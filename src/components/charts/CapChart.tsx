import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from 'recharts';
import ChartTooltip from '../ui/ChartTooltip';
import { C, MOEX_ISSUE_SIZE } from '../../lib/constants';
import { tickInterval } from '../../lib/analytics';
import { fmtNum } from '../../lib/formatters';
import type { StockHistory } from '../../lib/types';

interface CapChartProps {
  data: StockHistory[];
  issueSize?: number;
}

export default function CapChart({ data, issueSize = MOEX_ISSUE_SIZE }: CapChartProps) {
  if (data.length === 0) return <div className="skeleton h-64 w-full" />;

  const chartData = data.map(d => ({
    date: d.trade_date,
    cap: d.close * issueSize,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="capGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={C.cyan} stopOpacity={0.3} />
            <stop offset="95%" stopColor={C.cyan} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: C.muted }}
          interval={tickInterval(chartData, 10)}
        />
        <YAxis
          domain={['auto', 'auto']}
          tick={{ fontSize: 10, fill: C.muted }}
          tickFormatter={(v: number) => fmtNum(v)}
        />
        <Tooltip content={<ChartTooltip format={(v: number) => fmtNum(v) + ' \u20bd'} />} />
        <Area
          type="monotone"
          dataKey="cap"
          name="Капитализация"
          stroke={C.cyan}
          fill="url(#capGrad)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
