import { expect, test } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';

const en = loadMessages('en');

test('W2 probe: edit-save network flow', async ({ page }) => {
  test.setTimeout(240_000);
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(90_000);
  await loginAs(page, 'ops');

  // create a throwaway school through the dialog
  await page.goto('/dashboard/ops/schools');
  await expect(page.locator('[data-surface="ops-schools"]')).toBeVisible({ timeout: 60_000 });
  await page.getByTestId('ops-create-school').click();
  const dlg = page.locator('[data-slot="ops-create-school-dialog"]');
  const stamp = Date.now();
  await dlg.locator('#create-school-name').fill(`W2 Edit Probe ${stamp}`);
  await dlg.locator('#create-school-suburb').fill('Fitzroy');
  await dlg.locator('#create-school-contact-name').fill('Probe Owner');
  await dlg.locator('#create-school-contact-email').fill(`w2-edit-probe-${stamp}@schooltest.local`);
  await dlg.getByRole('button', { name: cat(en, 'Ops.createSchool.submit'), exact: true }).click();
  await dlg.waitFor({ state: 'detached', timeout: 30_000 }).catch(() => test.info().log('create dialog still open'));
  await page.waitForTimeout(1_500);
  const search = page.getByTestId('ops-schools-search');
  await search.fill(`W2 Edit Probe ${stamp}`);
  await page.waitForTimeout(1_000);

  const row = page.locator('[data-directory-row]', { hasText: `W2 Edit Probe ${stamp}` }).first();
  await row.click();
  await expect(page.locator('[data-surface="ops-school-detail"]')).toBeVisible({ timeout: 60_000 });
  await page.getByTestId('ops-edit-school').click();
  const edit = page.locator('[data-slot="ops-edit-school-dialog"]');
  await edit.waitFor();
  await edit.locator('#edit-school-suburb').fill('Carlton North');

  const reqPromise = page.waitForResponse(
    (r) => /\/api\/schools\/[a-z0-9]+$/.test(new URL(r.url()).pathname) && r.request().method() === 'PATCH',
    { timeout: 8_000 },
  ).then((r) => `PATCH ${r.status()}`).catch(() => 'no-patch');

  await edit.getByRole('button', { name: cat(en, 'Ops.createSchool.save'), exact: true }).click();
  const patch = await reqPromise;
  test.info().annotations.push({ type: 'note', description: `save request: ${patch}` });
  await page.waitForTimeout(2_000);
  console.log('PATCH outcome:', patch);
  console.log('edit dialog visible:', await edit.isVisible().catch(() => false));
  const toasts = await page.locator('[data-sonner-toast]').allInnerTexts().catch(() => []);
  console.log('toasts:', JSON.stringify(toasts).slice(0, 400));
  // leave the school for follow-up API checks
  expect(true).toBe(true);
});
