// Supabase table types — matches real schema in project wbyaevwqvusmmtafydso
// Column names use snake_case as in Postgres

export interface StockHistory {
  trade_date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number;
  volume: number | null;
  value: number | null;
}

export interface MoexLive {
  id: number;
  last_price: number | null;
  open_price: number | null;
  high_price: number | null;
  low_price: number | null;
  cap: number | null;
  cap_trend: number | null;
  vol_today: number | null;
  val_today: number | null;
  num_trades: number | null;
  issue_size: number | null;
  update_time: string | null;
  updated_at: string | null;
}

export interface DividendHistory {
  registry_close_date: string;
  value: number;
  currency: string | null;
}

export interface IndexHistory {
  ticker: string;
  trade_date: string;
  close: number;
  capitalization: number | null;
}

export interface CurrencyHistory {
  pair: string;
  trade_date: string;
  close: number;
}

export interface BrentHistory {
  trade_date: string;
  close: number;
}

export interface TradingVolume {
  trade_date: string;
  value: number | null;
}

export interface WorldBankIndicator {
  country: string;
  indicator: string;
  year: number;
  value: number | null;
}

export interface GlobalExchange {
  ticker: string;
  trade_date: string;
  close: number;
}

export interface KeyRate {
  effective_date: string;
  rate: number;
}

export interface Meta {
  source: string;
  last_date: string | null;
  updated_at: string | null;
}

export interface PeerStockHistory {
  ticker: string;
  trade_date: string;
  close: number;
}
