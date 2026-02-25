// Color palette (matches prototype)
export const C = {
  bg: '#0a0e17',
  card: '#111827',
  card2: '#1a2234',
  gold: '#e8c547',
  cyan: '#4fc3f7',
  danger: '#ef5350',
  muted: '#8892a4',
  green: '#66bb6a',
  purple: '#ab47bc',
  orange: '#ffa726',
  pink: '#ec407a',
  teal: '#26a69a',
  lime: '#d4e157',
  indigo: '#5c6bc0',
} as const;

export const CHART_COLORS = [
  C.gold, C.cyan, C.green, C.danger,
  C.purple, C.orange, C.pink, C.teal,
];

export const GLOBAL_EXCHANGES = [
  { ticker: 'ICE', name: 'ICE', label: 'Intercontinental Exchange' },
  { ticker: 'CME', name: 'CME', label: 'CME Group' },
  { ticker: '0388.HK', name: 'HKEX', label: 'Hong Kong Exchanges' },
  { ticker: 'LSEG.LON', name: 'LSEG', label: 'London Stock Exchange' },
  { ticker: 'DB1.DEX', name: 'DB1', label: 'Deutsche Börse' },
] as const;

export const PEER_TICKERS = ['SBER', 'VTBR', 'T', 'CBOM', 'BSPB'] as const;

export const EVENTS = [
  { date: '2013-02-15', label: 'IPO Московской биржи', color: C.gold },
  { date: '2014-03-17', label: 'Крым: первые санкции ЕС/США', color: C.danger },
  { date: '2014-12-16', label: 'Ключевая ставка 17%', color: C.orange },
  { date: '2018-04-06', label: 'Санкции против Русала', color: C.orange },
  { date: '2020-03-18', label: 'COVID-19: обвал рынков', color: C.danger },
  { date: '2022-02-24', label: 'Начало СВО, массовые санкции', color: C.danger },
  { date: '2022-02-28', label: 'Ключевая ставка 20%', color: C.orange },
  { date: '2022-03-28', label: 'Возобновление торгов на MOEX', color: C.green },
  { date: '2023-07-24', label: 'Начало цикла повышения ставки', color: C.orange },
  { date: '2024-10-25', label: 'Ключевая ставка 21%', color: C.danger },
] as const;

export const KEY_RATE_HISTORY = [
  { date: '2013-09-13', rate: 5.50 },
  { date: '2014-03-03', rate: 7.00 },
  { date: '2014-04-28', rate: 7.50 },
  { date: '2014-10-31', rate: 9.50 },
  { date: '2014-12-12', rate: 10.50 },
  { date: '2014-12-16', rate: 17.00 },
  { date: '2015-02-02', rate: 15.00 },
  { date: '2015-08-03', rate: 11.00 },
  { date: '2016-06-14', rate: 10.50 },
  { date: '2017-03-27', rate: 9.75 },
  { date: '2017-12-18', rate: 7.75 },
  { date: '2018-09-17', rate: 7.50 },
  { date: '2019-06-17', rate: 7.50 },
  { date: '2019-12-16', rate: 6.25 },
  { date: '2020-04-27', rate: 5.50 },
  { date: '2020-07-27', rate: 4.25 },
  { date: '2021-03-22', rate: 4.50 },
  { date: '2021-07-26', rate: 6.50 },
  { date: '2021-12-20', rate: 8.50 },
  { date: '2022-02-28', rate: 20.00 },
  { date: '2022-04-11', rate: 17.00 },
  { date: '2022-09-19', rate: 7.50 },
  { date: '2023-07-24', rate: 8.50 },
  { date: '2023-10-30', rate: 15.00 },
  { date: '2023-12-18', rate: 16.00 },
  { date: '2024-07-26', rate: 18.00 },
  { date: '2024-10-25', rate: 21.00 },
] as const;

export const MOEX_ISSUE_SIZE = 2_276_401_458;

export type Period = '3Y' | '5Y' | '10Y' | 'ALL';

export function getPeriodDates(period: Period): { from: string; to: string } {
  const today = new Date().toISOString().substring(0, 10);
  const year = new Date().getFullYear();
  switch (period) {
    case '3Y': return { from: `${year - 3}-01-01`, to: today };
    case '5Y': return { from: `${year - 5}-01-01`, to: today };
    case '10Y': return { from: `${year - 10}-01-01`, to: today };
    default: return { from: '2013-01-01', to: today };
  }
}

// Navigation tabs
export const TABS = [
  { path: '/', label: 'Обзор', key: 'summary' },
  { path: '/performance', label: 'Динамика', key: 'performance' },
  { path: '/peers', label: 'Сравнение', key: 'peers' },
  { path: '/drivers', label: 'Факторы', key: 'drivers' },
  { path: '/macro', label: 'Макро', key: 'macro' },
  { path: '/data-health', label: 'Данные', key: 'data-health' },
] as const;
