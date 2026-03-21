# lite-phone-input

Lightweight phone input with format-as-you-type, validation, and emoji flags. **~13KB gzipped total** — zero runtime dependencies.

A modern alternative to intl-tel-input that bundles formatting and validation without requiring a 61KB utils bundle or flag sprite images.

## Features

- **~13KB gzipped** (JS + country data) — includes formatting AND validation
- **Emoji flags** computed from ISO code at runtime (zero image cost)
- **Format-as-you-type** with per-country masks (mobile-first patterns)
- **Per-country length validation** with rich error data
- **~240 countries** with searchable dropdown
- **Country filtering** via `allowedCountries` / `excludedCountries`
- **E.164 output** always — `+{dialCode}{digits}`
- **TypeScript-first** with full type definitions
- **Framework adapters** — Vanilla JS, React, Preact
- **Accessible** — WCAG 2.1 AA, ARIA combobox pattern, keyboard navigation
- **RTL safe** — phone input is always LTR
- **Mobile-friendly** — phone keyboard via `inputMode="tel"`, fullscreen dropdown on small screens
- **SSR-safe** — no browser API calls at module level

## Installation

```bash
npm install lite-phone-input
```

## Quick Start

### Vanilla JS

```js
import { PhoneInput } from 'lite-phone-input/vanilla';
import 'lite-phone-input/styles';

const phone = PhoneInput.mount(document.getElementById('phone'), {
  defaultCountry: 'US',
  separateDialCode: true,
  onChange(e164, country, validation) {
    console.log(e164);           // '+12025551234'
    console.log(country.code);   // 'US'
    console.log(validation.valid); // true
  },
});

// Read values
phone.getValue();          // '+12025551234' (E.164)
phone.getNationalNumber(); // '2025551234'
phone.getCountry();        // { code: 'US', dialCode: '1', name: 'United States' }
phone.isValid();           // true

// Cleanup
phone.destroy();
```

### React

```jsx
import { useRef, useState } from 'react';
import { PhoneInput } from 'lite-phone-input/react';
import 'lite-phone-input/styles';

function MyForm() {
  const [value, setValue] = useState('');
  const phoneRef = useRef(null);

  return (
    <PhoneInput
      ref={phoneRef}
      defaultCountry="US"
      separateDialCode
      value={value}
      onChange={(e164, country, validation) => setValue(e164)}
      name="phone"
      aria-label="Phone number"
    />
  );

  // Imperative access via ref:
  // phoneRef.current.getValue()
  // phoneRef.current.isValid()
  // phoneRef.current.setCountry('GB')
}
```

Supports **controlled** (pass `value` prop) and **uncontrolled** (omit `value`, use ref) modes.

### Preact

```jsx
import { PhoneInput } from 'lite-phone-input/preact';
import 'lite-phone-input/styles';
```

Same API as React. Uses `preact/hooks` directly — no `preact/compat` required from consumers.

### CDN / Script Tag

```html
<link rel="stylesheet" href="https://unpkg.com/lite-phone-input/dist/styles.css">
<script src="https://unpkg.com/lite-phone-input/dist/vanilla/index.global.js"></script>
<script>
  const phone = LitePhoneInput.PhoneInput.mount(document.getElementById('phone'), {
    defaultCountry: 'US',
  });
</script>
```

## Options

```js
PhoneInput.mount(el, {
  // Country selection
  defaultCountry: 'US',              // ISO 3166-1 alpha-2 code (required)
  allowedCountries: [],               // empty = all, or ['US', 'CA', 'GB']
  excludedCountries: [],              // countries to hide
  preferredCountries: ['US', 'GB'],   // shown at top of dropdown
  allowDropdown: true,                // false = locked country, no dropdown

  // Formatting & validation
  formatAsYouType: true,
  strict: true,                       // block non-digits, enforce max length

  // Display
  separateDialCode: true,             // show dial code outside the input
  placeholder: 'auto',               // 'auto' = from format pattern, or custom string
  disabled: false,

  // i18n
  locale: undefined,                  // e.g. 'fr' — uses Intl.DisplayNames for country names

  // Rendering
  renderFlag: undefined,              // (countryCode: string) => string (HTML)

  // Form integration
  hiddenInput: undefined,             // { phone: 'phone_e164', country: 'phone_country' }
  inputAttributes: {},                // name, id, data-*, aria-label, etc.

  // Initial value
  value: '',                          // E.164 value (auto-detects country from dial code)

  // Callbacks
  onChange: (e164, country, validationResult) => {},
  onCountryChange: (country) => {},
  onValidationChange: (validationResult) => {},
  onDropdownOpen: () => {},
  onDropdownClose: () => {},

  // Advanced
  dropdownContainer: document.body,   // portal target for z-index issues
  containerClass: '',
});
```

