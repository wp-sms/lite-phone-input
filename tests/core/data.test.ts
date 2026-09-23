import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAllCountries } from '../../src/core/countries';
import { validatePhone } from '../../src/core/validate';
import data from '../../data/phone-countries.json';
import { parseLengths, verify } from '../../scripts/generate-data.mjs';

afterEach(() => vi.restoreAllMocks());

describe('generated metadata', () => {
  it('preserves supported examples and exact length gaps', () => {
    for (const country of getAllCountries()) {
      if (country.exampleNumber) expect(validatePhone(country.exampleNumber, country).valid, country.code).toBe(true);
      if (country.possibleLengths) {
        for (let length = country.minLength; length <= country.maxLength; length++) {
          expect(validatePhone('2'.repeat(length), country).valid, `${country.code}: ${length}`)
            .toBe(country.possibleLengths.includes(length));
        }
      }
    }
  });
  it('parses discrete lengths and ranges', () => {
    expect(parseLengths('[4-6],8,10')).toEqual([4, 5, 6, 8, 10]);
  });
  it('fails verification rather than accepting broken metadata', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const broken = data.map(country => country.c === 'US' ? { ...country, min: 11, max: 10 } : country);
    expect(() => verify(broken, JSON.stringify(broken))).toThrow(/verification failed/i);
  });
});
