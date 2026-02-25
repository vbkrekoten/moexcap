import type { ReactNode } from 'react';
import { fmtDate } from '../../lib/formatters';

interface SectionProps {
  title: string;
  source?: string;
  updatedAt?: string;
  children: ReactNode;
  className?: string;
}

export default function Section({ title, source, updatedAt, children, className = '' }: SectionProps) {
  return (
    <div className={`bg-bg-card rounded-xl border border-gray-800 p-4 md:p-6 fade-in ${className}`}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-display text-2xl md:text-3xl tracking-wider text-gold">{title}</h2>
        {source && (
          <div className="text-xs text-muted">
            Источник: {source}
            {updatedAt ? ` \u2022 ${fmtDate(updatedAt)}` : ''}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
