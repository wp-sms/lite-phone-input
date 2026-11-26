import { test, expect, type Page } from '@playwright/test';
import type { PhoneInputOptions } from '../../src/core/types';
import AxeBuilder from '@axe-core/playwright';
import path from 'node:path';

test.beforeEach(async ({ page }) => {
  await page.setContent('<!doctype html><html lang="en"><head><title>Phone input test</title></head><body><main><form><label for="phone">Phone number</label><div id="mount"></div><button type="reset">Reset</button><button type="submit">Submit</button></form></main></body></html>');
  await page.addStyleTag({ path: path.resolve('dist/styles.css') });
  await page.addScriptTag({ path: path.resolve('dist/vanilla/index.global.js') });
});
async function mount(page: Page, options: Partial<PhoneInputOptions> = {}) {
  await page.evaluate(options => {
    const w = window as any;
    w.phone = w.LitePhoneInput.PhoneInput.mount(document.querySelector('#mount'), {
      defaultCountry: 'US', inputAttributes: { id: 'phone' }, ...options,
    });
  }, options);
}

test('international replacement, paste selection, and native reset preserve numbers', async ({ page }) => {
  await mount(page, { separateDialCode: true, initialValue: '+12025551234', hiddenInput: { phone: 'canonical' } });
  const input = page.locator('#phone');
  await input.fill('+447400123456');
  expect(await page.evaluate(() => (window as any).phone.getValue())).toBe('+447400123456');
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(input).toHaveValue('202 555 1234');
  await input.evaluate((el: HTMLInputElement) => {
    el.setSelectionRange(4, 7);
    const clipboardData = new DataTransfer(); clipboardData.setData('text', '999');
    const event = new ClipboardEvent('paste', { bubbles: true, cancelable: true });
    // Firefox protects data supplied to synthetic ClipboardEvent constructors.
    // Supply the clipboard payload explicitly to exercise the real paste listener.
    Object.defineProperty(event, 'clipboardData', { value: clipboardData });
    el.dispatchEvent(event);
  });
  await expect(input).toHaveValue('202 999 1234');
  expect(await page.evaluate(() => new FormData(document.querySelector('form')!).get('canonical'))).toBe('+12029991234');
});

test('keyboard selection, dismissal, and toggle work', async ({ page }) => {
  await mount(page);
  const trigger = page.getByRole('button', { name: /Select country/ });
  await trigger.click();
  const search = page.getByRole('combobox', { name: 'Search countries' });
  await search.fill('GB');
  await expect(page.getByRole('option')).toHaveCount(1);
  await search.press('Enter');
  await expect(page.locator('#phone')).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-label', /United Kingdom/);
  await trigger.click();
  await search.press('Escape');
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole('button', { name: 'Close country selector' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await trigger.click();
  await page.evaluate(() => (window as any).phone.setOptions({ disabled: true }));
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('#phone')).toBeDisabled();
});

test('closed shadow root permits real mouse selection and outside dismissal', async ({ page }) => {
  await page.evaluate(() => {
    const w = window as any;
    const root = document.querySelector('#mount')!.attachShadow({ mode: 'closed' });
    for (const style of document.querySelectorAll('style')) root.append(style.cloneNode(true));
    const host = document.createElement('div'); root.append(host);
    w.shadow = root;
    w.phone = w.LitePhoneInput.PhoneInput.mount(host, { defaultCountry: 'US', allowedCountries: ['US', 'GB'], dropdownContainer: host });
    root.querySelector('button')!.click();
  });
  const clickInside = async (selector: string) => {
    const point = await page.evaluate(selector => {
      const element = (window as any).shadow.querySelector(selector);
      element.scrollIntoView();
      const rect = element.getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    }, selector);
    await page.mouse.click(point.x, point.y);
  };
  await clickInside('.lpi__search');
  expect(await page.evaluate(() => !!(window as any).shadow.querySelector('.lpi__dropdown'))).toBe(true);
  await clickInside('[data-code="GB"]');
  expect(await page.evaluate(() => (window as any).phone.getCountry().code)).toBe('GB');
  await page.evaluate(() => (window as any).shadow.querySelector('button').click());
  // The fullscreen popup covers the page on mobile. Use an actual outside
  // pointer target above it to exercise event retargeting in every viewport.
  await page.getByRole('button', { name: 'Submit', exact: true }).evaluate(el => {
    el.style.cssText = 'position:fixed;right:0;top:0;z-index:20000';
    el.setAttribute('type', 'button');
  });
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  expect(await page.evaluate(() => !!(window as any).shadow.querySelector('.lpi__dropdown'))).toBe(false);
});

test('widget passes automated accessibility checks closed and open', async ({ page }) => {
  await mount(page);
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: /Select country/ }).click();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
});

