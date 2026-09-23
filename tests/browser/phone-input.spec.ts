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
