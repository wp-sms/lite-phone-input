# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2026-09-23

### Upgrade notes

- Validation can now return `invalid_country` and `invalid_length`. Update exhaustive reason handling and validate before submitting `getValue()`.
- Full international, pasted, and replacement values retain overflow digits instead of being silently truncated. Ordinary local typing still respects strict mode.
- React/Preact input events such as `onBlur` receive native DOM events. React handlers should not assume SyntheticEvent methods. `onChange` retains its `(value, country, validation)` signature.
- Framework `value` and `defaultValue` props are excluded from the public type. Use `initialValue` for mount-time values and `ref.setValue()` for subsequent changes; see the updated form-library recipes.
- Country filters that leave no supported country now throw a descriptive `RangeError`.

### Added

- `focus()`, `reset()`, and `getInput()` on vanilla instances and framework refs.
- `Country.possibleLengths` for exact possible lengths when a country's min/max range has gaps.

### Fixed

- Preserve international replacements in national/separate-dial-code modes; unknown or disallowed countries report `invalid_country` without rewriting the value (issue #2).
- Ignore late geo-IP results after initial values, explicit API changes, or user interaction.
- Honor local paste selections and synchronize native form resets with widget state and hidden fields.
- Synchronize React/Preact boolean props, event handlers, styles, and changing/removed input attributes.
- Support dropdown interactions inside closed ShadowRoots (issue #1), update open dropdown filters, and close disabled dropdowns.
- Reject country filters that leave no supported country without partially applying updates.
- Add a named dialog relationship, accessible search label, visible Close button, and clear stale active-descendant references.
- Preserve the React client boundary and support React 17 ESM imports without relying on JSX runtime resolution.

### Changed

- International and pasted/replacement values retain overflow digits for validation instead of silently truncating them. Ordinary local typing still respects strict mode.
- Pin libphonenumber metadata and preserve exact possible lengths where the range has gaps (`invalid_length`). Validation remains a plausibility check.
- Minify the vanilla/browser builds and enforce a gzip bundle budget.
- Add browser/axe, package-consumer and coverage checks; update development dependencies.

## [0.5.0] - 2026-03-30

### Fixed

- **Cursor position with non-ASCII numerals** — fixed cursor jumping when typing Persian, Arabic-Indic, or other non-ASCII digits in national mode.

### Changed

- **Expanded numeral normalization** — `normalizeNumerals()` now supports 9 numeral systems (was 2): Arabic-Indic, Persian, Devanagari, Bengali, Thai, Lao, Myanmar, Khmer, and Fullwidth.

## [0.4.0] - 2026-03-27

### Added

- **`geoIpLookup` option** — auto-detect the user's country at mount time using any geo-IP service. Accepts a callback-based function, runs once, and is ignored if the user has already interacted with the widget (typed, pasted, or opened the dropdown).

## [0.3.0] - 2026-03-23

### Added

- **`nationalMode` option** — display and type phone numbers in national format (e.g., "07400 123456" for GB). Output remains E.164. Countries with a display prefix (like GB's "0") auto-prepend it.
- **Example-number placeholders** — `placeholder: 'auto'` now generates realistic example numbers per country (e.g., "+1 201 555 0123" for US) instead of generic mask placeholders.
- **New `Country` fields** — `displayNationalPrefix` and `exampleNumber` exposed on the `Country` type for programmatic use.

## [0.2.0] - 2026-03-22

### Breaking

- **`value` prop replaced with `initialValue` (React/Preact)** — Controlled mode removed. The component is now always uncontrolled. Use `initialValue` to pre-fill, `onChange` to observe, and `ref` methods to read/write programmatically.

### Changed

- **CSS custom properties no longer declared in `.lpi`** — Consumers can override variables at `:root` or any ancestor scope without specificity battles.
- **Dropdown positioning uses `position: fixed`** instead of `position: absolute` + scroll offsets when rendered in a portal container.

### Fixed

- **Dropdown positioning works with any custom `dropdownContainer`**, not just `document.body`. Previously, custom containers fell back to CSS-only positioning which broke outside `.lpi`.
- **Inline mode** input handling and cursor positioning.

## [0.1.0] - 2025-01-01

### Added

- **Vanilla JS** phone input widget with `PhoneInput.mount()` / `destroy()` lifecycle
- **React adapter** with controlled/uncontrolled modes and imperative ref API
- **Preact adapter** using native `preact/hooks` (no `preact/compat` required)
- **Format-as-you-type** with per-country masks (~240 countries)
- **Per-country length validation** returning rich `ValidationResult` objects
- **Emoji flags** computed at runtime from ISO codes (zero image cost)
- **Searchable country dropdown** with preferred countries, filtering, and keyboard navigation
- **E.164 output** via `getValue()` — always `+{dialCode}{digits}`
- **CSS custom properties** for theming (15 variables) and BEM class naming
- **Hidden form inputs** for phone (E.164) and country code
- **Callbacks**: `onChange`, `onCountryChange`, `onValidationChange`, `onDropdownOpen`, `onDropdownClose`
- **Core utilities** for headless/server-side use: `formatPhone`, `validatePhone`, `getFlag`, `getCountryByCode`, `getCountryByDialCode`, `getAllCountries`, `extractDigits`, `normalizeNumerals`, `getCursorPosition`
- **Strict mode** blocking non-digit input and enforcing max length
- **Arabic-Indic and Persian numeral** normalization
- **Paste handling** with international prefix detection (`+` and `00`)
- **Separate dial code** display mode
- **Custom flag rendering** via `renderFlag` callback
- **Locale support** for country names via `Intl.DisplayNames`
- **Dropdown portal** support via `dropdownContainer`
- **Mobile fullscreen** dropdown on small screens (CSS media query)
- **RTL safe** — phone input always uses `dir="ltr"`
- **SSR safe** — no browser API calls at module level
- **WCAG 2.1 AA** accessible: ARIA combobox pattern, keyboard navigation, screen reader live region
- **CDN / IIFE build** for script-tag usage
- **TypeScript-first** — written in TypeScript with full type definitions
- **Zero runtime dependencies**

[0.6.0]: https://github.com/wp-sms/lite-phone-input/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/wp-sms/lite-phone-input/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/wp-sms/lite-phone-input/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/wp-sms/lite-phone-input/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/wp-sms/lite-phone-input/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/wp-sms/lite-phone-input/releases/tag/v0.1.0
