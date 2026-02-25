import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from 'recharts';
import ChartTooltip from '../ui/ChartTooltip';
import { C } from '../../lib/constants';
import { maxDrawdown, tickInterval } from '../../lib/analytics';
import type { PricePoint } from '../../lib/analytics';

interface DrawdownChartProps {
  data: PricePoint[];
}

export default function DrawdownChart({ data }: DrawdownChartProps) {
  const dd = maxDrawdown(data);
  if (dd.length === 0) return <div className="skeleton h-64 w-full" />;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={dd} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={C.danger} stopOpacity={0.4} />
            <stop offset="95%" stopColor={C.danger} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: C.muted }}
          interval={tickInterval(dd, 10)}
        />
        <YAxis
          domain={['auto', 0]}
          tick={{ fontSize: 10, fill: C.muted }}
          tickFormatter={(v: number) => v.toFixed(0) + '%'}
        />
        <Tooltip content={<ChartTooltip format={(v: number) => v.toFixed(1) + '%'} />} />
        <Area
          type="monotone"
          dataKey="dd"
          name="Просадка"
          stroke={C.danger}
          fill="url(#ddGrad)"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
