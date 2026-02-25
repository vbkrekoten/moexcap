import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from 'recharts';
import ChartTooltip from '../ui/ChartTooltip';
import { C } from '../../lib/constants';
import { rollingVolatility, tickInterval } from '../../lib/analytics';
import type { PricePoint } from '../../lib/analytics';

interface VolatilityChartProps {
  data: PricePoint[];
}

export default function VolatilityChart({ data }: VolatilityChartProps) {
  const vol = rollingVolatility(data);
  if (vol.length === 0) return <div className="skeleton h-64 w-full" />;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={vol} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: C.muted }}
          interval={tickInterval(vol, 10)}
        />
        <YAxis
          tick={{ fontSize: 10, fill: C.muted }}
          tickFormatter={(v: number) => v.toFixed(0) + '%'}
        />
        <Tooltip content={<ChartTooltip format={(v: number) => v.toFixed(1) + '%'} />} />
        <Line
          type="monotone"
          dataKey="vol"
          name="Волатильность"
          stroke={C.orange}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
