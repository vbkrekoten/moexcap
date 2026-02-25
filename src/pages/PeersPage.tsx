import { useState, useMemo } from 'react';
import Section from '../components/ui/Section';
import PeriodSelector from '../components/ui/PeriodSelector';
import VsIndexChart from '../components/charts/VsIndexChart';
import PeerComparisonChart from '../components/charts/PeerComparisonChart';
import GlobalExchangesChart from '../components/charts/GlobalExchangesChart';
import PeerTable from '../components/sections/PeerTable';
import { useDashboardData } from '../hooks/useDashboardData';
import type { Period } from '../lib/constants';
import { getPeriodDates } from '../lib/constants';

export default function PeersPage() {
  const { data, loading } = useDashboardData();
  const [period, setPeriod] = useState<Period>('5Y');

  const { from } = useMemo(() => getPeriodDates(period), [period]);

  // Filter all series to the selected period
  const filteredStock = useMemo(
    () => data.stock.filter(d => d.trade_date >= from),
    [data.stock, from],
  );

  const filteredImoex = useMemo(
    () => data.imoex.filter(d => d.trade_date >= from),
    [data.imoex, from],
  );

  const filteredRtsi = useMemo(
    () => data.rtsi.filter(d => d.trade_date >= from),
    [data.rtsi, from],
  );

  const filteredPeers = useMemo(
    () => data.peers.filter(d => d.trade_date >= from),
    [data.peers, from],
  );

  const filteredGlobal = useMemo(
    () => data.globalExchanges.filter(d => d.trade_date >= from),
    [data.globalExchanges, from],
  );

  const lastDate = filteredStock[filteredStock.length - 1]?.trade_date;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PeriodSelector period={period} onChange={setPeriod} />
        {lastDate && (
          <span className="text-xs text-muted">
            {filteredStock.length} торговых дней
          </span>
        )}
      </div>

      <Section title="MOEX vs ИНДЕКСЫ (IMOEX / RTSI)" source="MOEX ISS" updatedAt={lastDate}>
        {loading
          ? <div className="skeleton h-80 w-full" />
          : <VsIndexChart stock={filteredStock} imoex={filteredImoex} rtsi={filteredRtsi} />
        }
      </Section>

      <Section title="MOEX vs ПИРЫ (SBER, VTBR, T, CBOM, BSPB)" source="MOEX ISS" updatedAt={lastDate}>
        {loading
          ? <div className="skeleton h-80 w-full" />
          : <PeerComparisonChart stock={filteredStock} peers={filteredPeers} />
        }
      </Section>

      <Section title="MOEX vs МИРОВЫЕ БИРЖИ" source="Yahoo Finance / MOEX" updatedAt={lastDate}>
        {loading
          ? <div className="skeleton h-80 w-full" />
          : <GlobalExchangesChart stock={filteredStock} globalExchanges={filteredGlobal} />
        }
      </Section>

      <Section title="ТАБЛИЦА PERFORMANCE" source="MOEX ISS / Yahoo Finance">
        {loading
          ? <div className="skeleton h-48 w-full" />
          : <PeerTable stock={data.stock} peers={data.peers} globalExchanges={data.globalExchanges} />
        }
      </Section>
    </div>
  );
}
