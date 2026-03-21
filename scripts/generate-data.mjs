#!/usr/bin/env node

/**
 * Generates data/phone-countries.json from Google's libphonenumber metadata.
 *
 * Usage:
 *   node scripts/generate-data.mjs                    # download from GitHub
 *   node scripts/generate-data.mjs --local path.xml   # use local file
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { gzipSync } from 'node:zlib';

const METADATA_URL =
  'https://raw.githubusercontent.com/google/libphonenumber/master/resources/PhoneNumberMetadata.xml';

const OUTPUT_PATH = new URL('../data/phone-countries.json', import.meta.url);

const NUMBER_TYPES = [
  'fixedLine',
  'mobile',
  'pager',
  'tollFree',
  'premiumRate',
  'sharedCost',
  'personalNumber',
  'voip',
  'uan',
  'voicemail',
];

// --- Helpers ---

async function downloadMetadata() {
  const localIdx = process.argv.indexOf('--local');
  if (localIdx !== -1 && process.argv[localIdx + 1]) {
    console.log(`Reading local file: ${process.argv[localIdx + 1]}`);
    return readFileSync(process.argv[localIdx + 1], 'utf-8');
  }

  console.log('Downloading PhoneNumberMetadata.xml...');
  const res = await fetch(METADATA_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  console.log('Download complete.');
  return res.text();
}

/**
 * Parse possibleLengths national attribute.
 * Formats: "10", "7,8,10", "[4-8],10,12"
 */
function parseLengths(national) {
  if (!national) return [];
  const lengths = [];
  for (const part of national.split(',')) {
    const trimmed = part.trim();
    const rangeMatch = trimmed.match(/^\[(\d+)-(\d+)\]$/);
    if (rangeMatch) {
      const lo = parseInt(rangeMatch[1], 10);
      const hi = parseInt(rangeMatch[2], 10);
      for (let i = lo; i <= hi; i++) lengths.push(i);
    } else {
      const n = parseInt(trimmed, 10);
      if (!isNaN(n)) lengths.push(n);
    }
  }
  return lengths;
}

/** Collect possibleLengths from the given number type sections of a territory element. */
function collectLengths(el, types) {
  const lengths = [];
  for (const type of types) {
    const typeEl = el.querySelector(type);
    if (!typeEl) continue;
    const plEl = typeEl.querySelector('possibleLengths');
    if (!plEl) continue;
    const national = plEl.getAttribute('national');
    if (national) lengths.push(...parseLengths(national));
  }
  return lengths;
}

/** Group an array of entries by dial code (`d` field). */
function groupByDialCode(entries) {
  const groups = new Map();
  for (const entry of entries) {
    const key = entry.d;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  }
  return groups;
}

/**
 * Convert a libphonenumber format pattern + format string to an X-mask.
 * Uses example number to determine group sizes by applying the regex.
 * Falls back to regex parsing if no example number matches.
 *
 * Pattern: "(\d{3})(\d{3})(\d{4})"
 * Format:  "$1-$2-$3"
 * Example: "2015550123"
 * Result:  "XXX XXX XXXX"
 */
