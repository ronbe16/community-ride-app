import { describe, it, expect } from 'vitest';

// Mirrors the validation logic in Profile.tsx, Signup.tsx, and CompleteProfile.tsx
function isValidPhilippineMobile(raw: string): boolean {
  const digits = raw.trim().startsWith('+63')
    ? raw.trim().slice(3)
    : raw.trim().replace(/\D/g, '');
  return /^9\d{9}$/.test(digits);
}

describe('Philippine mobile number validation', () => {
  it('accepts 10-digit local format', () => expect(isValidPhilippineMobile('9171234567')).toBe(true));
  it('accepts +63 international format', () => expect(isValidPhilippineMobile('+639171234567')).toBe(true));
  it('accepts local format with leading spaces', () => expect(isValidPhilippineMobile('  9171234567  ')).toBe(true));
  it('rejects 9-digit number', () => expect(isValidPhilippineMobile('917123456')).toBe(false));
  it('rejects 11-digit number', () => expect(isValidPhilippineMobile('91712345678')).toBe(false));
  it('rejects number not starting with 9', () => expect(isValidPhilippineMobile('8171234567')).toBe(false));
  it('rejects empty string', () => expect(isValidPhilippineMobile('')).toBe(false));
  it('rejects email address', () => expect(isValidPhilippineMobile('test@example.com')).toBe(false));
  it('rejects landline format', () => expect(isValidPhilippineMobile('02-1234567')).toBe(false));
  it('rejects +63 with wrong starting digit', () => expect(isValidPhilippineMobile('+638171234567')).toBe(false));
});
