import type { Country, PhoneInputOptions, ValidationResult } from '../core/types';
import { getAllCountries, getCountryByCode, getCountryByDialCode, getFlag } from '../core/countries';
import { formatPhone, getCursorPosition, extractDigits, normalizeNumerals } from '../core/format';
import { validatePhone } from '../core/validate';
import { Dropdown } from './dropdown';

const isClient = typeof window !== 'undefined';

export class PhoneInput {
  private el: HTMLElement;
  private opts: PhoneInputOptions;
  private countries: Country[];
  private selectedCountry: Country;
  private nationalDigits = '';
  private displayInternational = false;
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

    if (isClient) {
      this.buildDOM();
      this.attachListeners();

      // Process initial value
      if (this.opts.value) {
        this.setValueInternal(this.opts.value, true);
      }
    }
  }

  static mount(el: HTMLElement, options: PhoneInputOptions): PhoneInput {
    return new PhoneInput(el, options);
  }

  // --- Public API ---

  getValue(): string {
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
    this.setValueInternal(e164, true);
  }

  setCountry(code: string): void {
    const country = this.resolveCountry(code);
    if (country) this.selectCountry(country, true);
  }

  isValid(): boolean {
    return this.validate().valid;
  }

  validate(): ValidationResult {
    return validatePhone(this.nationalDigits, this.selectedCountry);
  }

  setOptions(opts: Partial<PhoneInputOptions>): void {
    const prev = { ...this.opts };
    Object.assign(this.opts, opts);

    // Re-filter countries if filter options changed
    if (opts.allowedCountries !== undefined || opts.excludedCountries !== undefined) {
      this.countries = this.filterCountries(getAllCountries());
      // Ensure selected country is still in filtered list
      if (!this.countries.find(c => c.code === this.selectedCountry.code)) {
        this.selectCountry(this.countries[0], true);
      }
      if (this.dropdown) {
        this.dropdown.updateCountries(this.countries, this.opts.preferredCountries ?? []);
      }
    }

    if (opts.disabled !== undefined) {
      this.inputEl.disabled = !!opts.disabled;
      this.containerEl.classList.toggle('lpi--disabled', !!opts.disabled);
      if (this.triggerEl instanceof HTMLButtonElement) {
        this.triggerEl.disabled = !!opts.disabled;
      }
    }

    if (opts.separateDialCode !== undefined && opts.separateDialCode !== prev.separateDialCode) {
      this.updateDisplayMode();
    }

    if (opts.renderFlag !== undefined) {
      this.updateFlag();
    }

    if (opts.placeholder !== undefined) {
      this.updatePlaceholder();
    }

    if (opts.formatAsYouType !== undefined || opts.strict !== undefined) {
      this.reformatInput();
    }

    if (opts.allowDropdown !== undefined) {
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
      btn.setAttribute('role', 'combobox');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-haspopup', 'listbox');
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
  }

  private handleInput(e: InputEvent): void {
    // Android sends e.key="Unidentified" for +, so keydown can't filter it.
    // Fall back to InputEvent.data (same approach as intl-tel-input).
    if (this.opts.strict !== false && e.data === '+' && this.opts.separateDialCode) {
      this.inputEl.value = this.inputEl.value.replace('+', '');
    }

    const oldCursor = this.inputEl.selectionStart ?? 0;
    let raw = normalizeNumerals(this.inputEl.value);

    if (this.opts.separateDialCode) {
      // Input contains only national number
      let digits = extractDigits(raw);

      // Strip national prefix if typed at start
      digits = this.stripNationalPrefix(digits);

      // Enforce strict max length
      if (this.opts.strict !== false && digits.length > this.selectedCountry.maxLength) {
        digits = digits.slice(0, this.selectedCountry.maxLength);
      }

      this.nationalDigits = digits;

      const formatted = this.formatNationalValue(digits);

      const newCursor = getCursorPosition(this.inputEl.value, oldCursor, formatted);
      this.inputEl.value = formatted;
      this.inputEl.setSelectionRange(newCursor, newCursor);
    } else {
      // Inline mode: input contains +{dialCode}{national} or just national
      const digits = extractDigits(raw);
      const hasPlus = raw.startsWith('+');
      this.displayInternational = hasPlus;

      if (hasPlus && digits.length > 0) {
        // Try to detect country from dial code
        this.detectCountryFromDigits(digits);
      }

      // Extract national digits (remove dial code portion)
      let national = this.extractNationalFromFull(digits, hasPlus);
      national = this.stripNationalPrefix(national);

      // Enforce strict max length
      if (this.opts.strict !== false && national.length > this.selectedCountry.maxLength) {
        national = national.slice(0, this.selectedCountry.maxLength);
      }

      this.nationalDigits = national;

      let formatted: string;
      if (hasPlus) {
        const dc = this.selectedCountry.dialCode;
        if (digits.startsWith(dc) && national.length > 0) {
          formatted = `+${dc} ${this.formatNationalValue(national)}`;
        } else {
          // Still typing dial code or partial match — show raw
          formatted = `+${digits}`;
        }
      } else {
        formatted = this.formatNationalValue(national);
      }

      const newCursor = getCursorPosition(this.inputEl.value, oldCursor, formatted);
      this.inputEl.value = formatted;
      this.inputEl.setSelectionRange(newCursor, newCursor);
    }

    this.syncHiddenInputs();
    this.fireCallbacks();
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
    if (!this.opts.separateDialCode && e.key === '+' && this.inputEl.selectionStart === 0) {
      return;
    }

    // Allow digits only
    if (e.key.length === 1 && !/\d/.test(e.key)) {
      // Also allow Arabic-Indic and Persian numerals
      const code = e.key.charCodeAt(0);
      if (!((code >= 0x0660 && code <= 0x0669) || (code >= 0x06F0 && code <= 0x06F9))) {
        e.preventDefault();
      }
    }
  }

  private handlePaste(e: ClipboardEvent): void {
    e.preventDefault();
    const text = e.clipboardData?.getData('text') ?? '';
    if (!text) return;

    const cleaned = normalizeNumerals(text);
    let digits = cleaned.replace(/[^\d]/g, '');
    const isInternational = cleaned.startsWith('+') || cleaned.startsWith('00');

    if (isInternational) {
      // Strip 00 prefix digits (already converted to plain digits by replace above)
      if (cleaned.startsWith('00')) {
        digits = digits.slice(2);
      }
      this.detectCountryFromDigits(digits);
      digits = this.extractNationalFromFull(digits, true);
    }

    digits = this.stripNationalPrefix(digits);

    if (this.opts.strict !== false && digits.length > this.selectedCountry.maxLength) {
      digits = digits.slice(0, this.selectedCountry.maxLength);
    }

    this.nationalDigits = digits;
    this.displayInternational = isInternational;

    // Update display
    if (this.opts.separateDialCode) {
      this.inputEl.value = this.formatNationalValue();
    } else {
      this.inputEl.value = this.displayInternational
        ? this.formatFullValue()
        : this.formatNationalValue();
    }

    this.syncHiddenInputs();
    this.fireCallbacks();
  }

  private handleTriggerClick(): void {
    if (this.opts.allowDropdown === false) return;

    if (this.dropdown) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  // --- Dropdown ---

  private openDropdown(): void {
    if (this.dropdown) return;

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
      onClose: () => {
        this.closeDropdown();
        if (this.triggerEl instanceof HTMLButtonElement) {
          this.triggerEl.focus();
        }
      },
      container: this.opts.dropdownContainer ?? document.body,
    });

    this.dropdown.open(this.triggerEl);
    this.containerEl.classList.add('lpi--open');
    if (this.triggerEl instanceof HTMLButtonElement) {
      this.triggerEl.setAttribute('aria-expanded', 'true');
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

    if (fireEvent && prev.code !== country.code) {
      this.opts.onCountryChange?.(country);
      this.fireCallbacks();
    }
  }

  private detectCountryFromDigits(digits: string): void {
    // Try longest dial code first (up to 4 digits)
    for (let len = Math.min(4, digits.length); len >= 1; len--) {
      const prefix = digits.slice(0, len);
      const match = getCountryByDialCode(this.countries, prefix);
      if (match) {
        // If current country already matches this dial code, don't switch
        if (this.selectedCountry.dialCode === prefix) return;
        this.selectCountry(match, true);
        return;
      }
    }
  }

  private extractNationalFromFull(digits: string, hasInternationalPrefix: boolean): string {
    if (!hasInternationalPrefix) return digits;

    const dc = this.selectedCountry.dialCode;
    if (digits.startsWith(dc)) {
      return digits.slice(dc.length);
    }
    return digits;
  }

  private stripNationalPrefix(digits: string): string {
    const prefix = this.selectedCountry.nationalPrefix;
    if (prefix && digits.startsWith(prefix)) {
      // Only strip if remaining digits are sufficient (avoid stripping "1" from "1")
      const remaining = digits.slice(prefix.length);
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

  private formatFullValue(): string {
    if (!this.nationalDigits) return '';
    return `+${this.selectedCountry.dialCode} ${this.formatNationalValue()}`;
  }

  private updateFlag(): void {
    if (!this.flagEl) return;
    if (this.opts.renderFlag) {
      this.flagEl.innerHTML = this.opts.renderFlag(this.selectedCountry.code);
    } else {
      this.flagEl.textContent = getFlag(this.selectedCountry.code);
    }
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
      // Generate from format mask
      const mask = this.selectedCountry.format;
      if (mask) {
        const example = mask.replace(/X/g, '0');
        if (this.opts.separateDialCode) {
          this.inputEl.placeholder = example;
        } else {
          this.inputEl.placeholder = `+${this.selectedCountry.dialCode} ${example}`;
        }
      } else {
        this.inputEl.placeholder = '';
      }
    } else if (placeholder) {
      this.inputEl.placeholder = placeholder;
    } else {
      this.inputEl.placeholder = '';
    }
  }

  private updateDisplayMode(): void {
    this.containerEl.classList.toggle('lpi--separate-dial-code', !!this.opts.separateDialCode);

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

    if (this.opts.separateDialCode) {
      this.inputEl.value = this.formatNationalValue();
    } else {
      this.inputEl.value = this.displayInternational
        ? this.formatFullValue()
        : this.formatNationalValue();
    }
  }

  // --- Helpers ---

  private filterCountries(all: Country[]): Country[] {
    let filtered = all;

    if (this.opts.allowedCountries?.length) {
      const allowed = new Set(this.opts.allowedCountries.map(c => c.toUpperCase()));
      filtered = filtered.filter(c => allowed.has(c.code));
    }

    if (this.opts.excludedCountries?.length) {
      const excluded = new Set(this.opts.excludedCountries.map(c => c.toUpperCase()));
      filtered = filtered.filter(c => !excluded.has(c.code));
    }

    return filtered;
  }

  private resolveCountry(code: string): Country | undefined {
    return getCountryByCode(this.countries, code);
  }

  private setValueInternal(e164: string, updateInput: boolean): void {
    if (!e164) {
      this.nationalDigits = '';
      if (updateInput) this.reformatInput();
      this.syncHiddenInputs();
      this.fireCallbacks();
      return;
    }

    let digits = extractDigits(normalizeNumerals(e164));
    const hasPlus = e164.startsWith('+');

    if (hasPlus) {
      this.detectCountryFromDigits(digits);
      digits = this.extractNationalFromFull(digits, true);
    }

    digits = this.stripNationalPrefix(digits);
    this.nationalDigits = digits;
    this.displayInternational = true;

    if (updateInput) this.reformatInput();
    this.syncHiddenInputs();
    this.fireCallbacks();
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
    const v = validatePhone(this.nationalDigits, this.selectedCountry);
    const e164 = this.getValue();

    this.opts.onChange?.(e164, this.selectedCountry, v);

    if (this.lastValidation === null || v.valid !== this.lastValidation.valid) {
      this.opts.onValidationChange?.(v);
    }

    this.lastValidation = v;
  }
}
