import { useState, useMemo } from 'react';
import Section from '../components/ui/Section';
import PeriodSelector from '../components/ui/PeriodSelector';
import PriceChart from '../components/charts/PriceChart';
import CapChart from '../components/charts/CapChart';
import ReturnsChart from '../components/charts/ReturnsChart';
import VolatilityChart from '../components/charts/VolatilityChart';
import DrawdownChart from '../components/charts/DrawdownChart';
import { useDashboardData } from '../hooks/useDashboardData';
import type { Period } from '../lib/constants';
import { getPeriodDates } from '../lib/constants';
import type { PricePoint } from '../lib/analytics';

export default function PerformancePage() {
  const { data, loading } = useDashboardData();
  const [period, setPeriod] = useState<Period>('5Y');

  const filtered = useMemo(() => {
    const { from } = getPeriodDates(period);
    return data.stock.filter(d => d.trade_date >= from);
  }, [data.stock, period]);

  const pricePoints: PricePoint[] = useMemo(
    () => filtered.map(d => ({ date: d.trade_date, close: d.close })),
    [filtered],
  );

  const issueSize = data.live?.issue_size ?? 2_276_401_458;

  const lastDate = filtered[filtered.length - 1]?.trade_date;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PeriodSelector period={period} onChange={setPeriod} />
        {lastDate && (
          <span className="text-xs text-muted">
            {filtered.length} торговых дней
          </span>
        )}
      </div>

      <Section title="ЦЕНА АКЦИИ MOEX" source="MOEX ISS" updatedAt={lastDate}>
        {loading ? <div className="skeleton h-80 w-full" /> : <PriceChart data={filtered} />}
      </Section>

      <Section title="КАПИТАЛИЗАЦИЯ" source="price × issue_size" updatedAt={lastDate}>
        {loading ? <div className="skeleton h-64 w-full" /> : <CapChart data={filtered} issueSize={issueSize} />}
      </Section>

      <div className="grid md:grid-cols-2 gap-6">
        <Section title="МЕСЯЧНАЯ ДОХОДНОСТЬ">
          {loading ? <div className="skeleton h-64 w-full" /> : <ReturnsChart data={pricePoints} />}
        </Section>
        <Section title="ВОЛАТИЛЬНОСТЬ (20D)">
          {loading ? <div className="skeleton h-64 w-full" /> : <VolatilityChart data={pricePoints} />}
        </Section>
      </div>

      <Section title="ПРОСАДКА ОТ ATH">
        {loading ? <div className="skeleton h-64 w-full" /> : <DrawdownChart data={pricePoints} />}
      </Section>
    </div>
  );
}
