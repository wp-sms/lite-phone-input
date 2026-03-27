# lite-phone-input

[![npm version](https://img.shields.io/npm/v/lite-phone-input.svg)](https://www.npmjs.com/package/lite-phone-input)
[![bundle size](https://img.shields.io/bundlephobia/minzip/lite-phone-input)](https://bundlephobia.com/package/lite-phone-input)
[![license](https://img.shields.io/npm/l/lite-phone-input.svg)](./LICENSE)

Lightweight phone input with format-as-you-type, validation, and emoji flags. **~13KB gzipped total** — zero runtime dependencies.

## Why lite-phone-input?

| | lite-phone-input | intl-tel-input |
|---|---|---|
| **JS bundle** | ~13KB (includes formatting + validation) | ~15KB + ~260KB utils |
| **Flag assets** | Emoji (0KB) | Webp sprites (30–66KB) |
| **Dependencies** | 0 | Flag sprites + optional utils |
| **Formatting** | Built-in | Requires utils bundle |
| **Validation** | Built-in | Requires utils bundle |

## Features

- **~13KB gzipped** (JS + country data) — includes formatting AND validation
- **Emoji flags** computed from ISO code at runtime (zero image cost)
- **Format-as-you-type** with per-country masks (~240 countries)
- **Per-country length validation** with rich error data
- **TypeScript-first** with full type definitions
- **Framework adapters** — Vanilla JS, React, Preact
- **Accessible** — WCAG 2.1 AA, ARIA combobox pattern, keyboard navigation
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
```

### React

```jsx
import { useRef } from 'react';
import { PhoneInput } from 'lite-phone-input/react';
import 'lite-phone-input/styles';

function MyForm() {
  const phoneRef = useRef(null);

  return (
    <PhoneInput
      ref={phoneRef}
      defaultCountry="US"
      separateDialCode
      initialValue="+12025551234"
      onChange={(e164) => console.log(e164)}
      name="phone"
      aria-label="Phone number"
    />
  );
}
```

### Preact

```jsx
import { PhoneInput } from 'lite-phone-input/preact';
import 'lite-phone-input/styles';
```

Same API as React. Uses `preact/hooks` directly — no `preact/compat` required.

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

## Geo IP Lookup

Auto-detect the user's country at mount time using any geo-IP service. The lookup runs once, and the result is ignored if the user has already interacted with the widget.

```js
const phone = PhoneInput.mount(document.getElementById('phone'), {
  defaultCountry: 'US',
  geoIpLookup: (callback) => {
    // Cloudflare (free, no API key)
    fetch('/cdn-cgi/trace')
      .then(res => res.text())
      .then(text => {
        const match = text.match(/loc=(\w+)/);
        callback(match ? match[1] : null);
      })
      .catch(() => callback(null));
  },
});
```

```js
// Alternative: ipapi.co
geoIpLookup: (callback) => {
  fetch('https://ipapi.co/json/')
    .then(res => res.json())
    .then(data => callback(data.country_code))
    .catch(() => callback(null));
}
```

## Documentation

| Guide | Description |
|---|---|
| [Getting Started](docs/getting-started.md) | Installation and first render |
| [Vanilla JS Guide](docs/vanilla-guide.md) | Mounting, methods, callbacks |
| [React Guide](docs/react-guide.md) | Usage, ref methods, form libraries |
| [Preact Guide](docs/preact-guide.md) | Preact-specific setup |
| [API Reference](docs/api-reference.md) | All options, methods, and types |
| [Styling & Theming](docs/styling.md) | CSS variables, BEM classes, dark mode |
| [Validation](docs/validation.md) | Validation model and error messages |
| [Form Integration](docs/form-integration.md) | Hidden inputs, RHF, Formik |
| [Core Utilities](docs/core-utilities.md) | Headless/server-side functions |
| [Accessibility](docs/accessibility.md) | ARIA patterns, keyboard navigation |
| [Advanced Topics](docs/advanced.md) | SSR, RTL, i18n, portals |
| [Migration from intl-tel-input](docs/migration-from-intl-tel-input.md) | Comparison and migration guide |

## Browser Support

Chrome 80+, Firefox 80+, Safari 14+, Edge 80+. No IE support, no polyfills needed.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.

## License

[MIT](LICENSE)
