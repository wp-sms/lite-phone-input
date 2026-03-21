import type { Country, CountryData } from './types';
import rawData from '../../data/phone-countries.json';
import { extractDigits, normalizeNumerals } from './format';

/**
 * Compute flag emoji from ISO 3166-1 alpha-2 code.
 * Each letter is offset to a regional indicator symbol: A→🇦, B→🇧, etc.
 */
export function getFlag(code: string): string {
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

export function processCountryData(raw: CountryData[]): Country[] {
  return raw.map((d) => ({
    code: d.c,
    name: d.n,
    dialCode: d.d,
    format: d.f,
    nationalPrefix: d.p,
    minLength: d.min,
    maxLength: d.max,
    priority: d.pri,
  }));
}

export function getCountryByCode(
  countries: Country[],
  code: string,
): Country | undefined {
  const upper = code.toUpperCase();
  return countries.find((c) => c.code === upper);
}

// Lazy singleton for processed country data
let _allCountries: Country[] | null = null;
export function getAllCountries(): Country[] {
  if (!_allCountries) _allCountries = processCountryData(rawData as CountryData[]);
  return _allCountries;
}

/** Returns the highest-priority country for a shared dial code (e.g., US for +1) */
export function getCountryByDialCode(
  countries: Country[],
  dialCode: string,
): Country | undefined {
  let best: Country | undefined;
  for (const c of countries) {
    if (c.dialCode !== dialCode) continue;
    if (!best || c.priority < best.priority) best = c;
  }
  return best;
}

/** Extract national number from an E.164 string, stripping dial code and national prefix. */
export function getNationalNumber(e164: string, countryCode?: string): string {
  if (!e164) return '';

  const all = getAllCountries();
  const normalized = normalizeNumerals(e164);
  const digits = extractDigits(normalized);

  let country: Country | undefined;

  if (countryCode) {
    country = getCountryByCode(all, countryCode);
  }

  if (!country && normalized.startsWith('+')) {
    for (let len = Math.min(4, digits.length); len >= 1; len--) {
      const prefix = digits.slice(0, len);
      const match = getCountryByDialCode(all, prefix);
      if (match) {
        country = match;
        break;
      }
    }
  }

  if (!country) return digits;

  let national = digits;
  if (normalized.startsWith('+') && digits.startsWith(country.dialCode)) {
    national = digits.slice(country.dialCode.length);
  }

  if (country.nationalPrefix && national.startsWith(country.nationalPrefix)) {
    const remaining = national.slice(country.nationalPrefix.length);
    if (remaining.length > 0) {
      national = remaining;
    }
  }

  return national;
}
