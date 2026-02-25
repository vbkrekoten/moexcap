import {
  ResponsiveContainer, ComposedChart, Area, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts';
import ChartTooltip from '../ui/ChartTooltip';
import { C, EVENTS } from '../../lib/constants';
import { tickInterval } from '../../lib/analytics';
import { fmtNum } from '../../lib/formatters';
import type { StockHistory } from '../../lib/types';

interface PriceChartProps {
  data: StockHistory[];
}

export default function PriceChart({ data }: PriceChartProps) {
  if (data.length === 0) return <div className="skeleton h-72 w-full" />;

  const chartData = data.map(d => ({
    date: d.trade_date,
    close: d.close,
    volume: d.volume ?? 0,
  }));

  const visibleEvents = EVENTS.filter(
    e => e.date >= data[0].trade_date && e.date <= data[data.length - 1].trade_date,
  );

  return (
    <ResponsiveContainer width="100%" height={340}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={C.gold} stopOpacity={0.3} />
            <stop offset="95%" stopColor={C.gold} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: C.muted }}
          interval={tickInterval(chartData, 10)}
        />
        <YAxis
          yAxisId="price"
          domain={['auto', 'auto']}
          tick={{ fontSize: 10, fill: C.muted }}
          tickFormatter={(v: number) => v.toFixed(0)}
        />
        <YAxis
          yAxisId="vol"
          orientation="right"
          tick={{ fontSize: 10, fill: C.muted }}
          tickFormatter={(v: number) => fmtNum(v)}
          width={60}
        />
        <Tooltip content={<ChartTooltip format={(v: number) => fmtNum(v, 2)} />} />
        <Bar
          yAxisId="vol"
          dataKey="volume"
          name="Объём"
          fill={C.cyan}
          opacity={0.15}
          isAnimationActive={false}
        />
        <Area
          yAxisId="price"
          type="monotone"
          dataKey="close"
          name="Цена"
          stroke={C.gold}
          fill="url(#priceGrad)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        {visibleEvents.map(e => (
          <ReferenceLine
            key={e.date}
            yAxisId="price"
            x={e.date}
            stroke={e.color}
            strokeDasharray="4 4"
            strokeOpacity={0.6}
            label={{
              value: e.label,
              position: 'insideTop',
              fill: e.color,
              fontSize: 9,
              angle: -90,
              offset: 10,
            }}
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
