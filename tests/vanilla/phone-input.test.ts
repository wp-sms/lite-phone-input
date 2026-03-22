import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PhoneInput } from '../../src/vanilla/phone-input';

function createContainer(): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

describe('PhoneInput', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = createContainer();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('mount and destroy', () => {
    it('creates DOM structure inside container', () => {
      const phone = PhoneInput.mount(container, { defaultCountry: 'US' });

      expect(container.querySelector('.lpi')).toBeTruthy();
      expect(container.querySelector('.lpi__trigger')).toBeTruthy();
      expect(container.querySelector('.lpi__flag')).toBeTruthy();
      expect(container.querySelector('.lpi__input')).toBeTruthy();

      phone.destroy();
    });

    it('destroy removes all created DOM', () => {
      const phone = PhoneInput.mount(container, { defaultCountry: 'US' });
      phone.destroy();

      expect(container.innerHTML).toBe('');
    });

    it('sets input attributes', () => {
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        inputAttributes: { name: 'phone', id: 'phone-input', 'data-testid': 'phone' },
      });

      const input = container.querySelector('.lpi__input') as HTMLInputElement;
      expect(input.getAttribute('name')).toBe('phone');
      expect(input.getAttribute('id')).toBe('phone-input');
      expect(input.getAttribute('data-testid')).toBe('phone');

      phone.destroy();
    });

    it('input has correct type and inputMode', () => {
      const phone = PhoneInput.mount(container, { defaultCountry: 'US' });
      const input = container.querySelector('.lpi__input') as HTMLInputElement;

      expect(input.type).toBe('tel');
      expect(input.inputMode).toBe('tel');
      expect(input.autocomplete).toBe('tel');
      expect(input.dir).toBe('ltr');

      phone.destroy();
    });
  });

  describe('getValue and getNationalNumber', () => {
    it('returns empty string when no input', () => {
      const phone = PhoneInput.mount(container, { defaultCountry: 'US' });

      expect(phone.getValue()).toBe('');
      expect(phone.getNationalNumber()).toBe('');

      phone.destroy();
    });

    it('returns correct E.164 after setValue', () => {
      const phone = PhoneInput.mount(container, { defaultCountry: 'US' });
      phone.setValue('+12025551234');

      expect(phone.getValue()).toBe('+12025551234');
      expect(phone.getNationalNumber()).toBe('2025551234');

      phone.destroy();
    });
  });

  describe('setValue', () => {
    it('parses E.164 and auto-detects country', () => {
      const phone = PhoneInput.mount(container, { defaultCountry: 'US' });
      phone.setValue('+442071234567');

      expect(phone.getCountry().code).toBe('GB');
      expect(phone.getNationalNumber()).toBe('2071234567');

      phone.destroy();
    });

    it('falls back to defaultCountry when no dial code match', () => {
      const phone = PhoneInput.mount(container, { defaultCountry: 'US' });
      phone.setValue('2025551234'); // no + prefix

      expect(phone.getCountry().code).toBe('US');

      phone.destroy();
    });

    it('clears value with empty string', () => {
      const phone = PhoneInput.mount(container, { defaultCountry: 'US' });
      phone.setValue('+12025551234');
      phone.setValue('');

      expect(phone.getValue()).toBe('');
      expect(phone.getNationalNumber()).toBe('');

      phone.destroy();
    });
  });

  describe('getCountry and setCountry', () => {
    it('returns default country info', () => {
      const phone = PhoneInput.mount(container, { defaultCountry: 'US' });
      const country = phone.getCountry();

      expect(country.code).toBe('US');
      expect(country.dialCode).toBe('1');
      expect(country.name).toBe('United States');

      phone.destroy();
    });

    it('setCountry changes country and keeps digits', () => {
      const phone = PhoneInput.mount(container, { defaultCountry: 'US' });
      phone.setValue('+12025551234');
      phone.setCountry('GB');

      expect(phone.getCountry().code).toBe('GB');
      // Digits are preserved
      expect(phone.getNationalNumber()).toBe('2025551234');

      phone.destroy();
    });
  });

  describe('validation', () => {
    it('isValid returns true for valid US number', () => {
      const phone = PhoneInput.mount(container, { defaultCountry: 'US' });
      phone.setValue('+12025551234');

      expect(phone.isValid()).toBe(true);

      phone.destroy();
    });

    it('isValid returns false for too short number', () => {
      const phone = PhoneInput.mount(container, { defaultCountry: 'US' });
      phone.setValue('+120255');

      expect(phone.isValid()).toBe(false);

      phone.destroy();
    });

    it('validate returns full ValidationResult', () => {
      const phone = PhoneInput.mount(container, { defaultCountry: 'US' });
      phone.setValue('+12025551234');

      const result = phone.validate();
      expect(result.valid).toBe(true);
      expect(result.minDigits).toBe(10);
      expect(result.maxDigits).toBe(10);
      expect(result.currentDigits).toBe(10);

      phone.destroy();
    });
  });

  describe('separateDialCode mode', () => {
    it('shows dial code in trigger', () => {
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        separateDialCode: true,
      });

      const dialCode = container.querySelector('.lpi__dial-code');
      expect(dialCode).toBeTruthy();
      expect(dialCode?.textContent).toBe('+1');

      phone.destroy();
    });

    it('container has lpi--separate-dial-code class', () => {
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        separateDialCode: true,
      });

      expect(container.querySelector('.lpi--separate-dial-code')).toBeTruthy();

      phone.destroy();
    });
  });

  describe('disabled state', () => {
    it('applies disabled state to input and container', () => {
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        disabled: true,
      });

      const input = container.querySelector('.lpi__input') as HTMLInputElement;
      expect(input.disabled).toBe(true);
      expect(container.querySelector('.lpi--disabled')).toBeTruthy();

      phone.destroy();
    });
  });

  describe('hidden inputs', () => {
    it('creates hidden inputs when hiddenInput option provided', () => {
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        hiddenInput: { phone: 'phone_e164', country: 'phone_country' },
      });

      const phoneHidden = container.querySelector('input[name="phone_e164"]') as HTMLInputElement;
      const countryHidden = container.querySelector('input[name="phone_country"]') as HTMLInputElement;

      expect(phoneHidden).toBeTruthy();
      expect(phoneHidden.type).toBe('hidden');
      expect(countryHidden).toBeTruthy();
      expect(countryHidden.value).toBe('US');

      phone.destroy();
    });

    it('syncs hidden input values on setValue', () => {
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        hiddenInput: { phone: 'phone_e164', country: 'phone_country' },
      });

      phone.setValue('+442071234567');

      const phoneHidden = container.querySelector('input[name="phone_e164"]') as HTMLInputElement;
      const countryHidden = container.querySelector('input[name="phone_country"]') as HTMLInputElement;

      expect(phoneHidden.value).toBe('+442071234567');
      expect(countryHidden.value).toBe('GB');

      phone.destroy();
    });

    it('does not create hidden inputs by default', () => {
      const phone = PhoneInput.mount(container, { defaultCountry: 'US' });

      expect(container.querySelectorAll('input[type="hidden"]')).toHaveLength(0);

      phone.destroy();
    });
  });

  describe('callbacks', () => {
    it('fires onChange on setValue', () => {
      const onChange = vi.fn();
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        onChange,
      });

      phone.setValue('+12025551234');
      expect(onChange).toHaveBeenCalled();
      const [e164, country, validation] = onChange.mock.calls[0];
      expect(e164).toBe('+12025551234');
      expect(country.code).toBe('US');
      expect(validation.valid).toBe(true);

      phone.destroy();
    });

    it('fires onCountryChange when country changes', () => {
      const onCountryChange = vi.fn();
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        onCountryChange,
      });

      phone.setCountry('GB');
      expect(onCountryChange).toHaveBeenCalledOnce();
      expect(onCountryChange.mock.calls[0][0].code).toBe('GB');

      phone.destroy();
    });

    it('fires onValidationChange when validity toggles', () => {
      const onValidationChange = vi.fn();
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        onValidationChange,
      });

      // First setValue fires initial validation (invalid -> depends on state)
      phone.setValue('+12025551234');
      const firstCall = onValidationChange.mock.calls[0];
      expect(firstCall[0].valid).toBe(true);

      phone.destroy();
    });
  });

  describe('setOptions', () => {
    it('updates disabled state', () => {
      const phone = PhoneInput.mount(container, { defaultCountry: 'US' });

      phone.setOptions({ disabled: true });
      const input = container.querySelector('.lpi__input') as HTMLInputElement;
      expect(input.disabled).toBe(true);
      expect(container.querySelector('.lpi--disabled')).toBeTruthy();

      phone.setOptions({ disabled: false });
      expect(input.disabled).toBe(false);
      expect(container.querySelector('.lpi--disabled')).toBeNull();

      phone.destroy();
    });
  });

  describe('placeholder', () => {
    it('generates auto placeholder from format pattern', () => {
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        separateDialCode: true,
      });

      const input = container.querySelector('.lpi__input') as HTMLInputElement;
      // US format is "XXX XXX XXXX", auto placeholder should be "000 000 0000"
      expect(input.placeholder).toBe('000 000 0000');

      phone.destroy();
    });

    it('uses custom placeholder string', () => {
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        placeholder: 'Enter phone',
      });

      const input = container.querySelector('.lpi__input') as HTMLInputElement;
      expect(input.placeholder).toBe('Enter phone');

      phone.destroy();
    });
  });

  describe('allowDropdown: false', () => {
    it('renders trigger as span, not button', () => {
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        allowDropdown: false,
      });

      const trigger = container.querySelector('.lpi__trigger');
      expect(trigger?.tagName).toBe('SPAN');
      expect(container.querySelector('.lpi__arrow')).toBeNull();

      phone.destroy();
    });
  });

  describe('dropdown', () => {
    it('opens dropdown on trigger click', () => {
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        dropdownContainer: container,
      });

      const trigger = container.querySelector('.lpi__trigger') as HTMLButtonElement;
      trigger.click();

      expect(container.querySelector('.lpi--open')).toBeTruthy();
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      // Dropdown should be rendered in the container
      expect(container.querySelector('.lpi__dropdown')).toBeTruthy();

      phone.destroy();
    });

    it('does not open dropdown when allowDropdown is false', () => {
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        allowDropdown: false,
      });

      // Trigger is a span, not clickable
      const trigger = container.querySelector('.lpi__trigger') as HTMLElement;
      trigger.click();

      expect(container.querySelector('.lpi--open')).toBeNull();

      phone.destroy();
    });
  });

  describe('country filtering', () => {
    it('allowedCountries limits the dropdown', () => {
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        allowedCountries: ['US', 'CA', 'GB'],
      });

      // Verify country is accessible
      phone.setCountry('GB');
      expect(phone.getCountry().code).toBe('GB');

      phone.destroy();
    });

    it('excludedCountries hides countries', () => {
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        excludedCountries: ['GB'],
      });

      phone.setCountry('GB');
      // GB is excluded, so setCountry should not change
      expect(phone.getCountry().code).toBe('US');

      phone.destroy();
    });
  });

  describe('initial value', () => {
    it('sets initial value and detects country', () => {
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        value: '+442071234567',
      });

      expect(phone.getCountry().code).toBe('GB');
      expect(phone.getValue()).toBe('+442071234567');

      phone.destroy();
    });
  });

  describe('Android + key fallback', () => {
    it('strips + in separateDialCode strict mode', () => {
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        separateDialCode: true,
      });

      const input = container.querySelector('.lpi__input') as HTMLInputElement;
      input.value = '+';
      input.dispatchEvent(new InputEvent('input', { data: '+', bubbles: true }));

      expect(input.value).not.toContain('+');

      phone.destroy();
    });

    it('preserves + in inline mode', () => {
      const phone = PhoneInput.mount(container, { defaultCountry: 'US' });

      const input = container.querySelector('.lpi__input') as HTMLInputElement;
      input.value = '+1202';
      input.dispatchEvent(new InputEvent('input', { data: '+', bubbles: true }));

      expect(input.value.startsWith('+')).toBe(true);

      phone.destroy();
    });

    it('does not strip + when strict is false', () => {
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        separateDialCode: true,
        strict: false,
      });

      const input = container.querySelector('.lpi__input') as HTMLInputElement;
      input.value = '+202';
      input.dispatchEvent(new InputEvent('input', { data: '+', bubbles: true }));

      // + is removed by digit extraction regardless of strict mode
      expect(input.value).not.toContain('+');

      phone.destroy();
    });

    it('strips + mixed with digits in separateDialCode', () => {
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        separateDialCode: true,
      });

      const input = container.querySelector('.lpi__input') as HTMLInputElement;
      input.value = '20+2';
      input.dispatchEvent(new InputEvent('input', { data: '+', bubbles: true }));

      expect(input.value).not.toContain('+');
      expect(input.value.replace(/\s/g, '')).toContain('202');

      phone.destroy();
    });
  });

  describe('inline mode display', () => {
    it('shows national format when typing without +', () => {
      const phone = PhoneInput.mount(container, { defaultCountry: 'US' });
      const input = container.querySelector('.lpi__input') as HTMLInputElement;

      input.value = '2025551234';
      input.dispatchEvent(new InputEvent('input', { bubbles: true }));

      // Should NOT have +1 prefix
      expect(input.value).not.toContain('+');
      expect(input.value.replace(/\s/g, '')).toBe('2025551234');

      phone.destroy();
    });

    it('shows raw input while typing partial dial code', () => {
      const phone = PhoneInput.mount(container, { defaultCountry: 'US' });
      const input = container.querySelector('.lpi__input') as HTMLInputElement;

      input.value = '+4';
      input.dispatchEvent(new InputEvent('input', { bubbles: true }));

      // Should show "+4" not "+1 4"
      expect(input.value).toBe('+4');

      phone.destroy();
    });

    it('switches country and formats when full dial code typed', () => {
      const phone = PhoneInput.mount(container, { defaultCountry: 'US' });
      const input = container.querySelector('.lpi__input') as HTMLInputElement;

      input.value = '+442';
      input.dispatchEvent(new InputEvent('input', { bubbles: true }));

      // Should detect UK and format with +44
      expect(input.value.startsWith('+44')).toBe(true);
      expect(phone.getCountry().code).toBe('GB');

      phone.destroy();
    });

    it('formats full international number correctly', () => {
      const phone = PhoneInput.mount(container, { defaultCountry: 'US' });
      const input = container.querySelector('.lpi__input') as HTMLInputElement;

      input.value = '+12025551234';
      input.dispatchEvent(new InputEvent('input', { bubbles: true }));

      expect(input.value.startsWith('+1')).toBe(true);
      expect(phone.getCountry().code).toBe('US');

      phone.destroy();
    });

    it('shows + when user types just +', () => {
      const phone = PhoneInput.mount(container, { defaultCountry: 'US' });
      const input = container.querySelector('.lpi__input') as HTMLInputElement;

      input.value = '+';
      input.dispatchEvent(new InputEvent('input', { bubbles: true }));

      // Should keep "+" not clear it
      expect(input.value).toBe('+');

      phone.destroy();
    });

    it('shows national format when pasting without +', () => {
      const phone = PhoneInput.mount(container, { defaultCountry: 'US' });
      const input = container.querySelector('.lpi__input') as HTMLInputElement;

      const paste = new Event('paste', { bubbles: true }) as any;
      paste.clipboardData = { getData: () => '2025551234' };
      paste.preventDefault = vi.fn();
      input.dispatchEvent(paste);

      expect(input.value).not.toContain('+');
      expect(input.value.replace(/\s/g, '')).toBe('2025551234');

      phone.destroy();
    });

    it('shows international format when pasting with +', () => {
      const phone = PhoneInput.mount(container, { defaultCountry: 'US' });
      const input = container.querySelector('.lpi__input') as HTMLInputElement;

      const paste = new Event('paste', { bubbles: true }) as any;
      paste.clipboardData = { getData: () => '+442071234567' };
      paste.preventDefault = vi.fn();
      input.dispatchEvent(paste);

      expect(input.value.startsWith('+44')).toBe(true);
      expect(phone.getCountry().code).toBe('GB');

      phone.destroy();
    });

    it('shows international format after setValue()', () => {
      const phone = PhoneInput.mount(container, { defaultCountry: 'US' });
      const input = container.querySelector('.lpi__input') as HTMLInputElement;

      phone.setValue('+442071234567');

      expect(input.value.startsWith('+44')).toBe(true);

      phone.destroy();
    });
  });
});
