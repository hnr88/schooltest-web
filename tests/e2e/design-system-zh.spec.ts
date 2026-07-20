import { expect, test } from '@playwright/test';

import { ds, escapeRegExp, loadMessages } from './helpers/i18n';
import { watchErrors } from './helpers/ui';

// Chinese showcase render — split from design-system.spec.ts (file cap).
const zh = loadMessages('zh');

test('DS Chinese: /zh/design-system renders the showcase from zh.json', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/zh/design-system');
  await expect(page).toHaveURL((url) => url.pathname === '/zh/design-system');
  await expect(page).toHaveTitle(new RegExp(escapeRegExp(ds(zh, 'meta.title'))));
  await expect(page.getByRole('heading', { level: 1, name: ds(zh, 'pageTitle') })).toBeVisible();
  for (const key of ['sectionBrand', 'sectionCards', 'sectionData'] as const) {
    await expect(
      page.getByRole('heading', { level: 2, name: ds(zh, key), exact: true }),
    ).toBeVisible();
  }
  expect(errors, errors.join('\n')).toEqual([]);
});
