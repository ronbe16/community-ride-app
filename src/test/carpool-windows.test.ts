import { describe, it, expect } from 'vitest';
import { WINDOWS } from '@/lib/carpool-windows';

describe('WINDOWS carpool boundaries', () => {
  it('morning window starts at 5 (5:00 AM PHT)', () => expect(WINDOWS.morning.start).toBe(5));
  it('morning window ends at 10 (10:00 AM PHT)', () => expect(WINDOWS.morning.end).toBe(10));
  it('evening window starts at 16 (4:00 PM PHT)', () => expect(WINDOWS.evening.start).toBe(16));
  it('evening window ends at 22 (10:00 PM PHT)', () => expect(WINDOWS.evening.end).toBe(22));

  it('morning window is 5 hours wide', () =>
    expect(WINDOWS.morning.end - WINDOWS.morning.start).toBe(5));
  it('evening window is 6 hours wide', () =>
    expect(WINDOWS.evening.end - WINDOWS.evening.start).toBe(6));

  it('gap between windows is 6 hours (10:00 AM–4:00 PM)', () =>
    expect(WINDOWS.evening.start - WINDOWS.morning.end).toBe(6));
});
