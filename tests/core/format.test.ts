import { describe, it, expect } from 'vitest';
import { formatPhone, getCursorPosition, extractDigits, normalizeNumerals } from '../../src/core/format';

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

describe('getCursorPosition', () => {
  it('returns 0 when oldCursor is 0', () => {
    expect(getCursorPosition('+1 202', 0, '202')).toBe(0);
  });

  it('counts + as relevant character', () => {
    expect(getCursorPosition('+', 1, '+')).toBe(1);
  });

  it('places cursor after matching relevant chars', () => {
    expect(getCursorPosition('+1202', 3, '+1 202')).toBe(4);
  });

  it('handles transition from international to national format', () => {
    // Backspace "+" from "+1 202" → "1 202", cursor should be at 0
    expect(getCursorPosition('+1 202', 0, '1202')).toBe(0);
  });

  it('falls back to end when new value has fewer relevant chars', () => {
    expect(getCursorPosition('+1 202 555', 10, '+1 202')).toBe(6);
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
