[Home](../README.md) > Form Integration

# Form Integration

## Hidden Inputs

For traditional HTML form submissions, use `hiddenInput` to create hidden `<input>` elements that are automatically kept in sync:

```js
PhoneInput.mount(el, {
  defaultCountry: 'US',
  hiddenInput: {
    phone: 'phone_e164',       // <input type="hidden" name="phone_e164" value="+12025551234">
    country: 'phone_country',  // <input type="hidden" name="phone_country" value="US">
  },
});
```

Both fields are optional — include only what you need:

```js
// Only the E.164 value
hiddenInput: { phone: 'phone' }

// Only the country code
hiddenInput: { country: 'country_code' }
```

## Vanilla Form Submission

```html
<form id="contact-form">
  <div id="phone"></div>
  <button type="submit">Submit</button>
</form>

<script type="module">
  import { PhoneInput } from 'lite-phone-input/vanilla';
  import 'lite-phone-input/styles';

  const phone = PhoneInput.mount(document.getElementById('phone'), {
    defaultCountry: 'US',
    hiddenInput: { phone: 'phone', country: 'country' },
  });

  document.getElementById('contact-form').addEventListener('submit', (e) => {
    if (!phone.isValid()) {
      e.preventDefault();
      alert('Please enter a valid phone number');
      return;
    }
    // Hidden inputs are already populated — form submits normally
  });
</script>
```

## React Hook Form

```tsx
import { useForm, Controller } from 'react-hook-form';
import { PhoneInput } from 'lite-phone-input/react';
import 'lite-phone-input/styles';

interface FormValues {
  phone: string;
}

function PhoneForm() {
  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>();

  return (
    <form onSubmit={handleSubmit((data) => console.log(data.phone))}>
      <Controller
        name="phone"
        control={control}
        rules={{
          required: 'Phone number is required',
          validate: (value) => value.length > 3 || 'Enter a valid phone number',
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
      {errors.phone && <p>{errors.phone.message}</p>}
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Formik

```tsx
import { Formik, Form } from 'formik';
import { PhoneInput } from 'lite-phone-input/react';
import 'lite-phone-input/styles';

function PhoneForm() {
  return (
    <Formik
      initialValues={{ phone: '' }}
      validate={(values) => {
        const errors: Record<string, string> = {};
        if (!values.phone || values.phone.length <= 3) {
          errors.phone = 'Valid phone number required';
        }
        return errors;
      }}
      onSubmit={(values) => console.log(values.phone)}
    >
      {({ setFieldValue, values, errors, touched }) => (
        <Form>
          <PhoneInput
            defaultCountry="US"
            initialValue={values.phone}
            onChange={(e164) => setFieldValue('phone', e164)}
            name="phone"
          />
          {touched.phone && errors.phone && <p>{errors.phone}</p>}
          <button type="submit">Submit</button>
        </Form>
      )}
    </Formik>
  );
}
```

## Native HTML Form (no JavaScript submission)

Use `hiddenInput` and `inputAttributes` for fully declarative forms:

```js
PhoneInput.mount(el, {
  defaultCountry: 'US',
  hiddenInput: { phone: 'phone_e164', country: 'phone_country' },
  inputAttributes: {
    name: 'phone_display',   // visible input's name (national format)
    required: 'true',
  },
});
```

The form will submit three values:
- `phone_display` — the visible formatted value
- `phone_e164` — the hidden E.164 value (e.g. `+12025551234`)
- `phone_country` — the hidden country code (e.g. `US`)

## E.164 vs National Format

| Method | Format | Example | Use case |
|---|---|---|---|
| `getValue()` | E.164 | `+12025551234` | API calls, database storage |
| `getNationalNumber()` | Digits only | `2025551234` | Display, legacy systems |
| Hidden input (`phone`) | E.164 | `+12025551234` | Form submission |

Always store E.164 format for unambiguous international numbers.

## Input Attributes

Forward any HTML attributes to the `<input>` element via `inputAttributes` (vanilla) or directly as props (React/Preact):

### Vanilla

```js
PhoneInput.mount(el, {
  defaultCountry: 'US',
  inputAttributes: {
    name: 'phone',
    id: 'phone-input',
    'aria-label': 'Phone number',
    'data-testid': 'phone',
    required: 'true',
  },
});
```

### React / Preact

```jsx
<PhoneInput
  defaultCountry="US"
  name="phone"
  id="phone-input"
  aria-label="Phone number"
  data-testid="phone"
  required
/>
```

In React/Preact, unrecognized props are automatically forwarded to the input.

---

## See also

- [API Reference](api-reference.md) — `hiddenInput`, `inputAttributes` options
- [Validation](validation.md) — validation model and error messages
- [React Guide](react-guide.md) — React Hook Form and Formik recipes
