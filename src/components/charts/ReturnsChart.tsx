import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Cell, ReferenceLine,
} from 'recharts';
import ChartTooltip from '../ui/ChartTooltip';
import { C } from '../../lib/constants';
import { monthlyReturns, tickInterval } from '../../lib/analytics';
import { fmtPct } from '../../lib/formatters';
import type { PricePoint } from '../../lib/analytics';

interface ReturnsChartProps {
  data: PricePoint[];
}

export default function ReturnsChart({ data }: ReturnsChartProps) {
  const returns = monthlyReturns(data);
  if (returns.length === 0) return <div className="skeleton h-64 w-full" />;

  const chartData = returns.map(r => ({
    date: r.date.substring(0, 7),
    ret: r.ret * 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: C.muted }}
          interval={tickInterval(chartData, 12)}
        />
        <YAxis
          tick={{ fontSize: 10, fill: C.muted }}
          tickFormatter={(v: number) => v.toFixed(0) + '%'}
        />
        <Tooltip content={<ChartTooltip format={(v: number) => fmtPct(v)} />} />
        <ReferenceLine y={0} stroke={C.muted} strokeOpacity={0.5} />
        <Bar dataKey="ret" name="Доходность" isAnimationActive={false}>
          {chartData.map((d, i) => (
            <Cell key={i} fill={d.ret >= 0 ? C.green : C.danger} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
