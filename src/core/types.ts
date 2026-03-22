/** ISO 3166-1 alpha-2 country code (uppercase) */
export type CountryCode = string;

/** Country data as stored in phone-countries.json */
export interface CountryData {
  /** ISO 3166-1 alpha-2 code */
  c: string;
  /** English country name */
  n: string;
  /** Dial code without + */
  d: string;
  /** Format mask (X = digit) */
  f: string;
  /** National prefix (e.g., "0") or null */
  p: string | null;
  /** Minimum national number digit count */
  min: number;
  /** Maximum national number digit count */
  max: number;
  /** Priority for shared dial codes (0 = main) */
  pri: number;
}

/** Processed country object used at runtime */
export interface Country {
  code: CountryCode;
  name: string;
  dialCode: string;
  format: string;
  nationalPrefix: string | null;
  minLength: number;
  maxLength: number;
  priority: number;
}

export interface ValidationResult {
  valid: boolean;
  reason?: 'too_short' | 'too_long';
  minDigits: number;
  maxDigits: number;
  currentDigits: number;
}

export interface PhoneInputOptions {
  defaultCountry: string;
  allowedCountries?: string[];
  excludedCountries?: string[];
  preferredCountries?: string[];
  allowDropdown?: boolean;
  formatAsYouType?: boolean;
  strict?: boolean;
  separateDialCode?: boolean;
  placeholder?: string | 'auto';
  disabled?: boolean;
  locale?: string;
  renderFlag?: (countryCode: string) => string;
  hiddenInput?: { phone?: string; country?: string };
  inputAttributes?: Record<string, string>;
  initialValue?: string;
  containerClass?: string;
  dropdownContainer?: HTMLElement;

  onChange?: (e164: string, country: Country, validation: ValidationResult) => void;
  onCountryChange?: (country: Country) => void;
  onValidationChange?: (validation: ValidationResult) => void;
  onDropdownOpen?: () => void;
  onDropdownClose?: () => void;
}
