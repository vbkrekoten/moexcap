import { describe, it, expect } from 'vitest';
import {
  pearson, monthlyDownsample, monthlyReturns,
  rollingVolatility, maxDrawdown, rollingCorrelation, ols, tickInterval,
} from '../../src/lib/analytics';

describe('pearson', () => {
  it('returns null for arrays shorter than 5', () => {
    expect(pearson([1, 2, 3], [1, 2, 3])).toBeNull();
  });

  it('returns ~1 for perfectly correlated arrays', () => {
    const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const y = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20];
    const r = pearson(x, y);
    expect(r).not.toBeNull();
    expect(r!).toBeCloseTo(1, 5);
  });

  it('returns ~-1 for inversely correlated arrays', () => {
    const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const y = [20, 18, 16, 14, 12, 10, 8, 6, 4, 2];
    const r = pearson(x, y);
    expect(r!).toBeCloseTo(-1, 5);
  });

  it('returns 0 for constant arrays', () => {
    const x = [1, 1, 1, 1, 1, 1];
    const y = [1, 2, 3, 4, 5, 6];
    expect(pearson(x, y)).toBe(0);
  });
});

describe('monthlyDownsample', () => {
  it('returns empty for empty input', () => {
    expect(monthlyDownsample([])).toEqual([]);
  });

  it('keeps last observation per month', () => {
    const data = [
      { date: '2024-01-01', v: 1 },
      { date: '2024-01-15', v: 2 },
      { date: '2024-01-31', v: 3 },
      { date: '2024-02-01', v: 4 },
      { date: '2024-02-28', v: 5 },
    ];
    const result = monthlyDownsample(data);
    expect(result).toHaveLength(2);
    expect(result[0].v).toBe(3); // last of Jan
    expect(result[1].v).toBe(5); // last of Feb
  });
});

describe('monthlyReturns', () => {
  it('computes monthly returns correctly', () => {
    const data = [
      { date: '2024-01-31', close: 100 },
      { date: '2024-02-28', close: 110 },
      { date: '2024-03-31', close: 99 },
    ];
    const ret = monthlyReturns(data);
    expect(ret).toHaveLength(2);
    expect(ret[0].ret).toBeCloseTo(0.1, 5);
    expect(ret[1].ret).toBeCloseTo(-0.1, 5);
  });
});

describe('rollingVolatility', () => {
  it('returns empty for insufficient data', () => {
    expect(rollingVolatility([{ date: '2024-01-01', close: 100 }])).toEqual([]);
  });

  it('returns correct length for sufficient data', () => {
    const data = Array.from({ length: 30 }, (_, i) => ({
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      close: 100 + Math.sin(i) * 5,
    }));
    const vol = rollingVolatility(data, 20);
    // Should have (30 - 1) - 20 + 1 = 10 points
    expect(vol.length).toBe(10);
    // Volatility should be positive
    vol.forEach(v => expect(v.vol).toBeGreaterThan(0));
  });
});

describe('maxDrawdown', () => {
  it('returns empty for empty input', () => {
    expect(maxDrawdown([])).toEqual([]);
  });

  it('computes drawdown from ATH correctly', () => {
    const data = [
      { date: '2024-01-01', close: 100 },
      { date: '2024-01-02', close: 120 }, // new ATH
      { date: '2024-01-03', close: 90 },  // drawdown from 120
      { date: '2024-01-04', close: 60 },  // deeper drawdown
    ];
    const dd = maxDrawdown(data);
    expect(dd).toHaveLength(4);
    expect(dd[0].dd).toBe(0); // first point, no drawdown
    expect(dd[1].dd).toBe(0); // new ATH
    expect(dd[2].dd).toBeCloseTo(-25, 1); // (90-120)/120*100
    expect(dd[3].dd).toBeCloseTo(-50, 1); // (60-120)/120*100
  });
});

describe('ols', () => {
  it('returns null for arrays shorter than 5', () => {
    expect(ols([1, 2], [1, 2])).toBeNull();
  });

  it('finds perfect linear relationship', () => {
    const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const y = x.map(v => 2 * v + 3); // y = 3 + 2x
    const result = ols(x, y);
    expect(result).not.toBeNull();
    expect(result!.alpha).toBeCloseTo(3, 5);
    expect(result!.beta).toBeCloseTo(2, 5);
    expect(result!.r2).toBeCloseTo(1, 5);
  });

  it('handles noisy data with reasonable R2', () => {
    const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const y = [2.1, 4.3, 5.8, 8.2, 9.9, 12.1, 14.3, 15.8, 18.2, 20.1];
    const result = ols(x, y);
    expect(result).not.toBeNull();
    expect(result!.r2).toBeGreaterThan(0.95);
    expect(result!.beta).toBeGreaterThan(1.5);
  });
});

describe('rollingCorrelation', () => {
  it('returns empty for insufficient data', () => {
    const x = [{ date: '2024-01', ret: 0.01 }];
    const y = [{ date: '2024-01', ret: 0.02 }];
    expect(rollingCorrelation(x, y, 12)).toEqual([]);
  });
});

describe('tickInterval', () => {
  it('returns 1 for small arrays', () => {
    expect(tickInterval([1, 2, 3], 12)).toBe(1);
  });

  it('returns correct interval for larger arrays', () => {
    const arr = new Array(120).fill(0);
    expect(tickInterval(arr, 12)).toBe(10);
  });

  it('handles empty/undefined arrays', () => {
    expect(tickInterval([], 12)).toBe(1);
  });
});
