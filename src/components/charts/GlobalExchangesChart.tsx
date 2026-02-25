import { useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend,
} from 'recharts';
import ChartTooltip from '../ui/ChartTooltip';
import { C, CHART_COLORS, GLOBAL_EXCHANGES } from '../../lib/constants';
import { tickInterval } from '../../lib/analytics';
import { fmtPct } from '../../lib/formatters';
import type { StockHistory, GlobalExchange } from '../../lib/types';

interface GlobalExchangesChartProps {
  stock: StockHistory[];
  globalExchanges: GlobalExchange[];
}

/**
 * Normalized % change chart: MOEX vs global exchanges (ICE, CME, HKEX, LSEG, DB1).
 * Each series is rebased to 0% at the common start date.
 */
export default function GlobalExchangesChart({ stock, globalExchanges }: GlobalExchangesChartProps) {
  const chartData = useMemo(() => {
    if (stock.length === 0 || globalExchanges.length === 0) return [];

    // Group exchange data by ticker -> Map<date, close>
    const exchangeMaps = new Map<string, Map<string, number>>();
    for (const ex of GLOBAL_EXCHANGES) {
      exchangeMaps.set(ex.ticker, new Map());
    }
    for (const g of globalExchanges) {
      const map = exchangeMaps.get(g.ticker);
      if (map) map.set(g.trade_date, g.close);
    }

    // Build MOEX date map for easy lookups
    const moexMap = new Map(stock.map(d => [d.trade_date, d.close]));

    // Collect all unique dates across all series, sorted
    const allDates = new Set<string>();
    stock.forEach(d => allDates.add(d.trade_date));
    globalExchanges.forEach(d => allDates.add(d.trade_date));
    const sortedDates = [...allDates].sort();

    // Find common start date where MOEX and at least some exchanges have data
    let startMoex: number | null = null;
    const startExchanges: Record<string, number> = {};
    let startFound = false;

    for (const date of sortedDates) {
      const moexClose = moexMap.get(date);
      if (moexClose == null) continue;

      let hasAny = false;
      for (const ex of GLOBAL_EXCHANGES) {
        const map = exchangeMaps.get(ex.ticker)!;
        if (map.has(date) && !startExchanges[ex.ticker]) {
          startExchanges[ex.ticker] = map.get(date)!;
          hasAny = true;
        }
      }
      if (!startFound && moexClose && hasAny) {
        startMoex = moexClose;
        startFound = true;
      }
      // Check if we found start values for all exchanges
      if (startFound && GLOBAL_EXCHANGES.every(ex => startExchanges[ex.ticker])) break;
    }

    if (!startFound || !startMoex) return [];

    // Build rows based on MOEX dates (use MOEX as primary timeline)
    const rows: Record<string, unknown>[] = [];
    for (const d of stock) {
      const row: Record<string, unknown> = {
        date: d.trade_date,
        MOEX: (d.close / startMoex - 1) * 100,
      };
      for (const ex of GLOBAL_EXCHANGES) {
        const val = exchangeMaps.get(ex.ticker)!.get(d.trade_date);
        const start = startExchanges[ex.ticker];
        row[ex.name] = val != null && start ? (val / start - 1) * 100 : null;
      }
      rows.push(row);
    }
    return rows;
  }, [stock, globalExchanges]);

  if (chartData.length === 0) return <div className="skeleton h-72 w-full" />;

  const allNames = ['MOEX', ...GLOBAL_EXCHANGES.map(ex => ex.name)];

  return (
    <ResponsiveContainer width="100%" height={340}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: C.muted }}
          interval={tickInterval(chartData, 10)}
        />
        <YAxis
          tick={{ fontSize: 10, fill: C.muted }}
          tickFormatter={(v: number) => v.toFixed(0) + '%'}
        />
        <Tooltip content={<ChartTooltip format={(v: number) => fmtPct(v)} />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {allNames.map((name, i) => (
          <Line
            key={name}
            type="monotone"
            dataKey={name}
            name={name}
            stroke={CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={name === 'MOEX' ? 2.5 : 1.5}
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
