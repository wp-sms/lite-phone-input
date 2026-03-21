[Home](../README.md) > Validation

# Validation

## How Validation Works

lite-phone-input uses **length-based validation**. Each country in the dataset has `minLength` and `maxLength` values representing the expected national digit count. Validation compares the current number of digits against these bounds.

This approach covers the vast majority of real-world use cases without requiring a full libphonenumber implementation (~260KB).

## ValidationResult

Both `validate()` (instance) and `validatePhone()` (utility) return the same shape:

```ts
interface ValidationResult {
  valid: boolean;
  reason?: 'too_short' | 'too_long';  // Only present when valid is false
  minDigits: number;
  maxDigits: number;
  currentDigits: number;
}
```

### Examples

```js
// Valid US number (10 digits)
{ valid: true, minDigits: 10, maxDigits: 10, currentDigits: 10 }

// Too short
{ valid: false, reason: 'too_short', minDigits: 10, maxDigits: 10, currentDigits: 7 }

// Too long
{ valid: false, reason: 'too_long', minDigits: 10, maxDigits: 10, currentDigits: 12 }
```

## isValid() vs validate()

| Method | Returns | Use when |
|---|---|---|
| `isValid()` | `boolean` | You only need a pass/fail check |
| `validate()` | `ValidationResult` | You need to build error messages with digit counts |

`isValid()` is a convenience wrapper: it calls `validate()` and returns `.valid`.

## Building Error Messages

```js
const result = phone.validate();

if (!result.valid) {
  if (result.reason === 'too_short') {
    alert(`Enter at least ${result.minDigits} digits (you have ${result.currentDigits})`);
  } else if (result.reason === 'too_long') {
    alert(`Maximum ${result.maxDigits} digits allowed (you have ${result.currentDigits})`);
  }
}
```

For countries with variable-length numbers (e.g. `minDigits: 8, maxDigits: 11`):

```js
if (result.reason === 'too_short') {
  alert(`Enter ${result.minDigits}–${result.maxDigits} digits (you have ${result.currentDigits})`);
}
```

## onValidationChange Callback

`onValidationChange` fires **only when the validity state transitions** — not on every keystroke. This makes it ideal for showing/hiding error UI:

```js
PhoneInput.mount(el, {
  defaultCountry: 'US',
  onValidationChange(result) {
    const errorEl = document.getElementById('error');
    if (result.valid) {
      errorEl.textContent = '';
    } else {
      errorEl.textContent = 'Please enter a valid phone number';
    }
  },
});
```

Transitions:
- First keystroke (no previous state → invalid): fires
- Digits added but still invalid: **does not fire** (state unchanged)
- Becomes valid: fires
- Becomes invalid again: fires

## onChange Includes Validation

The `onChange` callback receives the validation result on every change, so you can do inline validation without calling `validate()`:

```js
PhoneInput.mount(el, {
  defaultCountry: 'US',
  onChange(e164, country, validation) {
    submitButton.disabled = !validation.valid;
  },
});
```

## Server-Side Validation

Use `validatePhone` from the core export for server-side or headless validation:

```js
import { validatePhone, getCountryByCode, getAllCountries } from 'lite-phone-input';

const countries = getAllCountries();
const us = getCountryByCode(countries, 'US');

const result = validatePhone('2025551234', us);
// { valid: true, minDigits: 10, maxDigits: 10, currentDigits: 10 }
```

The `digits` parameter should be the **national number** (excluding dial code and national prefix).

## Strict Mode

When `strict: true` (default):
- Non-digit characters are blocked from being typed
- The input enforces `maxLength` — digits beyond the country's max are rejected
- Arabic-Indic and Persian numerals are still accepted (normalized to ASCII)

When `strict: false`:
- Any character can be typed
- No max-length enforcement
- Validation still works — it just doesn't prevent invalid input

```js
// Strict (default) — input rejects 11th digit for US
PhoneInput.mount(el, { defaultCountry: 'US', strict: true });

// Permissive — input accepts anything, validate() still reports errors
PhoneInput.mount(el, { defaultCountry: 'US', strict: false });
```

## Empty Input

When the input is empty (`currentDigits: 0`), `validate()` returns:

```js
{ valid: false, reason: 'too_short', minDigits: 10, maxDigits: 10, currentDigits: 0 }
```

You may want to treat empty as a separate state in your UI (e.g., don't show an error until the user has started typing):

```js
onChange(e164, country, validation) {
  if (validation.currentDigits === 0) {
    setError('');  // No error for empty input
  } else if (!validation.valid) {
    setError(`Enter ${validation.minDigits} digits`);
  } else {
    setError('');
  }
}
```

---

## See also

- [API Reference](api-reference.md) — ValidationResult type, validate() method
- [Form Integration](form-integration.md) — validation in form submissions
- [Core Utilities](core-utilities.md) — `validatePhone()` for server-side use
