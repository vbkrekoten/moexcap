import { useMemo } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid,
} from 'recharts';
import Section from '../components/ui/Section';
import KPICard from '../components/ui/KPICard';
import ChartTooltip from '../components/ui/ChartTooltip';
import { useDashboardData } from '../hooks/useDashboardData';
import { fmtNum, fmtDate } from '../lib/formatters';
import { pearson, monthlyReturns } from '../lib/analytics';
import { C, MOEX_ISSUE_SIZE } from '../lib/constants';

export default function ExecutiveSummaryPage() {
  const { data, loading } = useDashboardData();

  // KPIs
  const kpis = useMemo(() => {
    const s = data.stock;
    const last = s[s.length - 1];
    const prev30 = s.length > 22 ? s[s.length - 23] : s[0];
    const priceChange = prev30 && last
      ? ((last.close - prev30.close) / prev30.close * 100)
      : null;

    const liveCap = data.live?.cap;
    const issueSize = data.live?.issue_size ?? MOEX_ISSUE_SIZE;
    const cap = liveCap ?? (last ? last.close * issueSize : null);

    const lastDiv = data.dividends[data.dividends.length - 1];
    const divYield = lastDiv && last ? (lastDiv.value / last.close * 100) : null;

    const lastUsd = data.currency[data.currency.length - 1];

    return {
      price: last ? last.close.toFixed(2) + ' \u20bd' : '\u2014',
      priceDate: last?.trade_date,
      priceChange,
      cap: cap ? fmtNum(cap) + ' \u20bd' : '\u2014',
      divYield: divYield != null ? divYield.toFixed(1) + '%' : '\u2014',
      lastDiv: lastDiv ? lastDiv.value.toFixed(2) + ' \u20bd' : '\u2014',
      usdRub: lastUsd ? lastUsd.close.toFixed(2) + ' \u20bd' : '\u2014',
      usdDate: lastUsd?.trade_date,
    };
  }, [data]);

  // Sparkline data (last 30 days)
  const sparkData = useMemo(() => {
    const s = data.stock;
    return s.slice(-30).map(d => ({
      date: d.trade_date,
      close: d.close,
    }));
  }, [data]);

  // Correlations for insights
  const correlations = useMemo(() => {
    const stockPts = data.stock.map(d => ({ date: d.trade_date, close: d.close }));
    const brentPts = data.brent.map(d => ({ date: d.trade_date, close: d.close }));
    const usdPts = data.currency.map(d => ({ date: d.trade_date, close: d.close }));
    const imoexPts = data.imoex.map(d => ({ date: d.trade_date, close: d.close }));

    const retMoex = monthlyReturns(stockPts).map(r => r.ret);
    const retBrent = monthlyReturns(brentPts).map(r => r.ret);
    const retUsd = monthlyReturns(usdPts).map(r => r.ret);
    const retImoex = monthlyReturns(imoexPts).map(r => r.ret);

    return {
      brent: pearson(retMoex, retBrent),
      usdRub: pearson(retMoex, retUsd),
      imoex: pearson(retMoex, retImoex),
    };
  }, [data]);

  // Auto-insights
  const insights = useMemo(() => {
    const lines: string[] = [];
    const s = data.stock;
    if (s.length === 0) return lines;

    const last = s[s.length - 1];
    const m1 = s.length > 22 ? s[s.length - 23] : null;
    const y1 = s.length > 252 ? s[s.length - 253] : null;

    if (m1) {
      const chg = ((last.close - m1.close) / m1.close * 100);
      lines.push(`Цена за месяц: ${chg >= 0 ? '+' : ''}${chg.toFixed(1)}% (${m1.close.toFixed(2)} \u2192 ${last.close.toFixed(2)} \u20bd)`);
    }
    if (y1) {
      const chg = ((last.close - y1.close) / y1.close * 100);
      lines.push(`Цена за год: ${chg >= 0 ? '+' : ''}${chg.toFixed(1)}%`);
    }
    if (correlations.brent != null) {
      lines.push(`Корреляция с Brent: ${correlations.brent.toFixed(2)}`);
    }
    if (correlations.usdRub != null) {
      lines.push(`Корреляция с USD/RUB: ${correlations.usdRub.toFixed(2)}`);
    }

    const lastRate = data.keyRates[data.keyRates.length - 1];
    if (lastRate) {
      lines.push(`Ключевая ставка ЦБ: ${lastRate.rate}% (с ${fmtDate(lastRate.effective_date)})`);
    }

    return lines;
  }, [data, correlations]);

  // Data freshness traffic light
  const freshness = useMemo(() => {
    const now = Date.now();
    return data.meta.map(m => {
      const updatedMs = m.updated_at ? new Date(m.updated_at).getTime() : 0;
      const hoursAgo = (now - updatedMs) / 3_600_000;
      const status = hoursAgo < 24 ? 'green' : hoursAgo < 72 ? 'yellow' : 'red';
      return { source: m.source, lastDate: m.last_date, status };
    });
  }, [data]);

  const freshnessColor = useMemo(() => {
    if (freshness.some(f => f.status === 'red')) return 'red';
    if (freshness.some(f => f.status === 'yellow')) return 'yellow';
    return 'green';
  }, [freshness]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          label="Цена MOEX"
          value={kpis.price}
          subtitle={kpis.priceDate ? fmtDate(kpis.priceDate) : ''}
          change={kpis.priceChange}
          loading={loading}
        />
        <KPICard label="Капитализация" value={kpis.cap} subtitle="ISSUECAPITALIZATION" loading={loading} />
        <KPICard
          label="Див. доходность"
          value={kpis.divYield}
          subtitle={`Посл. дивиденд: ${kpis.lastDiv}`}
          loading={loading}
        />
        <KPICard
          label="USD/RUB"
          value={kpis.usdRub}
          subtitle={kpis.usdDate ? fmtDate(kpis.usdDate) : ''}
          loading={loading}
        />
      </div>

      {/* Sparkline */}
      <Section title="ЦЕНА MOEX — 30 ДНЕЙ" source="Supabase / moex_stock_history" updatedAt={data.stock[data.stock.length - 1]?.trade_date}>
        {loading || sparkData.length === 0 ? (
          <div className="skeleton h-32 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={sparkData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.gold} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.gold} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.muted }} />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: C.muted }}
                tickFormatter={(v: number) => v.toFixed(0)}
              />
              <Tooltip content={<ChartTooltip format={(v: number) => v.toFixed(2) + ' \u20bd'} />} />
              <Area
                type="monotone"
                dataKey="close"
                name="Цена"
                stroke={C.gold}
                fill="url(#sparkGrad)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Section>

      {/* Data Freshness + Insights */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Auto-insights */}
        <Section title="АВТО-ИНСАЙТЫ">
          {loading ? (
            <div className="space-y-2">
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-4 w-5/6" />
            </div>
          ) : insights.length === 0 ? (
            <p className="text-muted text-sm">Недостаточно данных для инсайтов.</p>
          ) : (
            <ul className="space-y-2">
              {insights.map((line, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-gold mt-0.5">&bull;</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Data freshness compact */}
        <Section title="СВЕЖЕСТЬ ДАННЫХ">
          {loading ? (
            <div className="skeleton h-24 w-full" />
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${
                  freshnessColor === 'green' ? 'bg-success'
                  : freshnessColor === 'yellow' ? 'bg-orange'
                  : 'bg-danger'
                }`} />
                <span className="text-sm">
                  {freshnessColor === 'green' ? 'Все источники актуальны'
                   : freshnessColor === 'yellow' ? 'Некоторые источники устарели (24-72ч)'
                   : 'Есть критически устаревшие источники (>72ч)'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {freshness.map(f => (
                  <div key={f.source} className="flex items-center gap-1.5 text-xs">
                    <div className={`w-2 h-2 rounded-full ${
                      f.status === 'green' ? 'bg-success'
                      : f.status === 'yellow' ? 'bg-orange'
                      : 'bg-danger'
                    }`} />
                    <span className="text-muted truncate">{f.source}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
