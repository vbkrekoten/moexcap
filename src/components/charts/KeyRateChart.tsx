import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from 'recharts';
import ChartTooltip from '../ui/ChartTooltip';
import { C } from '../../lib/constants';
import { tickInterval } from '../../lib/analytics';
import type { KeyRate } from '../../lib/types';

interface KeyRateChartProps {
  data: KeyRate[];
}

export default function KeyRateChart({ data }: KeyRateChartProps) {
  if (data.length === 0) return <div className="skeleton h-56 w-full" />;

  const chartData = data.map(d => ({
    date: d.effective_date,
    rate: d.rate,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={C.orange} stopOpacity={0.3} />
            <stop offset="95%" stopColor={C.orange} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: C.muted }}
          interval={tickInterval(chartData, 8)}
        />
        <YAxis
          tick={{ fontSize: 10, fill: C.muted }}
          tickFormatter={(v: number) => v + '%'}
        />
        <Tooltip content={<ChartTooltip format={(v: number) => v.toFixed(1) + '%'} />} />
        <Area
          type="stepAfter"
          dataKey="rate"
          name="Ключевая ставка"
          stroke={C.orange}
          fill="url(#rateGrad)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
