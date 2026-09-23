[Home](../README.md) > Form Integration

# Form Integration

The widget owns its editing state. `initialValue` is read once; use `setValue()` when a form library resets, loads, or changes a value. `setValue()` does not emit `onChange` when the normalized value is unchanged, so a form bridge can safely synchronize values.

## Native HTML forms

Use hidden fields to submit the normalized value and country:

```js
const phone = PhoneInput.mount(document.getElementById('phone'), {
  defaultCountry: 'US',
  initialValue: '+12025551234',
  hiddenInput: { phone: 'phone', country: 'phone_country' },
  inputAttributes: { id: 'phone-input', required: 'true' },
});

const form = document.getElementById('contact-form');
form.addEventListener('submit', event => {
  if (!phone.isValid()) {
    event.preventDefault();
    phone.focus();
    // Show a labeled error using phone.validate().reason.
  }
});
```

Give the visible input an associated `<label>`. Its native `required` attribute checks emptiness, not phone plausibility. Validate before submitting hidden fields. If you also name the visible input, use a different name; its value is formatted for display.

`form.reset()` restores the initial phone value and country, display, and hidden fields after the browser's reset action. Canceled reset events are respected. `phone.reset()` performs the same restoration immediately. Native reset handling follows the input's form association, including a later `form` attribute update. A newer programmatic value supplied during or immediately after reset takes precedence.

## React Hook Form

This bridge handles ordinary edits, blur/touched state, `reset()`, `setValue()`, and focus on validation errors. The adapter emits native DOM events for `onBlur` and other input event props.

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { Controller, useForm, type ControllerRenderProps } from 'react-hook-form';
import { PhoneInput, type PhoneInputRef } from 'lite-phone-input/react';
import 'lite-phone-input/styles';

type Values = { phone: string };

function PhoneField({ field }: { field: ControllerRenderProps<Values, 'phone'> }) {
  const phone = useRef<PhoneInputRef | null>(null);
  useEffect(() => { phone.current?.setValue(field.value ?? ''); }, [field.value]);

  return (
    <PhoneInput
      ref={instance => { phone.current = instance; field.ref(instance); }}
      defaultCountry="US"
      initialValue={field.value}
      name={field.name}
      aria-label="Phone number"
      onChange={value => field.onChange(value)}
      onBlur={field.onBlur}
    />
  );
}

export function PhoneForm() {
  const { control, handleSubmit, reset } = useForm<Values>({
    defaultValues: { phone: '+12025551234' },
  });
  return (
    <form onSubmit={handleSubmit(values => console.log(values.phone))}>
      <Controller name="phone" control={control}
        rules={{ required: 'Phone number is required' }}
        render={({ field }) => <PhoneField field={field} />} />
      <button type="button" onClick={() => reset({ phone: '' })}>Clear</button>
      <button type="submit">Submit</button>
    </form>
  );
}
```

The example enforces presence only. Use your form schema or server validator for phone plausibility, or wire `PhoneInput.validate()` into your validation rule. Length validation does not prove number ownership or reachability.

## Formik

Keep a ref bridge for programmatic updates and explicitly report blur so touched state works:

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { Formik, Form, useField } from 'formik';
import { PhoneInput, type PhoneInputRef } from 'lite-phone-input/react';
import 'lite-phone-input/styles';

function PhoneField() {
  const [field, meta, helpers] = useField<string>('phone');
  const phone = useRef<PhoneInputRef>(null);
  useEffect(() => { phone.current?.setValue(field.value ?? ''); }, [field.value]);
  const error = meta.touched ? meta.error : undefined;
  return (
    <>
      <label htmlFor="phone">Phone number</label>
      <PhoneInput ref={phone} defaultCountry="US" initialValue={field.value}
        name={field.name} id="phone"
        onChange={value => { void helpers.setValue(value); }}
        onBlur={() => { void helpers.setTouched(true); }}
        aria-invalid={!!error} aria-describedby={error ? 'phone-error' : undefined} />
      {error && <p id="phone-error" role="alert">{error}</p>}
    </>
  );
}

export function PhoneForm() {
  return (
    <Formik initialValues={{ phone: '+12025551234' }}
      onSubmit={values => console.log(values.phone)}>
      <Form>
        <PhoneField />
        <button type="reset">Reset</button>
        <button type="submit">Submit</button>
      </Form>
    </Formik>
  );
}
```

## Ref methods and native props

Vanilla instances and React/Preact refs expose `focus()`, `reset()`, and `getInput()` in addition to number/country methods. Framework `value` and `defaultValue` props are intentionally unsupported. Boolean props such as `required={false}` remove the attribute; changing or removing ARIA attributes is synchronized. Events such as `onBlur`, `onFocus`, and `onKeyDown` are native DOM events, not React SyntheticEvents.

---

See [Validation](validation.md), [React Guide](react-guide.md), and [API Reference](api-reference.md).
