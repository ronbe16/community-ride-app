import { describe, it, expect } from 'vitest';

// Mirrors the normalisation logic added by SEC-004 in Profile.tsx handleSaveProfile
function normalisePhilippineMobile(raw: string): string | null {
  const clean = raw.trim();
  const localDigits = clean.startsWith('+63')
    ? clean.slice(3)
    : clean.replace(/\D/g, '');
  if (!/^9\d{9}$/.test(localDigits)) return null;
  return '+63' + localDigits;
}

describe('Profile mobile normalisation (SEC-004 regression guard)', () => {
  it('normalises local format to +63 prefix', () =>
    expect(normalisePhilippineMobile('9171234567')).toBe('+639171234567'));

  it('preserves already-normalised +63 format', () =>
    expect(normalisePhilippineMobile('+639171234567')).toBe('+639171234567'));

  it('strips spaces before normalising', () =>
    expect(normalisePhilippineMobile('  9171234567  ')).toBe('+639171234567'));

  it('rejects and returns null for non-mobile strings', () =>
    expect(normalisePhilippineMobile('test@example.com')).toBeNull());

  it('rejects empty string', () =>
    expect(normalisePhilippineMobile('')).toBeNull());

  it('rejects number not starting with 9', () =>
    expect(normalisePhilippineMobile('8171234567')).toBeNull());

  it('rejects 9-digit number (too short)', () =>
    expect(normalisePhilippineMobile('917123456')).toBeNull());
});
