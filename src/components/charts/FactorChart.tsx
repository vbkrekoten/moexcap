import { useMemo } from 'react';
import {
  ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend,
} from 'recharts';
import ChartTooltip from '../ui/ChartTooltip';
import { C, CHART_COLORS } from '../../lib/constants';
import { tickInterval } from '../../lib/analytics';
import type { StockHistory, BrentHistory, CurrencyHistory, KeyRate } from '../../lib/types';

interface FactorChartProps {
  stock: StockHistory[];
  brent: BrentHistory[];
  currency: CurrencyHistory[];
  keyRates: KeyRate[];
}

interface ChartRow {
  date: string;
  moex: number | null;
  brent: number | null;
  usd: number | null;
  rate: number | null;
}

export default function FactorChart({ stock, brent, currency, keyRates }: FactorChartProps) {
  const chartData = useMemo(() => {
    if (stock.length === 0) return [];

    // Build lookup maps by date
    const brentMap = new Map(brent.map(d => [d.trade_date, d.close]));
    const usdMap = new Map(currency.map(d => [d.trade_date, d.close]));

    // Sorted key rates for step interpolation
    const sortedRates = [...keyRates].sort(
      (a, b) => a.effective_date.localeCompare(b.effective_date),
    );

    function getKeyRate(date: string): number | null {
      let rate: number | null = null;
      for (const r of sortedRates) {
        if (r.effective_date <= date) rate = r.rate;
        else break;
      }
      return rate;
    }

    // Find first date where all three series have values to compute base
    let moexBase: number | null = null;
    let brentBase: number | null = null;
    let usdBase: number | null = null;

    for (const d of stock) {
      const bv = brentMap.get(d.trade_date);
      const uv = usdMap.get(d.trade_date);
      if (bv != null && uv != null && d.close > 0) {
        moexBase = d.close;
        brentBase = bv;
        usdBase = uv;
        break;
      }
    }

    if (moexBase == null || brentBase == null || usdBase == null) {
      // Fallback: use first stock point as base for MOEX only
      moexBase = stock[0].close || 1;
      brentBase = brent[0]?.close || 1;
      usdBase = currency[0]?.close || 1;
    }

    const rows: ChartRow[] = [];
    for (const d of stock) {
      const bv = brentMap.get(d.trade_date);
      const uv = usdMap.get(d.trade_date);
      rows.push({
        date: d.trade_date,
        moex: (d.close / moexBase) * 100,
        brent: bv != null ? (bv / brentBase) * 100 : null,
        usd: uv != null ? (uv / usdBase) * 100 : null,
        rate: getKeyRate(d.trade_date),
      });
    }

    return rows;
  }, [stock, brent, currency, keyRates]);

  if (chartData.length === 0) return <div className="skeleton h-80 w-full" />;

  return (
    <ResponsiveContainer width="100%" height={380}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={C.orange} stopOpacity={0.15} />
            <stop offset="95%" stopColor={C.orange} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: C.muted }}
          interval={tickInterval(chartData, 10)}
        />
        <YAxis
          yAxisId="norm"
          domain={['auto', 'auto']}
          tick={{ fontSize: 10, fill: C.muted }}
          tickFormatter={(v: number) => v.toFixed(0)}
          label={{
            value: 'База = 100',
            angle: -90,
            position: 'insideLeft',
            style: { fontSize: 10, fill: C.muted },
          }}
        />
        <YAxis
          yAxisId="rate"
          orientation="right"
          domain={[0, 'auto']}
          tick={{ fontSize: 10, fill: C.muted }}
          tickFormatter={(v: number) => v.toFixed(0) + '%'}
          width={50}
          label={{
            value: 'Ключ. ставка',
            angle: 90,
            position: 'insideRight',
            style: { fontSize: 10, fill: C.muted },
          }}
        />
        <Tooltip
          content={
            <ChartTooltip
              format={(v: number) => v.toFixed(1)}
            />
          }
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: C.muted }}
        />
        <Area
          yAxisId="rate"
          type="stepAfter"
          dataKey="rate"
          name="Ключ. ставка (%)"
          stroke={C.orange}
          fill="url(#rateGrad)"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
          connectNulls
        />
        <Line
          yAxisId="norm"
          type="monotone"
          dataKey="moex"
          name="MOEX"
          stroke={CHART_COLORS[0]}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
          connectNulls
        />
        <Line
          yAxisId="norm"
          type="monotone"
          dataKey="brent"
          name="Brent"
          stroke={CHART_COLORS[1]}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
          connectNulls
        />
        <Line
          yAxisId="norm"
          type="monotone"
          dataKey="usd"
          name="USD/RUB"
          stroke={CHART_COLORS[3]}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
          connectNulls
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
