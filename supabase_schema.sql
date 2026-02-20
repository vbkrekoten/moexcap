-- ==============================================
-- MOEX Dashboard: Supabase Schema
-- ==============================================

-- 1. MOEX Stock OHLCV History
CREATE TABLE moex_stock_history (
  trade_date DATE PRIMARY KEY,
  open       NUMERIC(12,4),
  high       NUMERIC(12,4),
  low        NUMERIC(12,4),
  close      NUMERIC(12,4) NOT NULL,
  volume     BIGINT DEFAULT 0,
  value      NUMERIC(18,2) DEFAULT 0
);

-- 2. MOEX Live Snapshot (singleton row)
CREATE TABLE moex_live (
  id           INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_price   NUMERIC(12,4),
  open_price   NUMERIC(12,4),
  high_price   NUMERIC(12,4),
  low_price    NUMERIC(12,4),
  cap          NUMERIC(20,2),
  cap_trend    NUMERIC(20,2),
  vol_today    BIGINT,
  val_today    NUMERIC(18,2),
  num_trades   INTEGER,
  issue_size   BIGINT,
  update_time  TEXT,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MOEX Dividends
CREATE TABLE moex_dividends (
  registry_close_date DATE PRIMARY KEY,
  value               NUMERIC(10,4) NOT NULL,
  currency            TEXT DEFAULT 'SUR'
);

-- 4. Index History (IMOEX, RTSI)
CREATE TABLE index_history (
  ticker     TEXT NOT NULL,
  trade_date DATE NOT NULL,
  close      NUMERIC(12,4) NOT NULL,
  PRIMARY KEY (ticker, trade_date)
);

-- 5. Currency History (USD/RUB)
CREATE TABLE currency_history (
  pair       TEXT NOT NULL DEFAULT 'USD/RUB',
  trade_date DATE NOT NULL,
  close      NUMERIC(10,4) NOT NULL,
  PRIMARY KEY (pair, trade_date)
);

-- 6. Brent Futures History
CREATE TABLE brent_history (
  trade_date DATE PRIMARY KEY,
  close      NUMERIC(10,4) NOT NULL
);

-- 7. Trading Volumes (market totals)
CREATE TABLE trading_volumes (
  trade_date DATE PRIMARY KEY,
  value      NUMERIC(18,2) DEFAULT 0
);

-- 8. World Bank Indicators (GDP, CPI)
CREATE TABLE world_bank_indicators (
  country    TEXT NOT NULL,
  indicator  TEXT NOT NULL,
  year       INTEGER NOT NULL,
  value      NUMERIC(18,4),
  PRIMARY KEY (country, indicator, year)
);

-- 9. Global Exchanges (ICE, CME, HKEX, LSEG, DB1)
CREATE TABLE global_exchanges (
  ticker     TEXT NOT NULL,
  trade_date DATE NOT NULL,
  close      NUMERIC(12,4) NOT NULL,
  PRIMARY KEY (ticker, trade_date)
);

-- 10. Key Rates (CBR)
CREATE TABLE key_rates (
  effective_date DATE PRIMARY KEY,
  rate           NUMERIC(5,2) NOT NULL
);

-- 11. Meta (last update tracking)
CREATE TABLE meta (
  source      TEXT PRIMARY KEY,
  last_date   DATE,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- Row Level Security: public read-only via anon
-- ==============================================

ALTER TABLE moex_stock_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE moex_live ENABLE ROW LEVEL SECURITY;
ALTER TABLE moex_dividends ENABLE ROW LEVEL SECURITY;
ALTER TABLE index_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE currency_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE brent_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_volumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_bank_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON moex_stock_history FOR SELECT TO anon USING (true);
CREATE POLICY "Public read" ON moex_live FOR SELECT TO anon USING (true);
CREATE POLICY "Public read" ON moex_dividends FOR SELECT TO anon USING (true);
CREATE POLICY "Public read" ON index_history FOR SELECT TO anon USING (true);
CREATE POLICY "Public read" ON currency_history FOR SELECT TO anon USING (true);
CREATE POLICY "Public read" ON brent_history FOR SELECT TO anon USING (true);
CREATE POLICY "Public read" ON trading_volumes FOR SELECT TO anon USING (true);
CREATE POLICY "Public read" ON world_bank_indicators FOR SELECT TO anon USING (true);
CREATE POLICY "Public read" ON global_exchanges FOR SELECT TO anon USING (true);
CREATE POLICY "Public read" ON key_rates FOR SELECT TO anon USING (true);
CREATE POLICY "Public read" ON meta FOR SELECT TO anon USING (true);
