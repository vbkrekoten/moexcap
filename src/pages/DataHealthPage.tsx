import { useMemo, useState, useCallback } from 'react';
import Section from '../components/ui/Section';
import { useDashboardData } from '../hooks/useDashboardData';
import { supabase } from '../lib/supabase';
import { fmtDate } from '../lib/formatters';

interface SourceStatus {
  source: string;
  lastDate: string | null;
  updatedAt: string | null;
  hoursAgo: number;
  status: 'green' | 'yellow' | 'red';
}

const REFRESH_FUNCTIONS = ['refresh-moex', 'refresh-market', 'refresh-cbr', 'refresh-peers'] as const;

export default function DataHealthPage() {
  const { data, loading, reload } = useDashboardData();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshLog, setRefreshLog] = useState<string[]>([]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshLog([]);
    const logs: string[] = [];
    for (const fn of REFRESH_FUNCTIONS) {
      logs.push(`${fn}: запуск...`);
      setRefreshLog([...logs]);
      try {
        const { data: result, error } = await supabase.functions.invoke(fn);
        if (error) {
          logs[logs.length - 1] = `${fn}: ошибка — ${error.message}`;
        } else {
          const log = result?.log?.join(', ') ?? (result?.stock_rows != null ? `stock: ${result.stock_rows}, div: ${result.dividends}` : 'OK');
          logs[logs.length - 1] = `${fn}: ${log}`;
        }
      } catch (e) {
        logs[logs.length - 1] = `${fn}: ${e}`;
      }
      setRefreshLog([...logs]);
    }
    await reload();
    setRefreshing(false);
  }, [reload]);

  const sources = useMemo<SourceStatus[]>(() => {
    const now = Date.now();
    return data.meta.map(m => {
      const updatedMs = m.updated_at ? new Date(m.updated_at).getTime() : 0;
      const hoursAgo = (now - updatedMs) / 3_600_000;
      const status = hoursAgo < 24 ? 'green' as const : hoursAgo < 72 ? 'yellow' as const : 'red' as const;
      return {
        source: m.source,
        lastDate: m.last_date,
        updatedAt: m.updated_at,
        hoursAgo,
        status,
      };
    }).sort((a, b) => a.source.localeCompare(b.source));
  }, [data.meta]);

  // Alerts for stale sources
  const alerts = useMemo(() => {
    const items: { source: string; message: string; severity: 'warn' | 'error' }[] = [];
    for (const s of sources) {
      if (s.status === 'red') {
        const days = Math.floor(s.hoursAgo / 24);
        items.push({
          source: s.source,
          message: `Данные устарели на ${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}`,
          severity: 'error',
        });
      } else if (s.status === 'yellow') {
        items.push({
          source: s.source,
          message: 'Данные устарели (24-72ч)',
          severity: 'warn',
        });
      }
    }
    return items;
  }, [sources]);

  // Row counts from loaded data
  const rowCounts = useMemo(() => {
    const counts: Record<string, number> = {
      moex_stock_history: data.stock.length,
      moex_live: data.live ? 1 : 0,
      moex_dividends: data.dividends.length,
      index_history_IMOEX: data.imoex.length,
      index_history_RTSI: data.rtsi.length,
      currency_history: data.currency.length,
      brent_history: data.brent.length,
      trading_volumes: data.tradingVol.length,
      world_bank_indicators: data.worldBank.length,
      global_exchanges: data.globalExchanges.length,
      key_rates: data.keyRates.length,
      peer_stock_history: data.peers.length,
    };
    // Match meta sources to row counts
    return counts;
  }, [data]);

  const statusDot = (s: 'green' | 'yellow' | 'red') =>
    s === 'green' ? 'bg-success' : s === 'yellow' ? 'bg-orange' : 'bg-danger';

  const statusLabel = (s: 'green' | 'yellow' | 'red') =>
    s === 'green' ? 'OK' : s === 'yellow' ? 'Устарело' : 'Критично';

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {(['green', 'yellow', 'red'] as const).map(status => {
          const count = sources.filter(s => s.status === status).length;
          return (
            <div key={status} className="bg-bg-card2 rounded-lg p-4 border border-gray-700 text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${statusDot(status)}`} />
              <div className="text-2xl font-bold font-mono text-gold">{count}</div>
              <div className="text-xs text-muted">{statusLabel(status)}</div>
            </div>
          );
        })}
      </div>

      {/* Freshness Table */}
      <Section title="СВЕЖЕСТЬ ДАННЫХ">
        {loading ? (
          <div className="skeleton h-64 w-full" />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Статус</th>
                  <th>Источник</th>
                  <th>Последняя дата</th>
                  <th>Обновлено</th>
                  <th>Часов назад</th>
                  <th>Строк</th>
                </tr>
              </thead>
              <tbody>
                {sources.map(s => (
                  <tr key={s.source}>
                    <td>
                      <div className={`w-3 h-3 rounded-full ${statusDot(s.status)}`} />
                    </td>
                    <td className="font-mono text-xs">{s.source}</td>
                    <td>{s.lastDate ? fmtDate(s.lastDate) : '—'}</td>
                    <td>{s.updatedAt ? fmtDate(s.updatedAt) : '—'}</td>
                    <td className={`font-mono ${
                      s.status === 'green' ? 'text-success' : s.status === 'yellow' ? 'text-orange' : 'text-danger'
                    }`}>
                      {s.hoursAgo < 1 ? '<1' : Math.floor(s.hoursAgo)}
                    </td>
                    <td className="font-mono">
                      {rowCounts[s.source] ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Manual Refresh */}
      <Section title="ОБНОВЛЕНИЕ ДАННЫХ">
        <div className="flex items-center gap-4 mb-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-gold/20 border border-gold/40 rounded-lg text-gold text-sm font-mono hover:bg-gold/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {refreshing ? 'Обновление...' : 'Обновить данные'}
          </button>
          <span className="text-xs text-muted">
            Вызов Edge Functions: moex, market, cbr, peers
          </span>
        </div>
        {refreshLog.length > 0 && (
          <div className="bg-bg-card rounded-lg border border-gray-700 p-3 font-mono text-xs space-y-1">
            {refreshLog.map((line, i) => (
              <div key={i} className={line.includes('ошибка') ? 'text-danger' : 'text-muted'}>
                {line}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Alerts */}
      <Section title="АЛЕРТЫ">
        {loading ? (
          <div className="skeleton h-32 w-full" />
        ) : alerts.length === 0 ? (
          <p className="text-success text-sm">Все источники актуальны.</p>
        ) : (
          <div className="space-y-2">
            {alerts.map(a => (
              <div
                key={a.source}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                  a.severity === 'error'
                    ? 'bg-danger/10 border-danger/30'
                    : 'bg-orange/10 border-orange/30'
                }`}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  a.severity === 'error' ? 'bg-danger' : 'bg-orange'
                }`} />
                <span className="font-mono text-xs text-gold">{a.source}</span>
                <span className="text-sm text-muted">{a.message}</span>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
