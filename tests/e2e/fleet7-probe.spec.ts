import { expect, test } from '@playwright/test';

import { cat, en, loginAsPage, shot } from './helpers/fleet7';

// FLEET-7 diagnostic probe — what does the staff table actually render for a
// pending invitation? Read-only.
test('F7 probe: staff table vs pending invitation', async ({ page }) => {
  test.setTimeout(120_000);
  await loginAsPage(page, 'schoolAdmin');
  await page.goto('/dashboard/school/teachers');
  const surface = page.locator('[data-surface="school-admin-teachers"]');
  await expect(surface).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(3_000);
  await shot(page, '90-probe-teachers-unsearched');
  const subtitle = await page.locator('[data-slot="school-teachers"] p').first().innerText();
  const showing = await page.getByText(/Showing .* of .* staff/).innerText().catch(() => 'n/a');
  const invitedChips = await page.getByText('Invited', { exact: true }).count();
  console.log('PROBE subtitle:', subtitle);
  console.log('PROBE showing:', showing);
  console.log('PROBE invited-chips-on-page-1:', invitedChips);

  const search = page.getByPlaceholder(cat(en, 'Teachers.table.searchPlaceholder'));
  await search.fill('f7-teacher-1789561404110@schooltest.local');
  await page.waitForTimeout(2_500);
  await shot(page, '91-probe-teachers-searched');
  console.log('PROBE searched-body-has-email:', (await page.innerText('body')).includes('f7-teacher-1789561404110'));
  console.log('PROBE searched-showing:', await page.getByText(/Showing .* of .* staff|Nothing matches|No matching/i).first().innerText().catch(() => 'n/a'));
  expect(true).toBe(true);
});
