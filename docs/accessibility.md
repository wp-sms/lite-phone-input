[Home](../README.md) > Accessibility

# Accessibility

lite-phone-input targets **WCAG 2.1 AA** compliance. This page documents the ARIA patterns, keyboard interactions, and screen reader behavior built into the widget.

## ARIA Roles and Attributes

### Country Trigger Button

When `allowDropdown: true` (default), the trigger is a `<button>` with:

| Attribute | Value | Description |
|---|---|---|
| `role` | `combobox` | Indicates a composite widget with a popup |
| `aria-expanded` | `true` / `false` | Reflects dropdown open/closed state |
| `aria-haspopup` | `listbox` | Indicates the popup contains a listbox |
| `aria-label` | `"Select country"` | Accessible name for the button |
| `type` | `button` | Prevents form submission on click |

When `allowDropdown: false`, the trigger is a `<span>` (not interactive).

### Dropdown

| Element | Attribute | Value |
|---|---|---|
| Dropdown container | `role` | `dialog` |
| Dropdown container | `aria-label` | `"Select country"` |
| Search input | `role` | `combobox` |
| Search input | `aria-expanded` | `true` |
| Search input | `aria-controls` | `lpi-list-{id}` (references the listbox) |
| Search input | `aria-autocomplete` | `list` |
| Search input | `aria-activedescendant` | ID of the highlighted option |
| Country list | `role` | `listbox` |
| Country list | `id` | `lpi-list-{id}` |
| Country item | `role` | `option` |
| Country item | `aria-selected` | `true` / `false` |
| Separator | `role` | `separator` |

### Live Region

A visually hidden `<div>` with `aria-live="polite"` announces the result count when the user searches (e.g., "5 results", "1 result").

### Phone Input

| Attribute | Value | Description |
|---|---|---|
| `type` | `tel` | Triggers phone keyboard on mobile |
| `inputMode` | `tel` | Ensures numeric keyboard on mobile browsers |
| `autocomplete` | `tel` | Enables browser autofill for phone numbers |
| `dir` | `ltr` | Forces left-to-right input even in RTL layouts |

## Keyboard Navigation

### Phone Input

| Key | Action |
|---|---|
| **Tab** | Moves focus: trigger → input (standard tab order) |

### Dropdown (when open)

| Key | Action |
|---|---|
| **Arrow Down** | Move highlight to next country (wraps to top) |
| **Arrow Up** | Move highlight to previous country (wraps to bottom) |
| **Enter** | Select the highlighted country and close |
| **Escape** | Close the dropdown, return focus to trigger |
| **Tab** | Close the dropdown |
| **Any letter** | Types into the search input (auto-focused on open) |

### Trigger Button

| Key | Action |
|---|---|
| **Enter / Space** | Open the dropdown |

## Focus Management

1. **Dropdown opens**: focus moves to the search input inside the dropdown
2. **Country selected** (Enter or click): dropdown closes, focus moves to the phone input
3. **Escape pressed**: dropdown closes, focus returns to the trigger button
4. **Click outside**: dropdown closes

The currently selected country is highlighted when the dropdown opens, and the list scrolls to show it.

## Screen Reader Behavior

- The trigger button announces "Select country" via `aria-label`
- When the dropdown opens, the search input is focused and announced as a combobox
- As the user arrows through countries, `aria-activedescendant` updates to announce each option
- The live region announces result counts as the user types in search (e.g., "5 results")
- Each country option announces: flag + country name + dial code
- The selected country has `aria-selected="true"`

## Disabled State

When `disabled: true`:
- The container gets `.lpi--disabled` (opacity 0.6, `pointer-events: none`)
- The `<input>` element gets `disabled` attribute
- The trigger `<button>` gets `disabled` attribute
- No keyboard or mouse interaction is possible

## Best Practices for Consumers

### Always provide a label

```jsx
// Option 1: Visible label
<label htmlFor="phone">Phone number</label>
<PhoneInput defaultCountry="US" id="phone" />

// Option 2: aria-label
<PhoneInput defaultCountry="US" aria-label="Phone number" />

// Option 3: aria-labelledby
<h3 id="phone-heading">Contact Phone</h3>
<PhoneInput defaultCountry="US" aria-labelledby="phone-heading" />
```

### Connect error messages

```jsx
<PhoneInput
  defaultCountry="US"
  aria-describedby={error ? 'phone-error' : undefined}
  aria-invalid={!!error}
/>
{error && <p id="phone-error" role="alert">{error}</p>}
```

### Required field

```jsx
<PhoneInput defaultCountry="US" required aria-required="true" />
```

---

## See also

- [API Reference](api-reference.md) — `disabled`, `inputAttributes`, `allowDropdown` options
- [Styling & Theming](styling.md) — focus styles, `.lpi--disabled` modifier
- [Advanced Topics](advanced.md) — RTL support
