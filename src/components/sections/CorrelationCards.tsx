import { useMemo } from 'react';
import { pearson } from '../../lib/analytics';
import { C } from '../../lib/constants';

interface CorrPair {
  label: string;
  x: number[];
  y: number[];
}

interface CorrelationCardsProps {
  pairs: CorrPair[];
}

interface CorrInfo {
  label: string;
  value: number | null;
  interpretation: string;
}

function interpret(r: number | null): string {
  if (r == null) return 'нет данных';
  const abs = Math.abs(r);
  const direction = r >= 0 ? 'прямая' : 'обратная';
  if (abs >= 0.7) return `сильная ${direction}`;
  if (abs >= 0.5) return `умеренная ${direction}`;
  if (abs >= 0.3) return `слабая ${direction}`;
  return `очень слабая ${direction}`;
}

function corrColor(r: number | null): string {
  if (r == null) return C.muted;
  if (r > 0.5) return C.green;
  if (r < -0.5) return C.danger;
  return C.muted;
}

export default function CorrelationCards({ pairs }: CorrelationCardsProps) {
  const cards: CorrInfo[] = useMemo(() => {
    return pairs.map(({ label, x, y }) => {
      const r = pearson(x, y);
      return { label, value: r, interpretation: interpret(r) };
    });
  }, [pairs]);

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-bg-card2 rounded-lg p-4 border border-gray-700 hover:border-gold/40 transition-colors"
        >
          <div className="text-xs text-muted uppercase tracking-wider mb-2">
            {card.label}
          </div>
          <div
            className="text-2xl md:text-3xl font-bold font-mono mb-1"
            style={{ color: corrColor(card.value) }}
          >
            {card.value != null ? card.value.toFixed(3) : '\u2014'}
          </div>
          <div className="text-xs text-muted">
            {card.interpretation}
          </div>
        </div>
      ))}
    </div>
  );
}
