/**
 * BUG-002 follow-up — ops correct a school's timezone on the school edit form,
 * and the zone follows the school's state until someone sets it by hand.
 *
 * REQUIRES THE BUG-002 FOLLOW-UP API (the ops detail read emits `timezone`,
 * the versioned PATCH accepts it, and the school middleware re-derives the zone
 * when `state` changes). Against an older API the edit dialog shows no zone and
 * step 1 fails. Everything is real: a FRESH school created through the ops API
 * WITHOUT a state (so it starts on the no-state default, Australia/Melbourne),
 * the portal's own edit dialog for every change, and the ops detail read for
 * the cross-checks.
 *
 *  1. no state -> Australia/Melbourne (the create rule);
 *  2. state set to WA, zone untouched -> the PATCH carries no zone and the API
 *     re-derives Australia/Perth;
 *  3. a zone chosen by hand (Australia/Eucla) is saved as chosen;
 *  4. a later state change (SA) keeps the hand-set zone.
 *
 * Screenshots: $BUG_PROOF_DIR/BUG-002/ (default ~/Desktop/live_feedback_1/proof).
 */
import fs from 'node:fs';
import path from 'node:path';

import { expect, test, type Locator, type Page } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';
import { cleanupSchool, detailPath, opsJwt } from './helpers/ops-onboarding';
import { loginAs } from './helpers/roles';

test.describe.configure({ mode: 'serial' });

const en = loadMessages('en');
const API = process.env.E2E_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:5500';
const PROOF_DIR = path.join(process.env.BUG_PROOF_DIR ?? '/Users/hunor.nagy/Desktop/live_feedback_1/proof', 'BUG-002');
const STAMP = Date.now();
const SCHOOL_NAME = `BUG002 Zone ${STAMP}`;

let documentId = '';

interface DetailRow {
  state: string | null;
  timezone?: string | null;
}

async function opsDetail(): Promise<DetailRow> {
  const res = await fetch(`${API}/api/ops/schools/${documentId}`, {
    headers: { Authorization: `Bearer ${await opsJwt()}`, 'X-Ops-Portal-Version': '1' },
  });
  expect(res.status, 'ops detail read').toBe(200);
  return ((await res.json()) as { data: DetailRow }).data;
}

async function shot(page: Page, slug: string): Promise<void> {
  fs.mkdirSync(PROOF_DIR, { recursive: true });
  const body = await page.screenshot({ path: path.join(PROOF_DIR, `${slug}.png`) });
  await test.info().attach(slug, { body, contentType: 'image/png' });
}

async function openEditDialog(page: Page): Promise<Locator> {
  await page.goto(detailPath(documentId));
  await expect(page.locator('[data-surface="ops-school-detail"]')).toBeVisible({ timeout: 60_000 });
  await page.getByTestId('ops-edit-school').click();
  const dialog = page.locator('[data-slot="ops-edit-school-dialog"]');
  await expect(dialog).toBeVisible({ timeout: 30_000 });
  return dialog;
}

/** Choose an option in one of the dialog's selects and VERIFY it stuck. */
async function chooseSelect(page: Page, dialog: Locator, id: string, optionLabel: string): Promise<void> {
  await dialog.locator(`#${id}`).click();
  await page.getByRole('option', { name: optionLabel, exact: true }).first().click();
  await expect(dialog.locator(`#${id}`)).toHaveText(new RegExp(optionLabel.replace('/', '\\/')), { timeout: 5_000 });
}

/** Save the dialog and return the PATCH body the portal sent. */
async function save(page: Page, dialog: Locator): Promise<Record<string, unknown>> {
  const patch = page.waitForResponse(
    (res) => new URL(res.url()).pathname === `/api/schools/${documentId}` && res.request().method() === 'PATCH',
    { timeout: 20_000 },
  );
  await dialog.getByRole('button', { name: cat(en, 'Ops.createSchool.save'), exact: true }).click();
  const response = await patch;
  expect(response.status(), await response.text()).toBe(200);
  await expect(dialog).toBeHidden({ timeout: 30_000 });
  return response.request().postDataJSON() as Record<string, unknown>;
}

test.beforeAll(async () => {
  // The versioned ops create (C-OPS-PORTAL-003) with NO state — the same call
  // the portal's Create School dialog makes when the state is left unchosen.
  const res = await fetch(`${API}/api/schools`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${await opsJwt()}`,
      'X-Ops-Portal-Version': '1',
      'Idempotency-Key': `bug002-zone-fixture-${STAMP}`,
    },
    body: JSON.stringify({
      name: SCHOOL_NAME,
      suburb: 'Belmore',
      contact_name: 'Zone Tester',
      contact_email: `bug002-${STAMP}@example.au`,
      portal: { plan: 'pilot', status: 'pending_setup', send_owner_invitation: false },
    }),
  });
  const body = (await res.json()) as { data?: { documentId?: string } };
  expect(res.status, JSON.stringify(body)).toBe(201);
  documentId = String(body.data?.documentId ?? '');
  expect(documentId).not.toBe('');
});

test.afterAll(async () => {
  if (documentId) await cleanupSchool(documentId);
});

test('BUG-002: a no-state school follows its new state to Australia/Perth, and a hand-set zone sticks', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1440, height: 900 });

  // ---- 1. Created without a state: the no-state default ----
  expect(await opsDetail()).toMatchObject({ state: null, timezone: 'Australia/Melbourne' });
  await loginAs(page, 'ops');
  let dialog = await openEditDialog(page);
  await expect(dialog.getByText(cat(en, 'Ops.createSchool.timezone'), { exact: true })).toBeVisible();
  await expect(dialog.locator('#edit-school-timezone')).toHaveText(/Australia\/Melbourne/);
  await shot(page, '01-no-state-school-melbourne');

  // ---- 2. State WA, zone untouched: no zone on the wire, the API re-derives Perth ----
  await chooseSelect(page, dialog, 'edit-school-state', 'WA');
  const stateOnly = await save(page, dialog);
  expect(stateOnly.state).toBe('WA');
  expect(stateOnly).not.toHaveProperty('timezone');
  expect(await opsDetail()).toMatchObject({ state: 'WA', timezone: 'Australia/Perth' });
  dialog = await openEditDialog(page);
  await expect(dialog.locator('#edit-school-timezone')).toHaveText(/Australia\/Perth/);
  await shot(page, '02-state-wa-zone-perth');

  // ---- 3. A zone chosen by hand is saved as chosen ----
  await chooseSelect(page, dialog, 'edit-school-timezone', 'Australia/Eucla');
  await shot(page, '03-hand-set-eucla');
  const handSet = await save(page, dialog);
  expect(handSet.timezone).toBe('Australia/Eucla');
  expect(await opsDetail()).toMatchObject({ state: 'WA', timezone: 'Australia/Eucla' });

  // ---- 4. A later state change keeps the hand-set zone ----
  dialog = await openEditDialog(page);
  await chooseSelect(page, dialog, 'edit-school-state', 'SA');
  const later = await save(page, dialog);
  expect(later).not.toHaveProperty('timezone');
  expect(await opsDetail()).toMatchObject({ state: 'SA', timezone: 'Australia/Eucla' });
  dialog = await openEditDialog(page);
  await expect(dialog.locator('#edit-school-timezone')).toHaveText(/Australia\/Eucla/);
  await shot(page, '04-state-sa-keeps-eucla');
});
