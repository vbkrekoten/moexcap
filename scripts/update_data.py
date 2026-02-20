"""
MOEX Dashboard — Daily data updater.
Fetches data from ISS MOEX, World Bank, stooq.com and upserts into Supabase.
Run via GitHub Actions or manually.
"""

import os
import sys
import time
import logging
import requests
from datetime import date, timedelta
from supabase import create_client

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
log = logging.getLogger(__name__)

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
sb = create_client(SUPABASE_URL, SUPABASE_KEY)

TODAY = date.today().isoformat()
BATCH_SIZE = 500
MOEX_PAGE_SIZE = 100
MOEX_DELAY = 0.35
BATCH_DELAY = 0.5

# Key rate history — seeded on first run, then maintained manually
KEY_RATE_SEED = [
    ("2013-09-13", 5.50), ("2014-03-03", 7.00), ("2014-04-28", 7.50),
    ("2014-10-31", 9.50), ("2014-12-12", 10.50), ("2014-12-16", 17.00),
    ("2015-02-02", 15.00), ("2015-08-03", 11.00), ("2016-06-14", 10.50),
    ("2017-03-27", 9.75), ("2017-12-18", 7.75), ("2018-09-17", 7.50),
    ("2019-06-17", 7.50), ("2019-12-16", 6.25), ("2020-04-27", 5.50),
    ("2020-07-27", 4.25), ("2021-03-22", 4.50), ("2021-07-26", 6.50),
    ("2021-12-20", 8.50), ("2022-02-28", 20.00), ("2022-04-11", 17.00),
    ("2022-09-19", 7.50), ("2023-07-24", 8.50), ("2023-10-30", 15.00),
    ("2023-12-18", 16.00), ("2024-07-26", 18.00), ("2024-10-25", 21.00),
]


# ── Helpers ──────────────────────────────────────────

def get_last_date(source: str) -> str | None:
    result = sb.table("meta").select("last_date").eq("source", source).execute()
    if result.data and result.data[0].get("last_date"):
        return result.data[0]["last_date"]
    return None


def set_last_date(source: str, last_date: str):
    sb.table("meta").upsert({"source": source, "last_date": last_date}).execute()


def upsert_batch(table: str, rows: list):
    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i : i + BATCH_SIZE]
        sb.table(table).upsert(batch).execute()
        if i + BATCH_SIZE < len(rows):
            time.sleep(BATCH_DELAY)


def fetch_moex_paginated(url_template: str, from_date: str, to_date: str, parse_row) -> list:
    all_rows = []
    start = 0
    while True:
        url = url_template.format(from_=from_date, to=to_date, start=start)
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        j = resp.json()
        history = j.get("history", {})
        columns = history.get("columns", [])
        data = history.get("data", [])
        if not data:
            break
        for row in data:
            parsed = parse_row(columns, row)
            if parsed:
                all_rows.append(parsed)
        if len(data) < MOEX_PAGE_SIZE:
            break
        start += MOEX_PAGE_SIZE
        time.sleep(MOEX_DELAY)
    return all_rows


def incremental_dates(source: str, default_from: str = "2013-01-01") -> tuple[str, str]:
    last = get_last_date(source)
    from_date = (date.fromisoformat(last) + timedelta(days=1)).isoformat() if last else default_from
    return from_date, TODAY


# ── Updaters ─────────────────────────────────────────

def update_moex_stock_history():
    source = "moex_stock_history"
    from_date, to_date = incremental_dates(source)
    if from_date > to_date:
        log.info(f"{source}: already up to date")
        return

    def parse(cols, row):
        close = row[cols.index("CLOSE")]
        if not close or close <= 0:
            return None
        return {
            "trade_date": row[cols.index("TRADEDATE")],
            "open": row[cols.index("OPEN")],
            "high": row[cols.index("HIGH")],
            "low": row[cols.index("LOW")],
            "close": close,
            "volume": row[cols.index("VOLUME")] or 0,
            "value": row[cols.index("VALUE")] or 0,
        }

    rows = fetch_moex_paginated(
        "https://iss.moex.com/iss/history/engines/stock/markets/shares/boards/TQBR/securities/MOEX.json"
        "?from={from_}&till={to}&iss.meta=off&start={start}",
        from_date, to_date, parse,
    )
    if rows:
        upsert_batch(source, rows)
        set_last_date(source, rows[-1]["trade_date"])
        log.info(f"{source}: upserted {len(rows)} rows")
    else:
        log.info(f"{source}: no new data")


