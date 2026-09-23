import type { Country, PhoneInputOptions, ValidationResult } from '../core/types';
import { getAllCountries, getCountryByCode, getFlag } from '../core/countries';
import { formatPhone, getCursorPosition, extractDigits, normalizeNumerals, isNonAsciiDigit } from '../core/format';
import { validatePhone } from '../core/validate';
import { Dropdown } from './dropdown';
import { parsePhoneValue } from '../core/parse';

const isClient = typeof window !== 'undefined';

export class PhoneInput {
  private el: HTMLElement;
  private opts: PhoneInputOptions;
  private countries: Country[];
  private selectedCountry: Country;
  private nationalDigits = '';
  private displayInternational = false;
  private userHasInteracted = false;
  private valueRevision = 0;
  private unsupportedInternational: string | null = null;
  private initialCountryCode: string;
  private initialValue: string;

  private get isNationalInput(): boolean {
    return !!this.opts.separateDialCode || !!this.opts.nationalMode;
  }
  private lastValidation: ValidationResult | null = null;
  private dropdown: Dropdown | null = null;
  private ac: AbortController;

  // DOM references
  private containerEl!: HTMLDivElement;
  private triggerEl!: HTMLButtonElement | HTMLSpanElement;
  private flagEl!: HTMLSpanElement;
  private dialCodeEl: HTMLSpanElement | null = null;
  private arrowEl: HTMLSpanElement | null = null;
  private inputEl!: HTMLInputElement;
  private hiddenPhoneEl: HTMLInputElement | null = null;
  private hiddenCountryEl: HTMLInputElement | null = null;

  private constructor(el: HTMLElement, options: PhoneInputOptions) {
    this.el = el;
    this.opts = { ...options };
    this.ac = new AbortController();

    // Filter countries
    this.countries = this.filterCountries(getAllCountries());

    // Resolve default country
    this.selectedCountry = this.resolveCountry(this.opts.defaultCountry) ?? this.countries[0];
    this.initialCountryCode = this.selectedCountry.code;
    this.initialValue = this.opts.initialValue ?? '';
    this.userHasInteracted = !!this.initialValue;

    if (isClient) {
      this.buildDOM();
      this.attachListeners();

      // Process initial value
      if (this.opts.initialValue) {
        this.setValueInternal(this.opts.initialValue, true);
      }

      this.initialCountryCode = this.selectedCountry.code;
      this.invokeGeoIpLookup();
    }
  }

  static mount(el: HTMLElement, options: PhoneInputOptions): PhoneInput {
    return new PhoneInput(el, options);
  }

  // --- Public API ---

  getValue(): string {
    if (this.unsupportedInternational !== null) return this.unsupportedInternational;
    if (!this.nationalDigits) return '';
    return `+${this.selectedCountry.dialCode}${this.nationalDigits}`;
  }

  getNationalNumber(): string {
    return this.nationalDigits;
  }

  getCountry(): { code: string; dialCode: string; name: string } {
    return {
      code: this.selectedCountry.code,
      dialCode: this.selectedCountry.dialCode,
      name: this.selectedCountry.name,
    };
  }

  setValue(e164: string): void {
    this.valueRevision++;
    this.userHasInteracted = true;
    this.setValueInternal(e164, true);
  }

  getInput(): HTMLInputElement { return this.inputEl; }

  focus(): void { this.inputEl?.focus(); }

  reset(): void {
    this.valueRevision++;
    const previousValue = this.getValue();
    const previousValid = this.validate().valid;
    const country = this.resolveCountry(this.initialCountryCode) ?? this.countries[0];
    this.selectCountry(country, false);
    this.setValueInternal(this.initialValue, true, previousValue, previousValid);
  }

  setCountry(code: string): void {
    this.valueRevision++;
    this.userHasInteracted = true;
    const country = this.resolveCountry(code);
    if (country) this.selectCountry(country, true);
  }

  isValid(): boolean {
    return this.validate().valid;
  }

  validate(): ValidationResult {
    const result = validatePhone(this.nationalDigits, this.selectedCountry);
    return this.unsupportedInternational !== null
      ? { ...result, valid: false, reason: 'invalid_country' } : result;
  }

