import { fmtPct } from '../../lib/formatters';

interface KPICardProps {
  label: string;
  value: string;
  subtitle?: string;
  change?: number | null;
  loading?: boolean;
}

export default function KPICard({ label, value, subtitle, change, loading }: KPICardProps) {
  if (loading) {
    return (
      <div className="bg-bg-card2 rounded-lg p-4 border border-gray-700">
        <div className="skeleton h-4 w-24 mb-2" />
        <div className="skeleton h-8 w-32 mb-1" />
        <div className="skeleton h-3 w-20" />
      </div>
    );
  }

  const changeColor = change == null ? '' : change >= 0 ? 'text-green-400' : 'text-danger';

  return (
    <div className="bg-bg-card2 rounded-lg p-4 border border-gray-700 hover:border-gold/40 transition-colors">
      <div className="text-xs text-muted uppercase tracking-wider mb-1">{label}</div>
      <div className="text-xl md:text-2xl font-bold text-gold font-mono">{value}</div>
      <div className="flex items-center gap-2 mt-1">
        {subtitle && <span className="text-xs text-muted">{subtitle}</span>}
        {change != null && <span className={`text-xs font-semibold ${changeColor}`}>{fmtPct(change)}</span>}
      </div>
    </div>
  );
}
