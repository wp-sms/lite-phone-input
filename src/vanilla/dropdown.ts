import type { Country } from '../core/types';
import { getFlag } from '../core/countries';

export interface DropdownOptions {
  countries: Country[];
  preferredCountries: string[];
  selectedCode: string;
  locale?: string;
  renderFlag?: (countryCode: string) => string;
  onSelect: (country: Country) => void;
  onClose: () => void;
  container: HTMLElement;
}

let nextId = 0;

export class Dropdown {
  private id: number;
  private el: HTMLDivElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private listEl: HTMLUListElement | null = null;
  private liveRegion: HTMLDivElement | null = null;
  private highlightIndex = -1;
  private filteredItems: Country[] = [];
  private orderedCountries: Country[] | null = null;
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;
  private ac: AbortController | null = null;
  private displayNames: Intl.DisplayNames | null = null;
  private options: DropdownOptions;

  constructor(options: DropdownOptions) {
    this.options = options;
    this.id = nextId++;
    if (options.locale && typeof Intl?.DisplayNames === 'function') {
      try {
        this.displayNames = new Intl.DisplayNames([options.locale], { type: 'region' });
      } catch {
        // fallback to English names
      }
    }
  }

  open(anchorEl: HTMLElement): void {
    if (this.el) return;

    this.ac = new AbortController();
    const signal = this.ac.signal;

    // Build dropdown DOM
    this.el = document.createElement('div');
    this.el.className = 'lpi__dropdown';
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-label', 'Select country');

    // Search input
    this.searchInput = document.createElement('input');
    this.searchInput.className = 'lpi__search';
    this.searchInput.type = 'text';
    this.searchInput.setAttribute('role', 'combobox');
    this.searchInput.setAttribute('aria-expanded', 'true');
    this.searchInput.setAttribute('aria-controls', `lpi-list-${this.id}`);
    this.searchInput.setAttribute('aria-autocomplete', 'list');
    this.searchInput.placeholder = 'Search...';
    this.el.appendChild(this.searchInput);

    // Live region
    this.liveRegion = document.createElement('div');
    this.liveRegion.className = 'lpi__sr-only';
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.el.appendChild(this.liveRegion);

    // Country list
    this.listEl = document.createElement('ul');
    this.listEl.className = 'lpi__list';
    this.listEl.setAttribute('role', 'listbox');
    this.listEl.id = `lpi-list-${this.id}`;
    this.el.appendChild(this.listEl);

    // Build initial list
    this.filteredItems = this.getOrderedCountries();
    this.buildList();

    // Position and attach to container
    this.options.container.appendChild(this.el);
    this.position(anchorEl);

    // Check mobile fullscreen
    if (typeof window.matchMedia === 'function' &&
        window.matchMedia('(max-width: 500px), (pointer: coarse) and (max-height: 600px)').matches) {
      this.el.classList.add('lpi__dropdown--fullscreen');
    }

    // Focus search
    this.searchInput.focus();

    // Highlight selected country
    const selectedIdx = this.filteredItems.findIndex(c => c.code === this.options.selectedCode);
    if (selectedIdx >= 0) {
      this.updateHighlight(selectedIdx);
    }

    // Event listeners
    this.searchInput.addEventListener('input', () => this.handleSearchInput(), { signal });
    this.el.addEventListener('keydown', (e) => this.handleKeyDown(e), { signal });
    this.listEl.addEventListener('click', (e) => this.handleListClick(e), { signal });

    // Close triggers
    document.addEventListener('mousedown', (e) => this.handleClickOutside(e), { signal });
    this.setupScrollListeners(anchorEl, signal);
  }

