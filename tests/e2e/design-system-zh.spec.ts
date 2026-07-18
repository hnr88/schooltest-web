import { expect, test } from '@playwright/test';

import { ds, escapeRegExp, loadMessages } from './helpers/i18n';
import { watchErrors } from './helpers/ui';

// Chinese showcase render (cookie-driven locale) — split from design-system.spec.ts (file cap).
const zh = loadMessages('zh');

test('DS Chinese: NEXT_LOCALE=zh renders the showcase from zh.json', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ baseURL });
  await context.addCookies([
    { name: 'NEXT_LOCALE', value: 'zh', url: baseURL ?? 'http://localhost:3100' },
  ]);
  const page = await context.newPage();
  const errors = watchErrors(page);
  try {
    await page.goto('/design-system');
    await expect(page).toHaveTitle(new RegExp(escapeRegExp(ds(zh, 'meta.title'))));
    await expect(page.getByRole('heading', { level: 1, name: ds(zh, 'pageTitle') })).toBeVisible();
    for (const key of ['sectionBrand', 'sectionCards', 'sectionData'] as const) {
      await expect(
        page.getByRole('heading', { level: 2, name: ds(zh, key), exact: true }),
      ).toBeVisible();
    }
    expect(errors, errors.join('\n')).toEqual([]);
  } finally {
    await context.close();
  }
});
