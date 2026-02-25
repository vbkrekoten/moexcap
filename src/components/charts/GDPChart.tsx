import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from 'recharts';
import ChartTooltip from '../ui/ChartTooltip';
import { C } from '../../lib/constants';
import { fmtNum } from '../../lib/formatters';
import type { WorldBankIndicator } from '../../lib/types';

interface GDPChartProps {
  data: WorldBankIndicator[];
}

export default function GDPChart({ data }: GDPChartProps) {
  const gdp = data
    .filter(d => d.indicator.includes('GDP') || d.indicator.includes('gdp'))
    .sort((a, b) => a.year - b.year);

  if (gdp.length === 0) return <p className="text-muted text-sm">Нет данных по ВВП</p>;

  const chartData = gdp.map(d => ({
    year: String(d.year),
    value: d.value ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="year" tick={{ fontSize: 10, fill: C.muted }} />
        <YAxis tick={{ fontSize: 10, fill: C.muted }} tickFormatter={(v: number) => fmtNum(v)} />
        <Tooltip content={<ChartTooltip format={(v: number) => fmtNum(v)} />} />
        <Bar dataKey="value" name="ВВП" fill={C.cyan} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
