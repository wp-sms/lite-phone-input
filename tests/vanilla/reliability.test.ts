import { afterEach, describe, expect, it, vi } from 'vitest';
import { PhoneInput } from '../../src/vanilla/phone-input';
import type { PhoneInputOptions } from '../../src/core/types';

const instances: PhoneInput[] = [];
afterEach(() => { instances.splice(0).forEach(p => p.destroy()); document.body.replaceChildren(); });
function mount(options: Partial<PhoneInputOptions> = {}, parent: ParentNode = document.body) {
  const el = document.createElement('div'); parent.appendChild(el);
  const phone = PhoneInput.mount(el, { defaultCountry: 'US', ...options }); instances.push(phone);
  return { phone, el, input: el.querySelector<HTMLInputElement>('input[type=tel]')!, trigger: el.querySelector<HTMLButtonElement>('button')! };
}
function inputValue(input: HTMLInputElement, value: string) {
  input.value = value;
  input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertReplacementText' }));
}
function paste(input: HTMLInputElement, value: string) {
  const event = new Event('paste', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'clipboardData', { value: { getData: () => value } });
  input.dispatchEvent(event);
}

describe('number preservation', () => {
  for (const mode of [{ separateDialCode: true }, { nationalMode: true }, {}]) {
    for (const strict of [true, false]) {
      it(`parses international replacements: ${JSON.stringify(mode)}, strict=${strict}`, () => {
        const { phone, input } = mount({ ...mode, strict });
        inputValue(input, '  ۰۰۴۴۷۴۰۰۱۲۳۴۵۶ ');
        expect(phone.getValue()).toBe('+447400123456');
        expect(phone.getCountry().code).toBe('GB');
        expect(phone.isValid()).toBe(true);
      });
    }
  }
  for (const path of ['input', 'paste', 'setValue'] as const) {
    it(`preserves a disallowed international number via ${path}`, () => {
      const { phone, input } = mount({ allowedCountries: ['US'], separateDialCode: true });
      if (path === 'input') inputValue(input, '+447400123456');
      else if (path === 'paste') paste(input, '+447400123456');
      else phone.setValue('+447400123456');
      expect(phone.getValue()).toBe('+447400123456');
      expect(input.value).toBe('+447400123456');
      expect(phone.validate()).toMatchObject({ valid: false, reason: 'invalid_country' });
      phone.setOptions({ allowedCountries: ['US', 'GB'] });
      expect(phone.getCountry().code).toBe('GB');
      expect(phone.isValid()).toBe(true);
    });
  }
  it('does not truncate an explicit international replacement', () => {
    const { phone, input } = mount({ separateDialCode: true });
    inputValue(input, '+120255512345');
    expect(phone.getValue()).toBe('+120255512345');
    expect(phone.validate().reason).toBe('too_long');
  });
  it('geo-IP never overwrites an initial value or explicit API choice', () => {
    let callback!: (code: string | null) => void;
    const { phone } = mount({ initialValue: '+447400123456', geoIpLookup: cb => { callback = cb; } });
    callback('US'); expect(phone.getValue()).toBe('+447400123456');
    const next = mount({ geoIpLookup: cb => { callback = cb; } });
    next.phone.setCountry('GB'); callback('US'); expect(next.phone.getCountry().code).toBe('GB');
    const third = mount({ geoIpLookup: cb => { callback = cb; } });
    third.phone.setValue('+447400123456'); callback('US'); expect(third.phone.getValue()).toBe('+447400123456');
  });
  it('pastes local digits at the selection', () => {
    const { phone, input } = mount({ separateDialCode: true, initialValue: '+12025551234' });
    input.setSelectionRange(4, 7); paste(input, '999');
    expect(phone.getValue()).toBe('+12029991234');
    expect(input.selectionStart).toBe(7);
  });
});

describe('form lifecycle', () => {
  it('resets display, value, country and hidden inputs to the initial state', async () => {
    const form = document.createElement('form'); document.body.append(form);
    const onChange = vi.fn();
    const { phone, input } = mount({ initialValue: '+12025551234', hiddenInput: { phone: 'phone', country: 'country' }, onChange }, form);
    phone.setValue('+447400123456'); form.reset(); await new Promise(resolve => setTimeout(resolve, 0));
    expect(phone.getValue()).toBe('+12025551234');
    expect(input.value).toBe('+1 202 555 1234');
    expect(Object.fromEntries(new FormData(form))).toEqual({ phone: '+12025551234', country: 'US' });
    expect(onChange.mock.lastCall?.[0]).toBe('+12025551234');
  });
  it('respects canceled reset events', async () => {
    const form = document.createElement('form'); document.body.append(form);
    const { phone } = mount({ initialValue: '+12025551234' }, form);
    form.addEventListener('reset', e => e.preventDefault());
    phone.setValue('+447400123456'); form.reset(); await new Promise(resolve => setTimeout(resolve, 0));
    expect(phone.getValue()).toBe('+447400123456');
  });
});

