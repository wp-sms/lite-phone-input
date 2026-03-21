# Contributing to lite-phone-input

Thank you for your interest in contributing! This guide covers development setup, project structure, and how to submit changes.

## Development Setup

### Prerequisites

- Node.js 18+
- npm 9+

### Getting Started

```bash
git clone https://github.com/wp-sms/lite-phone-input.git
cd lite-phone-input
npm install
```

### Common Commands

```bash
npm run build          # Build all packages (tsup)
npm run dev            # Watch mode build
npm test               # Run tests (vitest)
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage
npm run typecheck      # TypeScript type checking (tsc --noEmit)
npm run example        # Build and open vanilla example
```

## Project Structure

```
lite-phone-input/
├── data/
│   └── phone-countries.json     # Country data (generated)
├── dist/                        # Build output
├── docs/                        # Documentation
├── examples/
│   └── vanilla.html             # Vanilla JS demo page
├── scripts/
│   └── generate-data.mjs        # Country data generation script
├── src/
│   ├── core/
│   │   ├── countries.ts         # Country functions (getFlag, getCountryByCode, etc.)
│   │   ├── format.ts            # formatPhone, extractDigits, normalizeNumerals
│   │   ├── index.ts             # Public core exports
│   │   ├── types.ts             # All TypeScript types
│   │   └── validate.ts          # validatePhone
│   ├── vanilla/
│   │   ├── dropdown.ts          # Dropdown component
│   │   ├── phone-input.ts       # Main PhoneInput class
│   │   ├── styles.css           # Stylesheet
│   │   └── index.ts             # Vanilla entry point
│   ├── react/
│   │   ├── PhoneInput.tsx       # React adapter
│   │   └── index.ts             # React entry point
│   └── preact/
│       ├── PhoneInput.tsx       # Preact adapter
│       └── index.ts             # Preact entry point
├── tests/                       # Test files
├── tsconfig.json
├── tsup.config.ts               # Build configuration
└── vitest.config.ts             # Test configuration
```

## How to Contribute

### Reporting Bugs

Open an issue on GitHub with:
- A clear title describing the bug
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS information
- A minimal reproduction (CodeSandbox, StackBlitz, or code snippet)

### Suggesting Features

Open an issue describing:
- The use case and problem you're solving
- Your proposed solution
- Whether you're willing to implement it

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `npm test`
5. Run type checking: `npm run typecheck`
6. Build: `npm run build`
7. Commit with a descriptive message
8. Push to your fork and open a PR

## PR Guidelines

- **One concern per PR** — don't mix features, bug fixes, and refactors
- **Include tests** for new features and bug fixes
- **Update types** if you change the public API
- **Run the full check** before submitting: `npm run typecheck && npm test && npm run build`
- **Keep bundle size in mind**

## Code Style

- TypeScript strict mode
- No default exports (use named exports)
- BEM naming for CSS classes under `.lpi` namespace
- CSS custom properties prefixed with `--lpi-`
- Prefer `const` over `let`; avoid `var`
- Use `AbortController` for event listener cleanup

## Testing

Tests use [Vitest](https://vitest.dev/) with jsdom for DOM testing.

```bash
npm test                  # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
```

When writing tests:
- Test public API behavior, not implementation details
- Include edge cases (empty input, max length, special characters)
- Test both vanilla and framework adapters when relevant

## Updating Country Data

Country data lives in `data/phone-countries.json`. To regenerate:

```bash
npm run generate-data
```

This runs `scripts/generate-data.mjs`, which produces the JSON file with format masks, dial codes, validation lengths, and priorities for all countries.

After regenerating:
1. Spot-check a few countries for correctness
2. Run the tests to ensure nothing broke
3. Note any changes in your PR description

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
