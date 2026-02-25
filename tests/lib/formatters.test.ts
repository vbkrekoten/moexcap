import { describe, it, expect } from 'vitest';
import { fmtNum, fmtPct, fmtDate, fmtMonthShort } from '../../src/lib/formatters';

describe('fmtNum', () => {
  it('returns dash for null/undefined/NaN', () => {
    expect(fmtNum(null)).toBe('\u2014');
    expect(fmtNum(undefined)).toBe('\u2014');
    expect(fmtNum(NaN)).toBe('\u2014');
  });

  it('formats trillions', () => {
    expect(fmtNum(1.5e12)).toBe('1.5 трлн');
  });

  it('formats billions', () => {
    expect(fmtNum(2.3e9)).toBe('2.3 млрд');
  });

  it('formats millions', () => {
    expect(fmtNum(7.8e6)).toBe('7.8 млн');
  });

  it('formats regular numbers', () => {
    const result = fmtNum(1234);
    // Should contain digits and possibly locale separators
    expect(result).toContain('1');
    expect(result).toContain('234');
  });

  it('respects decimal parameter', () => {
    expect(fmtNum(3.14159, 2)).toContain('3');
  });

  it('handles negative trillions', () => {
    expect(fmtNum(-1.5e12)).toBe('-1.5 трлн');
  });
});

describe('fmtPct', () => {
  it('returns dash for null/undefined', () => {
    expect(fmtPct(null)).toBe('\u2014');
    expect(fmtPct(undefined)).toBe('\u2014');
  });

  it('formats positive with plus sign', () => {
    expect(fmtPct(5.5)).toBe('+5.5%');
  });

  it('formats negative with minus sign', () => {
    expect(fmtPct(-3.2)).toBe('-3.2%');
  });

  it('formats zero with plus sign', () => {
    expect(fmtPct(0)).toBe('+0.0%');
  });
});

describe('fmtDate', () => {
  it('returns dash for null/undefined/empty', () => {
    expect(fmtDate(null)).toBe('\u2014');
    expect(fmtDate(undefined)).toBe('\u2014');
    expect(fmtDate('')).toBe('\u2014');
  });

  it('formats ISO date string', () => {
    const result = fmtDate('2024-03-15');
    // Should contain day, month, year parts
    expect(result).toBeTruthy();
    expect(result).not.toBe('\u2014');
  });
});

describe('fmtMonthShort', () => {
  it('formats month-year correctly', () => {
    expect(fmtMonthShort('2024-01')).toBe('янв 24');
    expect(fmtMonthShort('2024-03')).toBe('мар 24');
    expect(fmtMonthShort('2024-12')).toBe('дек 24');
  });

  it('works with full date strings', () => {
    expect(fmtMonthShort('2024-06-15')).toBe('июн 24');
  });
});
