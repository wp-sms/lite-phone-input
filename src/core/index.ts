export type {
  Country,
  CountryCode,
  CountryData,
  PhoneInputOptions,
  ValidationResult,
} from './types';

export {
  getFlag,
  processCountryData,
  getCountryByCode,
  getCountryByDialCode,
  getAllCountries,
  getNationalNumber,
} from './countries';

export {
  formatPhone,
  getCursorPosition,
  extractDigits,
  normalizeNumerals,
} from './format';

export { validatePhone } from './validate';

import { getAllCountries } from './countries';

/** Pre-processed array of all supported countries. */
export const countries = getAllCountries();
