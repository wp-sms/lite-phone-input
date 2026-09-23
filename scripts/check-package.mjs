import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const temporary = mkdtempSync(join(tmpdir(), 'lite-phone-input-package-'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
try {
  const [packed] = JSON.parse(execFileSync(npm, ['pack', '--ignore-scripts', '--json', '--pack-destination', temporary], { encoding: 'utf8' }));
  const tarball = join(temporary, packed.filename);
  for (const major of ['17', '19']) {
    const consumer = join(temporary, `react-${major}`);
    execFileSync(npm, ['install', '--prefix', consumer, '--ignore-scripts', '--no-audit', '--no-fund', tarball, `react@${major}`, `react-dom@${major}`, `@types/react@${major}`, 'preact@10', 'react-hook-form@7', 'formik@2'], { stdio: 'pipe' });
    const esm = `import assert from 'node:assert/strict';
import { countries, validatePhone } from 'lite-phone-input';
import { PhoneInput as Vanilla } from 'lite-phone-input/vanilla';
import { PhoneInput } from 'lite-phone-input/react';
import { PhoneInput as Preact } from 'lite-phone-input/preact';
import React from 'react';
import { renderToString } from 'react-dom/server${major === '17' ? '.js' : ''}';
assert(countries.length >= 240);
assert.equal(typeof Vanilla.mount, 'function');
assert.equal(typeof Preact, 'function');
assert.equal(validatePhone('2025551234', countries.find(c => c.code === 'US')).valid, true);
assert.equal(renderToString(React.createElement(PhoneInput, { defaultCountry: 'US' })), '<div></div>');`;
    writeFileSync(join(consumer, 'smoke.mjs'), esm);
    execFileSync(process.execPath, ['smoke.mjs'], { cwd: consumer, stdio: 'inherit' });
    writeFileSync(join(consumer, 'smoke.cjs'), `const assert = require('node:assert/strict');
for (const path of ['lite-phone-input', 'lite-phone-input/vanilla', 'lite-phone-input/react', 'lite-phone-input/preact']) assert(Object.keys(require(path)).length > 0);
assert(require.resolve('lite-phone-input/styles').endsWith('styles.css'));`);
    execFileSync(process.execPath, ['smoke.cjs'], { cwd: consumer, stdio: 'inherit' });
    const types = `import { PhoneInput, type PhoneInputRef } from 'lite-phone-input/react';
import { PhoneInput as Preact } from 'lite-phone-input/preact';
import { PhoneInput as Vanilla } from 'lite-phone-input/vanilla';
import { validatePhone, countries } from 'lite-phone-input';
const ref = {} as PhoneInputRef; ref.focus(); ref.reset(); ref.setValue('+12025551234');
void [PhoneInput, Preact, Vanilla, validatePhone('2025551234', countries[0])];`;
    for (const extension of ['mts', 'cts']) writeFileSync(join(consumer, `consumer.${extension}`), types);
    const examples = [...readFileSync('docs/form-integration.md', 'utf8').matchAll(/```tsx\n([\s\S]*?)```/g)];
    const exampleFiles = examples.map((match, i) => {
      const file = `form-example-${i}.tsx`;
      writeFileSync(join(consumer, file), match[1]);
      return file;
    });
    execFileSync(process.execPath, [resolve('node_modules/typescript/bin/tsc'), '--noEmit', '--strict', '--skipLibCheck', '--jsx', 'react-jsx', '--esModuleInterop', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--target', 'ES2020', 'consumer.mts', 'consumer.cts', ...exampleFiles], { cwd: consumer, stdio: 'inherit' });
    const reactEntry = readFileSync(join(consumer, 'node_modules/lite-phone-input/dist/react/index.js'), 'utf8');
    assert.match(reactEntry, /^["']use client["'];/);
    console.log(`Packed ESM, CJS, types, form examples and SSR passed with React ${major} and Preact 10.`);
  }
  const size = gzipSync(readFileSync('dist/vanilla/index.global.js')).length;
  assert(size <= 15000, `Standalone gzip budget exceeded: ${size} bytes > 15000 bytes`);
  console.log(`Standalone browser bundle: ${size} bytes gzipped (budget: 15000).`);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
