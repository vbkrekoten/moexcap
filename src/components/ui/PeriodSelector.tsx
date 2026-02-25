import type { Period } from '../../lib/constants';

const PERIODS: { key: Period; label: string }[] = [
  { key: '3Y', label: '3 года' },
  { key: '5Y', label: '5 лет' },
  { key: '10Y', label: '10 лет' },
  { key: 'ALL', label: 'Всё' },
];

interface PeriodSelectorProps {
  period: Period;
  onChange: (p: Period) => void;
}

export default function PeriodSelector({ period, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex gap-1 bg-bg-card2 rounded-lg p-1">
      {PERIODS.map(p => (
        <button
          key={p.key}
          onClick={() => onChange(p.key)}
          className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
            period === p.key
              ? 'bg-gold text-bg font-bold'
              : 'text-muted hover:text-white'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
