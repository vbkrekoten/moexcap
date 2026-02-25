import { useState, useMemo } from 'react';
import Section from '../components/ui/Section';
import PeriodSelector from '../components/ui/PeriodSelector';
import FactorChart from '../components/charts/FactorChart';
import CorrelationCards from '../components/sections/CorrelationCards';
import RollingCorrelationChart from '../components/charts/RollingCorrelationChart';
import RegressionChart from '../components/charts/RegressionChart';
import { useDashboardData } from '../hooks/useDashboardData';
import { monthlyReturns } from '../lib/analytics';
import type { PricePoint } from '../lib/analytics';
import type { Period } from '../lib/constants';
import { getPeriodDates } from '../lib/constants';

export default function DriversPage() {
  const { data, loading } = useDashboardData();
  const [period, setPeriod] = useState<Period>('5Y');

  // Filter all series by selected period
  const { stock, brent, currency, imoex, keyRates } = useMemo(() => {
    const { from } = getPeriodDates(period);
    return {
      stock: data.stock.filter(d => d.trade_date >= from),
      brent: data.brent.filter(d => d.trade_date >= from),
      currency: data.currency.filter(d => d.trade_date >= from),
      imoex: data.imoex.filter(d => d.trade_date >= from),
      keyRates: data.keyRates,
    };
  }, [data, period]);

  // Build PricePoint arrays for analytics
  const moexPP: PricePoint[] = useMemo(
    () => stock.map(d => ({ date: d.trade_date, close: d.close })),
    [stock],
  );
  const brentPP: PricePoint[] = useMemo(
    () => brent.map(d => ({ date: d.trade_date, close: d.close })),
    [brent],
  );
  const usdPP: PricePoint[] = useMemo(
    () => currency.map(d => ({ date: d.trade_date, close: d.close })),
    [currency],
  );
  const imoexPP: PricePoint[] = useMemo(
    () => imoex.map(d => ({ date: d.trade_date, close: d.close })),
    [imoex],
  );

  // Monthly returns for correlation & regression
  const moexRet = useMemo(() => monthlyReturns(moexPP), [moexPP]);
  const brentRet = useMemo(() => monthlyReturns(brentPP), [brentPP]);
  const usdRet = useMemo(() => monthlyReturns(usdPP), [usdPP]);
  const imoexRet = useMemo(() => monthlyReturns(imoexPP), [imoexPP]);

  // Aligned monthly return arrays for Pearson correlation cards (per-pair alignment)
  const corrPairs = useMemo(() => {
    const moexMap = new Map(moexRet.map(d => [d.date.substring(0, 7), d.ret]));
    const brentMap = new Map(brentRet.map(d => [d.date.substring(0, 7), d.ret]));
    const usdMap = new Map(usdRet.map(d => [d.date.substring(0, 7), d.ret]));
    const imoexMap = new Map(imoexRet.map(d => [d.date.substring(0, 7), d.ret]));

    const months = [...moexMap.keys()].sort();

    function align(otherMap: Map<string, number>) {
      const x: number[] = [];
      const y: number[] = [];
      for (const m of months) {
        const mv = moexMap.get(m);
        const ov = otherMap.get(m);
        if (mv !== undefined && ov !== undefined) {
          x.push(mv);
          y.push(ov);
        }
      }
      return { x, y };
    }

    const brentPair = align(brentMap);
    const usdPair = align(usdMap);
    const imoexPair = align(imoexMap);

    return [
      { label: 'MOEX \u2194 Brent', x: brentPair.x, y: brentPair.y },
      { label: 'MOEX \u2194 USD/RUB', x: usdPair.x, y: usdPair.y },
      { label: 'MOEX \u2194 IMOEX', x: imoexPair.x, y: imoexPair.y },
    ];
  }, [moexRet, brentRet, usdRet, imoexRet]);

  const lastDate = stock[stock.length - 1]?.trade_date;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PeriodSelector period={period} onChange={setPeriod} />
        {lastDate && (
          <span className="text-xs text-muted">
            Данные по {lastDate}
          </span>
        )}
      </div>

      {/* Factor analytics chart */}
      <Section title="ФАКТОРНЫЙ АНАЛИЗ" source="MOEX ISS / CBR" updatedAt={lastDate}>
        {loading ? (
          <div className="skeleton h-80 w-full" />
        ) : (
          <FactorChart
            stock={stock}
            brent={brent}
            currency={currency}
            keyRates={keyRates}
          />
        )}
      </Section>

      {/* Correlation KPI cards */}
      {loading ? (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-bg-card2 rounded-lg p-4 border border-gray-700">
            <div className="skeleton h-4 w-24 mb-2" />
            <div className="skeleton h-8 w-32 mb-1" />
            <div className="skeleton h-3 w-20" />
          </div>
          <div className="bg-bg-card2 rounded-lg p-4 border border-gray-700">
            <div className="skeleton h-4 w-24 mb-2" />
            <div className="skeleton h-8 w-32 mb-1" />
            <div className="skeleton h-3 w-20" />
          </div>
          <div className="bg-bg-card2 rounded-lg p-4 border border-gray-700">
            <div className="skeleton h-4 w-24 mb-2" />
            <div className="skeleton h-8 w-32 mb-1" />
            <div className="skeleton h-3 w-20" />
          </div>
        </div>
      ) : (
        <CorrelationCards pairs={corrPairs} />
      )}

      {/* Rolling 12M correlation chart */}
      <Section title="СКОЛЬЗЯЩАЯ 12М КОРРЕЛЯЦИЯ" source="месячные доходности">
        {loading ? (
          <div className="skeleton h-64 w-full" />
        ) : (
          <RollingCorrelationChart
            moexReturns={moexRet}
            brentReturns={brentRet}
            usdReturns={usdRet}
          />
        )}
      </Section>

      {/* Regression chart: MOEX vs Brent */}
      <Section title="РЕГРЕССИЯ: MOEX vs BRENT" source="месячные доходности, OLS">
        {loading ? (
          <div className="skeleton h-64 w-full" />
        ) : (
          <RegressionChart
            moexReturns={moexRet}
            brentReturns={brentRet}
          />
        )}
      </Section>
    </div>
  );
}