def update_moex_live():
    source = "moex_live"
    try:
        url = "https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities/MOEX.json?iss.meta=off"
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        j = resp.json()

        row_data = {"id": 1}

        sec = j.get("securities", {})
        if sec.get("data"):
            cols = sec["columns"]
            row = sec["data"][0]
            is_idx = cols.index("ISSUESIZE")
            row_data["issue_size"] = row[is_idx] or 0

        md = j.get("marketdata", {})
        if md.get("data"):
            cols = md["columns"]
            row = md["data"][0]
            row_data["last_price"] = row[cols.index("LAST")]
            row_data["open_price"] = row[cols.index("OPEN")]
            row_data["high_price"] = row[cols.index("HIGH")]
            row_data["low_price"] = row[cols.index("LOW")]
            row_data["cap"] = row[cols.index("ISSUECAPITALIZATION")]
            row_data["cap_trend"] = row[cols.index("TRENDISSUECAPITALIZATION")]
            row_data["vol_today"] = row[cols.index("VOLTODAY")]
            row_data["val_today"] = row[cols.index("VALTODAY")]
            row_data["num_trades"] = row[cols.index("NUMTRADES")]
            row_data["update_time"] = row[cols.index("UPDATETIME")]

        # Also fetch issue size from security description
        url2 = "https://iss.moex.com/iss/securities/MOEX.json?iss.meta=off"
        resp2 = requests.get(url2, timeout=15)
        resp2.raise_for_status()
        j2 = resp2.json()
        if j2.get("description", {}).get("data"):
            for desc_row in j2["description"]["data"]:
                if desc_row[0] == "ISSUESIZE":
                    row_data["issue_size"] = int(desc_row[2])

        sb.table(source).upsert(row_data).execute()
        set_last_date(source, TODAY)
        log.info(f"{source}: updated")
    except Exception as e:
        raise RuntimeError(f"{source}: {e}") from e


def update_moex_dividends():
    source = "moex_dividends"
    try:
        url = "https://iss.moex.com/iss/securities/MOEX/dividends.json?iss.meta=off"
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        j = resp.json()
        divs = []
        if j.get("dividends", {}).get("data"):
            cols = j["dividends"]["columns"]
            ri = cols.index("registryclosedate")
            vi = cols.index("value")
            ci = cols.index("currencyid")
            for row in j["dividends"]["data"]:
                if row[ri] and row[vi]:
                    divs.append({
                        "registry_close_date": row[ri],
                        "value": row[vi],
                        "currency": row[ci] or "SUR",
                    })
        if divs:
            upsert_batch(source, divs)
            set_last_date(source, divs[-1]["registry_close_date"])
            log.info(f"{source}: upserted {len(divs)} rows")
    except Exception as e:
        raise RuntimeError(f"{source}: {e}") from e


def update_index_history(ticker: str):
    source = f"index_history_{ticker}"
    from_date, to_date = incremental_dates(source)
    if from_date > to_date:
        log.info(f"{source}: already up to date")
        return

    def parse(cols, row):
        close = row[cols.index("CLOSE")]
        if not close or close <= 0:
            return None
        return {
            "ticker": ticker,
            "trade_date": row[cols.index("TRADEDATE")],
            "close": close,
        }

    rows = fetch_moex_paginated(
        f"https://iss.moex.com/iss/history/engines/stock/markets/index/securities/{ticker}.json"
        "?from={from_}&till={to}&iss.meta=off&start={start}",
        from_date, to_date, parse,
    )
    if rows:
        upsert_batch("index_history", rows)
        set_last_date(source, rows[-1]["trade_date"])
        log.info(f"{source}: upserted {len(rows)} rows")
    else:
        log.info(f"{source}: no new data")


