[Home](../README.md) > Migration from intl-tel-input

# Migration from intl-tel-input

A comprehensive guide for migrating from intl-tel-input (v26) to lite-phone-input.

## Table of Contents

- [Why Switch](#why-switch)
- [Feature Comparison](#feature-comparison)
- [Options Mapping](#options-mapping)
- [Methods Mapping](#methods-mapping)
- [Events / Callbacks Mapping](#events--callbacks-mapping)
- [React Component Mapping](#react-component-mapping)
- [What lite-phone-input Does NOT Support](#what-lite-phone-input-does-not-support)
- [What lite-phone-input Adds](#what-lite-phone-input-adds)
- [Step-by-Step Migration](#step-by-step-migration)
- [CSS Variable Mapping](#css-variable-mapping)

---

## Why Switch

| | lite-phone-input | intl-tel-input |
|---|---|---|
| **JS bundle** | ~13KB total (JS + data) | ~15KB + ~260KB utils |
| **Flag assets** | Emoji (0KB) | Webp sprites (30–66KB) |
| **Dependencies** | 0 | Flag sprites + optional utils |
| **Formatting** | Built-in | Requires utils bundle |
| **Validation** | Built-in (length-based) | Requires utils bundle (libphonenumber) |

lite-phone-input gives you formatting and validation in ~13KB with zero dependencies. intl-tel-input's core JS is ~15KB, but formatting and validation require loading the utils bundle (~260KB), plus flag sprite images (30–66KB).

---

## Feature Comparison

| Feature | intl-tel-input | lite-phone-input | Notes |
|---|---|---|---|
| **Bundle size (JS)** | ~15KB + ~260KB utils | ~13KB total | lite includes formatting + validation |
| **Flag images** | Webp sprites (30–66KB) | Emoji (0KB) | Emoji computed from ISO code via `getFlag()` |
| **CSS** | Separate CSS + sprite paths | Separate CSS, no sprites | lite uses BEM + CSS variables |
| **Format-as-you-type** | Yes (requires utils) | Yes (built-in) | lite uses per-country masks |
| **Validation** | libphonenumber (utils required) | Length-based (built-in) | lite validates min/max digit count per country |
| **Number type detection** | Yes (MOBILE, FIXED_LINE, etc.) | No | — |
| **Multiple number formats** | E.164, INTERNATIONAL, NATIONAL, RFC3966 | E.164 only | lite always outputs E.164 |
| **Country auto-detect (IP)** | Yes (`geoIpLookup`) | No | — |
| **Country search** | Yes (`countrySearch: true`) | Yes (always enabled) | — |
| **Separate dial code** | Yes | Yes | Same option name |
| **Strict mode** | Yes (`strictMode`) | Yes (`strict`) | Same behavior |
| **Hidden form inputs** | Yes (function-based) | Yes (object-based) | Different API |
| **Placeholder** | `autoPlaceholder` + `customPlaceholder` + `placeholderNumberType` | `placeholder: 'auto'` or custom string | intl-tel-input has more control |
| **Country filtering** | `onlyCountries` / `excludeCountries` | `allowedCountries` / `excludedCountries` | Name difference |
| **Preferred countries** | `countryOrder` (v26) | `preferredCountries` | — |
| **Show/hide flags** | `showFlags: boolean` | Always shows (emoji) | lite has `renderFlag` for custom rendering |
| **Dropdown portal** | `dropdownContainer` | `dropdownContainer` | Same concept |
| **Fullscreen mobile** | `useFullscreenPopup` | Auto via CSS media query | lite uses CSS, not configurable |
| **i18n (UI strings)** | 46+ language packs | No | lite only localizes country names via `Intl.DisplayNames` |
| **Arabic/Persian numerals** | Supported | Supported | lite uses `normalizeNumerals()` |
| **RTL support** | Yes | Yes | Both use `dir="ltr"` on input |
| **SSR safe** | Yes | Yes | Both guard `typeof window` |
| **TypeScript** | Full definitions | TypeScript-first | lite is written in TypeScript |
| **React** | Yes | Yes | Different prop APIs |
| **Vue** | Yes | No | — |
| **Angular** | Yes | No | — |
| **Svelte** | Yes | No | — |
| **Preact** | No | Yes | lite has native Preact adapter |
| **CDN/IIFE build** | Yes | Yes | — |
| **Accessibility** | WCAG 2.1 | WCAG 2.1 AA | Both use combobox pattern |
| **Zero dependencies** | No | Yes | lite is fully self-contained |

---

## Options Mapping

| intl-tel-input | lite-phone-input | Notes |
|---|---|---|
| `initialCountry` | `defaultCountry` | Required in lite (no empty default) |
| `initialCountry: "auto"` | — | No IP-based auto-detection |
| `onlyCountries` | `allowedCountries` | Same behavior |
| `excludeCountries` | `excludedCountries` | Same behavior |
| `countryOrder` | `preferredCountries` | Shows preferred at top |
| `allowDropdown` | `allowDropdown` | Same |
| `separateDialCode` | `separateDialCode` | Same |
| `formatAsYouType` | `formatAsYouType` | Same |
| `strictMode` | `strict` | Same behavior, shorter name |
| `nationalMode` | `nationalMode` | Same behavior |
| `containerClass` | `containerClass` | Same |
| `dropdownContainer` | `dropdownContainer` | Same |
| `countrySearch` | — | Always enabled |
| `showFlags` | — | Always shows emoji. Use `renderFlag` for custom |
| `autoPlaceholder` | `placeholder: 'auto'` | No aggressive/polite modes |
| `customPlaceholder` | `placeholder: 'string'` | No callback variant |
| `placeholderNumberType` | — | lite generates from example numbers |
| `hiddenInput` (function) | `hiddenInput: { phone, country }` | Object instead of function |
| `geoIpLookup` | — | Not supported |
| `loadUtils` | — | Not needed (built-in) |
| `i18n` (UI strings) | — | No UI string translations |
| `countryNameLocale` | `locale` | Both use `Intl.DisplayNames` |
| `fixDropdownWidth` | — | Not supported |
| `useFullscreenPopup` | — | Auto via CSS media query |
| `dropdownAlwaysOpen` | — | Not supported |
| `allowNumberExtensions` | — | No extension support |
| `allowPhonewords` | — | No phoneword support |
| `formatOnDisplay` | — | Always formats |

---

## Methods Mapping

| intl-tel-input | lite-phone-input | Notes |
|---|---|---|
| `getNumber()` / `getNumber(format)` | `getValue()` | Always E.164, no format parameter |
| `setNumber(number)` | `setValue(e164)` | Same behavior |
| `getSelectedCountryData()` | `getCountry()` | Returns `{ code, dialCode, name }` |
| `setCountry(iso2)` | `setCountry(code)` | Same |
| `isValidNumber()` | `isValid()` | Length-based validation |
| `isValidNumberPrecise()` | — | No precise validation |
| `getValidationError()` | `validate()` | Returns `ValidationResult` with min/max/current digits |
| `getNumberType()` | — | No number type detection |
| `getExtension()` | — | No extension support |
| `setDisabled(bool)` | `setOptions({ disabled: bool })` | Via generic `setOptions` |
| `destroy()` | `destroy()` | Same |
| `iti.promise` | — | No async loading needed |
| `intlTelInput.getInstance(input)` | — | No global registry; store `mount()` return |
| `intlTelInput.getCountryData()` | `getAllCountries()` | Import from `'lite-phone-input'` |

---

## Events / Callbacks Mapping

| intl-tel-input (DOM event) | lite-phone-input (callback) | Notes |
|---|---|---|
| `"countrychange"` | `onCountryChange` | Callback, not DOM event |
| `"open:countrydropdown"` | `onDropdownOpen` | Callback |
| `"close:countrydropdown"` | `onDropdownClose` | Callback |
| — | `onChange` | Fires on every value change with `(e164, country, validation)` |
| — | `onValidationChange` | Fires only on valid/invalid state transitions |

### Before (intl-tel-input)

```js
input.addEventListener('countrychange', () => {
  const data = iti.getSelectedCountryData();
  console.log(data.iso2);
});
```

### After (lite-phone-input)

```js
PhoneInput.mount(el, {
  defaultCountry: 'US',
  onCountryChange(country) {
    console.log(country.code);
  },
});
```

---

## React Component Mapping

| intl-tel-input React | lite-phone-input React | Notes |
|---|---|---|
| `initOptions={{ ... }}` | Props directly on component | lite flattens options as props |
| `initialValue="..."` | `initialValue="..."` | Always uncontrolled; use `initialValue` to pre-fill |
| `inputProps={{ name, id }}` | `name="..." id="..."` (direct props) | Forwards unknown props to input |
| `onChangeNumber` | `onChange` | lite passes `(e164, country, validation)` |
| `onChangeCountry` | `onCountryChange` | lite passes full country object |
| `onChangeValidity` | `onValidationChange` | lite passes full `ValidationResult` |
| `onChangeErrorCode` | — | No error code callback |
| `usePreciseValidation` | — | No precise validation |
| `ref.current.getInstance()` | `ref.current` (is the instance) | lite ref IS the imperative handle |
| `ref.current.getInput()` | — | No direct input element access |

### Before (intl-tel-input React)

```jsx
<IntlTelInput
  initOptions={{
    initialCountry: 'us',
    separateDialCode: true,
    onlyCountries: ['us', 'gb'],
  }}
  initialValue="+12025551234"
  inputProps={{ name: 'phone' }}
  onChangeNumber={(num) => setPhone(num)}
  onChangeCountry={(iso2) => setCountry(iso2)}
/>
```

### After (lite-phone-input React)

```jsx
<PhoneInput
  defaultCountry="US"
  separateDialCode
  allowedCountries={['US', 'GB']}
  initialValue="+12025551234"
  name="phone"
  onChange={(e164) => setPhone(e164)}
  onCountryChange={(country) => setCountry(country.code)}
/>
```

---

## What lite-phone-input Does NOT Support

If you rely on any of these features, evaluate whether you need them before migrating:

1. **IP-based country detection** — `geoIpLookup` + `initialCountry: "auto"`
2. **Number type detection** — MOBILE, FIXED_LINE, TOLL_FREE, etc.
3. **Multiple output formats** — NATIONAL, INTERNATIONAL, RFC3966 (E.164 only)
4. **Precise validation** — full libphonenumber rules
5. **Vue / Angular / Svelte adapters**
6. **UI string translations** — 46+ languages
7. **Number extensions** and **phonewords**
8. **Granular placeholder control** — aggressive/polite modes, number type, custom callback
9. **Area code disambiguation** for shared dial codes (e.g. US vs Canada for `+1`)
10. **`dropdownAlwaysOpen`** mode
11. **`fixDropdownWidth`** control
12. **`showFlags: false`** — hide flags entirely
13. **Global instance registry** — `intlTelInput.getInstance(input)`

---

## What lite-phone-input Adds

1. **Built-in validation** — no separate utils bundle needed
2. **Built-in formatting** — no separate utils bundle needed
3. **Emoji flags** — zero image cost, no sprite paths to configure
4. **Native Preact adapter** — no `preact/compat` aliasing needed
5. **`onValidationChange`** — fires on valid/invalid state transitions
6. **`onChange` with validation** — every callback includes `ValidationResult`
7. **`renderFlag` callback** — custom flag HTML per country
8. **Rich `ValidationResult`** — `{ valid, reason, minDigits, maxDigits, currentDigits }`

---

## Step-by-Step Migration

### 1. Swap packages

```bash
npm uninstall intl-tel-input
npm install lite-phone-input
```

### 2. Replace CSS import

```diff
- import 'intl-tel-input/build/css/intlTelInput.css';
+ import 'lite-phone-input/styles';
```

### 3. Replace JS import

```diff
- import intlTelInput from 'intl-tel-input';
+ import { PhoneInput } from 'lite-phone-input/vanilla';
```

### 4. Map options

```diff
- const iti = intlTelInput(input, {
-   initialCountry: 'us',
-   onlyCountries: ['us', 'gb', 'ca'],
-   excludeCountries: ['ru'],
-   countryOrder: ['us', 'gb'],
-   separateDialCode: true,
-   strictMode: true,
-   autoPlaceholder: 'aggressive',
-   hiddenInput: () => ({ phone: 'phone_e164', country: 'country_code' }),
- });
+ const phone = PhoneInput.mount(container, {
+   defaultCountry: 'US',
+   allowedCountries: ['US', 'GB', 'CA'],
+   excludedCountries: ['RU'],
+   preferredCountries: ['US', 'GB'],
+   separateDialCode: true,
+   strict: true,
+   placeholder: 'auto',
+   hiddenInput: { phone: 'phone_e164', country: 'country_code' },
+ });
```

> **Note:** Country codes are uppercase in lite-phone-input (`'US'`), lowercase in intl-tel-input (`'us'`).

### 5. Replace event listeners with callbacks

```diff
- input.addEventListener('countrychange', () => {
-   console.log(iti.getSelectedCountryData().iso2);
- });
- input.addEventListener('open:countrydropdown', () => { ... });
- input.addEventListener('close:countrydropdown', () => { ... });
+ // Pass callbacks in options:
+ onCountryChange(country) {
+   console.log(country.code);
+ },
+ onDropdownOpen() { ... },
+ onDropdownClose() { ... },
```

### 6. Replace method calls

```diff
- iti.getNumber();                    // E.164
+ phone.getValue();                   // E.164

- iti.setNumber('+442071234567');
+ phone.setValue('+442071234567');

- iti.getSelectedCountryData();       // { iso2, dialCode, name, ... }
+ phone.getCountry();                 // { code, dialCode, name }

- iti.setCountry('gb');
+ phone.setCountry('GB');             // Uppercase

- iti.isValidNumber();
+ phone.isValid();

- iti.getValidationError();           // Error code number
+ phone.validate();                   // { valid, reason, minDigits, maxDigits, currentDigits }

- iti.destroy();
+ phone.destroy();
```

### 7. Remove utils loading code

```diff
- import 'intl-tel-input/utils';
- // or
- intlTelInput(input, {
-   loadUtils: () => import('intl-tel-input/utils'),
- });
+ // Not needed — formatting and validation are built-in
```

### 8. Test validation

Validation behavior differs:
- **intl-tel-input**: uses full libphonenumber rules (number type, precise format)
- **lite-phone-input**: uses length-based validation (min/max national digits)

Most valid numbers will pass both. Edge cases to check:
- Numbers at the boundary of min/max length for variable-length countries
- Special number types (toll-free, shared cost) that have different length rules

---

## CSS Variable Mapping

| intl-tel-input | lite-phone-input | Notes |
|---|---|---|
| `--iti-hover-color` | `--lpi-hover-bg` | Similar |
| `--iti-border-color` | `--lpi-border-color` | Same concept |
| `--iti-dropdown-bg` | `--lpi-dropdown-bg` | Same concept |
| `--iti-icon-color` | — | No equivalent |
| `--iti-spacer-horizontal` | `--lpi-spacing` | Same concept |
| `--iti-flag-height` / `--iti-flag-width` | `--lpi-flag-size` | Single size (emoji) |
| — | `--lpi-bg` | Container background |
| — | `--lpi-text-color` | Text color |
| — | `--lpi-border-radius` | Border radius |
| — | `--lpi-font-size` | Font size |
| — | `--lpi-input-height` | Input height |
| — | `--lpi-selected-bg` | Selected item background |
| — | `--lpi-highlight-bg` | Highlighted item background |
| — | `--lpi-dropdown-shadow` | Dropdown shadow |
| — | `--lpi-dropdown-max-height` | Dropdown max height |

---

## See also

- [Getting Started](getting-started.md) — installation and first render
- [API Reference](api-reference.md) — all options, methods, and types
- [Vanilla JS Guide](vanilla-guide.md) — complete usage guide
- [React Guide](react-guide.md) — React adapter details
