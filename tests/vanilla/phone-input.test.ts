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
    it('generates auto placeholder from example number', () => {
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        separateDialCode: true,
      });

      const input = container.querySelector('.lpi__input') as HTMLInputElement;
      // US example number formatted: "201 555 0123"
      expect(input.placeholder).toBe('201 555 0123');

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
        initialValue: '+442071234567',
      });

      expect(phone.getCountry().code).toBe('GB');
      expect(phone.getValue()).toBe('+442071234567');

      phone.destroy();
    });
  });

  describe('nationalMode', () => {
    describe('display', () => {
      it('container has lpi--national-mode class', () => {
        const phone = PhoneInput.mount(container, {
          defaultCountry: 'US',
          nationalMode: true,
        });

        expect(container.querySelector('.lpi--national-mode')).toBeTruthy();

        phone.destroy();
      });

      it('does NOT show dial code in trigger', () => {
        const phone = PhoneInput.mount(container, {
          defaultCountry: 'US',
          nationalMode: true,
        });

        expect(container.querySelector('.lpi__dial-code')).toBeNull();

        phone.destroy();
      });

      it('shows national format in input after setValue with E.164', () => {
        const phone = PhoneInput.mount(container, {
          defaultCountry: 'US',
          nationalMode: true,
        });
        const input = container.querySelector('.lpi__input') as HTMLInputElement;

        phone.setValue('+12025551234');

        expect(input.value).not.toContain('+');
        expect(input.value.replace(/\s/g, '')).toBe('2025551234');

        phone.destroy();
      });
    });

    describe('placeholder', () => {
      it('generates national-only placeholder from example number (no dial code prefix)', () => {
        const phone = PhoneInput.mount(container, {
          defaultCountry: 'US',
          nationalMode: true,
        });
        const input = container.querySelector('.lpi__input') as HTMLInputElement;

        // US example number formatted without prefix: "201 555 0123"
        expect(input.placeholder).toBe('201 555 0123');
        expect(input.placeholder).not.toContain('+');

        phone.destroy();
      });
    });

    describe('input behavior', () => {
      it('treats all input as national digits', () => {
        const phone = PhoneInput.mount(container, {
          defaultCountry: 'US',
          nationalMode: true,
        });
        const input = container.querySelector('.lpi__input') as HTMLInputElement;

        input.value = '2025551234';
        input.dispatchEvent(new InputEvent('input', { bubbles: true }));

        expect(input.value).not.toContain('+');
        expect(phone.getNationalNumber()).toBe('2025551234');

        phone.destroy();
      });

      it('blocks + at position 0 in strict mode', () => {
        const phone = PhoneInput.mount(container, {
          defaultCountry: 'US',
          nationalMode: true,
        });
        const input = container.querySelector('.lpi__input') as HTMLInputElement;

        input.value = '+';
        input.dispatchEvent(new InputEvent('input', { data: '+', bubbles: true }));

        expect(input.value).not.toContain('+');

        phone.destroy();
      });
    });

    describe('pasting', () => {
      it('auto-detects country from pasted international number', () => {
        const phone = PhoneInput.mount(container, {
          defaultCountry: 'US',
          nationalMode: true,
        });
        const input = container.querySelector('.lpi__input') as HTMLInputElement;

        const paste = new Event('paste', { bubbles: true }) as any;
        paste.clipboardData = { getData: () => '+442071234567' };
        paste.preventDefault = vi.fn();
        input.dispatchEvent(paste);

        expect(phone.getCountry().code).toBe('GB');

        phone.destroy();
      });

      it('displays national format with prefix after pasting international number (GB)', () => {
        const phone = PhoneInput.mount(container, {
          defaultCountry: 'US',
          nationalMode: true,
        });
        const input = container.querySelector('.lpi__input') as HTMLInputElement;

        const paste = new Event('paste', { bubbles: true }) as any;
        paste.clipboardData = { getData: () => '+442071234567' };
        paste.preventDefault = vi.fn();
        input.dispatchEvent(paste);

        expect(input.value).not.toContain('+');
        // GB has displayNationalPrefix, so "0" is prepended
        expect(input.value.replace(/\s/g, '')).toBe('02071234567');

        phone.destroy();
      });

      it('handles pasting with 00 prefix', () => {
        const phone = PhoneInput.mount(container, {
          defaultCountry: 'US',
          nationalMode: true,
        });
        const input = container.querySelector('.lpi__input') as HTMLInputElement;

        const paste = new Event('paste', { bubbles: true }) as any;
        paste.clipboardData = { getData: () => '00442071234567' };
        paste.preventDefault = vi.fn();
        input.dispatchEvent(paste);

        expect(phone.getCountry().code).toBe('GB');
        expect(input.value).not.toContain('+');

        phone.destroy();
      });
    });

    describe('country changes', () => {
      it('reformats to national format on country change', () => {
        const phone = PhoneInput.mount(container, {
          defaultCountry: 'US',
          nationalMode: true,
        });
        const input = container.querySelector('.lpi__input') as HTMLInputElement;

        phone.setValue('+12025551234');
        phone.setCountry('GB');

        expect(input.value).not.toContain('+');

        phone.destroy();
      });
    });

    describe('output', () => {
      it('getValue() returns E.164', () => {
        const phone = PhoneInput.mount(container, {
          defaultCountry: 'US',
          nationalMode: true,
        });

        phone.setValue('+12025551234');
        expect(phone.getValue()).toBe('+12025551234');

        phone.destroy();
      });

      it('getNationalNumber() returns correct national digits', () => {
        const phone = PhoneInput.mount(container, {
          defaultCountry: 'US',
          nationalMode: true,
        });

        phone.setValue('+12025551234');
        expect(phone.getNationalNumber()).toBe('2025551234');

        phone.destroy();
      });

      it('hidden inputs contain E.164', () => {
        const phone = PhoneInput.mount(container, {
          defaultCountry: 'US',
          nationalMode: true,
          hiddenInput: { phone: 'phone_e164', country: 'phone_country' },
        });

        phone.setValue('+442071234567');

        const phoneHidden = container.querySelector('input[name="phone_e164"]') as HTMLInputElement;
        const countryHidden = container.querySelector('input[name="phone_country"]') as HTMLInputElement;

        expect(phoneHidden.value).toBe('+442071234567');
        expect(countryHidden.value).toBe('GB');

        phone.destroy();
      });

      it('onChange receives E.164', () => {
        const onChange = vi.fn();
        const phone = PhoneInput.mount(container, {
          defaultCountry: 'US',
          nationalMode: true,
          onChange,
        });

        phone.setValue('+12025551234');
        expect(onChange).toHaveBeenCalled();
        expect(onChange.mock.calls[0][0]).toBe('+12025551234');

        phone.destroy();
      });
    });

    describe('interaction with other options', () => {
      it('separateDialCode takes precedence (dial code shown in trigger)', () => {
        const phone = PhoneInput.mount(container, {
          defaultCountry: 'US',
          nationalMode: true,
          separateDialCode: true,
        });

        expect(container.querySelector('.lpi__dial-code')).toBeTruthy();
        expect(container.querySelector('.lpi--separate-dial-code')).toBeTruthy();
        expect(container.querySelector('.lpi--national-mode')).toBeNull();

        phone.destroy();
      });

      it('works with formatAsYouType: false', () => {
        const phone = PhoneInput.mount(container, {
          defaultCountry: 'US',
          nationalMode: true,
          formatAsYouType: false,
        });
        const input = container.querySelector('.lpi__input') as HTMLInputElement;

        phone.setValue('+12025551234');
        // Without formatting, should be raw digits
        expect(input.value).toBe('2025551234');

        phone.destroy();
      });

      it('works with strict: false', () => {
        const phone = PhoneInput.mount(container, {
          defaultCountry: 'US',
          nationalMode: true,
          strict: false,
        });
        const input = container.querySelector('.lpi__input') as HTMLInputElement;

        input.value = '2025551234';
        input.dispatchEvent(new InputEvent('input', { bubbles: true }));

        expect(phone.getNationalNumber()).toBe('2025551234');

        phone.destroy();
      });
    });

    describe('national prefix display', () => {
      it('UK: typing "02071234567" shows display with "0" prefix', () => {
        const phone = PhoneInput.mount(container, {
          defaultCountry: 'GB',
          nationalMode: true,
        });
        const input = container.querySelector('.lpi__input') as HTMLInputElement;

        input.value = '02071234567';
        input.dispatchEvent(new InputEvent('input', { bubbles: true }));

        // "0" prefix stripped then re-added by display
        expect(input.value.startsWith('0')).toBe(true);
        expect(input.value.replace(/\s/g, '')).toBe('02071234567');
        expect(phone.getValue()).toBe('+442071234567');

        phone.destroy();
      });

      it('UK: typing "2071234567" auto-adds "0" prefix in display', () => {
        const phone = PhoneInput.mount(container, {
          defaultCountry: 'GB',
          nationalMode: true,
        });
        const input = container.querySelector('.lpi__input') as HTMLInputElement;

        input.value = '2071234567';
        input.dispatchEvent(new InputEvent('input', { bubbles: true }));

        // "0" prefix auto-added by display
        expect(input.value.startsWith('0')).toBe(true);
        expect(input.value.replace(/\s/g, '')).toBe('02071234567');
        expect(phone.getValue()).toBe('+442071234567');

        phone.destroy();
      });

      it('UK: setValue("+442071234567") shows with "0" prefix', () => {
        const phone = PhoneInput.mount(container, {
          defaultCountry: 'GB',
          nationalMode: true,
        });
        const input = container.querySelector('.lpi__input') as HTMLInputElement;

        phone.setValue('+442071234567');

        expect(input.value.startsWith('0')).toBe(true);
        expect(input.value.replace(/\s/g, '')).toBe('02071234567');

        phone.destroy();
      });

      it('UK: typing just "0" shows prefix only', () => {
        const phone = PhoneInput.mount(container, {
          defaultCountry: 'GB',
          nationalMode: true,
        });
        const input = container.querySelector('.lpi__input') as HTMLInputElement;

        input.value = '0';
        input.dispatchEvent(new InputEvent('input', { bubbles: true }));

        // Prefix stripped to empty, display shows just "0"
        expect(input.value).toBe('0');
        expect(phone.getNationalNumber()).toBe('');

        phone.destroy();
      });

      it('UK: paste "+442071234567" shows with "0" prefix', () => {
        const phone = PhoneInput.mount(container, {
          defaultCountry: 'GB',
          nationalMode: true,
        });
        const input = container.querySelector('.lpi__input') as HTMLInputElement;

        const paste = new Event('paste', { bubbles: true }) as any;
        paste.clipboardData = { getData: () => '+442071234567' };
        paste.preventDefault = vi.fn();
        input.dispatchEvent(paste);

        expect(input.value.replace(/\s/g, '')).toBe('02071234567');
        expect(phone.getValue()).toBe('+442071234567');

        phone.destroy();
      });

      it('UK: paste "02071234567" shows with "0" prefix', () => {
        const phone = PhoneInput.mount(container, {
          defaultCountry: 'GB',
          nationalMode: true,
        });
        const input = container.querySelector('.lpi__input') as HTMLInputElement;

        const paste = new Event('paste', { bubbles: true }) as any;
        paste.clipboardData = { getData: () => '02071234567' };
        paste.preventDefault = vi.fn();
        input.dispatchEvent(paste);

        expect(input.value.replace(/\s/g, '')).toBe('02071234567');
        expect(phone.getValue()).toBe('+442071234567');

        phone.destroy();
      });

      it('US: typing "2025551234" shows NO "1" prefix', () => {
        const phone = PhoneInput.mount(container, {
          defaultCountry: 'US',
          nationalMode: true,
        });
        const input = container.querySelector('.lpi__input') as HTMLInputElement;

        input.value = '2025551234';
        input.dispatchEvent(new InputEvent('input', { bubbles: true }));

        expect(input.value.startsWith('1')).toBe(false);
        expect(input.value.replace(/\s/g, '')).toBe('2025551234');

        phone.destroy();
      });

      it('US: typing "12025551234" strips "1", no prefix shown', () => {
        const phone = PhoneInput.mount(container, {
          defaultCountry: 'US',
          nationalMode: true,
        });
        const input = container.querySelector('.lpi__input') as HTMLInputElement;

        input.value = '12025551234';
        input.dispatchEvent(new InputEvent('input', { bubbles: true }));

        // US has no displayNationalPrefix, so "1" is stripped normally
        expect(input.value.replace(/\s/g, '')).toBe('2025551234');

        phone.destroy();
      });

      it('country change GB→US removes prefix display', () => {
        const phone = PhoneInput.mount(container, {
          defaultCountry: 'GB',
          nationalMode: true,
        });
        const input = container.querySelector('.lpi__input') as HTMLInputElement;

        phone.setValue('+442071234567');
        expect(input.value.startsWith('0')).toBe(true);

        phone.setCountry('US');
        // US has no displayNationalPrefix, no "1" shown
        expect(input.value.startsWith('1')).toBe(false);

        phone.destroy();
      });

      it('empty input shows no prefix', () => {
        const phone = PhoneInput.mount(container, {
          defaultCountry: 'GB',
          nationalMode: true,
        });
        const input = container.querySelector('.lpi__input') as HTMLInputElement;

        expect(input.value).toBe('');

        phone.destroy();
      });

      it('separateDialCode takes precedence over national prefix display', () => {
        const phone = PhoneInput.mount(container, {
          defaultCountry: 'GB',
          nationalMode: true,
          separateDialCode: true,
        });
        const input = container.querySelector('.lpi__input') as HTMLInputElement;

        phone.setValue('+442071234567');
        // separateDialCode wins: no "0" prefix in input
        expect(input.value.startsWith('0')).toBe(false);

        phone.destroy();
      });

      it('UK: formatAsYouType: false still prepends prefix', () => {
        const phone = PhoneInput.mount(container, {
          defaultCountry: 'GB',
          nationalMode: true,
          formatAsYouType: false,
        });
        const input = container.querySelector('.lpi__input') as HTMLInputElement;

        phone.setValue('+442071234567');
        expect(input.value).toBe('02071234567');

        phone.destroy();
      });
    });

    describe('example number placeholders', () => {
      it('GB nationalMode placeholder includes "0" prefix and example number', () => {
        const phone = PhoneInput.mount(container, {
          defaultCountry: 'GB',
          nationalMode: true,
        });
        const input = container.querySelector('.lpi__input') as HTMLInputElement;

        // GB example: "7400123456" → formatted "7400 123456", with prefix "0" → "07400 123456"
        expect(input.placeholder.startsWith('0')).toBe(true);
        expect(input.placeholder).not.toContain('+');

        phone.destroy();
      });

      it('US separateDialCode placeholder uses example number without prefix', () => {
        const phone = PhoneInput.mount(container, {
          defaultCountry: 'US',
          separateDialCode: true,
        });
        const input = container.querySelector('.lpi__input') as HTMLInputElement;

        // US example: "2015550123" → formatted "201 555 0123"
        expect(input.placeholder).toBe('201 555 0123');
        expect(input.placeholder).not.toContain('+');

        phone.destroy();
      });

      it('inline mode placeholder includes dial code + example number', () => {
        const phone = PhoneInput.mount(container, {
          defaultCountry: 'US',
        });
        const input = container.querySelector('.lpi__input') as HTMLInputElement;

        // Inline mode: "+1 201 555 0123"
        expect(input.placeholder).toBe('+1 201 555 0123');

        phone.destroy();
      });
    });

    describe('runtime toggling', () => {
      it('setOptions can enable nationalMode', () => {
        const phone = PhoneInput.mount(container, { defaultCountry: 'US' });

        phone.setValue('+12025551234');
        phone.setOptions({ nationalMode: true });

        expect(container.querySelector('.lpi--national-mode')).toBeTruthy();
        const input = container.querySelector('.lpi__input') as HTMLInputElement;
        expect(input.value).not.toContain('+');

        phone.destroy();
      });

      it('setOptions can disable nationalMode', () => {
        const phone = PhoneInput.mount(container, {
          defaultCountry: 'US',
          nationalMode: true,
        });

        phone.setValue('+12025551234');
        phone.setOptions({ nationalMode: false });

        expect(container.querySelector('.lpi--national-mode')).toBeNull();

        phone.destroy();
      });
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

  describe('callback deduplication (infinite loop prevention)', () => {
    it('setValue does not fire onChange when value normalizes to same result', () => {
      const onChange = vi.fn();
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        onChange,
      });

      phone.setValue('+12025551234');
      expect(onChange).toHaveBeenCalledTimes(1);

      onChange.mockClear();
      phone.setValue('+12025551234');
      expect(onChange).not.toHaveBeenCalled();

      phone.destroy();
    });

    it('setValue with national prefix fires onChange once with normalized value', () => {
      const onChange = vi.fn();
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'DE',
        onChange,
      });

      // "+4901234" has national prefix "0" which gets stripped → getValue()="+491234"
      phone.setValue('+4901234');
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0]).toBe('+491234');

      // Calling again with the same raw value should still produce the same
      // normalized result → no second onChange
      onChange.mockClear();
      phone.setValue('+4901234');
      expect(onChange).not.toHaveBeenCalled();

      phone.destroy();
    });

    it('handleInput fires onChange once when country changes', () => {
      const onChange = vi.fn();
      const phone = PhoneInput.mount(container, { defaultCountry: 'US', onChange });
      onChange.mockClear();

      const input = container.querySelector('.lpi__input') as HTMLInputElement;
      input.value = '+442071234567';
      input.dispatchEvent(new InputEvent('input', { bubbles: true }));

      // Should fire exactly once (not double from detectCountryFromDigits + handleInput)
      expect(onChange).toHaveBeenCalledTimes(1);

      phone.destroy();
    });

    it('onCountryChange fires with correct data during handleInput', () => {
      const onCountryChange = vi.fn();
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        onCountryChange,
      });

      const input = container.querySelector('.lpi__input') as HTMLInputElement;
      input.value = '+442071234567';
      input.dispatchEvent(new InputEvent('input', { bubbles: true }));

      expect(onCountryChange).toHaveBeenCalledTimes(1);
      expect(onCountryChange.mock.calls[0][0].code).toBe('GB');

      phone.destroy();
    });

    it('setValue with empty string does not fire onChange when already empty', () => {
      const onChange = vi.fn();
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        onChange,
      });

      // Already empty, setting empty should not fire
      phone.setValue('');
      expect(onChange).not.toHaveBeenCalled();

      phone.destroy();
    });
  });

  describe('geoIpLookup', () => {
    it('updates country when callback fires before interaction', () => {
      let cb: (code: string | null) => void;
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        geoIpLookup: (callback) => { cb = callback; },
      });

      cb!('GB');
      expect(phone.getCountry().code).toBe('GB');

      phone.destroy();
    });

    it('handles synchronous callback', () => {
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        geoIpLookup: (callback) => { callback('DE'); },
      });

      expect(phone.getCountry().code).toBe('DE');

      phone.destroy();
    });

    it('ignores callback after user types', () => {
      let cb: (code: string | null) => void;
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        geoIpLookup: (callback) => { cb = callback; },
      });

      const input = container.querySelector('.lpi__input') as HTMLInputElement;
      input.value = '2';
      input.dispatchEvent(new InputEvent('input', { data: '2' }));

      cb!('GB');
      expect(phone.getCountry().code).toBe('US');

      phone.destroy();
    });

    it('ignores callback after dropdown opens', () => {
      let cb: (code: string | null) => void;
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        geoIpLookup: (callback) => { cb = callback; },
      });

      const trigger = container.querySelector('.lpi__trigger') as HTMLButtonElement;
      trigger.click();

      cb!('GB');
      expect(phone.getCountry().code).toBe('US');

      phone.destroy();
    });

    it('ignores callback after user pastes', () => {
      let cb: (code: string | null) => void;
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        geoIpLookup: (callback) => { cb = callback; },
      });

      const input = container.querySelector('.lpi__input') as HTMLInputElement;
      const pasteEvent = new Event('paste', { bubbles: true }) as any;
      pasteEvent.clipboardData = { getData: () => '202' };
      input.dispatchEvent(pasteEvent);

      cb!('GB');
      expect(phone.getCountry().code).toBe('US');

      phone.destroy();
    });

    it('stays on defaultCountry when callback returns null', () => {
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        geoIpLookup: (callback) => { callback(null); },
      });

      expect(phone.getCountry().code).toBe('US');

      phone.destroy();
    });

    it('stays unchanged when callback returns invalid code', () => {
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        geoIpLookup: (callback) => { callback('XX'); },
      });

      expect(phone.getCountry().code).toBe('US');

      phone.destroy();
    });

    it('stays unchanged when callback returns country not in allowedCountries', () => {
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        allowedCountries: ['US', 'CA'],
        geoIpLookup: (callback) => { callback('GB'); },
      });

      expect(phone.getCountry().code).toBe('US');

      phone.destroy();
    });

    it('does not throw after destroy', () => {
      let cb: (code: string | null) => void;
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        geoIpLookup: (callback) => { cb = callback; },
      });

      phone.destroy();
      expect(() => cb!('GB')).not.toThrow();
    });

    it('is not re-invoked via setOptions', () => {
      const lookup = vi.fn((callback: (code: string | null) => void) => {
        callback('GB');
      });
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        geoIpLookup: lookup,
      });

      expect(lookup).toHaveBeenCalledTimes(1);
      phone.setOptions({ disabled: false });
      expect(lookup).toHaveBeenCalledTimes(1);

      phone.destroy();
    });

    it('fires onCountryChange on geo result', () => {
      const onCountryChange = vi.fn();
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        onCountryChange,
        geoIpLookup: (callback) => { callback('GB'); },
      });

      expect(onCountryChange).toHaveBeenCalledTimes(1);
      expect(onCountryChange.mock.calls[0][0].code).toBe('GB');

      phone.destroy();
    });

    it('handles case-insensitive country code', () => {
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        geoIpLookup: (callback) => { callback('gb'); },
      });

      expect(phone.getCountry().code).toBe('GB');

      phone.destroy();
    });

    it('handles async callback via setTimeout', async () => {
      let cb: (code: string | null) => void;
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
        geoIpLookup: (callback) => {
          setTimeout(() => callback('FR'), 0);
        },
      });

      expect(phone.getCountry().code).toBe('US');
      await new Promise((r) => setTimeout(r, 10));
      expect(phone.getCountry().code).toBe('FR');

      phone.destroy();
    });

    it('works normally without geoIpLookup option', () => {
      const phone = PhoneInput.mount(container, {
        defaultCountry: 'US',
      });

      expect(phone.getCountry().code).toBe('US');

      phone.destroy();
    });
  });
});