def update_currency_history():
    """Fetch USD/RUB from Central Bank of Russia (CBR) XML API."""
    source = "currency_history"
    from_date, to_date = incremental_dates(source)
    if from_date > to_date:
        log.info(f"{source}: already up to date")
        return

    import xml.etree.ElementTree as ET
    from datetime import datetime

    d1 = datetime.fromisoformat(from_date).strftime("%d/%m/%Y")
    d2 = datetime.fromisoformat(to_date).strftime("%d/%m/%Y")
    url = f"http://www.cbr.ru/scripts/XML_dynamic.asp?date_req1={d1}&date_req2={d2}&VAL_NM_RQ=R01235"
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    root = ET.fromstring(resp.content.decode("windows-1251"))

    rows = []
    for rec in root.findall("Record"):
        date_str = rec.attrib["Date"]
        value_str = rec.find("Value").text.replace(",", ".")
        nominal = int(rec.find("Nominal").text)
        trade_date = datetime.strptime(date_str, "%d.%m.%Y").strftime("%Y-%m-%d")
        rows.append({
            "pair": "USD/RUB",
            "trade_date": trade_date,
            "close": round(float(value_str) / nominal, 4),
        })

    if rows:
        upsert_batch(source, rows)
        set_last_date(source, rows[-1]["trade_date"])
        log.info(f"{source}: upserted {len(rows)} rows (source: CBR)")
    else:
        log.info(f"{source}: no new data")


def update_brent_history():
    """Fetch Brent crude oil prices from GitHub/DataHub (EIA source data)."""
    source = "brent_history"
    last = get_last_date(source)
    from_date = last if last else "2013-01-01"

    url = "https://raw.githubusercontent.com/datasets/oil-prices/main/data/brent-daily.csv"
    resp = requests.get(url, timeout=30, headers={
        "User-Agent": "Mozilla/5.0 (compatible; MOEX-Dashboard/1.0)"
    })
    resp.raise_for_status()

    rows = []
    for line in resp.text.strip().split("\n")[1:]:
        parts = line.split(",")
        if len(parts) >= 2 and parts[0] >= from_date:
            try:
                close = float(parts[1])
                if close > 0:
                    rows.append({"trade_date": parts[0], "close": close})
            except ValueError:
                continue

    # Skip rows we already have (up to and including last date)
    if last:
        rows = [r for r in rows if r["trade_date"] > last]

    if rows:
        upsert_batch(source, rows)
        set_last_date(source, rows[-1]["trade_date"])
        log.info(f"{source}: upserted {len(rows)} rows (source: DataHub/EIA)")
    else:
        log.info(f"{source}: no new data")


def update_trading_volumes():
    source = "trading_volumes"
    from_date, to_date = incremental_dates(source)
    if from_date > to_date:
        log.info(f"{source}: already up to date")
        return

    def parse(cols, row):
        val = row[cols.index("VALUE")]
        if not val or val <= 0:
            return None
        return {
            "trade_date": row[cols.index("TRADEDATE")],
            "value": val,
        }

    rows = fetch_moex_paginated(
        "https://iss.moex.com/iss/history/engines/stock/markets/index/securities/IMOEX.json"
        "?from={from_}&till={to}&iss.meta=off&iss.only=history&history.columns=TRADEDATE,VALUE&start={start}",
        from_date, to_date, parse,
    )
    if rows:
        upsert_batch(source, rows)
        set_last_date(source, rows[-1]["trade_date"])
        log.info(f"{source}: upserted {len(rows)} rows")
    else:
        log.info(f"{source}: no new data")


