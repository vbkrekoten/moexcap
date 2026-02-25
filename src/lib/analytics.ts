import { KEY_RATE_HISTORY } from './constants';

export interface PricePoint {
  date: string;
  close: number;
}

// Pearson correlation on two arrays
export function pearson(x: number[], y: number[]): number | null {
  const n = Math.min(x.length, y.length);
  if (n < 5) return null;
  let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
  for (let i = 0; i < n; i++) {
    sx += x[i]; sy += y[i];
    sxx += x[i] * x[i]; syy += y[i] * y[i];
    sxy += x[i] * y[i];
  }
  const denom = Math.sqrt((n * sxx - sx * sx) * (n * syy - sy * sy));
  return denom === 0 ? 0 : (n * sxy - sx * sy) / denom;
}

// Downsample daily data to monthly (last observation per month)
export function monthlyDownsample<T extends { date: string }>(data: T[]): T[] {
  if (!data || data.length === 0) return [];
  const byMonth: Record<string, T> = {};
  data.forEach(d => {
    const m = d.date.substring(0, 7);
    byMonth[m] = d;
  });
  return Object.values(byMonth).sort((a, b) => a.date.localeCompare(b.date));
}

// Monthly returns from price array
export function monthlyReturns(data: PricePoint[]): { date: string; ret: number }[] {
  const monthly = monthlyDownsample(data);
  const ret: { date: string; ret: number }[] = [];
  for (let i = 1; i < monthly.length; i++) {
    if (monthly[i - 1].close > 0) {
      ret.push({
        date: monthly[i].date,
        ret: monthly[i].close / monthly[i - 1].close - 1,
      });
    }
  }
  return ret;
}

// Interpolate key rate to monthly series
export function interpolateKeyRate(
  from: string,
  to: string,
): { date: string; rate: number }[] {
  const result: { date: string; rate: number }[] = [];
  const d = new Date(from);
  const end = new Date(to);
  while (d <= end) {
    const ds = d.toISOString().substring(0, 10);
    let rate: number = KEY_RATE_HISTORY[0]?.rate ?? 0;
    for (const r of KEY_RATE_HISTORY) {
      if (r.date <= ds) rate = r.rate;
      else break;
    }
    result.push({ date: ds.substring(0, 7), rate });
    d.setMonth(d.getMonth() + 1);
  }
  return result;
}

// 20-day rolling annualized volatility
export function rollingVolatility(
  data: PricePoint[],
  window = 20,
): { date: string; vol: number }[] {
  if (data.length < window + 1) return [];
  const logRet: number[] = [];
  for (let i = 1; i < data.length; i++) {
    logRet.push(Math.log(data[i].close / data[i - 1].close));
  }
  const result: { date: string; vol: number }[] = [];
  for (let i = window - 1; i < logRet.length; i++) {
    const slice = logRet.slice(i - window + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / window;
    const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / (window - 1);
    result.push({
      date: data[i + 1].date,
      vol: Math.sqrt(variance) * Math.sqrt(252) * 100,
    });
  }
  return result;
}

// Maximum drawdown from ATH
export function maxDrawdown(data: PricePoint[]): { date: string; dd: number }[] {
  if (data.length === 0) return [];
  let peak = data[0].close;
  return data.map(d => {
    if (d.close > peak) peak = d.close;
    return { date: d.date, dd: ((d.close - peak) / peak) * 100 };
  });
}

// Rolling 12-month Pearson correlation
export function rollingCorrelation(
  x: { date: string; ret: number }[],
  y: { date: string; ret: number }[],
  window = 12,
): { date: string; corr: number }[] {
  const merged: { date: string; xr: number; yr: number }[] = [];
  const yMap = new Map(y.map(d => [d.date.substring(0, 7), d.ret]));
  for (const d of x) {
    const m = d.date.substring(0, 7);
    const yr = yMap.get(m);
    if (yr !== undefined) {
      merged.push({ date: d.date, xr: d.ret, yr });
    }
  }
  const result: { date: string; corr: number }[] = [];
  for (let i = window - 1; i < merged.length; i++) {
    const slice = merged.slice(i - window + 1, i + 1);
    const xArr = slice.map(s => s.xr);
    const yArr = slice.map(s => s.yr);
    const c = pearson(xArr, yArr);
    if (c !== null) {
      result.push({ date: merged[i].date, corr: c });
    }
  }
  return result;
}

// Simple OLS regression: y = alpha + beta * x
export function ols(
  x: number[],
  y: number[],
): { alpha: number; beta: number; r2: number } | null {
  const n = Math.min(x.length, y.length);
  if (n < 5) return null;
  let sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    sx += x[i]; sy += y[i];
    sxx += x[i] * x[i]; sxy += x[i] * y[i];
    syy += y[i] * y[i];
  }
  const denom = n * sxx - sx * sx;
  if (denom === 0) return null;
  const beta = (n * sxy - sx * sy) / denom;
  const alpha = (sy - beta * sx) / n;
  const yMean = sy / n;
  let ssTot = 0, ssRes = 0;
  for (let i = 0; i < n; i++) {
    ssTot += (y[i] - yMean) ** 2;
    ssRes += (y[i] - (alpha + beta * x[i])) ** 2;
  }
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  return { alpha, beta, r2 };
}

// Tick interval helper (for Recharts XAxis)
export function tickInterval(arr: unknown[], maxTicks = 12): number {
  return Math.max(1, Math.floor((arr?.length || 1) / maxTicks));
}