  close(): void {
    if (!this.el) return;
    this.ac?.abort();
    this.ac = null;
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = null;
    }
    this.el.remove();
    this.el = null;
    this.searchInput = null;
    this.listEl = null;
    this.liveRegion = null;
    this.highlightIndex = -1;
    this.filteredItems = [];
    this.orderedCountries = null;
  }

  isOpen(): boolean {
    return this.el !== null;
  }

  setSelected(code: string): void {
    const prevCode = this.options.selectedCode;
    this.options.selectedCode = code;
    if (this.listEl) {
      // Update only the old and new selected elements
      if (prevCode) {
        const oldEl = this.listEl.querySelector<HTMLLIElement>(`[data-code="${prevCode}"]`);
        if (oldEl) {
          oldEl.setAttribute('aria-selected', 'false');
          oldEl.classList.remove('lpi__option--selected');
        }
      }
      const newEl = this.listEl.querySelector<HTMLLIElement>(`[data-code="${code}"]`);
      if (newEl) {
        newEl.setAttribute('aria-selected', 'true');
        newEl.classList.add('lpi__option--selected');
      }
    }
  }

  updateCountries(countries: Country[], preferredCountries: string[]): void {
    this.options.countries = countries;
    this.options.preferredCountries = preferredCountries;
    this.orderedCountries = null;
  }

  destroy(): void {
    this.close();
  }

  // --- Internal ---

  private getOrderedCountries(): Country[] {
    if (this.orderedCountries) return this.orderedCountries;

    const { countries, preferredCountries } = this.options;
    if (!preferredCountries.length) {
      this.orderedCountries = countries;
      return countries;
    }

    const prefSet = new Set(preferredCountries.map(c => c.toUpperCase()));
    const preferred: Country[] = [];
    const rest: Country[] = [];

    for (const c of countries) {
      if (prefSet.has(c.code)) {
        preferred.push(c);
      } else {
        rest.push(c);
      }
    }

    preferred.sort((a, b) => {
      return preferredCountries.indexOf(a.code) - preferredCountries.indexOf(b.code);
    });

    this.orderedCountries = [...preferred, ...rest];
    return this.orderedCountries;
  }

  private buildList(): void {
    if (!this.listEl) return;
    this.listEl.replaceChildren();

    const { preferredCountries, selectedCode } = this.options;
    const prefSet = preferredCountries.length > 0
      ? new Set(preferredCountries.map(c => c.toUpperCase()))
      : null;
    let addedSeparator = false;

    for (let i = 0; i < this.filteredItems.length; i++) {
      const country = this.filteredItems[i];

      // Insert separator after preferred countries
      if (!addedSeparator && prefSet && !prefSet.has(country.code)) {
        if (i > 0) {
          const sep = document.createElement('li');
          sep.className = 'lpi__separator';
          sep.setAttribute('role', 'separator');
          sep.innerHTML = '<hr>';
          this.listEl.appendChild(sep);
        }
        addedSeparator = true;
      }

      const li = document.createElement('li');
      li.className = 'lpi__option';
      if (country.code === selectedCode) li.classList.add('lpi__option--selected');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', country.code === selectedCode ? 'true' : 'false');
      li.dataset.code = country.code;
      li.id = `lpi-opt-${this.id}-${country.code}`;

      const flag = document.createElement('span');
      flag.className = 'lpi__flag';
      if (this.options.renderFlag) {
        flag.innerHTML = this.options.renderFlag(country.code);
      } else {
        flag.textContent = getFlag(country.code);
      }

      const name = document.createElement('span');
      name.className = 'lpi__option-name';
      name.textContent = this.getCountryName(country);

      const dial = document.createElement('span');
      dial.className = 'lpi__option-dial';
      dial.textContent = `+${country.dialCode}`;

      li.appendChild(flag);
      li.appendChild(name);
      li.appendChild(dial);
      this.listEl.appendChild(li);
    }

    this.updateLiveRegion();
  }

  private getCountryName(country: Country): string {
    if (this.displayNames) {
      try {
        return this.displayNames.of(country.code) ?? country.name;
      } catch {
        return country.name;
      }
    }
    return country.name;
  }

  /** 3-bucket search: exact code/dial → starts-with → contains */
  search(query: string): Country[] {
    if (!query) return this.getOrderedCountries();

    const q = query.trim().toLowerCase();
    const qUpper = q.toUpperCase();
    const ordered = this.getOrderedCountries();

    const exact: Country[] = [];
    const startsWith: Country[] = [];
    const contains: Country[] = [];

    for (const c of ordered) {
      const name = this.getCountryName(c).toLowerCase();

      if (c.code === qUpper || c.dialCode === q) {
        exact.push(c);
      } else if (name.startsWith(q)) {
        startsWith.push(c);
      } else if (name.includes(q)) {
        contains.push(c);
      }
    }

    return [...exact, ...startsWith, ...contains];
  }

  private handleSearchInput(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      const query = this.searchInput?.value ?? '';
      this.filteredItems = this.search(query);
      this.highlightIndex = -1;
      this.buildList();
      if (this.filteredItems.length > 0) {
        this.updateHighlight(0);
      }
    }, 100);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (this.filteredItems.length > 0) {
          const next = this.highlightIndex < this.filteredItems.length - 1
            ? this.highlightIndex + 1
            : 0;
          this.updateHighlight(next);
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (this.filteredItems.length > 0) {
          const prev = this.highlightIndex > 0
            ? this.highlightIndex - 1
            : this.filteredItems.length - 1;
          this.updateHighlight(prev);
        }
        break;

      case 'Enter':
        e.preventDefault();
        if (this.highlightIndex >= 0 && this.highlightIndex < this.filteredItems.length) {
          this.options.onSelect(this.filteredItems[this.highlightIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        this.options.onClose();
        break;

      case 'Tab':
        this.options.onClose();
        break;
    }
  }

  private handleListClick(e: Event): void {
    const target = (e.target as HTMLElement).closest<HTMLLIElement>('.lpi__option');
    if (!target?.dataset.code) return;
    const country = this.filteredItems.find(c => c.code === target.dataset.code);
    if (country) this.options.onSelect(country);
  }

  private handleClickOutside(e: MouseEvent): void {
    if (this.el && !this.el.contains(e.target as Node)) {
      this.options.onClose();
    }
  }

  private setupScrollListeners(anchorEl: HTMLElement, signal: AbortSignal): void {
    let node: HTMLElement | null = anchorEl.parentElement;
    while (node && node !== document.documentElement) {
      const ancestor = node;
      ancestor.addEventListener('scroll', () => {
        // Don't close if the scroll is from the dropdown itself
        if (this.el && this.el.contains(ancestor)) return;
        this.options.onClose();
      }, { signal, passive: true });
      node = node.parentElement;
    }
  }

  private position(anchorEl: HTMLElement): void {
    if (!this.el) return;

    const rect = anchorEl.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // If rendering in a portal (document.body), use fixed-like absolute positioning
    const container = this.options.container;
    const isPortal = container === document.body;

    if (isPortal) {
      this.el.style.position = 'absolute';
      const scrollTop = window.scrollY;
      const scrollLeft = window.scrollX;
      const dropdownHeight = Math.min(300, spaceAbove);

      if (spaceBelow >= 300 || spaceBelow >= spaceAbove) {
        this.el.style.top = `${rect.bottom + scrollTop}px`;
        this.el.style.left = `${rect.left + scrollLeft}px`;
        this.el.classList.remove('lpi__dropdown--above');
      } else {
        this.el.style.top = `${rect.top + scrollTop - dropdownHeight}px`;
        this.el.style.left = `${rect.left + scrollLeft}px`;
        this.el.classList.add('lpi__dropdown--above');
      }
      this.el.style.width = `${Math.max(rect.width, 280)}px`;
    } else {
      // Relative to container
      if (spaceBelow >= 300 || spaceBelow >= spaceAbove) {
        this.el.classList.remove('lpi__dropdown--above');
      } else {
        this.el.classList.add('lpi__dropdown--above');
      }
    }
  }

  private updateHighlight(index: number): void {
    if (!this.listEl || !this.searchInput) return;

    // Remove old highlight
    if (this.highlightIndex >= 0) {
      const oldItem = this.getOptionElement(this.highlightIndex);
      oldItem?.classList.remove('lpi__option--highlighted');
    }

    this.highlightIndex = index;
    const item = this.getOptionElement(index);
    if (item) {
      item.classList.add('lpi__option--highlighted');
      item.scrollIntoView?.({ block: 'nearest' });
      this.searchInput.setAttribute('aria-activedescendant', item.id);
    }
  }

  private getOptionElement(index: number): HTMLLIElement | null {
    if (!this.listEl) return null;
    const options = this.listEl.querySelectorAll<HTMLLIElement>('.lpi__option');
    return options[index] ?? null;
  }

  private updateLiveRegion(): void {
    if (this.liveRegion) {
      const count = this.filteredItems.length;
      this.liveRegion.textContent = `${count} ${count === 1 ? 'result' : 'results'}`;
    }
  }
}
