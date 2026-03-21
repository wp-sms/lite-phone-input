import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Dropdown } from '../../src/vanilla/dropdown';
import type { Country } from '../../src/core/types';

const countries: Country[] = [
  { code: 'AF', name: 'Afghanistan', dialCode: '93', format: 'XX XXX XXXX', nationalPrefix: '0', minLength: 9, maxLength: 9, priority: 0 },
  { code: 'CA', name: 'Canada', dialCode: '1', format: 'XXX XXX XXXX', nationalPrefix: '1', minLength: 10, maxLength: 10, priority: 7 },
  { code: 'DE', name: 'Germany', dialCode: '49', format: 'XXXX XXXXXXX', nationalPrefix: '0', minLength: 10, maxLength: 11, priority: 0 },
  { code: 'GB', name: 'United Kingdom', dialCode: '44', format: 'XXXX XXX XXXX', nationalPrefix: '0', minLength: 10, maxLength: 10, priority: 0 },
  { code: 'US', name: 'United States', dialCode: '1', format: 'XXX XXX XXXX', nationalPrefix: '1', minLength: 10, maxLength: 10, priority: 0 },
];

function createDropdown(overrides: Partial<Parameters<typeof Dropdown['prototype']['open']>[0]> & Partial<ConstructorParameters<typeof Dropdown>[0]> = {}) {
  const onSelect = vi.fn();
  const onClose = vi.fn();
  const container = document.createElement('div');
  document.body.appendChild(container);

  const dropdown = new Dropdown({
    countries,
    preferredCountries: [],
    selectedCode: 'US',
    onSelect,
    onClose,
    container,
    ...overrides,
  });

  return { dropdown, onSelect, onClose, container };
}

describe('Dropdown', () => {
  let anchor: HTMLElement;

  beforeEach(() => {
    anchor = document.createElement('button');
    document.body.appendChild(anchor);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('search', () => {
    it('exact match on ISO code ranks first', () => {
      const { dropdown } = createDropdown();
      const results = dropdown.search('US');
      expect(results[0].code).toBe('US');
    });

    it('exact match on dial code ranks first', () => {
      const { dropdown } = createDropdown();
      const results = dropdown.search('49');
      expect(results[0].code).toBe('DE');
    });

    it('startsWith name ranks before contains', () => {
      const { dropdown } = createDropdown();
      const results = dropdown.search('un');
      // "United Kingdom" and "United States" start with "un"
      const names = results.map(c => c.name);
      expect(names.indexOf('United Kingdom')).toBeLessThan(names.length);
      expect(names.indexOf('United States')).toBeLessThan(names.length);
    });

    it('contains match works', () => {
      const { dropdown } = createDropdown();
      const results = dropdown.search('king');
      expect(results.some(c => c.code === 'GB')).toBe(true);
    });

    it('search is case insensitive', () => {
      const { dropdown } = createDropdown();
      const lower = dropdown.search('germany');
      const upper = dropdown.search('GERMANY');
      expect(lower.map(c => c.code)).toEqual(upper.map(c => c.code));
    });

    it('returns all countries for empty query', () => {
      const { dropdown } = createDropdown();
      const results = dropdown.search('');
      expect(results).toHaveLength(countries.length);
    });

    it('returns empty for no match', () => {
      const { dropdown } = createDropdown();
      const results = dropdown.search('zzzzz');
      expect(results).toHaveLength(0);
    });
  });

  describe('open and close', () => {
    it('creates dropdown DOM on open', () => {
      const { dropdown, container } = createDropdown();
      dropdown.open(anchor);
      expect(container.querySelector('.lpi__dropdown')).toBeTruthy();
      expect(container.querySelector('.lpi__search')).toBeTruthy();
      expect(container.querySelector('.lpi__list')).toBeTruthy();
      dropdown.destroy();
    });

    it('removes dropdown DOM on close', () => {
      const { dropdown, container } = createDropdown();
      dropdown.open(anchor);
      dropdown.close();
      expect(container.querySelector('.lpi__dropdown')).toBeNull();
    });

    it('isOpen reflects state', () => {
      const { dropdown } = createDropdown();
      expect(dropdown.isOpen()).toBe(false);
      dropdown.open(anchor);
      expect(dropdown.isOpen()).toBe(true);
      dropdown.close();
      expect(dropdown.isOpen()).toBe(false);
    });
  });

  describe('keyboard navigation', () => {
    it('arrow down moves highlight', () => {
      const { dropdown, container } = createDropdown();
      dropdown.open(anchor);

      const el = container.querySelector('.lpi__dropdown')!;
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

      const highlighted = container.querySelector('.lpi__option--highlighted');
      expect(highlighted).toBeTruthy();
      dropdown.destroy();
    });

    it('enter selects highlighted option', () => {
      const { dropdown, container, onSelect } = createDropdown();
      dropdown.open(anchor);

      const el = container.querySelector('.lpi__dropdown')!;
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      expect(onSelect).toHaveBeenCalledOnce();
      dropdown.destroy();
    });

    it('escape closes dropdown', () => {
      const { dropdown, container, onClose } = createDropdown();
      dropdown.open(anchor);

      const el = container.querySelector('.lpi__dropdown')!;
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(onClose).toHaveBeenCalledOnce();
      dropdown.destroy();
    });
  });

  describe('ARIA attributes', () => {
    it('list has role=listbox', () => {
      const { dropdown, container } = createDropdown();
      dropdown.open(anchor);

      const list = container.querySelector('.lpi__list');
      expect(list?.getAttribute('role')).toBe('listbox');
      dropdown.destroy();
    });

    it('options have role=option', () => {
      const { dropdown, container } = createDropdown();
      dropdown.open(anchor);

      const options = container.querySelectorAll('.lpi__option');
      options.forEach(opt => {
        expect(opt.getAttribute('role')).toBe('option');
      });
      dropdown.destroy();
    });

    it('selected option has aria-selected=true', () => {
      const { dropdown, container } = createDropdown({ selectedCode: 'US' });
      dropdown.open(anchor);

      const usOption = container.querySelector('[data-code="US"]');
      expect(usOption?.getAttribute('aria-selected')).toBe('true');

      const gbOption = container.querySelector('[data-code="GB"]');
      expect(gbOption?.getAttribute('aria-selected')).toBe('false');
      dropdown.destroy();
    });
  });

  describe('preferred countries', () => {
    it('renders preferred countries first with separator', () => {
      const { dropdown, container } = createDropdown({
        preferredCountries: ['GB', 'US'],
      });
      dropdown.open(anchor);

      const items = container.querySelectorAll('.lpi__list > li');
      // First two should be GB and US (preferred), then separator, then rest
      const firstOption = items[0] as HTMLElement;
      expect(firstOption.dataset.code).toBe('GB');
      const secondOption = items[1] as HTMLElement;
      expect(secondOption.dataset.code).toBe('US');
      // Third should be separator
      expect(items[2].classList.contains('lpi__separator')).toBe(true);
      dropdown.destroy();
    });

    it('does not duplicate preferred countries in main list', () => {
      const { dropdown, container } = createDropdown({
        preferredCountries: ['US'],
      });
      dropdown.open(anchor);

      const usOptions = container.querySelectorAll('[data-code="US"]');
      expect(usOptions).toHaveLength(1);
      dropdown.destroy();
    });
  });
});
