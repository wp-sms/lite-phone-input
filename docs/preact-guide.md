[Home](../README.md) > Preact Guide

# Preact Guide

## Setup

```bash
npm install lite-phone-input preact
```

```jsx
import { PhoneInput } from 'lite-phone-input/preact';
import 'lite-phone-input/styles';
```

Requires Preact 10+. Uses `preact/hooks` and `preact/compat` (for `forwardRef`) directly — **consumers do not need to alias `preact/compat` as `react`**.

## Import Path

Always use the dedicated Preact path:

```js
// Correct
import { PhoneInput } from 'lite-phone-input/preact';

// Wrong — this imports the React version
import { PhoneInput } from 'lite-phone-input/react';
```

## Differences from the React Adapter

| Aspect | React | Preact |
|---|---|---|
| Import path | `lite-phone-input/react` | `lite-phone-input/preact` |
| Peer dependency | `react >= 17` | `preact >= 10` |
| CSS class prop | `className` | `class` or `className` |
| Internal hooks | `react` | `preact/hooks` |
| `forwardRef` source | `react` | `preact/compat` |

The API is otherwise identical — same props, same ref methods, same callbacks.

## Basic Example

```jsx
import { useRef } from 'preact/hooks';
import { PhoneInput } from 'lite-phone-input/preact';
import 'lite-phone-input/styles';

function PhoneForm() {
  const phoneRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (phoneRef.current.isValid()) {
      console.log('Phone:', phoneRef.current.getValue());
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PhoneInput
        ref={phoneRef}
        defaultCountry="US"
        separateDialCode
        initialValue="+12025551234"
        onChange={(e164) => console.log(e164)}
        name="phone"
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Uncontrolled Example

```jsx
import { useRef } from 'preact/hooks';
import { PhoneInput } from 'lite-phone-input/preact';
import 'lite-phone-input/styles';

function PhoneForm() {
  const phoneRef = useRef(null);

  return (
    <>
      <PhoneInput ref={phoneRef} defaultCountry="GB" />
      <button onClick={() => console.log(phoneRef.current.getValue())}>
        Get Value
      </button>
    </>
  );
}
```

## Ref Methods

Same as the React adapter:

```js
phoneRef.current.getValue();          // '+12025551234'
phoneRef.current.getNationalNumber();  // '2025551234'
phoneRef.current.getCountry();         // { code: 'US', dialCode: '1', name: 'United States' }
phoneRef.current.isValid();            // true
phoneRef.current.validate();           // { valid: true, ... }
phoneRef.current.setValue('+442071234567');
phoneRef.current.setCountry('GB');
```

## TypeScript

```tsx
import { useRef } from 'preact/hooks';
import { PhoneInput, type PhoneInputRef } from 'lite-phone-input/preact';

const phoneRef = useRef<PhoneInputRef>(null);
```

## Complete Example

```jsx
import { useState, useRef } from 'preact/hooks';
import { PhoneInput } from 'lite-phone-input/preact';
import 'lite-phone-input/styles';

function App() {
  const [display, setDisplay] = useState('');
  const [valid, setValid] = useState(false);
  const phoneRef = useRef(null);

  return (
    <div>
      <PhoneInput
        ref={phoneRef}
        defaultCountry="US"
        separateDialCode
        preferredCountries={['US', 'GB', 'CA']}
        initialValue=""
        onChange={(e164, country, validation) => {
          setDisplay(e164);
          setValid(validation.valid);
        }}
        name="phone"
        aria-label="Phone number"
      />
      <p>
        Value: {display || '(empty)'} — {valid ? 'Valid' : 'Invalid'}
      </p>
    </div>
  );
}
```

---

## See also

- [API Reference](api-reference.md) — all props and ref methods
- [React Guide](react-guide.md) — if you're using React instead
- [Styling & Theming](styling.md) — CSS customization
- [Form Integration](form-integration.md) — hidden inputs and form libraries
