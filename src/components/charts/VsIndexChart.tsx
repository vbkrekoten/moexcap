import { useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend,
} from 'recharts';
import ChartTooltip from '../ui/ChartTooltip';
import { C, CHART_COLORS } from '../../lib/constants';
import { tickInterval } from '../../lib/analytics';
import { fmtPct } from '../../lib/formatters';
import type { StockHistory, IndexHistory } from '../../lib/types';

interface VsIndexChartProps {
  stock: StockHistory[];
  imoex: IndexHistory[];
  rtsi: IndexHistory[];
}

/**
 * Normalized % change chart: MOEX share price vs IMOEX vs RTSI.
 * Each series is rebased to 0% at the common start date.
 */
export default function VsIndexChart({ stock, imoex, rtsi }: VsIndexChartProps) {
  const chartData = useMemo(() => {
    if (stock.length === 0) return [];

    // Build lookup maps by trade_date
    const imoexMap = new Map(imoex.map(d => [d.trade_date, d.close]));
    const rtsiMap = new Map(rtsi.map(d => [d.trade_date, d.close]));

    // Find common start date where all three series have data
    let startMoex: number | null = null;
    let startImoex: number | null = null;
    let startRtsi: number | null = null;

    for (const d of stock) {
      const im = imoexMap.get(d.trade_date);
      const rt = rtsiMap.get(d.trade_date);
      if (im != null && rt != null) {
        startMoex = d.close;
        startImoex = im;
        startRtsi = rt;
        break;
      }
    }

    if (!startMoex || !startImoex || !startRtsi) return [];

    const rows: { date: string; moex: number; imoex: number | null; rtsi: number | null }[] = [];
    for (const d of stock) {
      const im = imoexMap.get(d.trade_date);
      const rt = rtsiMap.get(d.trade_date);
      rows.push({
        date: d.trade_date,
        moex: (d.close / startMoex - 1) * 100,
        imoex: im != null ? (im / startImoex - 1) * 100 : null,
        rtsi: rt != null ? (rt / startRtsi - 1) * 100 : null,
      });
    }
    return rows;
  }, [stock, imoex, rtsi]);

  if (chartData.length === 0) return <div className="skeleton h-72 w-full" />;

  const lines = [
    { key: 'moex', name: 'MOEX', color: CHART_COLORS[0] },
    { key: 'imoex', name: 'IMOEX', color: CHART_COLORS[1] },
    { key: 'rtsi', name: 'RTSI', color: CHART_COLORS[2] },
  ];

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
        {lines.map(l => (
          <Line
            key={l.key}
            type="monotone"
            dataKey={l.key}
            name={l.name}
            stroke={l.color}
            strokeWidth={2}
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
