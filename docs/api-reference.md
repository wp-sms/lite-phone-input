[Home](../README.md) > API Reference

# API Reference

Complete reference for all options, methods, types, and exports.

## Table of Contents

- [Options](#options)
- [Instance Methods](#instance-methods)
- [React / Preact Props](#react--preact-props)
- [Ref Methods (React / Preact)](#ref-methods-react--preact)
- [Core Utility Functions](#core-utility-functions)
- [TypeScript Types](#typescript-types)
- [Subpath Exports](#subpath-exports)

---

## Options

Pass these to `PhoneInput.mount(el, options)` (vanilla) or as props (React/Preact).

### Country Selection

| Option | Type | Default | Description |
|---|---|---|---|
| `defaultCountry` | `string` | — (required) | ISO 3166-1 alpha-2 code (e.g. `'US'`, `'GB'`) |
| `allowedCountries` | `string[]` | `[]` (all) | Only show these countries. Empty = all |
| `excludedCountries` | `string[]` | `[]` | Hide these countries from the dropdown |
| `preferredCountries` | `string[]` | `[]` | Show these countries at the top of the dropdown |
| `allowDropdown` | `boolean` | `true` | `false` = locked country, no dropdown trigger |

### Formatting & Validation

| Option | Type | Default | Description |
|---|---|---|---|
| `formatAsYouType` | `boolean` | `true` | Format the input value using the country's mask as the user types |
| `strict` | `boolean` | `true` | Block non-digit input and enforce max digit length |

### Display

| Option | Type | Default | Description |
|---|---|---|---|
| `separateDialCode` | `boolean` | `false` | Show the dial code outside the input (e.g. `+1` in the trigger area) |
| `nationalMode` | `boolean` | `false` | Display only the national number (no dial code anywhere). Output is still E.164. If `separateDialCode` is also true, it takes precedence |
| `placeholder` | `string \| 'auto'` | `'auto'` | `'auto'` generates from format mask. Any other string sets a custom placeholder |
| `disabled` | `boolean` | `false` | Disable the input and country trigger |

### Internationalization

| Option | Type | Default | Description |
|---|---|---|---|
| `locale` | `string` | `undefined` | BCP 47 locale tag (e.g. `'fr'`, `'ar'`). Uses `Intl.DisplayNames` for country names in the dropdown |

### Custom Rendering

| Option | Type | Default | Description |
|---|---|---|---|
| `renderFlag` | `(countryCode: string) => string` | `undefined` | Return custom HTML for a country's flag. Receives the ISO code, must return an HTML string |

### Form Integration

| Option | Type | Default | Description |
|---|---|---|---|
| `hiddenInput` | `{ phone?: string; country?: string }` | `undefined` | Creates hidden `<input>` elements with the given `name` attributes. `phone` holds E.164, `country` holds the ISO code |
| `inputAttributes` | `Record<string, string>` | `{}` | Attributes spread onto the underlying `<input>` element (e.g. `name`, `id`, `data-testid`, `aria-label`) |

### Initial Value

| Option | Type | Default | Description |
|---|---|---|---|
| `initialValue` | `string` | `''` | E.164 value to pre-fill. Auto-detects country from dial code |

### Callbacks

| Option | Type | Description |
|---|---|---|
| `onChange` | `(e164: string, country: Country, validation: ValidationResult) => void` | Fires on every value change |
| `onCountryChange` | `(country: Country) => void` | Fires when the selected country changes |
| `onValidationChange` | `(validation: ValidationResult) => void` | Fires only when validity state transitions (valid → invalid or vice versa) |
| `onDropdownOpen` | `() => void` | Fires when the country dropdown opens |
| `onDropdownClose` | `() => void` | Fires when the country dropdown closes |

### Advanced

| Option | Type | Default | Description |
|---|---|---|---|
| `dropdownContainer` | `HTMLElement` | `document.body` | Portal target for the dropdown. Use this to solve z-index stacking issues |
| `containerClass` | `string` | `''` | Additional CSS class(es) added to the root `.lpi` container |

---

## Instance Methods

Returned by `PhoneInput.mount()`.

| Method | Returns | Description |
|---|---|---|
| `getValue()` | `string` | E.164 string (e.g. `'+12025551234'`). Returns `''` if empty |
| `getNationalNumber()` | `string` | National digits only (e.g. `'2025551234'`) |
| `getCountry()` | `{ code: string; dialCode: string; name: string }` | Currently selected country |
| `setValue(e164: string)` | `void` | Set the value. Auto-detects country from dial code prefix |
| `setCountry(code: string)` | `void` | Change the selected country. Reformats existing digits with the new mask |
| `isValid()` | `boolean` | Whether the current value passes length validation |
| `validate()` | `ValidationResult` | Rich validation result (see [ValidationResult](#validationresult)) |
| `setOptions(opts)` | `void` | Update options without remounting. Accepts `Partial<PhoneInputOptions>` |
| `destroy()` | `void` | Remove all DOM elements and event listeners |

### Static Methods

| Method | Returns | Description |
|---|---|---|
| `PhoneInput.mount(el, options)` | `PhoneInput` | Create and mount a new instance onto the given element |

---

## React / Preact Props

The React and Preact components accept all [Options](#options) as props (minus `inputAttributes`). Unknown props are forwarded as attributes to the underlying `<input>` element.

```tsx
import { PhoneInput } from 'lite-phone-input/react';
// or
import { PhoneInput } from 'lite-phone-input/preact';
```

### Widget Props

All options listed above work as props:

```tsx
<PhoneInput
  defaultCountry="US"
  separateDialCode
  formatAsYouType
  strict
  initialValue="+12025551234"
  onChange={(e164, country, validation) => console.log(e164)}
/>
```

### Forwarded Input Attributes

Props not recognized as widget props are spread onto the `<input>` element:

```tsx
<PhoneInput
  defaultCountry="US"
  name="phone"
  id="phone-input"
  aria-label="Phone number"
  data-testid="phone"
  autoFocus
/>
```

### Uncontrolled Only

The React and Preact components are always uncontrolled. Use `initialValue` to pre-fill the input and `ref` methods (`getValue()`, `setValue()`) to read/write programmatically. Use `onChange` to observe value changes.

---

## Ref Methods (React / Preact)

Access imperative methods via a ref. The ref itself is the instance — no `.getInstance()` needed.

```tsx
const phoneRef = useRef<PhoneInputRef>(null);

// Later:
phoneRef.current.getValue();       // '+12025551234'
phoneRef.current.isValid();        // true
phoneRef.current.setCountry('GB');
```

| Method | Returns | Description |
|---|---|---|
| `getValue()` | `string` | E.164 string |
| `getNationalNumber()` | `string` | National digits only |
| `getCountry()` | `{ code: string; dialCode: string; name: string }` | Selected country |
| `setValue(e164: string)` | `void` | Set value programmatically |
| `setCountry(code: string)` | `void` | Change country |
| `isValid()` | `boolean` | Length validation check |
| `validate()` | `ValidationResult` | Rich validation result |

### PhoneInputRef Type

```ts
import type { PhoneInputRef } from 'lite-phone-input/react';
// or
import type { PhoneInputRef } from 'lite-phone-input/preact';
```

---

## Core Utility Functions

Imported from the root `'lite-phone-input'` path. Framework-agnostic, usable on the server.

| Function | Signature | Description |
|---|---|---|
| `formatPhone` | `(digits: string, pattern: string \| null) => string` | Format digits according to a country's mask. `X` = digit placeholder. Falls back to grouping every 4 digits if no pattern |
| `validatePhone` | `(digits: string, country: Country) => ValidationResult` | Validate national digit count against a country's min/max lengths |
| `getFlag` | `(code: string) => string` | Compute emoji flag from ISO 3166-1 alpha-2 code (e.g. `'US'` → `'🇺🇸'`) |
| `getCountryByCode` | `(countries: Country[], code: string) => Country \| undefined` | Find a country by ISO code |
| `getCountryByDialCode` | `(countries: Country[], dialCode: string) => Country \| undefined` | Find the highest-priority country for a dial code |
| `getAllCountries` | `() => Country[]` | Get the full processed country list (~240 countries) |
| `getNationalNumber` | `(e164: string, countryCode?: string) => string` | Extract national number from an E.164 string, stripping dial code and national prefix |
| `extractDigits` | `(value: string) => string` | Strip all non-digit characters |
| `normalizeNumerals` | `(value: string) => string` | Convert Arabic-Indic (٠–٩) and Persian (۰–۹) numerals to ASCII (0–9) |
| `getCursorPosition` | `(oldValue: string, oldCursor: number, newValue: string) => number` | Calculate new cursor position after formatting |
| `processCountryData` | `(raw: CountryData[]) => Country[]` | Convert raw JSON country data to `Country[]` objects |
| `countries` | `Country[]` (constant) | Pre-processed array of all supported countries |

### Usage

```js
import {
  formatPhone,
  validatePhone,
  getFlag,
  getCountryByCode,
  getAllCountries,
  extractDigits,
  normalizeNumerals,
} from 'lite-phone-input';

getFlag('US');                              // '🇺🇸'
formatPhone('2025551234', 'XXX XXX XXXX');  // '202 555 1234'

const countries = getAllCountries();
const us = getCountryByCode(countries, 'US');
validatePhone('2025551234', us);            // { valid: true, minDigits: 10, maxDigits: 10, currentDigits: 10 }

normalizeNumerals('٠١٢٣');                  // '0123'
extractDigits('+1 (202) 555-1234');         // '12025551234'
```

---

## TypeScript Types

All types are exported from `'lite-phone-input'`.

### Country

```ts
interface Country {
  code: string;         // ISO 3166-1 alpha-2 (e.g. 'US')
  name: string;         // English country name
  dialCode: string;     // Dial code without '+' (e.g. '1')
  format: string;       // Format mask (X = digit, e.g. 'XXX XXX XXXX')
  nationalPrefix: string | null;  // National trunk prefix (e.g. '0') or null
  minLength: number;    // Minimum national number digit count
  maxLength: number;    // Maximum national number digit count
  priority: number;     // Priority for shared dial codes (0 = main)
}
```

### CountryCode

```ts
type CountryCode = string;  // ISO 3166-1 alpha-2 code (uppercase)
```

### CountryData

Raw JSON format before processing:

```ts
interface CountryData {
  c: string;            // ISO code
  n: string;            // English name
  d: string;            // Dial code
  f: string;            // Format mask
  p: string | null;     // National prefix
  min: number;          // Min digit count
  max: number;          // Max digit count
  pri: number;          // Priority
}
```

### ValidationResult

```ts
interface ValidationResult {
  valid: boolean;
  reason?: 'too_short' | 'too_long';  // Only present when valid is false
  minDigits: number;
  maxDigits: number;
  currentDigits: number;
}
```

### PhoneInputOptions

```ts
interface PhoneInputOptions {
  defaultCountry: string;
  allowedCountries?: string[];
  excludedCountries?: string[];
  preferredCountries?: string[];
  allowDropdown?: boolean;
  formatAsYouType?: boolean;
  strict?: boolean;
  separateDialCode?: boolean;
  nationalMode?: boolean;
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
```

### PhoneInputRef (React / Preact)

```ts
interface PhoneInputRef {
  getValue(): string;
  getNationalNumber(): string;
  getCountry(): { code: string; dialCode: string; name: string };
  setValue(e164: string): void;
  setCountry(code: string): void;
  isValid(): boolean;
  validate(): ValidationResult;
}
```

### PhoneInputProps (React / Preact)

```ts
type PhoneInputProps = WidgetProps & InputAttrs;
// WidgetProps = Omit<PhoneInputOptions, 'inputAttributes'>
// InputAttrs  = Omit<InputHTMLAttributes<HTMLInputElement>, keyof WidgetProps>
```

---

## Subpath Exports

| Import Path | Contents | Use Case |
|---|---|---|
| `lite-phone-input` | Core types + utility functions | Server-side validation, headless use |
| `lite-phone-input/vanilla` | `PhoneInput` class | Vanilla JS widget |
| `lite-phone-input/react` | `PhoneInput` component + `PhoneInputRef` type | React apps |
| `lite-phone-input/preact` | `PhoneInput` component + `PhoneInputRef` type | Preact apps |
| `lite-phone-input/styles` | CSS stylesheet | Required for visual rendering |
| `lite-phone-input/data` | `phone-countries.json` | Raw country data (JSON) |

Each subpath provides ESM (`.js`), CJS (`.cjs`), and TypeScript definitions (`.d.ts`).

---

## See also

- [Getting Started](getting-started.md) — installation and first render
- [Vanilla JS Guide](vanilla-guide.md) — mount/destroy lifecycle, complete examples
- [React Guide](react-guide.md) — usage, ref methods, form libraries
- [Styling & Theming](styling.md) — CSS variables and BEM classes
- [Validation](validation.md) — validation model and error messages
