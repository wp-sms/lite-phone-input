[Home](../README.md) > Styling & Theming

# Styling & Theming

## CSS Custom Properties

Override any of these variables to match your design system:

```css
:root {
  --lpi-bg: #fff;
  --lpi-border-color: #ccc;
  --lpi-border-radius: 4px;
  --lpi-text-color: #333;
  --lpi-hover-bg: #f5f5f5;
  --lpi-selected-bg: #e8f0fe;
  --lpi-highlight-bg: #f0f0f0;
  --lpi-dropdown-bg: #fff;
  --lpi-dropdown-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  --lpi-font-size: 14px;
  --lpi-flag-size: 1.2em;
  --lpi-spacing: 8px;
  --lpi-input-height: 40px;
  --lpi-dropdown-max-height: 300px;
}
```

### Variable Reference

| Variable | Default | Description |
|---|---|---|
| `--lpi-bg` | `#fff` | Background color of the container |
| `--lpi-border-color` | `#ccc` | Border color (container, trigger separator, dropdown) |
| `--lpi-border-radius` | `4px` | Border radius of the container and dropdown |
| `--lpi-text-color` | `#333` | Text color for all elements |
| `--lpi-hover-bg` | `#f5f5f5` | Background on hover for trigger and dropdown items |
| `--lpi-selected-bg` | `#e8f0fe` | Background for the currently selected country |
| `--lpi-highlight-bg` | `#f0f0f0` | Background for keyboard-highlighted dropdown item |
| `--lpi-dropdown-bg` | `#fff` | Dropdown panel background |
| `--lpi-dropdown-shadow` | `0 2px 8px rgba(0,0,0,0.15)` | Dropdown box shadow |
| `--lpi-font-size` | `14px` | Base font size |
| `--lpi-flag-size` | `1.2em` | Emoji flag font size |
| `--lpi-spacing` | `8px` | Internal padding (trigger, input, search) |
| `--lpi-input-height` | `40px` | Height of the input container |
| `--lpi-dropdown-max-height` | `300px` | Maximum dropdown height before scrolling |

## BEM Class Reference

All classes use BEM naming under the `.lpi` namespace.

### Block & Elements

| Class | Element | Description |
|---|---|---|
| `.lpi` | Container | Root flex container with border and background |
| `.lpi__trigger` | Button/span | Country selector trigger (left side) |
| `.lpi__flag` | Span | Emoji flag inside the trigger |
| `.lpi__dial-code` | Span | Dial code text (when `separateDialCode` is true) |
| `.lpi__arrow` | Span | Dropdown arrow indicator (`▼`) |
| `.lpi__input` | Input | The phone number `<input>` element |
| `.lpi__dropdown` | Div | Dropdown panel (portal target) |
| `.lpi__search` | Input | Search input inside the dropdown |
| `.lpi__list` | UL | Country list (`role="listbox"`) |
| `.lpi__option` | LI | Individual country item (`role="option"`) |
| `.lpi__option-name` | Span | Country name text |
| `.lpi__option-dial` | Span | Dial code text in dropdown item |
| `.lpi__separator` | LI | Divider between preferred and other countries |
| `.lpi__sr-only` | Div | Screen reader live region |

### Modifier Classes

| Class | Applied to | When |
|---|---|---|
| `.lpi--disabled` | `.lpi` | `disabled: true` |
| `.lpi--separate-dial-code` | `.lpi` | `separateDialCode: true` |
| `.lpi--open` | `.lpi` | Dropdown is open |
| `.lpi__option--selected` | `.lpi__option` | Currently selected country |
| `.lpi__option--highlighted` | `.lpi__option` | Keyboard-focused country |
| `.lpi__dropdown--above` | `.lpi__dropdown` | Dropdown opens upward (not enough space below) |
| `.lpi__dropdown--fullscreen` | `.lpi__dropdown` | Mobile fullscreen mode |

## Dark Mode

```css
@media (prefers-color-scheme: dark) {
  :root {
    --lpi-bg: #1e1e1e;
    --lpi-border-color: #444;
    --lpi-text-color: #e0e0e0;
    --lpi-hover-bg: #2a2a2a;
    --lpi-selected-bg: #1a3a5c;
    --lpi-highlight-bg: #333;
    --lpi-dropdown-bg: #1e1e1e;
    --lpi-dropdown-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  }
}
```

Or use a class-based approach:

```css
.dark {
  --lpi-bg: #1e1e1e;
  --lpi-border-color: #444;
  --lpi-text-color: #e0e0e0;
  --lpi-hover-bg: #2a2a2a;
  --lpi-selected-bg: #1a3a5c;
  --lpi-highlight-bg: #333;
  --lpi-dropdown-bg: #1e1e1e;
  --lpi-dropdown-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}
```

## Tailwind CSS Integration

Use `containerClass` to add Tailwind utility classes to the root element, and override CSS variables for fine-tuning:

```jsx
<PhoneInput
  defaultCountry="US"
  containerClass="rounded-lg shadow-sm"
/>
```

```css
/* Override variables to match Tailwind theme */
.lpi {
  --lpi-border-color: theme('colors.gray.300');
  --lpi-border-radius: theme('borderRadius.lg');
  --lpi-font-size: theme('fontSize.sm');
  --lpi-input-height: theme('spacing.10');
}
```

## Material Design Recipe

```css
.lpi {
  --lpi-bg: transparent;
  --lpi-border-color: rgba(0, 0, 0, 0.42);
  --lpi-border-radius: 4px 4px 0 0;
  --lpi-font-size: 16px;
  --lpi-input-height: 56px;
  --lpi-spacing: 12px;
  border: none;
  border-bottom: 1px solid var(--lpi-border-color);
}

.lpi:focus-within {
  border-bottom: 2px solid #1976d2;
  box-shadow: none;
}

.lpi__trigger {
  border-right: none;
}
```

## Custom Flag Rendering

Use the `renderFlag` callback to replace emoji flags with custom HTML:

```js
PhoneInput.mount(el, {
  defaultCountry: 'US',
  renderFlag(countryCode) {
    return `<img src="/flags/${countryCode.toLowerCase()}.svg" width="20" height="15" alt="${countryCode}">`;
  },
});
```

React/Preact:

```jsx
<PhoneInput
  defaultCountry="US"
  renderFlag={(code) => `<img src="/flags/${code.toLowerCase()}.svg" width="20" height="15">`}
/>
```

## Mobile Fullscreen

On small screens (`max-width: 500px`) or touch devices with small viewport (`pointer: coarse` + `max-height: 600px`), the dropdown automatically goes fullscreen. This is handled entirely via CSS — no JavaScript option needed.

The `.lpi__dropdown--fullscreen` class is applied automatically and uses `position: fixed` to cover the entire viewport.

## Container Class

Add custom classes to the root `.lpi` element:

```js
PhoneInput.mount(el, {
  defaultCountry: 'US',
  containerClass: 'my-phone-input phone-input--large',
});
```

---

## See also

- [API Reference](api-reference.md) — all options and CSS variables
- [Accessibility](accessibility.md) — ARIA patterns and focus styles
- [Advanced Topics](advanced.md) — RTL, dropdown portals
