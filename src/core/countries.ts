import type { Country, CountryData } from './types';

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
