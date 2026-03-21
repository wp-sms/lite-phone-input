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
} from './countries';

export {
  formatPhone,
  getCursorPosition,
  extractDigits,
  normalizeNumerals,
} from './format';

export { validatePhone } from './validate';
