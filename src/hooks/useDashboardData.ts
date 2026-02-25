import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type {
  StockHistory, MoexLive, DividendHistory, IndexHistory,
  CurrencyHistory, BrentHistory, TradingVolume, WorldBankIndicator,
  GlobalExchange, KeyRate, Meta, PeerStockHistory,
} from '../lib/types';

export interface DashboardData {
  stock: StockHistory[];
  live: MoexLive | null;
  dividends: DividendHistory[];
  imoex: IndexHistory[];
  rtsi: IndexHistory[];
  currency: CurrencyHistory[];
  brent: BrentHistory[];
  tradingVol: TradingVolume[];
  worldBank: WorldBankIndicator[];
  globalExchanges: GlobalExchange[];
  keyRates: KeyRate[];
  meta: Meta[];
  peers: PeerStockHistory[];
}

const EMPTY: DashboardData = {
  stock: [], live: null, dividends: [],
  imoex: [], rtsi: [], currency: [], brent: [],
  tradingVol: [], worldBank: [], globalExchanges: [],
  keyRates: [], meta: [], peers: [],
};

// PostgREST returns Postgres `numeric` columns as strings to preserve precision.
// Convert string-encoded numbers back to JS numbers for chart/math operations.
const NUM_RE = /^-?\d+(\.\d+)?$/;
function coerceRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = typeof v === 'string' && NUM_RE.test(v) ? Number(v) : v;
  }
  return out;
}

const PAGE_SIZE = 1000;

async function fetchTable<T>(
  table: string,
  opts?: {
    select?: string;
    order?: string;
    ascending?: boolean;
    filter?: [string, string, string | number][];
    limit?: number;
  },
): Promise<T[]> {
  const all: Record<string, unknown>[] = [];
  const maxRows = opts?.limit ?? 50000;
  let from = 0;

  while (from < maxRows) {
    const to = Math.min(from + PAGE_SIZE - 1, maxRows - 1);
    let q = supabase.from(table).select(opts?.select ?? '*');
    if (opts?.filter) {
      for (const [col, op, val] of opts.filter) {
        q = q.filter(col, op, val);
      }
    }
    if (opts?.order) {
      q = q.order(opts.order, { ascending: opts.ascending ?? true });
    }
    q = q.range(from, to);
    const { data, error } = await q;
    if (error) {
      console.warn(`Error fetching ${table}:`, error.message);
      break;
    }
    const rows = (data ?? []) as unknown as Record<string, unknown>[];
    all.push(...rows);
    if (rows.length < PAGE_SIZE) break; // last page
    from += PAGE_SIZE;
  }

  return all.map(coerceRow) as T[];
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData>(EMPTY);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);

    const results = await Promise.allSettled([
      fetchTable<StockHistory>('moex_stock_history', { order: 'trade_date' }),
      supabase.from('moex_live').select('*').eq('id', 1).maybeSingle(),
      fetchTable<DividendHistory>('moex_dividends', { order: 'registry_close_date' }),
      fetchTable<IndexHistory>('index_history', { order: 'trade_date', filter: [['ticker', 'eq', 'IMOEX']] }),
      fetchTable<IndexHistory>('index_history', { order: 'trade_date', filter: [['ticker', 'eq', 'RTSI']] }),
      fetchTable<CurrencyHistory>('currency_history', { order: 'trade_date' }),
      fetchTable<BrentHistory>('brent_history', { order: 'trade_date' }),
      fetchTable<TradingVolume>('trading_volumes', { order: 'trade_date' }),
      fetchTable<WorldBankIndicator>('world_bank_indicators', { order: 'year' }),
      fetchTable<GlobalExchange>('global_exchanges', { order: 'trade_date' }),
      fetchTable<KeyRate>('key_rates', { order: 'effective_date' }),
      fetchTable<Meta>('meta'),
      fetchTable<PeerStockHistory>('peer_stock_history', { order: 'trade_date' }),
    ]);

    const arr = (i: number): unknown[] => {
      const r = results[i];
      return r.status === 'fulfilled' && Array.isArray(r.value) ? r.value : [];
    };

    const liveResult = results[1];
    let live: MoexLive | null = null;
    if (liveResult.status === 'fulfilled' && liveResult.value && 'data' in liveResult.value && liveResult.value.data) {
      live = coerceRow(liveResult.value.data as Record<string, unknown>) as unknown as MoexLive;
    }

    setData({
      stock: arr(0) as StockHistory[],
      live,
      dividends: arr(2) as DividendHistory[],
      imoex: arr(3) as IndexHistory[],
      rtsi: arr(4) as IndexHistory[],
      currency: arr(5) as CurrencyHistory[],
      brent: arr(6) as BrentHistory[],
      tradingVol: arr(7) as TradingVolume[],
      worldBank: arr(8) as WorldBankIndicator[],
      globalExchanges: arr(9) as GlobalExchange[],
      keyRates: arr(10) as KeyRate[],
      meta: arr(11) as Meta[],
      peers: arr(12) as PeerStockHistory[],
    });

    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  return { data, loading, reload: loadAll };
}
