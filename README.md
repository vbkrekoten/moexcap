# MOEX Dashboard

Дашборд коммерческого директора Московской биржи (MOEX).
Аналитика динамики акций, сравнение с пирами/индексами, факторный анализ, макроэкономика и мониторинг свежести данных.

## Стек

- **Frontend:** React 19, TypeScript, Vite 7, Tailwind CSS 4, Recharts 3
- **Backend:** Supabase (PostgreSQL + PostgREST + Auth + Edge Functions)
- **Hosting:** GitHub Pages (HTTPS, CDN)
- **Data ingestion:** 6 Supabase Edge Functions (Deno)

## Экраны

| # | Экран | Описание |
|---|-------|----------|
| 1 | Executive Summary | KPI-карточки, спарклайн, автоинсайты, светофор свежести |
| 2 | Performance | Цена, капитализация, доходности, волатильность, просадка |
| 3 | Peers & Index | MOEX vs IMOEX/RTSI, vs пиры (SBER, VTBR, T, CBOM, BSPB), vs мировые биржи |
| 4 | Drivers | Факторный график, корреляции, rolling correlation, регрессия |
| 5 | Macro | ВВП, CPI, ключевая ставка, USD/RUB, Brent, таймлайн |
| 6 | Data Health | Таблица свежести, алерты, кнопка ручного обновления |

## Источники данных

- **MOEX ISS API** — акции, индексы, фьючерсы, дивиденды
- **ЦБ РФ** — официальный курс USD/RUB, ключевая ставка
- **Alpha Vantage** — мировые биржи (ICE, CME, HKEX, LSEG, DB1)
- **FRED API** — ВВП и CPI России

## Быстрый старт

```bash
# 1. Клонировать
git clone https://github.com/<your-user>/moex-dashboard.git
cd moex-dashboard

# 2. Установить зависимости
npm install

# 3. Настроить переменные
cp .env.example .env
# Отредактировать .env: VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY

# 4. Запустить dev-сервер
npm run dev
```

## Docker

```bash
# Сборка и запуск
docker compose up --build

# Доступен на http://localhost:3000
```

## Деплой на GitHub Pages

1. Добавить секреты в Settings > Secrets and variables > Actions:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. Push в `main` — деплой автоматический через `.github/workflows/deploy.yml`

## Edge Functions (Data Ingestion)

| Функция | Источник | Таблицы |
|---------|----------|---------|
| `refresh-moex` | MOEX ISS | moex_stock_history, moex_live, moex_dividends |
| `refresh-market` | MOEX ISS | index_history, brent_history, trading_volumes |
| `refresh-cbr` | ЦБ РФ | currency_history, key_rates |
| `refresh-peers` | MOEX ISS | peer_stock_history |
| `refresh-global` | Alpha Vantage | global_exchanges |
| `refresh-macro` | FRED API | world_bank_indicators |

Для `refresh-global` и `refresh-macro` нужны API-ключи в Supabase Edge Function secrets:
- `ALPHA_VANTAGE_API_KEY` — бесплатный ключ на [alphavantage.co](https://www.alphavantage.co/support/#api-key)
- `FRED_API_KEY` — бесплатный ключ на [fred.stlouisfed.org](https://fred.stlouisfed.org/docs/api/api_key.html)

## Структура проекта

```
src/
  components/
    charts/       # Recharts-графики (PriceChart, VolatilityChart, ...)
    sections/     # Составные блоки (KPIRow, CorrelationCards, ...)
    layout/       # Header, Footer, AuthGuard
    ui/           # KPICard, Section, PeriodSelector, ...
  hooks/          # useDashboardData, useAuth, useAnalytics
  lib/            # supabase.ts, analytics.ts, formatters.ts, constants.ts, types.ts
  pages/          # 6 страниц + LoginPage
```

## Лицензия

MIT
