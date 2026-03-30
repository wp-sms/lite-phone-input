const TRAILING_SEP = /[\s\-]+$/;
const FALLBACK_GROUP = /(.{4})(?=.)/g;

/** Base code points for non-ASCII decimal digit blocks (each block is base+0 … base+9). */
const NUMERAL_BASES = [
  0x0660, // Arabic-Indic  ٠-٩
  0x06f0, // Persian        ۰-۹
  0x0966, // Devanagari     ०-९
  0x09e6, // Bengali        ০-৯
  0x0e50, // Thai           ๐-๙
  0x0ed0, // Lao            ໐-໙
  0x1040, // Myanmar        ၀-၉
  0x17e0, // Khmer          ០-៩
  0xff10, // Fullwidth      ０-９
];

// prettier-ignore
const NON_ASCII_DIGITS = /[\u0660-\u0669\u06F0-\u06F9\u0966-\u096F\u09E6-\u09EF\u0E50-\u0E59\u0ED0-\u0ED9\u1040-\u1049\u17E0-\u17E9\uFF10-\uFF19]/g;

function isRelevantChar(ch: string): boolean {
  const c = ch.charCodeAt(0);
  return (c >= 48 && c <= 57) || c === 43; // 0-9 or +
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
  if (oldCursor === 0) return 0;

  let relevantBeforeCursor = 0;
  for (let i = 0; i < oldCursor && i < oldValue.length; i++) {
    if (isRelevantChar(oldValue[i])) {
      relevantBeforeCursor++;
    }
  }

  let count = 0;
  for (let i = 0; i < newValue.length; i++) {
    if (isRelevantChar(newValue[i])) {
      count++;
    }
    if (count === relevantBeforeCursor) {
      return i + 1;
    }
  }

  return newValue.length;
}

export function extractDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Normalize non-ASCII numerals (Arabic-Indic, Persian, Devanagari, Bengali,
 * Thai, Lao, Myanmar, Khmer, Fullwidth) to ASCII 0-9.
 */
export function normalizeNumerals(value: string): string {
  return value.replace(NON_ASCII_DIGITS, (c) => {
    const code = c.charCodeAt(0);
    for (const base of NUMERAL_BASES) {
      if (code >= base && code <= base + 9) {
        return String(code - base);
      }
    }
    return c;
  });
}

/** Returns true if the character is a non-ASCII digit in any supported numeral system. */
export function isNonAsciiDigit(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return NUMERAL_BASES.some(base => code >= base && code <= base + 9);
}
