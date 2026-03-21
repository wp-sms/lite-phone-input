import { defineConfig } from 'tsup';

export default defineConfig([
  // Core utilities (headless/server use)
  {
    entry: ['src/core/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    outDir: 'dist/core',
    clean: true,
    sourcemap: true,
  },
  // Vanilla JS widget
  {
    entry: ['src/vanilla/index.ts'],
    format: ['esm', 'cjs', 'iife'],
    dts: true,
    outDir: 'dist/vanilla',
    clean: true,
    sourcemap: true,
    globalName: 'LitePhoneInput',
  },
  // React adapter
  {
    entry: ['src/react/index.tsx'],
    format: ['esm', 'cjs'],
    dts: true,
    outDir: 'dist/react',
    clean: true,
    sourcemap: true,
    external: ['react', 'react-dom'],
    jsx: 'automatic',
  },
  // Preact adapter
  {
    entry: ['src/preact/index.tsx'],
    format: ['esm', 'cjs'],
    dts: true,
    outDir: 'dist/preact',
    clean: true,
    sourcemap: true,
    external: ['preact'],
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
  },
]);
