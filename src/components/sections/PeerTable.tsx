import { useMemo } from 'react';
import { PEER_TICKERS, GLOBAL_EXCHANGES } from '../../lib/constants';
import { fmtPct, fmtNum } from '../../lib/formatters';
import type { StockHistory, PeerStockHistory, GlobalExchange } from '../../lib/types';

interface PeerTableProps {
  stock: StockHistory[];
  peers: PeerStockHistory[];
  globalExchanges: GlobalExchange[];
}

interface RowData {
  ticker: string;
  lastClose: number;
  ret1M: number | null;
  ret3M: number | null;
  retYTD: number | null;
  ret1Y: number | null;
}

/**
 * Compute return: (lastClose / refClose - 1) * 100.
 * `refIdx` is how many trading days back to look.
 */
function computeReturn(sorted: { close: number }[], refIdx: number): number | null {
  if (sorted.length === 0) return null;
  const lastClose = sorted[sorted.length - 1].close;
  const idx = sorted.length - 1 - refIdx;
  if (idx < 0) return null;
  const refClose = sorted[idx].close;
  if (refClose === 0) return null;
  return (lastClose / refClose - 1) * 100;
}

/**
 * Compute YTD return: from the first trading day of the current year.
 */
function computeYTD(sorted: { trade_date: string; close: number }[]): number | null {
  if (sorted.length === 0) return null;
  const year = new Date().getFullYear().toString();
  const firstOfYear = sorted.find(d => d.trade_date.startsWith(year));
  if (!firstOfYear || firstOfYear.close === 0) return null;
  const lastClose = sorted[sorted.length - 1].close;
  return (lastClose / firstOfYear.close - 1) * 100;
}

function buildRow(
  ticker: string,
  sorted: { trade_date: string; close: number }[],
): RowData {
  return {
    ticker,
    lastClose: sorted.length > 0 ? sorted[sorted.length - 1].close : 0,
    ret1M: computeReturn(sorted, 22),
    ret3M: computeReturn(sorted, 66),
    retYTD: computeYTD(sorted),
    ret1Y: computeReturn(sorted, 252),
  };
}

function ReturnCell({ value }: { value: number | null }) {
  if (value == null) return <td className="text-right text-muted">&mdash;</td>;
  const color = value >= 0 ? 'text-success' : 'text-danger';
  return <td className={`text-right font-mono ${color}`}>{fmtPct(value)}</td>;
}

export default function PeerTable({ stock, peers, globalExchanges }: PeerTableProps) {
  const rows = useMemo(() => {
    const result: RowData[] = [];

    // MOEX row
    const moexSorted = [...stock].sort((a, b) => a.trade_date.localeCompare(b.trade_date));
    result.push(buildRow('MOEX', moexSorted));

    // Peer rows
    for (const ticker of PEER_TICKERS) {
      const peerData = peers
        .filter(p => p.ticker === ticker)
        .sort((a, b) => a.trade_date.localeCompare(b.trade_date));
      result.push(buildRow(ticker, peerData));
    }

    // Global exchange rows
    for (const ex of GLOBAL_EXCHANGES) {
      const exData = globalExchanges
        .filter(g => g.ticker === ex.ticker)
        .sort((a, b) => a.trade_date.localeCompare(b.trade_date));
      result.push(buildRow(ex.name, exData));
    }

    return result;
  }, [stock, peers, globalExchanges]);

  if (rows.length === 0) return <div className="skeleton h-48 w-full" />;

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Тикер</th>
            <th className="text-right">Цена</th>
            <th className="text-right">1М</th>
            <th className="text-right">3М</th>
            <th className="text-right">YTD</th>
            <th className="text-right">1Г</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr
              key={r.ticker}
              className={r.ticker === 'MOEX' ? 'bg-bg-card2' : 'hover:bg-bg-card2/50'}
            >
              <td className={`font-semibold ${r.ticker === 'MOEX' ? 'text-gold' : 'text-white'}`}>
                {r.ticker}
              </td>
              <td className="text-right font-mono text-white">
                {fmtNum(r.lastClose, 2)}
              </td>
              <ReturnCell value={r.ret1M} />
              <ReturnCell value={r.ret3M} />
              <ReturnCell value={r.retYTD} />
              <ReturnCell value={r.ret1Y} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