  setOptions(opts: Partial<PhoneInputOptions>): void {
    const { geoIpLookup: _, ...rest } = opts;
    const prev = this.opts;
    const next = { ...prev, ...rest };
    const filtersChanged = 'allowedCountries' in opts || 'excludedCountries' in opts;
    // Validate before mutating state so a rejected update is atomic.
    const countries = filtersChanged ? this.filterCountries(getAllCountries(), next) : this.countries;
    const previousValue = this.getValue();
    const previousValid = this.validate().valid;
    this.opts = next;
    this.countries = countries;
    if (filtersChanged) {
      if (!this.resolveCountry(this.selectedCountry.code)) {
        this.selectCountry(this.countries[0], false);
      }
      // Reparse the original canonical value, never reinterpret it with the new dial code.
      this.setValueInternal(previousValue, true, previousValue, previousValid);
    }
    if (this.dropdown && (filtersChanged || 'preferredCountries' in opts || 'locale' in opts || 'renderFlag' in opts)) {
      this.dropdown.updateOptions({ countries, preferredCountries: next.preferredCountries ?? [], locale: next.locale, renderFlag: next.renderFlag });
    }
    if ('inputAttributes' in opts) {
      for (const key of Object.keys(prev.inputAttributes ?? {})) {
        if (!(key in (next.inputAttributes ?? {}))) this.inputEl.removeAttribute(key);
      }
      for (const [key, value] of Object.entries(next.inputAttributes ?? {})) this.inputEl.setAttribute(key, value);
    }
    if (next.disabled || next.allowDropdown === false) this.closeDropdown();

    if ('disabled' in opts) {
      this.inputEl.disabled = !!opts.disabled;
      this.containerEl.classList.toggle('lpi--disabled', !!opts.disabled);
      if (this.triggerEl instanceof HTMLButtonElement) {
        this.triggerEl.disabled = !!opts.disabled;
      }
    }

    const displayModeChanged =
      ('separateDialCode' in opts && opts.separateDialCode !== prev.separateDialCode) ||
      ('nationalMode' in opts && opts.nationalMode !== prev.nationalMode);
    if (displayModeChanged) {
      this.updateDisplayMode();
    }

    if ('renderFlag' in opts) {
      this.updateFlag();
    }

    if ('placeholder' in opts) {
      this.updatePlaceholder();
    }

    if ('formatAsYouType' in opts || 'strict' in opts) {
      this.reformatInput();
    }

    if ('allowDropdown' in opts) {
      this.rebuildTrigger();
    }
  }

  destroy(): void {
    this.ac.abort();
    if (this.dropdown) {
      this.dropdown.destroy();
      this.dropdown = null;
    }
    this.el.innerHTML = '';
  }

  private invokeGeoIpLookup(): void {
    const lookup = this.opts.geoIpLookup;
    if (!lookup) return;
    this.opts.geoIpLookup = undefined;
    const signal = this.ac.signal;

    lookup((countryCode) => {
      if (signal.aborted || this.userHasInteracted || !countryCode) return;
      const country = this.resolveCountry(countryCode);
      if (country) {
        this.selectCountry(country, true);
        this.initialCountryCode = country.code;
      }
    });
  }

  // --- DOM Construction ---

  private buildDOM(): void {
    this.containerEl = document.createElement('div');
    this.containerEl.className = 'lpi';
    if (this.opts.containerClass) {
      this.containerEl.className += ` ${this.opts.containerClass}`;
    }
    if (this.opts.separateDialCode) {
      this.containerEl.classList.add('lpi--separate-dial-code');
    }
    if (this.opts.nationalMode && !this.opts.separateDialCode) {
      this.containerEl.classList.add('lpi--national-mode');
    }
    if (this.opts.disabled) {
      this.containerEl.classList.add('lpi--disabled');
    }

    // Build trigger (button or span)
    this.buildTrigger();

    // Build input
    this.inputEl = document.createElement('input');
    this.inputEl.className = 'lpi__input';
    this.inputEl.type = 'tel';
    this.inputEl.inputMode = 'tel';
    this.inputEl.autocomplete = 'tel';
    this.inputEl.dir = 'ltr';
    if (this.opts.disabled) this.inputEl.disabled = true;

    // Spread inputAttributes
    if (this.opts.inputAttributes) {
      for (const [key, value] of Object.entries(this.opts.inputAttributes)) {
        this.inputEl.setAttribute(key, value);
      }
    }

    this.updatePlaceholder();
    this.containerEl.appendChild(this.inputEl);

    // Hidden inputs
    if (this.opts.hiddenInput) {
      if (this.opts.hiddenInput.phone) {
        this.hiddenPhoneEl = document.createElement('input');
        this.hiddenPhoneEl.type = 'hidden';
        this.hiddenPhoneEl.name = this.opts.hiddenInput.phone;
        this.containerEl.appendChild(this.hiddenPhoneEl);
      }
      if (this.opts.hiddenInput.country) {
        this.hiddenCountryEl = document.createElement('input');
        this.hiddenCountryEl.type = 'hidden';
        this.hiddenCountryEl.name = this.opts.hiddenInput.country;
        this.hiddenCountryEl.value = this.selectedCountry.code;
        this.containerEl.appendChild(this.hiddenCountryEl);
      }
    }

    this.el.appendChild(this.containerEl);
  }

