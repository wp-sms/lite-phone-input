import { describe, it, expect } from 'vitest';
import { validatePhone } from '../../src/core/validate';
import type { Country } from '../../src/core/types';

const US: Country = {
  code: 'US',
  name: 'United States',
  dialCode: '1',
  format: 'XXX XXX XXXX',
  nationalPrefix: '1',
  minLength: 10,
  maxLength: 10,
  priority: 0,
};

const DE: Country = {
  code: 'DE',
  name: 'Germany',
  dialCode: '49',
  format: 'XXXX XXXXXXX',
  nationalPrefix: '0',
  minLength: 10,
  maxLength: 11,
  priority: 0,
};

describe('validatePhone', () => {
  it('returns valid for digits matching exact length', () => {
    const result = validatePhone('2025551234', US);
    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
    expect(result.currentDigits).toBe(10);
  });

  it('returns too_short when digits below minimum', () => {
    const result = validatePhone('20255', US);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('too_short');
    expect(result.currentDigits).toBe(5);
  });

  it('returns too_long when digits exceed maximum', () => {
    const result = validatePhone('202555123456', US);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('too_long');
    expect(result.currentDigits).toBe(12);
  });

  it('handles countries with different min and max', () => {
    expect(validatePhone('1234567890', DE).valid).toBe(true);
    expect(validatePhone('12345678901', DE).valid).toBe(true);
    expect(validatePhone('123456789', DE).valid).toBe(false);
    expect(validatePhone('123456789012', DE).valid).toBe(false);
  });

  it('returns too_short for empty string', () => {
    const result = validatePhone('', US);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('too_short');
    expect(result.currentDigits).toBe(0);
  });

  it('always includes minDigits, maxDigits, currentDigits', () => {
    const valid = validatePhone('2025551234', US);
    expect(valid.minDigits).toBe(10);
    expect(valid.maxDigits).toBe(10);
    expect(valid.currentDigits).toBe(10);

    const invalid = validatePhone('202', US);
    expect(invalid.minDigits).toBe(10);
    expect(invalid.maxDigits).toBe(10);
    expect(invalid.currentDigits).toBe(3);
  });
});
