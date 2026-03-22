import { forwardRef, useEffect, useImperativeHandle, useRef, type InputHTMLAttributes } from 'react';
import type { PhoneInputOptions, ValidationResult } from '../core/types';
import { PhoneInput as VanillaPhoneInput } from '../vanilla/phone-input';

export interface PhoneInputRef {
  getValue(): string;
  getNationalNumber(): string;
  getCountry(): { code: string; dialCode: string; name: string };
  setValue(e164: string): void;
  setCountry(code: string): void;
  isValid(): boolean;
  validate(): ValidationResult;
}

type WidgetProps = Omit<PhoneInputOptions, 'inputAttributes'>;

/** Keys that belong to the widget, not to the underlying <input> element */
const WIDGET_KEYS = new Set<string>([
  'defaultCountry', 'allowedCountries', 'excludedCountries', 'preferredCountries',
  'allowDropdown', 'formatAsYouType', 'strict', 'separateDialCode',
  'placeholder', 'disabled', 'locale', 'renderFlag', 'hiddenInput',
  'initialValue', 'containerClass', 'dropdownContainer',
  'onChange', 'onCountryChange', 'onValidationChange', 'onDropdownOpen', 'onDropdownClose',
]);

type InputAttrs = Omit<InputHTMLAttributes<HTMLInputElement>, keyof WidgetProps>;

export type PhoneInputProps = WidgetProps & InputAttrs;

const DYNAMIC_OPTION_KEYS: (keyof WidgetProps)[] = [
  'disabled', 'allowedCountries', 'excludedCountries', 'preferredCountries',
  'allowDropdown', 'formatAsYouType', 'strict', 'separateDialCode',
  'placeholder', 'locale', 'renderFlag',
];

function extractInputAttrs(props: PhoneInputProps): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const [key, val] of Object.entries(props)) {
    if (!WIDGET_KEYS.has(key) && key !== 'className' && val !== undefined) {
      attrs[key] = String(val);
    }
  }
  return attrs;
}

export const PhoneInput = forwardRef<PhoneInputRef, PhoneInputProps>(
  function PhoneInput(props, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<VanillaPhoneInput | null>(null);
    const propsRef = useRef(props);
    const prevOptsRef = useRef<Record<string, unknown>>({});
    propsRef.current = props;

    useEffect(() => {
      if (!containerRef.current) return;

      const p = propsRef.current;
      const inputAttributes = extractInputAttrs(p);

      const options: PhoneInputOptions = {
        defaultCountry: p.defaultCountry,
        allowedCountries: p.allowedCountries,
        excludedCountries: p.excludedCountries,
        preferredCountries: p.preferredCountries,
        allowDropdown: p.allowDropdown,
        formatAsYouType: p.formatAsYouType,
        strict: p.strict,
        separateDialCode: p.separateDialCode,
        placeholder: p.placeholder,
        disabled: p.disabled,
        locale: p.locale,
        renderFlag: p.renderFlag,
        hiddenInput: p.hiddenInput,
        containerClass: p.containerClass,
        dropdownContainer: p.dropdownContainer,
        initialValue: p.initialValue,
        inputAttributes,
        // Callbacks read from ref so they always use the latest version
        onChange: (e164, country, validation) =>
          propsRef.current.onChange?.(e164, country, validation),
        onCountryChange: (country) =>
          propsRef.current.onCountryChange?.(country),
        onValidationChange: (validation) =>
          propsRef.current.onValidationChange?.(validation),
        onDropdownOpen: () => propsRef.current.onDropdownOpen?.(),
        onDropdownClose: () => propsRef.current.onDropdownClose?.(),
      };

      instanceRef.current = VanillaPhoneInput.mount(containerRef.current, options);

      return () => {
        instanceRef.current?.destroy();
        instanceRef.current = null;
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync changed props to the vanilla widget
    useEffect(() => {
      if (!instanceRef.current) return;

      const instance = instanceRef.current;

      // Collect only the dynamic options that actually changed
      const opts: Partial<PhoneInputOptions> = {};
      let hasChanges = false;

      for (const key of DYNAMIC_OPTION_KEYS) {
        if (props[key] !== undefined && props[key] !== prevOptsRef.current[key]) {
          (opts as Record<string, unknown>)[key] = props[key];
          hasChanges = true;
        }
      }

      // Track current values for next comparison
      const currentOpts: Record<string, unknown> = {};
      for (const key of DYNAMIC_OPTION_KEYS) {
        currentOpts[key] = props[key];
      }
      prevOptsRef.current = currentOpts;

      // Always sync input attributes (cheap to set, hard to diff)
      opts.inputAttributes = extractInputAttrs(props);

      if (hasChanges) {
        instance.setOptions(opts);
      }
    });

    useImperativeHandle(ref, () => ({
      getValue: () => instanceRef.current?.getValue() ?? '',
      getNationalNumber: () => instanceRef.current?.getNationalNumber() ?? '',
      getCountry: () =>
        instanceRef.current?.getCountry() ?? { code: '', dialCode: '', name: '' },
      setValue: (e164: string) => instanceRef.current?.setValue(e164),
      setCountry: (code: string) => instanceRef.current?.setCountry(code),
      isValid: () => instanceRef.current?.isValid() ?? false,
      validate: () =>
        instanceRef.current?.validate() ?? {
          valid: false,
          minDigits: 0,
          maxDigits: 0,
          currentDigits: 0,
        },
    }));

    return <div ref={containerRef} className={props.className} />;
  },
);
