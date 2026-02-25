import { fmtNum } from '../../lib/formatters';

interface Payload {
  name: string;
  value: number;
  color?: string;
  stroke?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Payload[];
  label?: string;
  format?: (v: number) => string;
}

export default function ChartTooltip({ active, payload, label, format }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-bg-card border border-gray-600 rounded-lg p-3 text-xs shadow-xl">
      <div className="text-gold font-semibold mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: p.color || p.stroke }}
          />
          <span className="text-muted">{p.name}: </span>
          <span className="text-white font-mono">
            {format ? format(p.value) : fmtNum(p.value, 2)}
          </span>
        </div>
      ))}
    </div>
  );
}
