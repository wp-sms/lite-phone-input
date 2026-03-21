const TRAILING_SEP = /[\s\-]+$/;
const FALLBACK_GROUP = /(.{4})(?=.)/g;
const NON_ASCII_DIGITS = /[\u0660-\u0669\u06F0-\u06F9]/g;

function isDigit(ch: string): boolean {
  const c = ch.charCodeAt(0);
  return c >= 48 && c <= 57;
}

/**
 * Format digits according to a country's format mask.
 * Mask uses X for digit positions, spaces/dashes as separators.
 * Overflow digits are appended unformatted.
 * Falls back to grouping every 4 digits when no mask is provided.
 */
export function formatPhone(digits: string, pattern: string | null): string {
  if (!digits) return '';

  if (!pattern) {
    return digits.replace(FALLBACK_GROUP, '$1 ');
  }

  let result = '';
  let digitIndex = 0;

  for (const char of pattern) {
    if (digitIndex >= digits.length) break;

    if (char === 'X') {
      result += digits[digitIndex++];
    } else {
      result += char;
    }
  }

  if (digitIndex < digits.length) {
    result += digits.slice(digitIndex);
  }

  return result.replace(TRAILING_SEP, '');
}

/**
 * Calculate new cursor position after formatting.
 * Counts digits before old cursor, finds same digit-count position in new value.
 */
export function getCursorPosition(
  oldValue: string,
  oldCursor: number,
  newValue: string,
): number {
  let digitsBeforeCursor = 0;
  for (let i = 0; i < oldCursor && i < oldValue.length; i++) {
    if (isDigit(oldValue[i])) {
      digitsBeforeCursor++;
    }
  }

  let digitCount = 0;
  for (let i = 0; i < newValue.length; i++) {
    if (isDigit(newValue[i])) {
      digitCount++;
    }
    if (digitCount === digitsBeforeCursor) {
      return i + 1;
    }
  }

  return newValue.length;
}

export function extractDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Normalize Arabic-Indic (٠-٩) and Persian (۰-۹) numerals to ASCII (0-9).
 */
export function normalizeNumerals(value: string): string {
  return value.replace(NON_ASCII_DIGITS, (c) => {
    const code = c.charCodeAt(0);
    return code <= 0x0669
      ? String(code - 0x0660)
      : String(code - 0x06f0);
  });
}