describe('dropdown lifecycle', () => {
  for (const mode of ['open', 'closed'] as const) {
    it(`supports inside and outside clicks in a ${mode} shadow root`, () => {
      const host = document.createElement('div'); document.body.append(host);
      const shadow = host.attachShadow({ mode });
      const portal = document.createElement('div'); shadow.append(portal);
      const { el, trigger, phone } = mount({ dropdownContainer: portal }, shadow);
      trigger.click();
      portal.querySelector('.lpi__search')!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true }));
      expect(portal.querySelector('.lpi__dropdown')).not.toBeNull();
      (portal.querySelector('[data-code=GB]') as HTMLElement).click();
      expect(phone.getCountry().code).toBe('GB');
      trigger.click();
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true }));
      expect(portal.querySelector('.lpi__dropdown')).toBeNull();
      trigger.click();
      document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true }));
      expect(portal.querySelector('.lpi__dropdown')).toBeNull();
    });
  }
  it('refreshes visible countries and cannot select a removed country', () => {
    const { phone, trigger } = mount({ allowedCountries: ['US', 'GB'] }); trigger.click();
    phone.setOptions({ allowedCountries: ['US'] });
    expect(document.querySelector('[data-code=GB]')).toBeNull();
    expect(document.querySelectorAll('.lpi__option')).toHaveLength(1);
  });
  it('preserves the number when filters remove its country', () => {
    const { phone } = mount({ initialValue: '+447400123456' });
    phone.setOptions({ allowedCountries: ['US'] });
    expect(phone.getValue()).toBe('+447400123456');
    expect(phone.validate().reason).toBe('invalid_country');
  });
  it.each([{ disabled: true }, { allowDropdown: false }])('closes on option update %j', options => {
    const { phone, trigger } = mount(); trigger.click(); phone.setOptions(options);
    expect(document.querySelector('.lpi__dropdown')).toBeNull();
  });
  it('rejects empty filters without damaging an existing instance', () => {
    expect(() => mount({ allowedCountries: ['XX'] })).toThrow(/at least one country/i);
    const { phone } = mount();
    expect(() => phone.setOptions({ allowedCountries: ['US'], excludedCountries: ['US'] })).toThrow(/at least one country/i);
    phone.setCountry('GB'); expect(phone.getCountry().code).toBe('GB');
  });
  it('links the trigger to a named dialog and provides a close button', () => {
    const { trigger } = mount(); trigger.click();
    const dialog = document.querySelector('.lpi__dropdown')!;
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger.getAttribute('aria-controls')).toBe(dialog.id);
    expect(document.querySelector('.lpi__search')?.getAttribute('aria-label')).toBe('Search countries');
    (dialog.querySelector('button[aria-label="Close country selector"]') as HTMLElement).click();
    expect(document.querySelector('.lpi__dropdown')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});

describe('incremental editing', () => {
  it('keeps a complete dial code visible before the national number is typed', () => {
    const { phone, input } = mount();
    for (const value of ['+', '+4', '+44', '+447']) {
      inputValue(input, value);
      expect(input.value.replace(/\s/g, '')).toBe(value);
    }
    expect(phone.getCountry().code).toBe('GB');
    phone.setValue(''); expect(input.value).toBe('');
  });
  it('does not select a country when Enter activates the Close button', () => {
    const { trigger, phone } = mount(); trigger.click();
    const close = document.querySelector<HTMLButtonElement>('.lpi__close')!;
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    close.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    close.click(); expect(document.querySelector('.lpi__dropdown')).toBeNull();
    expect(phone.getCountry().code).toBe('US');
  });
});

describe('reset ownership', () => {
  it('keeps a value explicitly set after native reset', async () => {
    const form = document.createElement('form'); document.body.append(form);
    const { phone, input } = mount({ initialValue: '+12025551234' }, form);
    form.reset(); phone.setValue('+447400123456');
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(phone.getValue()).toBe('+447400123456');
    expect(input.value).toBe('+44 7400 123456');
  });
  it('observes form associations applied after mount', async () => {
    const form = document.createElement('form'); form.id = 'external-form'; document.body.append(form);
    const { phone } = mount({ initialValue: '+12025551234' });
    phone.setOptions({ inputAttributes: { form: 'external-form' } });
    phone.setValue('+447400123456'); form.reset();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(phone.getValue()).toBe('+12025551234');
  });
});

it('notifies a reset when only the country code changed', () => {
  const onChange = vi.fn();
  const { phone } = mount({ initialValue: '+12025551234', onChange });
  phone.setCountry('GB'); onChange.mockClear(); phone.reset();
  expect(onChange).toHaveBeenCalledOnce();
  expect(onChange.mock.calls[0][0]).toBe('+12025551234');
});
