import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/index.ts', 'src/**/index.tsx'],
    },
  },
});
