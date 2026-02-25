import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from 'recharts';
import ChartTooltip from '../ui/ChartTooltip';
import { C } from '../../lib/constants';
import { tickInterval } from '../../lib/analytics';
import type { CurrencyHistory } from '../../lib/types';

interface CurrencyChartProps {
  data: CurrencyHistory[];
}

export default function CurrencyChart({ data }: CurrencyChartProps) {
  if (data.length === 0) return <div className="skeleton h-56 w-full" />;

  const chartData = data.map(d => ({
    date: d.trade_date,
    close: d.close,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: C.muted }}
          interval={tickInterval(chartData, 8)}
        />
        <YAxis
          domain={['auto', 'auto']}
          tick={{ fontSize: 10, fill: C.muted }}
          tickFormatter={(v: number) => v.toFixed(0)}
        />
        <Tooltip content={<ChartTooltip format={(v: number) => v.toFixed(2) + ' \u20bd'} />} />
        <Line
          type="monotone"
          dataKey="close"
          name="USD/RUB"
          stroke={C.green}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