## Instance Methods

```js
phone.getValue();                     // E.164 string: '+12025551234'
phone.getNationalNumber();            // national digits: '2025551234'
phone.getCountry();                   // { code, dialCode, name }
phone.setCountry('GB');               // change country, reformat digits
phone.setValue('+442071234567');       // set value, auto-detect country
phone.isValid();                      // boolean
phone.validate();                     // { valid, reason?, minDigits, maxDigits, currentDigits }
phone.setOptions({ disabled: true }); // update options without remount
phone.destroy();                      // remove DOM, abort listeners
```

## Validation

`validate()` returns a rich object for building error messages:

```js
const result = phone.validate();
// {
//   valid: false,
//   reason: 'too_short',    // 'too_short' | 'too_long' | undefined
//   minDigits: 10,
//   maxDigits: 10,
//   currentDigits: 7,
// }
```

`onValidationChange` fires only when validity state transitions (valid to invalid or vice versa), not on every keystroke.

## Display Modes

**Separate dial code** (`separateDialCode: true`):
```
[🇺🇸 +1 ▼] [202 555 1234        ]
```

**Inline** (`separateDialCode: false`):
```
[🇺🇸 ▼] [+1 202 555 1234       ]
```

In inline mode, the country auto-detects from the dial code as the user types.

## Theming

Override CSS custom properties to match your design system:

```css
:root {
  --lpi-bg: #fff;
  --lpi-border-color: #ccc;
  --lpi-border-radius: 4px;
  --lpi-text-color: #333;
  --lpi-hover-bg: #f5f5f5;
  --lpi-selected-bg: #e8f0fe;
  --lpi-highlight-bg: #f0f0f0;
  --lpi-dropdown-bg: #fff;
  --lpi-dropdown-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  --lpi-font-size: 14px;
  --lpi-flag-size: 1.2em;
  --lpi-spacing: 8px;
  --lpi-input-height: 40px;
  --lpi-dropdown-max-height: 300px;
}
```

All classes use BEM naming (`.lpi`, `.lpi__trigger`, `.lpi__input`, `.lpi__dropdown`, etc.) for targeted overrides.

## Core Utilities

The root import exports framework-agnostic utilities for headless or server-side use:

```js
import {
  formatPhone,
  validatePhone,
  getFlag,
  getCountryByCode,
  getCountryByDialCode,
  extractDigits,
  normalizeNumerals,
} from 'lite-phone-input';

getFlag('US');                            // '🇺🇸'
formatPhone('2025551234', 'XXX XXX XXXX'); // '202 555 1234'
validatePhone('2025551234', country);      // { valid: true, ... }
normalizeNumerals('٠١٢٣');                // '0123'
```

## Form Integration

### Hidden Inputs

```js
PhoneInput.mount(el, {
  hiddenInput: {
    phone: 'phone_e164',      // <input type="hidden" name="phone_e164" value="+1...">
    country: 'phone_country', // <input type="hidden" name="phone_country" value="US">
  },
});
```

### React Hook Form / Formik

Pass attributes directly — they're forwarded to the underlying `<input>`:

```jsx
<PhoneInput
  defaultCountry="US"
  name="phone"
  id="phone"
  data-testid="phone"
  aria-label="Phone number"
/>
```

## Input Behavior

- **Strict mode** (default): blocks non-digit input, enforces max length
- **Paste handling**: strips formatting, normalizes `00` → `+`, auto-detects country
- **Arabic-Indic / Persian numerals**: accepted and normalized to ASCII
- **Country switch**: keeps existing digits, reformats with new mask

## Keyboard Navigation

- **Tab**: country button → phone input (standard tab order)
- **Arrow keys**: navigate dropdown list
- **Enter**: select highlighted country
- **Escape**: close dropdown
- **Any letter**: focuses search input in dropdown

## Browser Support

Chrome 80+, Firefox 80+, Safari 14+, Edge 80+. No IE support, no polyfills needed.

## License

MIT
