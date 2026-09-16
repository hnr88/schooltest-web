import { expect, test } from '@playwright/test';

import { cat, en, freshEmail, loginAsPage, shot } from './helpers/fleet7';

// FLEET-7 diagnostic probe 2 — does the invitations list refetch after the
// invite POST? Network-level instrumentation, read-only.
test('F7 probe2: invitations refetch after invite', async ({ page }) => {
  test.setTimeout(120_000);
  const invites: string[] = [];
  page.on('request', (req) => {
    if (req.url().includes('/api/schools/me/invitations')) {
      invites.push(`${req.method()} ${new Date().toISOString().slice(11, 19)}`);
    }
  });
  const responses: string[] = [];
  page.on('response', (res) => {
    if (res.url().includes('/api/schools/me/invitations')) {
      responses.push(`${res.status()} ${new Date().toISOString().slice(11, 19)}`);
    }
  });

  await loginAsPage(page, 'schoolAdmin');
  await page.goto('/dashboard/school/teachers');
  await expect(page.locator('[data-surface="school-admin-teachers"]')).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(2_000);
  console.log('PROBE2 after mount requests:', JSON.stringify(invites));
  console.log('PROBE2 after mount responses:', JSON.stringify(responses));

  const email = freshEmail('probe2');
  await page.getByRole('button', { name: cat(en, 'Teachers.addButton') }).click();
  await page.locator('#inv-first-name').fill('Pro');
  await page.locator('#inv-last-name').fill('Be');
  await page.locator('#inv-email').fill(email);
  await page.getByRole('button', { name: cat(en, 'Teachers.invite.submit'), exact: true }).click();
  await expect(page.getByText(`Invitation sent to ${email}.`)).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(6_000);
  console.log('PROBE2 after invite requests:', JSON.stringify(invites));
  console.log('PROBE2 after invite responses:', JSON.stringify(responses));

  const search = page.getByPlaceholder(cat(en, 'Teachers.table.searchPlaceholder'));
  await search.fill(email);
  await page.waitForTimeout(3_000);
  await shot(page, '92-probe2-searched');
  console.log('PROBE2 searched-has-row:', (await page.innerText('body')).includes(email));
  console.log('PROBE2 all requests:', JSON.stringify(invites));
  console.log('PROBE2 all responses:', JSON.stringify(responses));
  expect(true).toBe(true);
});