function convertToMask(pattern, formatStr, exampleNumber) {
  let mask = formatStr;

  if (exampleNumber) {
    try {
      const re = new RegExp(pattern);
      const match = re.exec(exampleNumber);
      if (match) {
        for (let i = 1; i < match.length; i++) {
          if (match[i] != null) {
            const replacement = match[i].replace(/\d/g, 'X');
            mask = mask.replace(`$${i}`, replacement);
          }
        }
      }
    } catch {
      // Malformed pattern from XML — fall through to regex-based approach
    }
  }

  // Fallback: parse group sizes from the regex pattern itself
  if (/\$\d/.test(mask)) {
    const re = /\((?:[^()]*\\d\{(\d+)(?:,(\d+))?\}[^()]*)\)/g;
    const groups = [];
    let m;
    while ((m = re.exec(pattern)) !== null) {
      const size = m[2] ? parseInt(m[2], 10) : parseInt(m[1], 10);
      groups.push(size);
    }
    for (let i = 0; i < groups.length; i++) {
      mask = mask.replace(`$${i + 1}`, 'X'.repeat(groups[i]));
    }
  }

  mask = mask.replace(/\$\d+/g, '');

  // Normalize separators to spaces
  mask = mask
    .replace(/[()]/g, '')
    .replace(/[-./]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Replace any remaining literal digits with X (e.g., Argentina's "15" mobile prefix)
  mask = mask.replace(/\d/g, 'X');

  return mask || null;
}

// --- Territory Extraction ---

function extractTerritories(doc) {
  const territories = [];

  for (const el of doc.querySelectorAll('territory')) {
    const id = el.getAttribute('id');
    if (id === '001') continue; // non-geographical entity

    const countryCode = el.getAttribute('countryCode');
    const nationalPrefix = el.getAttribute('nationalPrefix') || null;
    const mainCountryForCode =
      el.getAttribute('mainCountryForCode') === 'true';

    const formats = [];
    for (const nf of el.querySelectorAll('availableFormats > numberFormat')) {
      const leadingDigitsEls = nf.querySelectorAll('leadingDigits');
      formats.push({
        pattern: nf.getAttribute('pattern'),
        format: nf.querySelector('format')?.textContent?.trim() || null,
        intlFormat: nf.querySelector('intlFormat')?.textContent?.trim() || null,
        leadingDigits: Array.from(leadingDigitsEls).map((ld) =>
          ld.textContent.replace(/\s+/g, ''),
        ),
      });
    }

    const mobileExample =
      el.querySelector('mobile > exampleNumber')?.textContent?.trim() || null;
    const fixedLineExample =
      el.querySelector('fixedLine > exampleNumber')?.textContent?.trim() || null;

    // Prefer fixedLine + mobile lengths; fall back to all types, then generalDesc
    let lengths = collectLengths(el, ['fixedLine', 'mobile']);
    if (lengths.length === 0) {
      lengths = collectLengths(el, NUMBER_TYPES);
    }
    if (lengths.length === 0) {
      const genPl = el.querySelector('generalDesc > possibleLengths');
      const national = genPl?.getAttribute('national');
      if (national) lengths = parseLengths(national);
    }

    territories.push({
      id,
      countryCode,
      nationalPrefix,
      mainCountryForCode,
      formats,
      mobileExample,
      fixedLineExample,
      lengths,
    });
  }

  return territories;
}

// --- Format Selection ---

/**
 * Select the best format for a territory (mobile-first).
 * Returns { pattern, format } or null.
 */
function selectFormat(territory, formatIndex) {
  let { formats } = territory;

  // Inherit from main country for this dial code if no local formats
  if (formats.length === 0) {
    const donor = formatIndex.get(territory.countryCode);
    if (donor) formats = donor.formats;
  }

  if (formats.length === 0) return null;

  const candidates = formats.filter((f) => f.intlFormat !== 'NA' && f.format);

  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  // Use mobile example number to pick the matching format via leadingDigits
  const example = territory.mobileExample;
  if (example) {
    for (const fmt of candidates) {
      if (fmt.leadingDigits.length > 0) {
        try {
          const re = new RegExp('^(?:' + fmt.leadingDigits[0] + ')');
          if (re.test(example)) return fmt;
        } catch {
          // malformed regex, skip
        }
      }
    }
  }

  return candidates[candidates.length - 1];
}

/**
 * Build an index: dialCode → main territory (with formats).
 * Used for format inheritance by territories without their own formats.
 */
function buildFormatIndex(territories) {
  const index = new Map();
  for (const t of territories) {
    if (t.mainCountryForCode && t.formats.length > 0) {
      index.set(t.countryCode, t);
    }
  }
  for (const t of territories) {
    if (!index.has(t.countryCode) && t.formats.length > 0) {
      index.set(t.countryCode, t);
    }
  }
  return index;
}

// --- Priority Assignment ---

function assignPriorities(entries, mainCountryCodes) {
  for (const [, group] of groupByDialCode(entries)) {
    if (group.length === 1) {
      group[0].pri = 0;
      continue;
    }

    const mainEntry = group.find((e) => mainCountryCodes.has(e.c));

    if (mainEntry) {
      mainEntry.pri = 0;
      const rest = group
        .filter((e) => e !== mainEntry)
        .sort((a, b) => a.c.localeCompare(b.c));
      let priority = 1;
      for (const entry of rest) {
        entry.pri = priority++;
      }
    } else {
      group.sort((a, b) => a.c.localeCompare(b.c));
      for (let i = 0; i < group.length; i++) {
        group[i].pri = i;
      }
    }
  }
}

// --- Verification ---

function verify(data, jsonStr) {
  const issues = [];

  console.log(`\nTotal countries: ${data.length}`);

  const checks = [
    { c: 'US', d: '1', p: '1', min: 10, max: 10 },
    { c: 'GB', d: '44', p: '0', min: 9, max: 10 },
  ];
  for (const check of checks) {
    const entry = data.find((e) => e.c === check.c);
    if (!entry) {
      issues.push(`Missing ${check.c}`);
      continue;
    }
    if (entry.d !== check.d) issues.push(`${check.c} dialCode: got ${entry.d}, expected ${check.d}`);
    if (entry.p !== check.p) issues.push(`${check.c} prefix: got ${entry.p}, expected ${check.p}`);
    if (entry.min !== check.min) issues.push(`${check.c} min: got ${entry.min}, expected ${check.min}`);
    if (entry.max !== check.max) issues.push(`${check.c} max: got ${entry.max}, expected ${check.max}`);
  }

  for (const [dialCode, group] of groupByDialCode(data)) {
    const zeros = group.filter((e) => e.pri === 0);
    if (zeros.length !== 1) {
      issues.push(`Dial code +${dialCode}: ${zeros.length} entries with pri=0 (expected 1)`);
    }
  }

  for (const entry of data) {
    if (!entry.c || !entry.n || !entry.d || entry.min == null || entry.max == null || entry.pri == null) {
      issues.push(`${entry.c}: missing required field`);
    }
    if (entry.min > entry.max) {
      issues.push(`${entry.c}: min (${entry.min}) > max (${entry.max})`);
    }
    if (entry.f && !/^[X \-]+$/.test(entry.f)) {
      issues.push(`${entry.c}: invalid format mask chars: "${entry.f}"`);
    }
  }

  const gzipped = gzipSync(jsonStr);
  console.log(`File size: ${(jsonStr.length / 1024).toFixed(1)}KB raw, ${(gzipped.length / 1024).toFixed(1)}KB gzipped`);

  if (issues.length > 0) {
    console.log('\nVerification issues:');
    for (const issue of issues) console.log(`  ⚠ ${issue}`);
  } else {
    console.log('Verification: all checks passed.');
  }

  console.log('\nSample entries:');
  for (const code of ['US', 'CA', 'GB', 'DE', 'JP', 'AU', 'BR', 'IN']) {
    const entry = data.find((e) => e.c === code);
    if (entry) console.log(`  ${JSON.stringify(entry)}`);
  }
}

// --- Main ---

async function main() {
  const xml = await downloadMetadata();

  console.log('Parsing metadata...');
  const dom = new JSDOM(xml, { contentType: 'text/xml' });
  const territories = extractTerritories(dom.window.document);
  console.log(`Extracted ${territories.length} territories.`);

  const formatIndex = buildFormatIndex(territories);
  const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });

  // Collect mainCountryForCode flags into a Set for assignPriorities
  const mainCountryCodes = new Set(
    territories.filter((t) => t.mainCountryForCode).map((t) => t.id),
  );

  const entries = [];
  const warnings = [];

  for (const t of territories) {
    let name;
    try {
      name = displayNames.of(t.id);
    } catch {
      name = t.id;
      warnings.push(`Could not resolve name for ${t.id}, using ISO code`);
    }

    const selectedFormat = selectFormat(t, formatIndex);
    let mask = null;
    if (selectedFormat) {
      const example = t.mobileExample || t.fixedLineExample;
      mask = convertToMask(selectedFormat.pattern, selectedFormat.format, example);
    }

    let min, max;
    if (t.lengths.length > 0) {
      min = Math.min(...t.lengths);
      max = Math.max(...t.lengths);
    } else if (mask) {
      const xCount = (mask.match(/X/g) || []).length;
      min = xCount;
      max = xCount;
    } else {
      min = 4;
      max = 15;
      warnings.push(`${t.id}: no length data, using fallback 4-15`);
    }

    entries.push({
      c: t.id,
      n: name,
      d: t.countryCode,
      f: mask,
      p: t.nationalPrefix,
      min,
      max,
      pri: 0,
    });
  }

  assignPriorities(entries, mainCountryCodes);
  entries.sort((a, b) => a.n.localeCompare(b.n, 'en'));

  const json = JSON.stringify(entries, null, 2);
  writeFileSync(OUTPUT_PATH, json + '\n', 'utf-8');
  console.log(`\nWrote ${OUTPUT_PATH.pathname}`);

  if (warnings.length > 0) {
    console.log('\nWarnings:');
    for (const w of warnings) console.log(`  ⚠ ${w}`);
  }

  verify(entries, json);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
