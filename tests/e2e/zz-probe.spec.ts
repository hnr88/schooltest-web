import { test, expect } from '@playwright/test';

test('skip link focus + enter', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.keyboard.press('Tab');
  const f = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    return `${el.tagName} href=${el.getAttribute('href')} text=${el.textContent?.trim()} focusVisible=${el.matches(':focus-visible')}`;
  });
  console.log('FIRST_TAB:', f);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  const f2 = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const main = document.querySelector('main');
    return `active=${el.tagName}#${el.id} isMain=${el === main} mainContains=${main?.contains(el) ?? false}`;
  });
  console.log('AFTER_ENTER:', f2);
});

test('active nav border on /teach', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/teach');
  const nav = page.getByRole('navigation', { name: 'Primary' });
  const rows = await nav.locator('a').evaluateAll((as) => as.map((a) => ({
    text: a.textContent?.trim(),
    href: a.getAttribute('href'),
    bbc: getComputedStyle(a).borderBottomColor,
    bbw: getComputedStyle(a).borderBottomWidth,
  })));
  console.log(JSON.stringify(rows, null, 1));
});
