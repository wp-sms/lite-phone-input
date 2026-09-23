[Home](../README.md) > Advanced Topics

# Advanced Topics

## SSR Safety

lite-phone-input is SSR-safe. The vanilla `PhoneInput` class guards all browser API calls behind a `typeof window !== 'undefined'` check. The React and Preact adapters mount the widget inside a `useEffect`, which only runs in the browser.

The React export includes a client boundary for Next.js App Router. Rendering on the server produces an empty wrapper; the interactive input is created after mount. Use a Client Component for callbacks and refs.

If you want to lazy-load the component client-side only:

```tsx
// Inside a Client Component
'use client';

import dynamic from 'next/dynamic';

const PhoneInput = dynamic(
  () => import('lite-phone-input/react').then((m) => m.PhoneInput),
  { ssr: false }
);
```

## RTL Support

The phone input automatically uses `dir="ltr"` on the `<input>` element, ensuring digits display correctly in RTL page layouts.

The rest of the widget (container, trigger, dropdown) inherits the page's direction. No additional configuration is needed.

```html
<!-- Works correctly in RTL pages -->
<html dir="rtl" lang="ar">
  <body>
    <div id="phone"></div>
  </body>
</html>
```

## Locale / i18n

Use the `locale` option to display country names in the user's language:

```js
PhoneInput.mount(el, {
  defaultCountry: 'US',
  locale: 'fr',  // French country names in the dropdown
});
```

This uses `Intl.DisplayNames` with `{ type: 'region' }` to translate country names. Falls back to English if the locale is not supported.

```js
// Japanese country names
PhoneInput.mount(el, { defaultCountry: 'JP', locale: 'ja' });

// Arabic country names
PhoneInput.mount(el, { defaultCountry: 'SA', locale: 'ar' });
```

> **Note:** Only country names in the dropdown are localized. UI labels ("Search...") are not translated.

## Dropdown Portal

By default, the dropdown is appended to `document.body`. This avoids z-index stacking context issues with modals, popovers, and overflow-hidden containers.

To change the portal target:

```js
PhoneInput.mount(el, {
  defaultCountry: 'US',
  dropdownContainer: document.getElementById('my-container'),
});
```

When using a portal container (including the default `document.body`), the dropdown uses `position: fixed` to stay aligned with the trigger regardless of scroll position.

## Dynamic Options

Use `setOptions()` (vanilla) or just change props (React/Preact) to update the widget without remounting:

```js
// Vanilla
phone.setOptions({
  disabled: true,
  separateDialCode: false,
  allowedCountries: ['US', 'CA'],
  locale: 'fr',
});
```

```jsx
// React — just change props
<PhoneInput
  defaultCountry="US"
  disabled={isDisabled}
  separateDialCode={showDialCode}
  allowedCountries={filteredCountries}
/>
```

### Dynamically updatable options

`disabled`, `allowedCountries`, `excludedCountries`, `preferredCountries`, `allowDropdown`, `formatAsYouType`, `strict`, `separateDialCode`, `nationalMode`, `placeholder`, `locale`, `renderFlag`

Other configuration options are intended for mount time. React/Preact callbacks always use the latest props. Vanilla `inputAttributes` can also be replaced through `setOptions()`.

## Input and Paste Handling

Typed values, browser input replacements, paste, and `setValue()` share international-prefix parsing. Leading/trailing whitespace is ignored and supported non-ASCII numerals are normalized. A leading `+` or `00` selects the matching allowed country.

Pasting an international number replaces the complete phone value. Pasting local digits replaces the current selection, or inserts at the cursor. Full replacements, pasted values, and explicit international numbers are not truncated; excess digits remain available for correction and fail validation.

Unknown or disallowed international numbers retain their normalized `+…` value and return `invalid_country`. Changing country filters reparses that value rather than silently changing its dial code. Country filters must leave at least one supported country; otherwise mount or `setOptions()` throws a `RangeError` without modifying an existing instance.

Geo-IP can choose the initial country only before initial values, explicit API changes, or user interaction establish a preference.

## Shared Dial Codes

Several countries share dial codes (e.g., `+1` is used by US, Canada, and Caribbean nations). lite-phone-input resolves conflicts using a **priority** system:

- Each country has a `priority` field (0 = main country for that dial code)
- `getCountryByDialCode()` returns the highest-priority match
- For `+1`, the US has priority 0, Canada has priority 1

When a user pastes `+12025551234`:
1. The dial code `1` is detected
2. US (priority 0) is selected as the country
3. `2025551234` is extracted as the national number

> **Note:** There is no area-code-level disambiguation. A Canadian number pasted with `+1` will show as US. Users can manually select the correct country.

## National Prefix Stripping

Some countries have a national trunk prefix (e.g., `0` in the UK, `1` in the US). When the user types the national prefix at the start of the input, it's automatically stripped:

```
UK (national prefix: "0"):
  User types: "02071234567" → stored as "2071234567"

India (national prefix: "0"):
  User types: "09876543210" → stored as "9876543210"
```

The stripping only occurs when:
1. The digits start with the country's national prefix
2. There are digits remaining after stripping (prevents stripping "0" from "0")

## Bundle Sizes

The library is split into subpath exports. Your bundler only includes what you import:

| Import | Contents | Approximate gzipped size |
|---|---|---|
| `lite-phone-input` | Core utilities + country data | ~7.4KB |
| `lite-phone-input/vanilla` | PhoneInput class + core | ~12.1KB |
| `lite-phone-input/react` | React adapter + core | ~17KB |
| `lite-phone-input/preact` | Preact adapter + core | ~17KB |
| `lite-phone-input/styles` | CSS stylesheet | ~1.3KB |

These are gzip sizes of the built ESM files; bundler minification/tree shaking can reduce them further. The standalone minified browser build is approximately 12.4KB gzipped. Framework peer dependencies are excluded. The core country data accounts for much of the bundle.

---

## See also

- [API Reference](api-reference.md) — all options and methods
- [Styling & Theming](styling.md) — CSS variables, mobile fullscreen
- [Accessibility](accessibility.md) — keyboard navigation, ARIA patterns
- [Core Utilities](core-utilities.md) — `normalizeNumerals`, `extractDigits`
