[Home](../README.md) > Vanilla JS Guide

# Vanilla JS Guide

## Mount and Destroy

```js
import { PhoneInput } from 'lite-phone-input/vanilla';
import 'lite-phone-input/styles';

// Mount onto a container element
const phone = PhoneInput.mount(document.getElementById('phone'), {
  defaultCountry: 'US',
});

// Later: clean up DOM and listeners
phone.destroy();
```

`mount()` appends the widget DOM inside the provided element. `destroy()` removes it and aborts all event listeners.

## Reading Values

```js
phone.getValue();          // '+12025551234' (E.164 format)
phone.getNationalNumber(); // '2025551234'   (national digits only)
phone.getCountry();        // { code: 'US', dialCode: '1', name: 'United States' }
phone.isValid();           // true
phone.validate();          // { valid: true, minDigits: 10, maxDigits: 10, currentDigits: 10 }
```

`getValue()` returns an empty string when the input is empty. It always returns E.164 format: `+{dialCode}{nationalDigits}`.

## Setting Values

```js
// Set a full E.164 number — auto-detects country from dial code
phone.setValue('+442071234567');

// Change country — keeps existing digits, reformats with new mask
phone.setCountry('GB');

// Clear the input
phone.setValue('');
```

## Validation

```js
const result = phone.validate();
// {
//   valid: false,
//   reason: 'too_short',   // 'too_short' | 'too_long' | undefined
//   minDigits: 10,
//   maxDigits: 10,
//   currentDigits: 7,
// }

if (!result.valid) {
  console.log(`Need ${result.minDigits} digits, got ${result.currentDigits}`);
}
```

See [Validation](validation.md) for the full validation model.

## Callbacks

```js
const phone = PhoneInput.mount(el, {
  defaultCountry: 'US',

  // Fires on every value change (typing, paste, programmatic)
  onChange(e164, country, validation) {
    console.log(e164);            // '+12025551234'
    console.log(country.code);    // 'US'
    console.log(validation.valid); // true
  },

  // Fires when the selected country changes
  onCountryChange(country) {
    console.log('Switched to', country.code);
  },

  // Fires only on validity state transitions (valid → invalid or vice versa)
  onValidationChange(validation) {
    console.log('Now', validation.valid ? 'valid' : 'invalid');
  },

  // Dropdown events
  onDropdownOpen() { console.log('Dropdown opened'); },
  onDropdownClose() { console.log('Dropdown closed'); },
});
```

## Display Modes

### Separate Dial Code

```js
PhoneInput.mount(el, { defaultCountry: 'US', separateDialCode: true });
// [🇺🇸 +1 ▼] [202 555 1234        ]
```

The dial code is displayed in the trigger area. The input contains only the national number.

### Inline (default)

```js
PhoneInput.mount(el, { defaultCountry: 'US', separateDialCode: false });
// [🇺🇸 ▼] [+1 202 555 1234       ]
```

The full number including dial code is in the input. Country auto-detects from the dial code as the user types.

### National Mode

```js
PhoneInput.mount(el, { defaultCountry: 'GB', nationalMode: true });
// [🇬🇧 ▼] [07400 123456          ]
```

Only the national number is shown — countries with a trunk prefix (like GB's "0") display it automatically. `getValue()` still returns E.164 (`+447400123456`).

## Updating Options Dynamically

Use `setOptions()` to change options without remounting:

```js
// Disable the widget
phone.setOptions({ disabled: true });

// Change display mode
phone.setOptions({ separateDialCode: true });

// Update country filters
phone.setOptions({
  allowedCountries: ['US', 'CA', 'GB'],
  preferredCountries: ['US'],
});

// Change placeholder
phone.setOptions({ placeholder: 'Enter your number' });

// Turn off formatting
phone.setOptions({ formatAsYouType: false });
```

Supported dynamic options: `disabled`, `allowedCountries`, `excludedCountries`, `preferredCountries`, `allowDropdown`, `formatAsYouType`, `strict`, `separateDialCode`, `placeholder`, `locale`, `renderFlag`.

Mount-only options (cannot be changed via `setOptions`): `defaultCountry`, `initialValue`, `hiddenInput`, `containerClass`, `dropdownContainer`, `geoIpLookup`, `inputAttributes`.

## Multiple Instances

Each `mount()` call creates an independent instance:

```js
const personal = PhoneInput.mount(document.getElementById('personal-phone'), {
  defaultCountry: 'US',
});

const work = PhoneInput.mount(document.getElementById('work-phone'), {
  defaultCountry: 'GB',
  separateDialCode: true,
});

// Each instance has its own state
personal.getValue(); // '+1...'
work.getValue();     // '+44...'

// Destroy individually
personal.destroy();
work.destroy();
```

## Complete Example

```html
<div id="phone"></div>
<p id="output"></p>

<script type="module">
  import { PhoneInput } from 'lite-phone-input/vanilla';
  import 'lite-phone-input/styles';

  const output = document.getElementById('output');

  const phone = PhoneInput.mount(document.getElementById('phone'), {
    defaultCountry: 'US',
    separateDialCode: true,
    preferredCountries: ['US', 'GB', 'CA'],
    strict: true,
    placeholder: 'auto',

    onChange(e164, country, validation) {
      output.textContent = validation.valid
        ? `Valid: ${e164}`
        : `Invalid: need ${validation.minDigits}–${validation.maxDigits} digits, have ${validation.currentDigits}`;
    },
  });
</script>
```

---

## See also

- [API Reference](api-reference.md) — all options and methods
- [Styling & Theming](styling.md) — CSS variables and BEM classes
- [Form Integration](form-integration.md) — hidden inputs and form submission
- [Advanced Topics](advanced.md) — SSR, RTL, portals, paste handling
