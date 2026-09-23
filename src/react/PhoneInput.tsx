import { createElement, forwardRef, useEffect, useImperativeHandle, useRef, type InputHTMLAttributes } from 'react';
import { dynamicOptionKeys, syncInputProps, type NativeInputAttributes } from '../adapters/props';
import type { PhoneInputOptions, ValidationResult } from '../core/types';
import { PhoneInput as VanillaPhoneInput } from '../vanilla/phone-input';

export interface PhoneInputRef {
  focus(): void;
  reset(): void;
  getInput(): HTMLInputElement | null;
  getValue(): string;
  getNationalNumber(): string;
  getCountry(): { code: string; dialCode: string; name: string };
  setValue(e164: string): void;
  setCountry(code: string): void;
  isValid(): boolean;
  validate(): ValidationResult;
}

type WidgetProps = Omit<PhoneInputOptions, 'inputAttributes'>;

type InputAttrs = Omit<NativeInputAttributes<InputHTMLAttributes<HTMLInputElement>>, keyof WidgetProps | 'value' | 'defaultValue' | 'children'>;

export type PhoneInputProps = WidgetProps & InputAttrs;

export const PhoneInput = forwardRef<PhoneInputRef, PhoneInputProps>(
  function PhoneInput(props, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<VanillaPhoneInput | null>(null);
    const propsRef = useRef(props);
    const prevInputPropsRef = useRef<Record<string, unknown>>({});
    const prevOptsRef = useRef<Record<string, unknown>>({});
    propsRef.current = props;

    useEffect(() => {
      if (!containerRef.current) return;

      const p = propsRef.current;

      const options: PhoneInputOptions = {
        defaultCountry: p.defaultCountry,
        allowedCountries: p.allowedCountries,
        excludedCountries: p.excludedCountries,
        preferredCountries: p.preferredCountries,
        allowDropdown: p.allowDropdown,
        formatAsYouType: p.formatAsYouType,
        strict: p.strict,
        separateDialCode: p.separateDialCode,
        nationalMode: p.nationalMode,
        placeholder: p.placeholder,
        disabled: p.disabled,
        locale: p.locale,
        renderFlag: p.renderFlag,
        hiddenInput: p.hiddenInput,
        containerClass: p.containerClass,
        dropdownContainer: p.dropdownContainer,
        geoIpLookup: p.geoIpLookup,
        initialValue: p.initialValue,
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
      prevOptsRef.current = Object.fromEntries(dynamicOptionKeys.map(key => [key, p[key]]));
      prevInputPropsRef.current = syncInputProps(instanceRef.current.getInput(), p as unknown as Record<string, unknown>, {});

      return () => {
        if (instanceRef.current) syncInputProps(instanceRef.current.getInput(), {}, prevInputPropsRef.current);
        prevInputPropsRef.current = {};
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

      for (const key of dynamicOptionKeys) {
        if (props[key] !== prevOptsRef.current[key]) {
          (opts as Record<string, unknown>)[key] = props[key];
          hasChanges = true;
        }
      }

      // Track current values for next comparison
      const currentOpts: Record<string, unknown> = {};
      for (const key of dynamicOptionKeys) {
        currentOpts[key] = props[key];
      }
      prevOptsRef.current = currentOpts;

      prevInputPropsRef.current = syncInputProps(instance.getInput(), props as unknown as Record<string, unknown>, prevInputPropsRef.current);

      if (hasChanges) {
        instance.setOptions(opts);
      }
    });

    useImperativeHandle(ref, () => ({
      focus: () => instanceRef.current?.focus(),
      reset: () => instanceRef.current?.reset(),
      getInput: () => instanceRef.current?.getInput() ?? null,
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

    return createElement('div', { ref: containerRef, className: props.className });
  },
);