/** A transformed modal (centered, or pinned near the top) whose body scrolls, with the field rendered inline inside it. */
async function mountInModal(page: Page, { height, before, after = 0, top, scale = 1 }: { height: number; before: number; after?: number; top?: number; scale?: number }) {
  await page.evaluate(({ height, before, after, top, scale }) => {
    const modal = document.createElement('div');
    const place = top === undefined ? `top:50%;transform:translate(-50%,-50%) scale(${scale})` : `top:${top}px;transform:translateX(-50%) scale(${scale})`;
    modal.style.cssText = `position:fixed;${place};left:50%;width:360px;background:#fff;border:1px solid #ccc`;
    const body = document.createElement('div');
    body.id = 'modal-body';
    body.style.cssText = `height:${height}px;overflow-y:auto;padding:8px`;
    const spacer = (h: number) => Object.assign(document.createElement('div'), { style: `height:${h}px` });
    body.append(spacer(before), document.querySelector('#mount')!, spacer(after));
    modal.append(body);
    document.body.append(modal);
  }, { height, before, after, top, scale });
  await mount(page, { defaultCountry: 'US', dropdownContainer: 'inline' });
}
const modalScrollTop = (page: Page) => page.evaluate(() => document.querySelector('#modal-body')!.scrollTop);
const nextFrames = (page: Page) => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
/** Dropdown and modal-body rects, and whether the highlighted option is inside the list. */
const layout = (page: Page) => page.evaluate(() => {
  const dropdown = document.querySelector('.lpi__dropdown')!;
  const listEl = dropdown.querySelector('.lpi__list')!;
  const body = document.querySelector('#modal-body')!;
  const b = body.getBoundingClientRect();
  const l = listEl.getBoundingClientRect();
  const h = listEl.querySelector('.lpi__option--highlighted')!.getBoundingClientRect();
  const d = dropdown.getBoundingClientRect();
  return {
    above: dropdown.classList.contains('lpi__dropdown--above'),
    fitsInBody: d.top >= b.top - 1 && d.bottom <= b.bottom + 1, // modal body has no border
    listScrollTop: listEl.scrollTop,
    highlightInList: h.top >= l.top - 2 && h.bottom <= l.bottom + 2,
  };
});

test('inline list inside a tiny scrolling modal stays open and does not scroll the modal (issue #4)', async ({ page }) => {
  // Too little room either side: even the minimum-height list overflows the modal body.
  await mountInModal(page, { height: 120, before: 40, after: 300 });
  const trigger = page.getByRole('button', { name: /Select country/ });
  const before = await modalScrollTop(page);
  await trigger.click();
  await nextFrames(page);
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await modalScrollTop(page)).toBe(before);
  const search = page.getByRole('combobox', { name: 'Search countries' });
  await search.press('ArrowDown');
  await nextFrames(page);
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await modalScrollTop(page)).toBe(before);
  // The inline list moves with the field, so scrolling the modal (here, by the user;
  // when typing, by the browser revealing the caret) must not close it.
  await page.locator('#modal-body').evaluate(el => { el.scrollTop = 60; });
  await nextFrames(page);
  await expect(page.getByRole('dialog')).toBeVisible();
  await search.fill('GB');
  await expect(page.getByRole('option')).toHaveCount(1);
  await search.press('Enter');
  await expect(trigger).toHaveAttribute('aria-label', /United Kingdom/);
});

test('inline list shrinks to fit below the field inside a scrolling modal', async ({ page, isMobile }) => {
  test.skip(isMobile, 'mobile uses the fullscreen list');
  await mountInModal(page, { height: 320, before: 120, after: 200 });
  const trigger = page.getByRole('button', { name: /Select country/ });
  const before = await modalScrollTop(page);
  await trigger.click();
  await nextFrames(page);
  await expect(page.getByRole('dialog')).toBeVisible();
  const result = await layout(page);
  expect(result).toMatchObject({ above: false, fitsInBody: true, highlightInList: true });
  expect(result.listScrollTop).toBeGreaterThan(0);
  // The selected country is visible, so a real click needs no scrolling.
  await page.locator('.lpi__option--highlighted').click();
  await page.locator('#phone').focus();
  await trigger.click();
  await page.locator('[data-code="CA"]').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toHaveAttribute('aria-label', /Canada/);
  expect(await modalScrollTop(page)).toBe(before);
});

test('inline list opens above the field when the scrolling modal has more room there', async ({ page, isMobile }) => {
  test.skip(isMobile, 'mobile uses the fullscreen list');
  // The window has room below the field; only the modal body doesn't.
  await mountInModal(page, { height: 400, before: 330, top: 20 });
  await page.getByRole('button', { name: /Select country/ }).click();
  await nextFrames(page);
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await layout(page)).toMatchObject({ above: true, fitsInBody: true, highlightInList: true });
});

test('inline list fits and scrolls correctly inside a scaled modal', async ({ page, isMobile }) => {
  test.skip(isMobile, 'mobile uses the fullscreen list');
  // Room below is 50px short of the list in CSS pixels, but would look sufficient in screen pixels.
  await mountInModal(page, { height: 320, before: 120, after: 200, scale: 0.6 });
  await page.getByRole('button', { name: /Select country/ }).click();
  await nextFrames(page);
  await expect(page.getByRole('dialog')).toBeVisible();
  const result = await layout(page);
  expect(result).toMatchObject({ fitsInBody: true, highlightInList: true });
  expect(result.listScrollTop).toBeGreaterThan(0);
});
