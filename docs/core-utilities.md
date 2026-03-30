[Home](../README.md) > Core Utilities

# Core Utilities

The root import (`'lite-phone-input'`) exports framework-agnostic functions for headless or server-side use. No DOM required.

```js
import {
  formatPhone,
  validatePhone,
  getFlag,
  getCountryByCode,
  getCountryByDialCode,
  getAllCountries,
  getNationalNumber,
  extractDigits,
  normalizeNumerals,
  getCursorPosition,
  processCountryData,
  countries,
} from 'lite-phone-input';
```

## When to Use

- **Server-side validation** — validate phone numbers in Node.js without a browser
- **Headless formatting** — format numbers for display without rendering a widget
- **Country lookups** — resolve countries by code or dial code
- **Custom widgets** — build your own phone input using these primitives

## Functions

### formatPhone

Format digits according to a country's format mask.

```js
formatPhone('2025551234', 'XXX XXX XXXX');
// '202 555 1234'

formatPhone('2025551234', 'XXXXX XXXXX');
// '20255 51234'

// Overflow digits are appended unformatted
formatPhone('202555123456', 'XXX XXX XXXX');
// '202 555 123456'

// No pattern — falls back to grouping every 4 digits
formatPhone('2025551234', null);
// '2025 5512 34'

// Empty input
formatPhone('', 'XXX XXX XXXX');
// ''
```

**Signature:** `(digits: string, pattern: string | null) => string`

### validatePhone

Validate a national number's digit count against a country's min/max lengths.

```js
const countries = getAllCountries();
const us = getCountryByCode(countries, 'US');

validatePhone('2025551234', us);
// { valid: true, minDigits: 10, maxDigits: 10, currentDigits: 10 }

validatePhone('202555', us);
// { valid: false, reason: 'too_short', minDigits: 10, maxDigits: 10, currentDigits: 6 }
```

**Signature:** `(digits: string, country: Country) => ValidationResult`

The `digits` parameter should be the national number (excluding dial code and national prefix).

### getFlag

Compute an emoji flag from an ISO 3166-1 alpha-2 country code.

```js
getFlag('US'); // '🇺🇸'
getFlag('GB'); // '🇬🇧'
getFlag('JP'); // '🇯🇵'
```

**Signature:** `(code: string) => string`

### getCountryByCode

Find a country by its ISO code.

```js
const countries = getAllCountries();
const gb = getCountryByCode(countries, 'GB');
// { code: 'GB', name: 'United Kingdom', dialCode: '44', format: 'XXXX XXXXXX', ... }

getCountryByCode(countries, 'XX');
// undefined
```

**Signature:** `(countries: Country[], code: string) => Country | undefined`

### getCountryByDialCode

Find the highest-priority country for a given dial code. Useful for shared dial codes (e.g., `+1` → US, `+44` → GB).

```js
const countries = getAllCountries();
getCountryByDialCode(countries, '1');   // US (priority 0)
getCountryByDialCode(countries, '44');  // GB
```

**Signature:** `(countries: Country[], dialCode: string) => Country | undefined`

### getAllCountries

Get the full processed country list (~240 countries). The result is lazily computed and cached.

```js
const countries = getAllCountries();
countries.length; // ~240
countries[0];     // { code: 'AF', name: 'Afghanistan', dialCode: '93', ... }
```

**Signature:** `() => Country[]`

### getNationalNumber

Extract the national number from an E.164 string, stripping the dial code and national prefix.

```js
getNationalNumber('+12025551234');        // '2025551234'
getNationalNumber('+442071234567');        // '2071234567'
getNationalNumber('+12025551234', 'US');   // '2025551234' (explicit country)
```

**Signature:** `(e164: string, countryCode?: string) => string`

When `countryCode` is omitted, the country is auto-detected from the dial code prefix.

### extractDigits

Strip all non-digit characters from a string.

```js
extractDigits('+1 (202) 555-1234'); // '12025551234'
extractDigits('abc');                // ''
```

**Signature:** `(value: string) => string`

### normalizeNumerals

Convert non-ASCII numerals to ASCII digits (0–9). Supports 9 numeral systems: Arabic-Indic, Persian, Devanagari, Bengali, Thai, Lao, Myanmar, Khmer, and Fullwidth.

```js
normalizeNumerals('٠١٢٣٤٥٦٧٨٩'); // '0123456789' (Arabic-Indic)
normalizeNumerals('۰۱۲۳');          // '0123'       (Persian)
normalizeNumerals('०१२३');          // '0123'       (Devanagari)
normalizeNumerals('๐๑๒๓');          // '0123'       (Thai)
normalizeNumerals('０１２３');       // '0123'       (Fullwidth)
normalizeNumerals('123');            // '123'        (ASCII passes through)
```

**Signature:** `(value: string) => string`

### getCursorPosition

Calculate the new cursor position after formatting changes. Counts digits before the old cursor position and maps to the equivalent position in the new value.

```js
getCursorPosition('202555', 6, '202 555');  // 7
```

**Signature:** `(oldValue: string, oldCursor: number, newValue: string) => number`

### processCountryData

Convert raw JSON country data (`CountryData[]`) to processed `Country[]` objects. Useful if you want to load a custom country dataset.

```js
import rawData from 'lite-phone-input/data';
const countries = processCountryData(rawData);
```

**Signature:** `(raw: CountryData[]) => Country[]`

### countries (constant)

Pre-processed array of all supported countries. Equivalent to calling `getAllCountries()`.

```js
import { countries } from 'lite-phone-input';
countries.length; // ~240
```

## Raw Country Data

The JSON file is available as a subpath export:

```js
import rawData from 'lite-phone-input/data';
```

Each entry has the shape:

```json
{
  "c": "US",
  "n": "United States",
  "d": "1",
  "f": "XXX XXX XXXX",
  "p": "1",
  "min": 10,
  "max": 10,
  "pri": 0
}
```

See [CountryData type](api-reference.md#countrydata) for field descriptions.

---

## See also

- [API Reference](api-reference.md) — full type definitions
- [Validation](validation.md) — validation model and error messages
- [Advanced Topics](advanced.md) — shared dial codes, national prefix stripping
