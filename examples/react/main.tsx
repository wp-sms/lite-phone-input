import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PhoneInput } from '../../src/react';
import type { PhoneInputRef } from '../../src/react';
import '../../src/vanilla/styles.css';

function App() {
  const [value, setValue] = useState('');
  const [country, setCountry] = useState('');
  const [valid, setValid] = useState<string>('—');
  const phoneRef = useRef<PhoneInputRef>(null);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 480, margin: '60px auto', padding: '0 20px' }}>
      <h1 style={{ fontSize: '1.4rem' }}>lite-phone-input — React</h1>

      <label htmlFor="phone" style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
        Phone number
      </label>

      <PhoneInput
        ref={phoneRef}
        defaultCountry="US"
        separateDialCode
        preferredCountries={['US', 'GB', 'DE', 'FR']}
        name="phone"
        id="phone"
        onChange={(e164, c, validation) => {
          setValue(e164);
          setCountry(`${c.name} (${c.code}) +${c.dialCode}`);
          setValid(
            validation.valid
              ? 'Yes'
              : `No — ${validation.reason ?? 'empty'} (${validation.currentDigits}/${validation.minDigits}–${validation.maxDigits})`
          );
        }}
        onCountryChange={(c) => {
          setCountry(`${c.name} (${c.code}) +${c.dialCode}`);
        }}
      />

      <div style={{
        marginTop: 24, padding: 16, background: '#f5f5f5',
        borderRadius: 6, fontFamily: 'monospace', fontSize: 13, lineHeight: 1.8,
      }}>
        E.164: {value || '—'}<br />
        National: {phoneRef.current?.getNationalNumber() || '—'}<br />
        Country: {country || '—'}<br />
        Valid: {valid}
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
