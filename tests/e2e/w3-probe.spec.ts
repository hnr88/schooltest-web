import { expect, test } from '@playwright/test';

import { loginAs } from './helpers/roles';

// THROWAWAY W3 diagnostic — classes list row anchors.
test('probe: classes list row link hrefs', async ({ page }) => {
  test.setTimeout(180_000);
  page.setDefaultTimeout(60_000);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await loginAs(page, 'schoolAdmin');
      break;
    } catch {
      await page.waitForTimeout(20_000);
      if (attempt === 2) throw new Error('login never landed');
    }
  }
  await page.goto('/dashboard/school/classes');
  const screen = page.locator('[data-surface="school-admin-classes"]');
  await expect(screen).toBeVisible({ timeout: 30_000 });
  const search = screen.getByLabel('Search classes', { exact: true });
  await search.fill('Proof');
  await page.waitForTimeout(3_000);
  const rows = page.getByRole('row');
  const count = await rows.count();
  console.log('ROW_COUNT:', count);
  for (let i = 0; i < Math.min(count, 3); i += 1) {
    const row = rows.nth(i);
    const text = (await row.innerText().catch(() => 'TXT?')).slice(0, 60);
    const links = await row
      .locator('a')
      .evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute('href')))
      .catch(() => ['EVAL?']);
    console.log(`ROW${i}:`, JSON.stringify({ text, links }));
  }
});
