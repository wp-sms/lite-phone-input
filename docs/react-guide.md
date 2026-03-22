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
import { useRef } from 'react';
import { PhoneInput, type PhoneInputRef } from 'lite-phone-input/react';
import type { ValidationResult } from 'lite-phone-input';

const phoneRef = useRef<PhoneInputRef>(null);
```

The `PhoneInputProps` type is also exported for wrapping components:

```tsx
import type { PhoneInputProps } from 'lite-phone-input/react';
```

## HTML Attribute Forwarding

Props not recognized as widget options are forwarded to the underlying `<input>` element:

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
phoneRef.current.setValue('+442071234567');
phoneRef.current.setCountry('GB');
```

## React Hook Form

```tsx
import { useForm, Controller } from 'react-hook-form';
import { PhoneInput } from 'lite-phone-input/react';
import 'lite-phone-input/styles';

function PhoneForm() {
  const { control, handleSubmit } = useForm();

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <Controller
        name="phone"
        control={control}
        rules={{
          validate: (value) => {
            // value is the E.164 string
            return value.length > 3 || 'Phone number is required';
          },
        }}
        render={({ field }) => (
          <PhoneInput
            defaultCountry="US"
            separateDialCode
            initialValue={field.value}
            onChange={(e164) => field.onChange(e164)}
            name={field.name}
          />
        )}
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

For ref-based validation, use `phoneRef.current.isValid()` inside the `validate` rule.

## Formik

```tsx
import { Formik, Form, Field } from 'formik';
import { PhoneInput } from 'lite-phone-input/react';
import 'lite-phone-input/styles';

function PhoneForm() {
  return (
    <Formik
      initialValues={{ phone: '' }}
      onSubmit={(values) => console.log(values)}
    >
      {({ setFieldValue, values }) => (
        <Form>
          <PhoneInput
            defaultCountry="US"
            initialValue={values.phone}
            onChange={(e164) => setFieldValue('phone', e164)}
            name="phone"
          />
          <button type="submit">Submit</button>
        </Form>
      )}
    </Formik>
  );
}
```

## Next.js / SSR

The component is SSR-safe — it guards browser APIs behind `typeof window` checks. No special configuration needed:

```tsx
// app/page.tsx (App Router) or pages/index.tsx (Pages Router)
import { PhoneInput } from 'lite-phone-input/react';
import 'lite-phone-input/styles';

export default function Page() {
  return <PhoneInput defaultCountry="US" />;
}
```

If you use dynamic imports:

```tsx
import dynamic from 'next/dynamic';

const PhoneInput = dynamic(
  () => import('lite-phone-input/react').then((m) => m.PhoneInput),
  { ssr: false }
);
```

## Complete Form Example

```tsx
import { useRef } from 'react';
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
        onChange={(e164) => console.log(e164)}
        onValidationChange={handleValidation}
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
