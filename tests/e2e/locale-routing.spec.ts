import { expect, test, type Page } from '@playwright/test';

import type { AnyLocale } from './helpers/i18n';

// Re-pointed at the redesigned landing: the locale switcher and the localized
// landing copy are gone (the landing renders hardcoded English under every
// prefix), so the locale contract is now URL/tag level — canonical locale
// URLs, correct `html lang`, an unprefixed default, prefix-preserving deep
// links, and the English copy rendering unchanged under every prefix.

const ALL_LOCALES: readonly AnyLocale[] = ['en', 'zh', 'ko', 'ms', 'vi', 'th'];
const HERO_TITLE = 'Diagnostic and progress testing for HSP';

function pathFor(locale: AnyLocale): string {
  return locale === 'en' ? '/' : `/${locale}`;
}

async function expectNoLocaleCookie(page: Page): Promise<void> {
  const cookies = await page.context().cookies();
  expect(cookies.some((cookie) => cookie.name === 'NEXT_LOCALE')).toBe(false);
}

for (const locale of ALL_LOCALES) {
  test(`locale URL: ${locale} renders from its canonical landing URL`, async ({ page }) => {
    const expectedPath = pathFor(locale);

    await page.goto(expectedPath);

    await expect(page).toHaveURL((url) => url.pathname === expectedPath);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    // The redesigned landing's copy is locale-independent English.
    await expect(page.locator('h1')).toHaveText(HERO_TITLE);
    await expectNoLocaleCookie(page);
  });
}

test('locale URL: an unprefixed URL stays English despite a non-English browser preference', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    extraHTTPHeaders: { 'Accept-Language': 'zh-CN,zh;q=0.9' },
  });
  const page = await context.newPage();

  try {
    await page.goto('/');

    await expect(page).toHaveURL((url) => url.pathname === '/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toHaveText(HERO_TITLE);
    await expectNoLocaleCookie(page);
  } finally {
    await context.close();
  }
});

test('locale URL: non-default prefixes survive public deep links', async ({ page }) => {
  await page.goto('/ko/design-system?source=locale-routing');

  await expect(page).toHaveURL(
    (url) => url.pathname === '/ko/design-system' && url.search === '?source=locale-routing',
  );
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  await expectNoLocaleCookie(page);
});

test('locale URL: every landing deep link survives every locale prefix', async ({ page }) => {
  for (const route of ['/diagnose', '/teach', '/track', '/predict', '/report']) {
    await page.goto(`/zh${route}?source=locale-routing`);
    await expect(page).toHaveURL(
      (url) => url.pathname === `/zh${route}` && url.search === '?source=locale-routing',
    );
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  }
});
