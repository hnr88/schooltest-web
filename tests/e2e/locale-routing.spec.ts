import { expect, test, type Page } from '@playwright/test';

import { cat, heroTitleLines, home, loadMessages, type AnyLocale } from './helpers/i18n';

const ALL_LOCALES: readonly AnyLocale[] = ['en', 'zh', 'ko', 'ms', 'vi', 'th'];

function pathFor(locale: AnyLocale): string {
  return locale === 'en' ? '/' : `/${locale}`;
}

async function expectNoLocaleCookie(page: Page): Promise<void> {
  const cookies = await page.context().cookies();
  expect(cookies.some((cookie) => cookie.name === 'NEXT_LOCALE')).toBe(false);
}

for (const locale of ALL_LOCALES) {
  test(`locale URL: ${locale} renders from its canonical landing URL`, async ({ page }) => {
    const messages = loadMessages(locale);
    const expectedPath = pathFor(locale);

    await page.goto(expectedPath);

    await expect(page).toHaveURL((url) => url.pathname === expectedPath);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    for (const line of heroTitleLines(messages)) {
      await expect(page.locator('h1')).toContainText(line);
    }
    await expect(page.getByText(home(messages, 'hero.subtitle'), { exact: true })).toBeVisible();
    await expectNoLocaleCookie(page);
  });
}

test('locale URL: the default locale canonicalizes /en to an unprefixed URL', async ({ page }) => {
  await page.goto('/en?source=locale-routing');

  await expect(page).toHaveURL(
    (url) => url.pathname === '/' && url.search === '?source=locale-routing',
  );
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expectNoLocaleCookie(page);
});

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
    await expect(
      page.getByText(home(loadMessages('en'), 'hero.subtitle'), { exact: true }),
    ).toBeVisible();
    await expectNoLocaleCookie(page);
  } finally {
    await context.close();
  }
});

test('locale selector: stays compact, shows language names, and preserves route state', async ({
  page,
}) => {
  const zh = loadMessages('zh');
  const en = loadMessages('en');
  const footer = page.getByRole('contentinfo');

  await page.goto('/zh?source=locale-routing#pricing');

  const zhSelector = footer.getByRole('combobox', {
    name: cat(zh, 'LocaleSwitcher.label'),
    exact: true,
  });
  await expect(zhSelector).toHaveText(/^\s*中文\s*(?:▼)?\s*$/);
  await expect(zhSelector).toHaveClass(/\bw-24\b/);
  await zhSelector.click();
  await page.getByRole('option', { name: 'English', exact: true }).click();

  await expect(page).toHaveURL(
    (url) =>
      url.pathname === '/' && url.search === '?source=locale-routing' && url.hash === '#pricing',
  );
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expectNoLocaleCookie(page);

  const enSelector = footer.getByRole('combobox', {
    name: cat(en, 'LocaleSwitcher.label'),
    exact: true,
  });
  await expect(enSelector).toHaveText(/^\s*English\s*(?:▼)?\s*$/);
  await enSelector.click();
  await page.getByRole('option', { name: '中文', exact: true }).click();

  await expect(page).toHaveURL(
    (url) =>
      url.pathname === '/zh' && url.search === '?source=locale-routing' && url.hash === '#pricing',
  );
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
  await expectNoLocaleCookie(page);
});

test('locale URL: non-default prefixes survive public deep links', async ({ page }) => {
  await page.goto('/ko/design-system?source=locale-routing');

  await expect(page).toHaveURL(
    (url) => url.pathname === '/ko/design-system' && url.search === '?source=locale-routing',
  );
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  await expectNoLocaleCookie(page);
});
