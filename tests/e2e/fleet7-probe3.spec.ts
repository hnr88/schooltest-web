import { expect, test } from '@playwright/test';

import { cat, en, loginAsPage, shot } from './helpers/fleet7';

// FLEET-7 diagnostic probe 3 — search the staff table for the JUST-failed
// invitation email (created 12:41:45, status invited, confirmed via API).
test('F7 probe3: search for the just-created invitation', async ({ page }) => {
  test.setTimeout(120_000);
  await loginAsPage(page, 'schoolAdmin');
  await page.goto('/dashboard/school/teachers');
  await expect(page.locator('[data-surface="school-admin-teachers"]')).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(3_000);

  const search = page.getByPlaceholder(cat(en, 'Teachers.table.searchPlaceholder'));
  await search.fill('f7-teacher-1789562488635@schooltest.local');
  await page.waitForTimeout(3_000);
  await shot(page, '93-probe3-searched');
  const body = await page.innerText('body');
  console.log('PROBE3 has-email:', body.includes('f7-teacher-1789562488635'));
  console.log('PROBE3 has-fleet:', body.includes('Fleet'));
  const showing = await page.getByText(/Showing .* of .* staff|Nothing matches|No matching/i).first().innerText().catch(() => 'n/a');
  console.log('PROBE3 showing:', showing);
  // Also try the status filter: Invited.
  await search.fill('');
  await page.waitForTimeout(2_000);
  const invitedChips = await page.getByText('Invited', { exact: true }).count();
  console.log('PROBE3 invited-chips-page1:', invitedChips);
  expect(true).toBe(true);
});
