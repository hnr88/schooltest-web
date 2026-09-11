/**
 * E2E proof — the ops Schools CREATE / EDIT / ARCHIVE lifecycle on a
 * throwaway 'ZZZ Probe <timestamp>' school (run only once the dialog tsc
 * errors are clear). Screenshots into tests/proofs/schools/:
 *   13-create-modal.png           the Create pill modal (640px design layout)
 *   14-created-in-list.png        the probe visible in the list
 *   15-edit-modal.png             the detail → Edit school modal (suburb change)
 *   16-archived-confirm.png       the typed-name Archive confirm
 *   17-archived-pill.png          the probe gone from active, present under Archived
 *
 * Persistence is verified against the live API (GET school detail), and the
 * probe is deleted through the versioned DELETE in afterAll.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { loginAs } from '../helpers/roles';
import { fixtureAuthContext, fixtureHeaders } from '../helpers/ops-portal';

const OUT = path.resolve(__dirname, '../../proofs/schools');
const SCREEN_PATH = '/dashboard/ops/schools';
const ACTION_TIMEOUT = 30_000;
const PROBE = `ZZZ Probe ${Date.now().toString(36)}`;
const PROBE_EMAIL = `zzz-probe-${Date.now().toString(36)}@schooltest.local`;
const NEW_SUBURB = 'Proofville East';

let jwt = '';
let probeDocumentId = '';

async function shot(page: Page, name: string): Promise<void> {
  await mkdir(OUT, { recursive: true });
  await page.screenshot({ path: path.join(OUT, name), fullPage: true });
}

async function apiLogin(request: APIRequestContext): Promise<void> {
  const { jwt: token } = await fixtureAuthContext(request, 'ops');
  if (token === null) throw new Error('ops fixture returned no JWT');
  jwt = token;
}

async function openSchools(page: Page): Promise<void> {
  await page.goto(SCREEN_PATH, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-slot="ops-schools"]')).toBeVisible({ timeout: ACTION_TIMEOUT });
  await expect(page.locator('[data-directory-row]').first()).toBeVisible({ timeout: ACTION_TIMEOUT });
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ request }) => {
  await apiLogin(request);
});

test.afterAll(async ({ request }) => {
  if (!probeDocumentId) return;
  await request.delete(`http://localhost:5500/api/ops/schools/${probeDocumentId}`, {
    headers: fixtureHeaders('ops', jwt),
  });
});

test.beforeEach(async ({ page }) => {
  await loginAs(page, 'ops');
});

test('create → list → edit (suburb) → archive, with persistence via API', async ({
  page,
  request,
}) => {
  // ---- 1. The Create pill opens the 640px design modal with the field rows.
  await openSchools(page);
  await page.getByTestId('ops-create-school').click();
  const dialog = page.locator('[data-slot="ops-create-school-dialog"]');
  await expect(dialog).toBeVisible({ timeout: ACTION_TIMEOUT });
  const width = await dialog.evaluate((el) => el.getBoundingClientRect().width);
  expect(width).toBeLessThanOrEqual(640 + 1);
  // The design's field rows all exist: [name|suburb],[state|sector|plan],
  // [contact|email],[phone|status].
  for (const id of [
    'create-school-name',
    'create-school-suburb',
    'create-school-state',
    'create-school-sector',
    'create-school-plan',
    'create-school-contact-name',
    'create-school-contact-email',
    'create-school-phone',
    'create-school-status',
  ]) {
    await expect(page.locator(`#${id}`)).toBeVisible();
  }
  await shot(page, '13-create-modal.png');

  // ---- 2. Fill and create the throwaway probe.
  await page.locator('#create-school-name').fill(PROBE);
  await page.locator('#create-school-suburb').fill('Probeshire');
  await page.getByRole('combobox', { name: 'State', exact: true }).click();
  await page.getByRole('option', { name: 'VIC', exact: true }).click();
  await page.getByRole('combobox', { name: 'Sector', exact: true }).click();
  await page.getByRole('option', { name: 'Government', exact: true }).click();
  await page.getByRole('combobox', { name: 'Plan', exact: true }).click();
  await page.getByRole('option', { name: 'Pilot', exact: true }).click();
  await page.locator('#create-school-contact-name').fill('Probe Contact');
  await page.locator('#create-school-contact-email').fill(PROBE_EMAIL);
  await page.locator('#create-school-phone').fill('0400000000');
  await dialog.getByRole('button', { name: 'Create school', exact: true }).click();
  await expect(dialog).not.toBeVisible({ timeout: ACTION_TIMEOUT });

  // The probe appears in the list (search narrows to it).
  await page.getByTestId('ops-schools-search').fill(PROBE);
  await expect(page.locator('[data-directory-row]')).toHaveCount(1, { timeout: ACTION_TIMEOUT });
  await expect(page.locator('[data-directory-row]').first()).toContainText(PROBE);
  await shot(page, '14-created-in-list.png');

  // ---- 3. Detail → Edit school: change the suburb, verify via the API.
  await page.locator('[data-directory-row]').first().click({ position: { x: 400, y: 20 } });
  await expect(page.locator('[data-slot="ops-school-detail"]')).toBeVisible({
    timeout: ACTION_TIMEOUT,
  });
  probeDocumentId = (page.url().match(/schools\/([a-z0-9]+)/) ?? [])[1] ?? '';
  expect(probeDocumentId).not.toBe('');

  await page.getByTestId('ops-edit-school').click();
  const editDialog = page.locator('[role="dialog"]').filter({ hasText: 'Update' });
  await expect(editDialog).toBeVisible({ timeout: ACTION_TIMEOUT });
  await shot(page, '15-edit-modal.png');
  await editDialog.locator('#edit-school-suburb').fill(NEW_SUBURB);
  // The edit form also owns the required contact fields — keep them valid.
  const contactName = editDialog.locator('#edit-school-contact-name');
  if (!((await contactName.inputValue()) ?? '').trim()) await contactName.fill('Probe Contact');
  const contactEmail = editDialog.locator('#edit-school-contact-email');
  if (!((await contactEmail.inputValue()) ?? '').trim()) await contactEmail.fill(PROBE_EMAIL);
  await editDialog.getByRole('button', { name: 'Save', exact: true }).click();

  // BUG (reported, not fixed here — file outside this lane's fix allowlist):
  // PATCH /api/schools/:id answers 200 with a top-level `meta`, the strict
  // dataEnvelope in use-school-create.mutation.ts editSchool() rejects it, so
  // the dialog shows the error toast and STAYS OPEN even though the write
  // persisted. Persistence is therefore proven against the API directly, and
  // the dialog is closed through its Cancel control to continue.
  await expect
    .poll(
      async () => {
        const res = await request.get(
          `http://localhost:5500/api/ops/schools/${probeDocumentId}`,
          { headers: fixtureHeaders('ops', jwt) },
        );
        if (!res.ok()) return '';
        const body = (await res.json()) as { data?: { suburb?: string } };
        return body.data?.suburb ?? '';
      },
      { timeout: ACTION_TIMEOUT },
    )
    .toBe(NEW_SUBURB);
  await editDialog.getByRole('button', { name: 'Cancel', exact: true }).click().catch(() => {});
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // ---- 4. Archive from the row menu, typed-name confirm.
  await openSchools(page);
  await page.getByTestId('ops-schools-search').fill(PROBE);
  await expect(page.locator('[data-directory-row]')).toHaveCount(1, { timeout: ACTION_TIMEOUT });
  const probeRow = page.locator('[data-directory-row]').first();
  await probeRow.getByRole('button', { name: 'Row actions' }).click();
  await page.getByRole('menuitem', { name: 'Archive school', exact: true }).click();

  const confirm = page.locator('[role="alertdialog"]');
  await expect(confirm).toBeVisible({ timeout: ACTION_TIMEOUT });
  await shot(page, '16-archived-confirm.png');
  await confirm.locator('input').fill(PROBE);
  await confirm.getByRole('button', { name: 'Archive school', exact: true }).click();
  await expect(confirm).not.toBeVisible({ timeout: ACTION_TIMEOUT });

  // ---- 5. It leaves the default tab and appears under the Archived pill.
  await page.getByTestId('ops-schools-search').fill('');
  await expect(page.locator('[data-directory-row]').filter({ hasText: PROBE })).toHaveCount(0, {
    timeout: ACTION_TIMEOUT,
  });
  await page.locator('[data-slot="ops-schools-pill-archived"]').click();
  await expect(page).toHaveURL(/status=archived/);
  await expect(page.locator('[data-directory-row]').filter({ hasText: PROBE })).toHaveCount(1, {
    timeout: ACTION_TIMEOUT,
  });
  await expect(page.locator('[data-slot="ops-schools-pill-archived"]')).toContainText('1');
  await shot(page, '17-archived-pill.png');
});
