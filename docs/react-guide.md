[Home](../README.md) > React Guide

# React Guide

## Setup

```bash
npm install lite-phone-input react
```

```jsx
import { PhoneInput } from 'lite-phone-input/react';
import 'lite-phone-input/styles';
```

Requires React 17+.

## Basic Usage

The component is always uncontrolled. Use `initialValue` to pre-fill, `onChange` to observe changes, and `ref` methods to read/write programmatically:

```jsx
import { useRef } from 'react';
import { PhoneInput } from 'lite-phone-input/react';
import 'lite-phone-input/styles';

function PhoneForm() {
  const phoneRef = useRef(null);

  return (
    <PhoneInput
      ref={phoneRef}
      defaultCountry="US"
      separateDialCode
      initialValue="+12025551234"
      onChange={(e164, country, validation) => {
        console.log(e164);            // '+12025551234'
        console.log(country.code);    // 'US'
        console.log(validation.valid); // true
      }}
    />
  );
}
```

The `onChange` callback receives `(e164, country, validation)` on every value change.

## Ref-Based Access

Use a ref to read values imperatively:

```jsx
import { useRef } from 'react';
import { PhoneInput } from 'lite-phone-input/react';
import 'lite-phone-input/styles';

function PhoneForm() {
  const phoneRef = useRef(null);

  const handleSubmit = () => {
    console.log(phoneRef.current.getValue());  // '+12025551234'
    console.log(phoneRef.current.isValid());   // true
  };

  return (
    <>
      <PhoneInput ref={phoneRef} defaultCountry="US" />
      <button onClick={handleSubmit}>Submit</button>
    </>
  );
}
```

## TypeScript

```tsx
import { useRef, useState } from 'react';
import { PhoneInput, type PhoneInputRef } from 'lite-phone-input/react';
import type { ValidationResult } from 'lite-phone-input';

const phoneRef = useRef<PhoneInputRef>(null);
```

The `PhoneInputProps` type is also exported for wrapping components:

```tsx
import type { PhoneInputProps } from 'lite-phone-input/react';
```

## HTML Attribute Forwarding

Input attributes, boolean props, styles, and native DOM event handlers are synchronized onto the underlying input. Removed props are removed from the DOM. `value` and `defaultValue` are not supported; use `initialValue` and ref methods. Event props receive native DOM events rather than React SyntheticEvents:

```jsx
<PhoneInput
  defaultCountry="US"
  name="phone"
  id="phone-input"
  aria-label="Phone number"
  data-testid="phone"
  autoFocus
  className="my-phone-wrapper"
/>
```

The `className` prop is applied to the wrapper `<div>`, not the input.

## Ref Methods

The ref exposes the same imperative API as the vanilla instance:

```tsx
const phoneRef = useRef<PhoneInputRef>(null);

// Read
phoneRef.current.getValue();          // '+12025551234'
phoneRef.current.getNationalNumber();  // '2025551234'
phoneRef.current.getCountry();         // { code: 'US', dialCode: '1', name: 'United States' }
phoneRef.current.isValid();            // true
phoneRef.current.validate();           // { valid: true, ... }

// Write
phoneRef.current.focus();
phoneRef.current.reset();
phoneRef.current.getInput();           // underlying HTMLInputElement
phoneRef.current.setValue('+442071234567');
phoneRef.current.setCountry('GB');
```

## Form libraries

See [Form Integration](form-integration.md) for complete React Hook Form and Formik bridges. The examples synchronize programmatic changes and reset through `setValue()`, report blur/touched state, and support focus via the ref. Passing a changing form value as `initialValue` alone does not synchronize it after mount.

## Next.js / SSR

The React export includes a `"use client"` boundary. Server rendering is safe and produces an empty wrapper; the actual input mounts in the browser. A server page may render the component with serializable options:

```tsx
// app/page.tsx (App Router) or pages/index.tsx (Pages Router)
import { PhoneInput } from 'lite-phone-input/react';
import 'lite-phone-input/styles';

export default function Page() {
  return <PhoneInput defaultCountry="US" />;
}
```

For callbacks, refs, or dynamic imports with `ssr: false`, put the consuming component behind its own `'use client'` boundary:

```tsx
'use client';

import dynamic from 'next/dynamic';

const PhoneInput = dynamic(
  () => import('lite-phone-input/react').then((m) => m.PhoneInput),
  { ssr: false }
);
```

## Complete Form Example

```tsx
import { useRef, useState } from 'react';
import { PhoneInput, type PhoneInputRef } from 'lite-phone-input/react';
import type { ValidationResult } from 'lite-phone-input';
import 'lite-phone-input/styles';

function ContactForm() {
  const phoneRef = useRef<PhoneInputRef>(null);
  const [error, setError] = useState('');

  const handleValidation = (v: ValidationResult) => {
    if (v.valid || v.currentDigits === 0) {
      setError('');
    } else if (v.reason === 'too_short') {
      setError(`Too short — need at least ${v.minDigits} digits`);
    } else if (v.reason === 'too_long') {
      setError(`Too long — max ${v.maxDigits} digits`);
    } else {
      setError('Check the country code and phone number length');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneRef.current?.isValid()) {
      setError('Please enter a valid phone number');
      return;
    }
    console.log('Submitting:', phoneRef.current.getValue());
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="phone">Phone</label>
      <PhoneInput
        ref={phoneRef}
        defaultCountry="US"
        separateDialCode
        preferredCountries={['US', 'GB', 'CA']}
        onChange={(e164, country, validation) => handleValidation(validation)}
        id="phone"
        name="phone"
        aria-label="Phone number"
        aria-describedby={error ? 'phone-error' : undefined}
      />
      {error && <p id="phone-error" role="alert">{error}</p>}
      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## See also

- [API Reference](api-reference.md) — all props and ref methods
- [Form Integration](form-integration.md) — hidden inputs, native forms
- [Validation](validation.md) — validation model and error messages
- [Styling & Theming](styling.md) — CSS customization
