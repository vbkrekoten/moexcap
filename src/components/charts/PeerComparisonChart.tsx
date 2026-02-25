import { useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend,
} from 'recharts';
import ChartTooltip from '../ui/ChartTooltip';
import { C, CHART_COLORS, PEER_TICKERS } from '../../lib/constants';
import { tickInterval } from '../../lib/analytics';
import { fmtPct } from '../../lib/formatters';
import type { StockHistory, PeerStockHistory } from '../../lib/types';

interface PeerComparisonChartProps {
  stock: StockHistory[];
  peers: PeerStockHistory[];
}

/**
 * Normalized % change chart: MOEX vs peer stocks (SBER, VTBR, T, CBOM, BSPB).
 * Each series is rebased to 0% at the common start date.
 */
export default function PeerComparisonChart({ stock, peers }: PeerComparisonChartProps) {
  const chartData = useMemo(() => {
    if (stock.length === 0 || peers.length === 0) return [];

    // Group peer data by ticker -> Map<date, close>
    const peerMaps = new Map<string, Map<string, number>>();
    for (const ticker of PEER_TICKERS) {
      peerMaps.set(ticker, new Map());
    }
    for (const p of peers) {
      const map = peerMaps.get(p.ticker);
      if (map) map.set(p.trade_date, p.close);
    }

    // Find common start date where MOEX and all peers have data
    let startMoex: number | null = null;
    const startPeers: Record<string, number> = {};
    let startFound = false;

    for (const d of stock) {
      let allPresent = true;
      for (const ticker of PEER_TICKERS) {
        const map = peerMaps.get(ticker)!;
        if (!map.has(d.trade_date)) {
          allPresent = false;
          break;
        }
      }
      if (allPresent) {
        startMoex = d.close;
        for (const ticker of PEER_TICKERS) {
          startPeers[ticker] = peerMaps.get(ticker)!.get(d.trade_date)!;
        }
        startFound = true;
        break;
      }
    }

    if (!startFound || !startMoex) return [];

    const rows: Record<string, unknown>[] = [];
    for (const d of stock) {
      const row: Record<string, unknown> = {
        date: d.trade_date,
        MOEX: (d.close / startMoex - 1) * 100,
      };
      for (const ticker of PEER_TICKERS) {
        const val = peerMaps.get(ticker)!.get(d.trade_date);
        row[ticker] = val != null ? (val / startPeers[ticker] - 1) * 100 : null;
      }
      rows.push(row);
    }
    return rows;
  }, [stock, peers]);

  if (chartData.length === 0) return <div className="skeleton h-72 w-full" />;

  const allTickers = ['MOEX', ...PEER_TICKERS] as const;

  return (
    <ResponsiveContainer width="100%" height={340}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: C.muted }}
          interval={tickInterval(chartData, 10)}
        />
        <YAxis
          tick={{ fontSize: 10, fill: C.muted }}
          tickFormatter={(v: number) => v.toFixed(0) + '%'}
        />
        <Tooltip content={<ChartTooltip format={(v: number) => fmtPct(v)} />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {allTickers.map((ticker, i) => (
          <Line
            key={ticker}
            type="monotone"
            dataKey={ticker}
            name={ticker}
            stroke={CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={ticker === 'MOEX' ? 2.5 : 1.5}
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
