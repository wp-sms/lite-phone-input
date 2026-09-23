import type { Country } from './types';
import { getCountryByDialCode } from './countries';
import { extractDigits, normalizeNumerals } from './format';

/** Shared interpretation for typed, pasted, autofilled and programmatic values. */
export function parsePhoneValue(value: string, countries: Country[], selected: Country) {
  const normalized = normalizeNumerals(value).trim();
  const international = normalized.startsWith('+') || normalized.startsWith('00');
  const digits = extractDigits(normalized.startsWith('00') ? normalized.slice(2) : normalized);
  if (!international) return { international, digits, country: selected };

  for (let length = Math.min(4, digits.length); length >= 1; length--) {
    const prefix = digits.slice(0, length);
    const country = selected.dialCode === prefix && countries.some(c => c.code === selected.code)
      ? selected : getCountryByDialCode(countries, prefix);
    if (country) return { international, digits: digits.slice(length), country };
  }
  return { international, digits, country: undefined };
}
