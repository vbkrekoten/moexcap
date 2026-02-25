import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from 'recharts';
import ChartTooltip from '../ui/ChartTooltip';
import { C } from '../../lib/constants';
import type { WorldBankIndicator } from '../../lib/types';

interface CPIChartProps {
  data: WorldBankIndicator[];
}

export default function CPIChart({ data }: CPIChartProps) {
  const cpi = data
    .filter(d => d.indicator.includes('CPI') || d.indicator.includes('cpi') || d.indicator.includes('inflation'))
    .sort((a, b) => a.year - b.year);

  if (cpi.length === 0) return <p className="text-muted text-sm">Нет данных по CPI</p>;

  const chartData = cpi.map(d => ({
    year: String(d.year),
    value: d.value ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="year" tick={{ fontSize: 10, fill: C.muted }} />
        <YAxis tick={{ fontSize: 10, fill: C.muted }} tickFormatter={(v: number) => v.toFixed(1) + '%'} />
        <Tooltip content={<ChartTooltip format={(v: number) => v.toFixed(2) + '%'} />} />
        <Bar dataKey="value" name="CPI" fill={C.danger} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