def update_world_bank():
    source = "world_bank_indicators"
    current_year = date.today().year
    indicators = [
        ("NY.GDP.MKTP.CD", "GDP"),
        ("FP.CPI.TOTL.ZG", "CPI"),
    ]
    all_rows = []
    for indicator, label in indicators:
        try:
            url = f"https://api.worldbank.org/v2/country/RU/indicator/{indicator}?format=json&date=2013:{current_year}&per_page=500"
            resp = requests.get(url, timeout=15)
            resp.raise_for_status()
            j = resp.json()
            if j and len(j) > 1 and j[1]:
                for item in j[1]:
                    if item.get("value") is not None:
                        all_rows.append({
                            "country": item["country"]["id"],
                            "indicator": indicator,
                            "year": int(item["date"]),
                            "value": item["value"],
                        })
            log.info(f"{source}/{label}: fetched {len([r for r in all_rows if r['indicator'] == indicator])} rows")
            time.sleep(0.5)
        except Exception as e:
            log.error(f"{source}/{label}: {e}")

    if all_rows:
        upsert_batch(source, all_rows)
        set_last_date(source, TODAY)


def update_global_exchanges():
    source = "global_exchanges"
    exchanges = [
        ("ice.us", "ICE"),
        ("cme.us", "CME"),
        ("388.hk", "HKEX"),
        ("lseg.uk", "LSEG"),
        ("db1.de", "DB1"),
    ]
    from_date = get_last_date(source) or "2013-01-01"
    d1 = from_date.replace("-", "")
    d2 = TODAY.replace("-", "")

    all_rows = []
    for stooq_ticker, name in exchanges:
        try:
            url = f"https://stooq.com/q/d/l/?s={stooq_ticker}&i=m&d1={d1}&d2={d2}"
            resp = requests.get(url, timeout=20, headers={
                "User-Agent": "Mozilla/5.0 (compatible; MOEX-Dashboard/1.0)"
            })
            resp.raise_for_status()
            lines = resp.text.strip().split("\n")
            count = 0
            for line in lines[1:]:
                parts = line.split(",")
                if len(parts) >= 5:
                    close = float(parts[4])
                    if close > 0:
                        all_rows.append({
                            "ticker": name,
                            "trade_date": parts[0],
                            "close": close,
                        })
                        count += 1
            log.info(f"{source}/{name}: fetched {count} rows")
            time.sleep(1)
        except Exception as e:
            log.error(f"{source}/{name}: {e}")

    if all_rows:
        upsert_batch(source, all_rows)
        set_last_date(source, TODAY)
        log.info(f"{source}: upserted {len(all_rows)} total rows")


def update_key_rates():
    source = "key_rates"
    result = sb.table(source).select("effective_date").limit(1).execute()
    if not result.data:
        # Seed from hardcoded data
        rows = [{"effective_date": d, "rate": r} for d, r in KEY_RATE_SEED]
        upsert_batch(source, rows)
        set_last_date(source, KEY_RATE_SEED[-1][0])
        log.info(f"{source}: seeded {len(rows)} rows")
    else:
        log.info(f"{source}: already seeded (update manually when CBR changes rate)")


# ── Main ─────────────────────────────────────────────

def main():
    updaters = [
        ("moex_stock_history", update_moex_stock_history),
        ("moex_live", update_moex_live),
        ("moex_dividends", update_moex_dividends),
        ("index_history/IMOEX", lambda: update_index_history("IMOEX")),
        ("index_history/RTSI", lambda: update_index_history("RTSI")),
        ("currency_history", update_currency_history),
        ("brent_history", update_brent_history),
        ("trading_volumes", update_trading_volumes),
        ("world_bank", update_world_bank),
        ("global_exchanges", update_global_exchanges),
        ("key_rates", update_key_rates),
    ]

    errors = []
    for name, fn in updaters:
        try:
            log.info(f"--- {name} ---")
            fn()
        except Exception as e:
            log.error(f"{name} FAILED: {e}")
            errors.append(name)

    if errors:
        log.error(f"Failed sources: {errors}")
        sys.exit(1)

    log.info("All sources updated successfully")


if __name__ == "__main__":
    main()
