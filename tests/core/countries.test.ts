import { describe, it, expect } from 'vitest';
import {
  getFlag,
  processCountryData,
  getCountryByCode,
  getCountryByDialCode,
} from '../../src/core/countries';
import type { Country, CountryData } from '../../src/core/types';

describe('getFlag', () => {
  it('returns correct emoji for US', () => {
    expect(getFlag('US')).toBe('🇺🇸');
  });

  it('returns correct emoji for GB', () => {
    expect(getFlag('GB')).toBe('🇬🇧');
  });

  it('handles lowercase input', () => {
    expect(getFlag('us')).toBe(getFlag('US'));
  });
});

describe('processCountryData', () => {
  const raw: CountryData[] = [
    { c: 'US', n: 'United States', d: '1', f: 'XXX XXX XXXX', p: '1', min: 10, max: 10, pri: 0 },
    { c: 'GB', n: 'United Kingdom', d: '44', f: 'XXXX XXX XXXX', p: '0', min: 10, max: 10, pri: 0 },
  ];

  it('maps compressed fields to runtime Country objects', () => {
    const countries = processCountryData(raw);
    expect(countries).toHaveLength(2);
    expect(countries[0]).toEqual({
      code: 'US',
      name: 'United States',
      dialCode: '1',
      format: 'XXX XXX XXXX',
      nationalPrefix: '1',
      minLength: 10,
      maxLength: 10,
      priority: 0,
    });
  });

  it('preserves null nationalPrefix', () => {
    const data: CountryData[] = [
      { c: 'SA', n: 'Saudi Arabia', d: '966', f: 'XX XXX XXXX', p: null, min: 9, max: 9, pri: 0 },
    ];
    const countries = processCountryData(data);
    expect(countries[0].nationalPrefix).toBeNull();
  });
});

describe('getCountryByCode', () => {
  const countries: Country[] = [
    { code: 'US', name: 'United States', dialCode: '1', format: 'XXX XXX XXXX', nationalPrefix: '1', minLength: 10, maxLength: 10, priority: 0 },
    { code: 'GB', name: 'United Kingdom', dialCode: '44', format: 'XXXX XXX XXXX', nationalPrefix: '0', minLength: 10, maxLength: 10, priority: 0 },
  ];

  it('finds country by uppercase code', () => {
    expect(getCountryByCode(countries, 'US')?.code).toBe('US');
  });

  it('finds country by lowercase code', () => {
    expect(getCountryByCode(countries, 'gb')?.code).toBe('GB');
  });

  it('returns undefined for unknown code', () => {
    expect(getCountryByCode(countries, 'ZZ')).toBeUndefined();
  });
});

describe('getCountryByDialCode', () => {
  const countries: Country[] = [
    { code: 'US', name: 'United States', dialCode: '1', format: 'XXX XXX XXXX', nationalPrefix: '1', minLength: 10, maxLength: 10, priority: 0 },
    { code: 'CA', name: 'Canada', dialCode: '1', format: 'XXX XXX XXXX', nationalPrefix: '1', minLength: 10, maxLength: 10, priority: 7 },
    { code: 'GB', name: 'United Kingdom', dialCode: '44', format: 'XXXX XXX XXXX', nationalPrefix: '0', minLength: 10, maxLength: 10, priority: 0 },
  ];

  it('returns highest-priority country for shared dial code', () => {
    expect(getCountryByDialCode(countries, '1')?.code).toBe('US');
  });

  it('returns the only country for unique dial code', () => {
    expect(getCountryByDialCode(countries, '44')?.code).toBe('GB');
  });

  it('returns undefined when no match', () => {
    expect(getCountryByDialCode(countries, '999')).toBeUndefined();
  });
});
