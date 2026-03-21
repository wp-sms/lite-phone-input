import { describe, it, expect } from 'vitest';
import { formatPhone, extractDigits, normalizeNumerals } from '../../src/core/format';

describe('formatPhone', () => {
  it('formats digits according to mask', () => {
    expect(formatPhone('2025551234', 'XXX XXX XXXX')).toBe('202 555 1234');
  });

  it('returns empty string for empty input', () => {
    expect(formatPhone('', 'XXX XXX XXXX')).toBe('');
  });

  it('handles partial input', () => {
    expect(formatPhone('202', 'XXX XXX XXXX')).toBe('202');
  });

  it('appends overflow digits unformatted', () => {
    expect(formatPhone('20255512345', 'XXX XXX XXXX')).toBe('202 555 12345');
  });

  it('uses fallback grouping when no pattern', () => {
    expect(formatPhone('1234567890', null)).toBe('1234 5678 90');
  });
});

describe('extractDigits', () => {
  it('strips non-digit characters', () => {
    expect(extractDigits('+1 (202) 555-1234')).toBe('12025551234');
  });
});

describe('normalizeNumerals', () => {
  it('converts Arabic-Indic to ASCII', () => {
    expect(normalizeNumerals('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
  });

  it('converts Persian to ASCII', () => {
    expect(normalizeNumerals('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789');
  });

  it('passes ASCII through unchanged', () => {
    expect(normalizeNumerals('0123456789')).toBe('0123456789');
  });
});
