import type { Country, ValidationResult } from './types';

/**
 * Validate a phone number's digit count against a country's min/max.
 * Digits should be the national number (excluding dial code and national prefix).
 */
export function validatePhone(
  digits: string,
  country: Country,
): ValidationResult {
  const currentDigits = digits.length;
  const { minLength, maxLength } = country;

  if (currentDigits < minLength) {
    return {
      valid: false,
      reason: 'too_short',
      minDigits: minLength,
      maxDigits: maxLength,
      currentDigits,
    };
  }

  if (currentDigits > maxLength) {
    return {
      valid: false,
      reason: 'too_long',
      minDigits: minLength,
      maxDigits: maxLength,
      currentDigits,
    };
  }

  return {
    valid: true,
    minDigits: minLength,
    maxDigits: maxLength,
    currentDigits,
  };
}
