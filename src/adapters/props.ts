import type { PhoneInputOptions } from '../core/types';

export const dynamicOptionKeys = [
  'disabled', 'allowedCountries', 'excludedCountries', 'preferredCountries',
  'allowDropdown', 'formatAsYouType', 'strict', 'separateDialCode', 'nationalMode',
  'placeholder', 'locale', 'renderFlag',
] as const satisfies readonly (keyof PhoneInputOptions)[];
const widgetKeys = new Set<string>([
  ...dynamicOptionKeys, 'defaultCountry', 'hiddenInput', 'initialValue', 'containerClass',
  'dropdownContainer', 'geoIpLookup', 'onChange', 'onCountryChange', 'onValidationChange',
  'onDropdownOpen', 'onDropdownClose', 'class', 'className', 'children', 'ref', 'key',
  'value', 'defaultValue', 'dangerouslySetInnerHTML',
]);
const booleanAttributes = new Set(['required', 'readonly', 'multiple', 'autofocus', 'hidden', 'disabled', 'inert', 'formnovalidate', 'checked']);
const attributeNames: Record<string, string> = { readOnly: 'readonly', formNoValidate: 'formnovalidate', autoFocus: 'autofocus', tabIndex: 'tabindex', maxLength: 'maxlength', minLength: 'minlength', autoComplete: 'autocomplete', inputMode: 'inputmode' };
const unitless = new Set(['opacity', 'zIndex', 'fontWeight', 'lineHeight', 'flex', 'flexGrow', 'flexShrink', 'order', 'zoom']);

/** Native listeners are deliberately not serialized into HTML attributes. */
export function syncInputProps(input: HTMLInputElement, props: Record<string, unknown>, previous: Record<string, unknown>): Record<string, unknown> {
  const next = Object.fromEntries(Object.entries(props).filter(([key]) => !widgetKeys.has(key)));
  for (const key of new Set([...Object.keys(previous), ...Object.keys(next)])) {
    const value = next[key];
    if (value === previous[key]) continue;
    if (/^on[A-Z]/.test(key)) {
      const capture = key.endsWith('Capture');
      const name = key.slice(2, capture ? -7 : undefined).toLowerCase();
      const event = name === 'doubleclick' ? 'dblclick' : name;
      if (typeof previous[key] === 'function') input.removeEventListener(event, previous[key] as EventListener, capture);
      if (typeof value === 'function') input.addEventListener(event, value as EventListener, capture);
      continue;
    }
    if (key === 'style') {
      input.removeAttribute('style');
      if (typeof value === 'string') input.style.cssText = value;
      else if (value && typeof value === 'object') {
        for (const [property, cssValue] of Object.entries(value)) {
          if (cssValue == null) continue;
          const cssName = property.startsWith('--') ? property : property.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);
          input.style.setProperty(cssName, typeof cssValue === 'number' && cssValue !== 0 && !unitless.has(property) && !property.startsWith('--') ? `${cssValue}px` : String(cssValue));
        }
      }
      continue;
    }
    const attribute = attributeNames[key] ?? key;
    if (value == null || (booleanAttributes.has(attribute) && value === false)) input.removeAttribute(attribute);
    else if (typeof value !== 'function' && typeof value !== 'object') input.setAttribute(attribute, booleanAttributes.has(attribute) ? '' : String(value));
    if (key === 'autoFocus' && value) input.focus();
  }
  return next;
}

/** Framework adapters attach DOM listeners; do not advertise SyntheticEvent methods. */
export type NativeInputAttributes<T> = {
  [K in keyof T]: K extends `on${string}`
    ? NonNullable<T[K]> extends (event: infer E) => unknown
      ? E extends { nativeEvent: infer N extends Event }
        ? (event: N & { currentTarget: HTMLInputElement }) => void
        : T[K]
      : T[K]
    : T[K];
};
