import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { createRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';
import { PhoneInput } from '../../src/react/PhoneInput';
import type { PhoneInputRef } from '../../src/react/PhoneInput';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  document.body.innerHTML = '';
});

function render(element: React.ReactElement) {
  act(() => root.render(element));
}

describe('React PhoneInput', () => {
  describe('mount and unmount', () => {
    it('renders the vanilla widget DOM', () => {
      render(<PhoneInput defaultCountry="US" />);

      expect(container.querySelector('.lpi')).toBeTruthy();
      expect(container.querySelector('.lpi__trigger')).toBeTruthy();
      expect(container.querySelector('.lpi__input')).toBeTruthy();
    });

    it('cleans up DOM on unmount', () => {
      render(<PhoneInput defaultCountry="US" />);
      expect(container.querySelector('.lpi')).toBeTruthy();

      act(() => root.unmount());
      // After unmount, the container div is removed
      expect(container.querySelector('.lpi')).toBeFalsy();
    });

    it('applies className to wrapper div', () => {
      render(<PhoneInput defaultCountry="US" className="my-phone" />);

      const wrapper = container.firstElementChild as HTMLDivElement;
      expect(wrapper.className).toContain('my-phone');
    });
  });

  describe('ref methods', () => {
    it('exposes getValue and setValue', () => {
      const ref = createRef<PhoneInputRef>();
      render(<PhoneInput defaultCountry="US" ref={ref} />);

      expect(ref.current!.getValue()).toBe('');

      act(() => ref.current!.setValue('+12025551234'));
      expect(ref.current!.getValue()).toBe('+12025551234');
    });

    it('exposes getNationalNumber', () => {
      const ref = createRef<PhoneInputRef>();
      render(<PhoneInput defaultCountry="US" ref={ref} />);

      act(() => ref.current!.setValue('+12025551234'));
      expect(ref.current!.getNationalNumber()).toBe('2025551234');
    });

    it('exposes getCountry', () => {
      const ref = createRef<PhoneInputRef>();
      render(<PhoneInput defaultCountry="US" ref={ref} />);

      const country = ref.current!.getCountry();
      expect(country.code).toBe('US');
      expect(country.dialCode).toBe('1');
    });

    it('exposes setCountry', () => {
      const ref = createRef<PhoneInputRef>();
      render(<PhoneInput defaultCountry="US" ref={ref} />);

      act(() => ref.current!.setCountry('GB'));
      expect(ref.current!.getCountry().code).toBe('GB');
    });

    it('exposes isValid and validate', () => {
      const ref = createRef<PhoneInputRef>();
      render(<PhoneInput defaultCountry="US" ref={ref} />);

      expect(ref.current!.isValid()).toBe(false);

      act(() => ref.current!.setValue('+12025551234'));
      expect(ref.current!.isValid()).toBe(true);

      const result = ref.current!.validate();
      expect(result.valid).toBe(true);
      expect(result.currentDigits).toBe(10);
    });
  });

  describe('initial value', () => {
    it('sets initial value on mount', () => {
      render(<PhoneInput defaultCountry="US" initialValue="+12025551234" />);

      const input = container.querySelector('.lpi__input') as HTMLInputElement;
      expect(input.value).toContain('202');
    });

    it('detects country from initialValue', () => {
      const ref = createRef<PhoneInputRef>();
      render(<PhoneInput defaultCountry="US" initialValue="+442071234567" ref={ref} />);
      expect(ref.current!.getCountry().code).toBe('GB');
      expect(ref.current!.getValue()).toBe('+442071234567');
    });

    it('updates value via ref.setValue', () => {
      const ref = createRef<PhoneInputRef>();
      render(<PhoneInput defaultCountry="US" initialValue="+12025551234" ref={ref} />);
      expect(ref.current!.getValue()).toBe('+12025551234');

      act(() => ref.current!.setValue('+442071234567'));
      expect(ref.current!.getValue()).toBe('+442071234567');
      expect(ref.current!.getCountry().code).toBe('GB');
    });

    it('fires onChange callback on user input', () => {
      const onChange = vi.fn();
      render(<PhoneInput defaultCountry="US" onChange={onChange} />);

      const input = container.querySelector('.lpi__input') as HTMLInputElement;
      act(() => {
        input.value = '2';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });

      expect(onChange).toHaveBeenCalled();
      const [e164, country] = onChange.mock.calls[0];
      expect(country.code).toBe('US');
    });
  });

  describe('uncontrolled mode', () => {
    it('manages state internally via ref', () => {
      const ref = createRef<PhoneInputRef>();
      render(<PhoneInput defaultCountry="US" ref={ref} />);

      expect(ref.current!.getValue()).toBe('');

      const input = container.querySelector('.lpi__input') as HTMLInputElement;
      act(() => {
        input.value = '+12025551234';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });

      // Value should be accessible via ref
      expect(ref.current!.getValue()).toBeTruthy();
    });
  });

  describe('prop updates', () => {
    it('syncs disabled prop', () => {
      render(<PhoneInput defaultCountry="US" disabled={false} />);
      const input = container.querySelector('.lpi__input') as HTMLInputElement;
      expect(input.disabled).toBe(false);

      render(<PhoneInput defaultCountry="US" disabled={true} />);
      expect(input.disabled).toBe(true);
    });

    it('syncs separateDialCode prop', () => {
      render(<PhoneInput defaultCountry="US" separateDialCode={false} />);
      expect(container.querySelector('.lpi__dial-code')).toBeFalsy();

      render(<PhoneInput defaultCountry="US" separateDialCode={true} />);
      expect(container.querySelector('.lpi__dial-code')).toBeTruthy();
    });
  });

  describe('HTML attribute passthrough', () => {
    it('forwards name, id, and data attributes to input', () => {
      render(
        <PhoneInput
          defaultCountry="US"
          name="phone"
          id="phone-input"
          data-testid="phone-field"
        />,
      );

      const input = container.querySelector('.lpi__input') as HTMLInputElement;
      expect(input.getAttribute('name')).toBe('phone');
      expect(input.getAttribute('id')).toBe('phone-input');
      expect(input.getAttribute('data-testid')).toBe('phone-field');
    });

    it('forwards aria-label to input', () => {
      render(<PhoneInput defaultCountry="US" aria-label="Phone number" />);

      const input = container.querySelector('.lpi__input') as HTMLInputElement;
      expect(input.getAttribute('aria-label')).toBe('Phone number');
    });
  });

  describe('callbacks', () => {
    it('fires onCountryChange when country changes via ref', () => {
      const onCountryChange = vi.fn();
      const ref = createRef<PhoneInputRef>();
      render(
        <PhoneInput defaultCountry="US" onCountryChange={onCountryChange} ref={ref} />,
      );

      act(() => ref.current!.setCountry('GB'));
      expect(onCountryChange).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'GB' }),
      );
    });

    it('fires onValidationChange when validity changes', () => {
      const onValidationChange = vi.fn();
      const ref = createRef<PhoneInputRef>();
      render(
        <PhoneInput defaultCountry="US" onValidationChange={onValidationChange} ref={ref} />,
      );

      act(() => ref.current!.setValue('+12025551234'));
      expect(onValidationChange).toHaveBeenCalledWith(
        expect.objectContaining({ valid: true }),
      );
    });
  });

  describe('no value sync (freeze prevention)', () => {
    it('does not have a value sync effect that could cause loops', () => {
      const onChange = vi.fn();
      const ref = createRef<PhoneInputRef>();

      render(
        <PhoneInput
          defaultCountry="DE"
          initialValue="+4901234567890"
          onChange={onChange}
          ref={ref}
        />,
      );

      // onChange fires once during mount for normalization (national prefix stripped)
      expect(onChange.mock.calls.length).toBeLessThanOrEqual(1);
      // Value should be the normalized form
      expect(ref.current!.getValue()).toBe('+491234567890');
    });

    it('rapid typing does not cause value rollback', () => {
      const onChange = vi.fn();
      const ref = createRef<PhoneInputRef>();
      render(<PhoneInput defaultCountry="US" onChange={onChange} ref={ref} />);

      const input = container.querySelector('.lpi__input') as HTMLInputElement;

      // Simulate rapid typing
      for (const digit of ['2', '20', '202', '2025', '20255', '202555', '2025551', '20255512', '202555123', '2025551234']) {
        act(() => {
          input.value = digit;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        });
      }

      // Final value should reflect the last typed input, not roll back
      expect(ref.current!.getNationalNumber()).toBe('2025551234');
      expect(ref.current!.getValue()).toBe('+12025551234');
    });
  });
});