  private buildTrigger(): void {
    const allowDropdown = this.opts.allowDropdown !== false;

    if (allowDropdown) {
      const btn = document.createElement('button');
      btn.className = 'lpi__trigger';
      btn.type = 'button';
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-haspopup', 'dialog');
      btn.setAttribute('aria-label', 'Select country');
      if (this.opts.disabled) btn.disabled = true;
      this.triggerEl = btn;
    } else {
      const span = document.createElement('span');
      span.className = 'lpi__trigger';
      this.triggerEl = span;
    }

    this.flagEl = document.createElement('span');
    this.flagEl.className = 'lpi__flag';
    this.updateFlag();
    this.triggerEl.appendChild(this.flagEl);

    if (this.opts.separateDialCode) {
      this.dialCodeEl = document.createElement('span');
      this.dialCodeEl.className = 'lpi__dial-code';
      this.dialCodeEl.textContent = `+${this.selectedCountry.dialCode}`;
      this.triggerEl.appendChild(this.dialCodeEl);
    }

    if (allowDropdown) {
      this.arrowEl = document.createElement('span');
      this.arrowEl.className = 'lpi__arrow';
      this.arrowEl.textContent = '▼';
      this.triggerEl.appendChild(this.arrowEl);

      // Attach click listener directly to the trigger
      this.triggerEl.addEventListener('click', () => this.handleTriggerClick(), { signal: this.ac.signal });
    }

    this.containerEl.appendChild(this.triggerEl);
  }

  private rebuildTrigger(): void {
    this.triggerEl.remove();
    this.dialCodeEl = null;
    this.arrowEl = null;

    this.buildTrigger();
    this.containerEl.insertBefore(this.triggerEl, this.inputEl);
  }

  // --- Event Handling ---

  private attachListeners(): void {
    const signal = this.ac.signal;

    this.inputEl.addEventListener('input', (e) => this.handleInput(e as InputEvent), { signal });
    this.inputEl.addEventListener('keydown', (e) => this.handleKeyDown(e), { signal });
    this.inputEl.addEventListener('paste', (e) => this.handlePaste(e), { signal });
    // Delegate reset so later form attributes/DOM moves are respected, including
    // non-composed reset events inside a ShadowRoot.
    const onReset = (event: Event) => {
      if (event.target !== this.inputEl.form) return;
      const revision = this.valueRevision;
      // A native reset can run after a microtask checkpoint; use a task.
      setTimeout(() => {
        if (event.defaultPrevented || signal.aborted) return;
        if (revision === this.valueRevision) this.reset();
        else {
          // A form library supplied a newer value during/after reset.
          this.reformatInput();
          this.syncHiddenInputs();
        }
      }, 0);
    };
    for (const root of new Set([this.inputEl.ownerDocument, this.inputEl.getRootNode()])) {
      root.addEventListener('reset', onReset, { signal });
    }
  }

  private handleInput(e: InputEvent): void {
    if (this.opts.disabled || this.inputEl.readOnly || e.isComposing) return;
    this.valueRevision++;
    this.userHasInteracted = true;
    // A standalone + typed in national mode is not a replacement phone number.
    if (this.opts.strict !== false && e.data === '+' && this.isNationalInput) {
      this.inputEl.value = this.inputEl.value.replace('+', '');
    }
    this.applyInputValue(this.inputEl.value, this.inputEl.selectionStart ?? 0,
      e.inputType !== 'insertReplacementText' && e.inputType !== 'insertFromPaste');
  }

