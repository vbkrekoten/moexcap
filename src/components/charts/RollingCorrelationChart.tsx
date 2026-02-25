import { useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend, ReferenceLine,
} from 'recharts';
import ChartTooltip from '../ui/ChartTooltip';
import { C, CHART_COLORS } from '../../lib/constants';
import { rollingCorrelation, tickInterval } from '../../lib/analytics';

interface ReturnPoint {
  date: string;
  ret: number;
}

interface RollingCorrelationChartProps {
  moexReturns: ReturnPoint[];
  brentReturns: ReturnPoint[];
  usdReturns: ReturnPoint[];
}

interface ChartRow {
  date: string;
  brent: number | null;
  usd: number | null;
}

export default function RollingCorrelationChart({
  moexReturns,
  brentReturns,
  usdReturns,
}: RollingCorrelationChartProps) {
  const chartData: ChartRow[] = useMemo(() => {
    const brentCorr = rollingCorrelation(moexReturns, brentReturns, 12);
    const usdCorr = rollingCorrelation(moexReturns, usdReturns, 12);

    // Merge by month key
    const map = new Map<string, ChartRow>();

    for (const d of brentCorr) {
      const key = d.date.substring(0, 7);
      map.set(key, { date: key, brent: d.corr, usd: null });
    }
    for (const d of usdCorr) {
      const key = d.date.substring(0, 7);
      const existing = map.get(key);
      if (existing) {
        existing.usd = d.corr;
      } else {
        map.set(key, { date: key, brent: null, usd: d.corr });
      }
    }

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [moexReturns, brentReturns, usdReturns]);

  if (chartData.length === 0) return <div className="skeleton h-64 w-full" />;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: C.muted }}
          interval={tickInterval(chartData, 12)}
        />
        <YAxis
          domain={[-1, 1]}
          ticks={[-1, -0.5, 0, 0.5, 1]}
          tick={{ fontSize: 10, fill: C.muted }}
          tickFormatter={(v: number) => v.toFixed(1)}
        />
        <Tooltip
          content={<ChartTooltip format={(v: number) => v.toFixed(3)} />}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: C.muted }} />
        <ReferenceLine y={0} stroke={C.muted} strokeOpacity={0.4} />
        <ReferenceLine y={0.5} stroke={C.green} strokeOpacity={0.2} strokeDasharray="4 4" />
        <ReferenceLine y={-0.5} stroke={C.danger} strokeOpacity={0.2} strokeDasharray="4 4" />
        <Line
          type="monotone"
          dataKey="brent"
          name="MOEX vs Brent"
          stroke={CHART_COLORS[1]}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="usd"
          name="MOEX vs USD/RUB"
          stroke={CHART_COLORS[3]}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
