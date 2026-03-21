[Home](../README.md) > Getting Started

# Getting Started

## Installation

```bash
# npm
npm install lite-phone-input

# yarn
yarn add lite-phone-input

# pnpm
pnpm add lite-phone-input
```

## Import CSS

Every setup requires the stylesheet. Import it once in your app's entry point:

```js
import 'lite-phone-input/styles';
```

Or link it directly in HTML:

```html
<link rel="stylesheet" href="node_modules/lite-phone-input/dist/styles.css">
```

## Minimal Examples

### Vanilla JS

```html
<div id="phone"></div>

<script type="module">
  import { PhoneInput } from 'lite-phone-input/vanilla';
  import 'lite-phone-input/styles';

  const phone = PhoneInput.mount(document.getElementById('phone'), {
    defaultCountry: 'US',
  });
</script>
```

### React

```jsx
import { PhoneInput } from 'lite-phone-input/react';
import 'lite-phone-input/styles';

function App() {
  return <PhoneInput defaultCountry="US" />;
}
```

### Preact

```jsx
import { PhoneInput } from 'lite-phone-input/preact';
import 'lite-phone-input/styles';

function App() {
  return <PhoneInput defaultCountry="US" />;
}
```

## CDN / Script Tag

No bundler required. Add these two tags to any HTML page:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Phone Input Demo</title>
  <link rel="stylesheet" href="https://unpkg.com/lite-phone-input/dist/styles.css">
</head>
<body>

  <div id="phone"></div>

  <script src="https://unpkg.com/lite-phone-input/dist/vanilla/index.global.js"></script>
  <script>
    const phone = LitePhoneInput.PhoneInput.mount(document.getElementById('phone'), {
      defaultCountry: 'US',
      separateDialCode: true,
      onChange(e164, country, validation) {
        console.log('E.164:', e164);
        console.log('Country:', country.code);
        console.log('Valid:', validation.valid);
      },
    });
  </script>

</body>
</html>
```

The global build exposes `window.LitePhoneInput` with the `PhoneInput` class.

## What's Next

- [Vanilla JS Guide](vanilla-guide.md) — lifecycle, methods, callbacks
- [React Guide](react-guide.md) — controlled/uncontrolled, form libraries
- [Preact Guide](preact-guide.md) — Preact-specific setup
- [API Reference](api-reference.md) — all options, methods, and types

---

## See also

- [Styling & Theming](styling.md) — customize appearance with CSS variables
- [Validation](validation.md) — understand the validation model
- [Form Integration](form-integration.md) — hidden inputs and form library recipes