  private applyInputValue(value: string, cursor: number, limitLocal: boolean): void {
    const raw = normalizeNumerals(value);
    const parsed = parsePhoneValue(raw, this.countries, this.selectedCountry);
    this.applyParsedValue(parsed);
    // Never truncate a complete replacement, paste or explicit international number.
    if (limitLocal && !parsed.international && this.opts.strict !== false) {
      this.nationalDigits = this.nationalDigits.slice(0, this.selectedCountry.maxLength);
    }
    this.displayInternational = parsed.international && !this.isNationalInput;
    this.reformatInput();
    if (!this.nationalDigits && this.shouldPrependPrefix && extractDigits(raw)) {
      this.inputEl.value = this.selectedCountry.nationalPrefix!;
    }
    const position = this.isNationalInput && this.unsupportedInternational === null
      ? (parsed.international ? this.inputEl.value.length : this.getNationalCursor(raw, cursor, this.formatNationalValue()))
      : getCursorPosition(raw, cursor, this.inputEl.value);
    this.inputEl.setSelectionRange(position, position);
    this.syncHiddenInputs();
    this.fireCallbacks();
  }

  private applyParsedValue(parsed: ReturnType<typeof parsePhoneValue>): void {
    this.unsupportedInternational = parsed.country ? null : `+${parsed.digits}`;
    if (parsed.country && parsed.country.code !== this.selectedCountry.code) {
      this.selectCountry(parsed.country, false);
    }
    this.nationalDigits = parsed.country ? this.stripNationalPrefix(parsed.digits) : parsed.digits;
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (this.opts.strict === false) return;

    // Allow control keys
    if (
      e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Tab' ||
      e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
      e.key === 'Home' || e.key === 'End' ||
      e.ctrlKey || e.metaKey
    ) {
      return;
    }

    // Allow + at position 0 in inline mode
    if (!this.isNationalInput && e.key === '+' && this.inputEl.selectionStart === 0) {
      return;
    }

    // Allow digits only (ASCII + all supported non-ASCII numeral systems)
    if (e.key.length === 1 && !/\d/.test(e.key) && !isNonAsciiDigit(e.key)) {
      e.preventDefault();
    }
  }

  private handlePaste(e: ClipboardEvent): void {
    if (this.opts.disabled || this.inputEl.readOnly) return;
    e.preventDefault();
    const text = e.clipboardData?.getData('text') ?? '';
    if (!text) return;
    this.valueRevision++;
    this.userHasInteracted = true;
    const cleaned = normalizeNumerals(text).trim();
    const international = cleaned.startsWith('+') || cleaned.startsWith('00');
    const start = this.inputEl.selectionStart ?? 0;
    const end = this.inputEl.selectionEnd ?? start;
    const value = international ? cleaned
      : this.inputEl.value.slice(0, start) + extractDigits(cleaned) + this.inputEl.value.slice(end);
    this.applyInputValue(value, international ? value.length : start + extractDigits(cleaned).length, false);
  }

