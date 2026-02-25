import { EVENTS } from '../../lib/constants';
import { fmtDate } from '../../lib/formatters';

export default function Timeline() {
  return (
    <div className="relative pl-6">
      <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-700" />
      {EVENTS.map(e => (
        <div key={e.date} className="relative mb-4 last:mb-0">
          <div
            className="absolute -left-4 top-1.5 w-3 h-3 rounded-full border-2"
            style={{ borderColor: e.color, background: e.color + '33' }}
          />
          <div className="text-xs text-muted">{fmtDate(e.date)}</div>
          <div className="text-sm" style={{ color: e.color }}>{e.label}</div>
        </div>
      ))}
    </div>
  );
}
