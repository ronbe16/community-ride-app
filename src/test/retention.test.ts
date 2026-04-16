import { describe, it, expect } from 'vitest';
import { ninetyDaysFromNow, ninetyDaysFrom } from '@/lib/retention';

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

describe('ninetyDaysFromNow', () => {
  it('returns a timestamp approximately 90 days from now', () => {
    const before = Date.now();
    const result = ninetyDaysFromNow();
    const after = Date.now();
    const expected = before + NINETY_DAYS_MS;
    expect(result.toMillis()).toBeGreaterThanOrEqual(expected);
    expect(result.toMillis()).toBeLessThanOrEqual(after + NINETY_DAYS_MS);
  });

  it('returns a timestamp strictly in the future', () => {
    const result = ninetyDaysFromNow();
    expect(result.toMillis()).toBeGreaterThan(Date.now());
  });
});

describe('ninetyDaysFrom', () => {
  it('returns a timestamp exactly 90 days after the given date', () => {
    const base = new Date('2026-01-01T00:00:00Z');
    const result = ninetyDaysFrom(base);
    const expected = new Date('2026-04-01T00:00:00Z').getTime();
    expect(result.toMillis()).toBe(expected);
  });

  it('handles leap years correctly', () => {
    // 2024 is a leap year; 90 days from Jan 1 2024 = Mar 31 2024
    // (Jan: 31 days remaining + Feb: 29 days + Mar 1-30 = 90 days)
    const base = new Date('2024-01-01T00:00:00Z');
    const result = ninetyDaysFrom(base);
    const expected = new Date('2024-03-31T00:00:00Z').getTime();
    expect(result.toMillis()).toBe(expected);
  });
});