  private handleTriggerClick(): void {
    if (this.opts.disabled || this.opts.allowDropdown === false) return;

    if (this.dropdown) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  // --- Dropdown ---

  private openDropdown(): void {
    if (this.dropdown) return;
    this.userHasInteracted = true;

    this.dropdown = new Dropdown({
      countries: this.countries,
      preferredCountries: this.opts.preferredCountries ?? [],
      selectedCode: this.selectedCountry.code,
      locale: this.opts.locale,
      renderFlag: this.opts.renderFlag,
      onSelect: (country) => {
        this.selectCountry(country, true);
        this.closeDropdown();
        this.inputEl.focus();
      },
      onClose: (restoreFocus = true) => {
        this.closeDropdown();
        if (restoreFocus && this.triggerEl instanceof HTMLButtonElement) {
          this.triggerEl.focus();
        }
      },
      container: this.opts.dropdownContainer ?? document.body,
    });

    this.dropdown.open(this.triggerEl);
    this.containerEl.classList.add('lpi--open');
    if (this.triggerEl instanceof HTMLButtonElement) {
      this.triggerEl.setAttribute('aria-expanded', 'true');
      this.triggerEl.setAttribute('aria-controls', this.dropdown.dialogId);
    }
    this.opts.onDropdownOpen?.();
  }

  private closeDropdown(): void {
    if (!this.dropdown) return;

    this.dropdown.close();
    this.dropdown = null;
    this.containerEl.classList.remove('lpi--open');
    if (this.triggerEl instanceof HTMLButtonElement) {
      this.triggerEl.setAttribute('aria-expanded', 'false');
      this.triggerEl.removeAttribute('aria-controls');
    }
    this.opts.onDropdownClose?.();
  }

  // --- Country Logic ---

  private selectCountry(country: Country, fireEvent: boolean): void {
    const prev = this.selectedCountry;
    this.selectedCountry = country;

    this.updateFlag();
    this.updateDialCodeDisplay();
    this.reformatInput();
    this.updatePlaceholder();
    this.syncHiddenInputs();

    if (this.dropdown) {
      this.dropdown.setSelected(country.code);
    }

    if (prev.code !== country.code) {
      this.opts.onCountryChange?.(country);
      if (fireEvent) this.fireCallbacks();
    }
  }

  private stripNationalPrefix(digits: string): string {
    const prefix = this.selectedCountry.nationalPrefix;
    if (prefix && digits.startsWith(prefix)) {
      const remaining = digits.slice(prefix.length);
      // Always strip when prefix will be re-added by the display layer
      if (this.shouldPrependPrefix) {
        return remaining;
      }
      // Only strip if remaining digits are sufficient (avoid stripping "1" from "1")
      if (remaining.length > 0) {
        return remaining;
      }
    }
    return digits;
  }

  // --- Display ---

  private formatNationalValue(digits = this.nationalDigits): string {
    return this.opts.formatAsYouType !== false
      ? formatPhone(digits, this.selectedCountry.format) : digits;
  }

  /** Returns true if national prefix should be prepended to display in nationalMode */
  private get shouldPrependPrefix(): boolean {
    return !!this.opts.nationalMode
      && !this.opts.separateDialCode
      && this.selectedCountry.displayNationalPrefix
      && !!this.selectedCountry.nationalPrefix;
  }

  private formatNationalDisplay(digits = this.nationalDigits): string {
    const formatted = this.formatNationalValue(digits);
    if (this.shouldPrependPrefix && digits) {
      return this.selectedCountry.nationalPrefix + formatted;
    }
    return formatted;
  }

  private getNationalCursor(oldValue: string, oldCursor: number, formattedWithoutPrefix: string): number {
    const np = this.shouldPrependPrefix ? this.selectedCountry.nationalPrefix! : '';
    if (!np) return getCursorPosition(oldValue, oldCursor, formattedWithoutPrefix);

    const oldStripped = oldValue.startsWith(np) ? oldValue.slice(np.length) : oldValue;
    const oldCursorAdj = oldValue.startsWith(np) ? Math.max(0, oldCursor - np.length) : oldCursor;
    return getCursorPosition(oldStripped, oldCursorAdj, formattedWithoutPrefix) + np.length;
  }

  private formatFullValue(): string {
    if (!this.nationalDigits) return this.displayInternational ? `+${this.selectedCountry.dialCode}` : '';
    return `+${this.selectedCountry.dialCode} ${this.formatNationalValue()}`;
  }

  private updateFlag(): void {
    if (!this.flagEl) return;
    if (this.opts.renderFlag) {
      this.flagEl.innerHTML = this.opts.renderFlag(this.selectedCountry.code);
    } else {
      this.flagEl.textContent = getFlag(this.selectedCountry.code);
    }
    this.triggerEl?.setAttribute('aria-label', `Select country: ${this.selectedCountry.name} (+${this.selectedCountry.dialCode})`);
  }

  private updateDialCodeDisplay(): void {
    if (this.dialCodeEl) {
      this.dialCodeEl.textContent = `+${this.selectedCountry.dialCode}`;
    }
  }

  private updatePlaceholder(): void {
    if (!this.inputEl) return;

    const placeholder = this.opts.placeholder;
    if (placeholder === 'auto' || placeholder === undefined) {
      const mask = this.selectedCountry.format;
      const maskFallback = mask ? mask.replace(/X/g, '0') : '';
      const ex = this.selectedCountry.exampleNumber;

      const formattedEx = ex ? this.formatNationalValue(ex) : '';

      if (this.isNationalInput) {
        if (formattedEx) {
          const np = this.shouldPrependPrefix ? this.selectedCountry.nationalPrefix! : '';
          this.inputEl.placeholder = np + formattedEx;
        } else {
          this.inputEl.placeholder = maskFallback;
        }
      } else {
        if (formattedEx) {
          this.inputEl.placeholder = `+${this.selectedCountry.dialCode} ${formattedEx}`;
        } else if (maskFallback) {
          this.inputEl.placeholder = `+${this.selectedCountry.dialCode} ${maskFallback}`;
        } else {
          this.inputEl.placeholder = '';
        }
      }
    } else if (placeholder) {
      this.inputEl.placeholder = placeholder;
    } else {
      this.inputEl.placeholder = '';
    }
  }

  private updateDisplayMode(): void {
    this.containerEl.classList.toggle('lpi--separate-dial-code', !!this.opts.separateDialCode);
    this.containerEl.classList.toggle('lpi--national-mode', !!this.opts.nationalMode && !this.opts.separateDialCode);

    // Rebuild dial code element in trigger
    if (this.opts.separateDialCode && !this.dialCodeEl) {
      this.dialCodeEl = document.createElement('span');
      this.dialCodeEl.className = 'lpi__dial-code';
      this.dialCodeEl.textContent = `+${this.selectedCountry.dialCode}`;
      // Insert before arrow
      if (this.arrowEl) {
        this.triggerEl.insertBefore(this.dialCodeEl, this.arrowEl);
      } else {
        this.triggerEl.appendChild(this.dialCodeEl);
      }
    } else if (!this.opts.separateDialCode && this.dialCodeEl) {
      this.dialCodeEl.remove();
      this.dialCodeEl = null;
    }

    this.reformatInput();
    this.updatePlaceholder();
  }

  private reformatInput(): void {
    if (!this.inputEl) return;

    if (this.unsupportedInternational !== null) {
      this.inputEl.value = this.unsupportedInternational;
    } else if (this.isNationalInput) {
      this.inputEl.value = this.formatNationalDisplay();
    } else {
      this.inputEl.value = this.displayInternational
        ? this.formatFullValue()
        : this.formatNationalValue();
    }
  }

  // --- Helpers ---

  private filterCountries(all: Country[], options = this.opts): Country[] {
    let filtered = all;

    if (options.allowedCountries?.length) {
      const allowed = new Set(options.allowedCountries.map(c => c.toUpperCase()));
      filtered = filtered.filter(c => allowed.has(c.code));
    }

    if (options.excludedCountries?.length) {
      const excluded = new Set(options.excludedCountries.map(c => c.toUpperCase()));
      filtered = filtered.filter(c => !excluded.has(c.code));
    }

    if (!filtered.length) throw new RangeError('PhoneInput requires at least one country after filtering.');
    return filtered;
  }

  private resolveCountry(code: string): Country | undefined {
    return getCountryByCode(this.countries, code);
  }

  private setValueInternal(
    e164: string,
    updateInput: boolean,
    prevValue = this.getValue(),
    prevValid = this.validate().valid,
  ): void {

    if (!e164) {
      this.displayInternational = false;
      this.unsupportedInternational = null;
      this.nationalDigits = '';
      if (updateInput) this.reformatInput();
      this.syncHiddenInputs();
      if (this.getValue() !== prevValue) this.fireCallbacks();
      return;
    }

    this.applyParsedValue(parsePhoneValue(e164, this.countries, this.selectedCountry));
    this.displayInternational = !this.isNationalInput;

    if (updateInput) this.reformatInput();
    this.syncHiddenInputs();
    if (this.getValue() !== prevValue || this.validate().valid !== prevValid) this.fireCallbacks();
  }

  private syncHiddenInputs(): void {
    if (this.hiddenPhoneEl) {
      this.hiddenPhoneEl.value = this.getValue();
    }
    if (this.hiddenCountryEl) {
      this.hiddenCountryEl.value = this.selectedCountry.code;
    }
  }

  private fireCallbacks(): void {
    const v = this.validate();
    const e164 = this.getValue();

    this.opts.onChange?.(e164, this.selectedCountry, v);

    if (this.lastValidation === null || v.valid !== this.lastValidation.valid) {
      this.opts.onValidationChange?.(v);
    }

    this.lastValidation = v;
  }
}
