/**
 * BUG-002 remaining gap — a zone chosen BY HAND that equals the automatic one
 * survives a state change, and "Automatic (from state)" hands it back to the
 * state. REQUIRES the API with `school.timezone_manual` (migration
 * 2026.09.23T20.00.00, the ops detail read emits the flag, the versioned PATCH
 * accepts `timezone_manual: false`).
 *
 * Everything through the portal as ops (admin@schooltest.local): the school is
 * created with the Create School dialog, every change is the Edit school
 * dialog, and it is archived from the detail menu at the end. Each step is
 * cross-checked in Postgres (read-only SELECT) and the rows are written next to
 * the screenshots as text evidence.
 *
 *  1. created as SA            -> Australia/Adelaide, automatic;
 *  2. Adelaide chosen by hand  -> the PATCH carries the zone, stored as chosen;
 *  3. state -> QLD             -> no zone on the wire, Adelaide KEPT;
 *  4. "Automatic (from state)" -> timezone_manual:false, re-derived Brisbane;
 *  5. state -> WA              -> the zone follows: Australia/Perth.
 *
 * Screenshots: $BUG_PROOF_DIR/BUG-002/manual-flag-*.png.
 */
import fs from 'node:fs';
import path from 'node:path';

import { expect, test, type Locator, type Page } from '@playwright/test';

import { runSql } from './helpers/auth-db';
import { cat, loadMessages } from './helpers/i18n';
import { detailPath } from './helpers/ops-onboarding';
import { loginAs } from './helpers/roles';

const en = loadMessages('en');
const API = process.env.E2E_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:5500';
const PROOF_DIR = path.join(process.env.BUG_PROOF_DIR ?? '/Users/hunor.nagy/Desktop/live_feedback_1/proof', 'BUG-002');
const STAMP = Date.now();
const SCHOOL_NAME = `BUG002 Manual Zone ${STAMP}`;
const AUTOMATIC = cat(en, 'Ops.createSchool.timezoneAutomatic');
const automaticFor = (zone: string) => cat(en, 'Ops.createSchool.timezoneAutomaticZone').replace('{zone}', zone);
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

let documentId = '';
const evidence: string[] = [];

/** `state|timezone|timezone_manual`, straight out of Postgres (read-only). */
function dbRow(step: string): string {
  const sql = `select state || '|' || timezone || '|' || timezone_manual from schools where document_id = '${documentId}'`;
  const row = runSql(sql).trim();
  evidence.push(`${step}\n  $ ${sql}\n  ${row}`);
  return row;
}

/** The shared dev API restarts on other agents' edits: wait until it answers before a write. */
async function apiUp(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 60; attempt++) {
    const status = await fetch(`${API}/_health`).then((res) => res.status, () => 0);
    if (status === 204) return;
    await page.waitForTimeout(2_000);
  }
  throw new Error(`[e2e] ${API}/_health never answered 204`);
}

async function shot(page: Page, slug: string): Promise<void> {
  // Let the dialog's open/close transitions finish, so the capture is not mid-fade.
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
  fs.mkdirSync(PROOF_DIR, { recursive: true });
  const body = await page.screenshot({ path: path.join(PROOF_DIR, `manual-flag-${slug}.png`) });
  await test.info().attach(slug, { body, contentType: 'image/png' });
}

async function gotoDetail(page: Page): Promise<void> {
  await apiUp(page);
  await page.goto(detailPath(documentId));
  await expect(page.locator('[data-surface="ops-school-detail"]')).toBeVisible({ timeout: 60_000 });
}

async function openEditDialog(page: Page): Promise<Locator> {
  await gotoDetail(page);
  await page.getByTestId('ops-edit-school').click();
  const dialog = page.locator('[data-slot="ops-edit-school-dialog"]');
  await expect(dialog).toBeVisible({ timeout: 30_000 });
  return dialog;
}

/** Choose an option in one of a dialog's selects and VERIFY it stuck. */
async function chooseSelect(page: Page, dialog: Locator, id: string, optionLabel: string): Promise<void> {
  await dialog.locator(`#${id}`).click();
  await page.getByRole('option', { name: optionLabel, exact: true }).first().click();
  await expect(dialog.locator(`#${id}`)).toHaveText(new RegExp(escape(optionLabel)), { timeout: 5_000 });
}

/** Save the edit dialog and return the PATCH body the portal sent. */
async function save(page: Page, dialog: Locator): Promise<Record<string, unknown>> {
  const patch = page.waitForResponse(
    (res) => new URL(res.url()).pathname === `/api/schools/${documentId}` && res.request().method() === 'PATCH',
    { timeout: 20_000 },
  );
  await apiUp(page);
  await dialog.getByRole('button', { name: cat(en, 'Ops.createSchool.save'), exact: true }).click();
  const response = await patch;
  expect(response.status(), await response.text()).toBe(200);
  await expect(dialog).toBeHidden({ timeout: 30_000 });
  return response.request().postDataJSON() as Record<string, unknown>;
}

test.afterAll(() => {
  if (evidence.length === 0) return;
  fs.mkdirSync(PROOF_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(PROOF_DIR, 'manual-flag-db-evidence.txt'),
    `school ${SCHOOL_NAME} (${documentId})\n\n${evidence.join('\n\n')}\n`,
  );
});

test('BUG-002: a zone chosen by hand equal to the automatic one is kept; Automatic follows the state again', async ({
  page,
}) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await apiUp(page);
  await loginAs(page, 'ops');

  // ---- 1. Create an SA school through the Create School dialog ----
  await page.goto('/dashboard/ops/schools');
  await expect(page.locator('[data-surface="ops-schools"]')).toBeVisible({ timeout: 60_000 });
  await page.getByTestId('ops-create-school').click();
  const create = page.locator('[data-slot="ops-create-school-dialog"]');
  await expect(create).toBeVisible({ timeout: 30_000 });
  await create.locator('#create-school-name').fill(SCHOOL_NAME);
  await create.locator('#create-school-suburb').fill('Norwood');
  await chooseSelect(page, create, 'create-school-state', 'SA');
  await chooseSelect(page, create, 'create-school-sector', 'Government');
  await chooseSelect(page, create, 'create-school-plan', 'Pilot');
  await chooseSelect(page, create, 'create-school-status', 'Pending setup');
  await create.locator('#create-school-contact-name').fill('Zone Tester');
  await create.locator('#create-school-contact-email').fill(`bug002-manual-${STAMP}@schooltest.local`);
  const created = page.waitForResponse(
    (res) => new URL(res.url()).pathname === '/api/schools' && res.request().method() === 'POST',
    { timeout: 30_000 },
  );
  await apiUp(page);
  await create.getByRole('button', { name: cat(en, 'Ops.createSchool.submit'), exact: true }).click();
  const createdResponse = await created;
  expect(createdResponse.status(), await createdResponse.text()).toBe(201);
  documentId = String(((await createdResponse.json()) as { data?: { documentId?: string } }).data?.documentId ?? '');
  expect(documentId).not.toBe('');
  expect(dbRow('1. created as SA (Create School dialog)')).toBe('SA|Australia/Adelaide|false');

  let dialog = await openEditDialog(page);
  await expect(dialog.locator('#edit-school-timezone')).toHaveText(new RegExp(escape(automaticFor('Australia/Adelaide'))));
  await shot(page, '01-sa-school-automatic-adelaide');

  // ---- 2. Choose Australia/Adelaide by hand — the SAME zone as the automatic one ----
  await chooseSelect(page, dialog, 'edit-school-timezone', 'Australia/Adelaide');
  await shot(page, '02-adelaide-chosen-by-hand');
  const chosen = await save(page, dialog);
  expect(chosen.timezone).toBe('Australia/Adelaide');
  expect(dbRow('2. Australia/Adelaide chosen by hand (equal to the automatic zone)')).toBe('SA|Australia/Adelaide|true');

  // ---- 3. State -> QLD: the chosen zone is KEPT ----
  dialog = await openEditDialog(page);
  await chooseSelect(page, dialog, 'edit-school-state', 'QLD');
  const toQld = await save(page, dialog);
  expect(toQld.state).toBe('QLD');
  expect(toQld).not.toHaveProperty('timezone');
  expect(dbRow('3. state changed to QLD')).toBe('QLD|Australia/Adelaide|true');
  dialog = await openEditDialog(page);
  await expect(dialog.locator('#edit-school-timezone')).toHaveText(/Australia\/Adelaide/);
  await expect(dialog.locator('#edit-school-timezone')).not.toHaveText(new RegExp(escape(AUTOMATIC)));
  await shot(page, '03-qld-keeps-hand-set-adelaide');

  // ---- 4. Back to "Automatic (from state)": re-derived from QLD ----
  await chooseSelect(page, dialog, 'edit-school-timezone', AUTOMATIC);
  await shot(page, '04-automatic-selected');
  const automatic = await save(page, dialog);
  expect(automatic.timezone_manual).toBe(false);
  expect(automatic).not.toHaveProperty('timezone');
  expect(dbRow('4. switched back to Automatic (from state)')).toBe('QLD|Australia/Brisbane|false');

  // ---- 5. State -> WA: the automatic zone follows ----
  dialog = await openEditDialog(page);
  await expect(dialog.locator('#edit-school-timezone')).toHaveText(new RegExp(escape(automaticFor('Australia/Brisbane'))));
  await chooseSelect(page, dialog, 'edit-school-state', 'WA');
  const toWa = await save(page, dialog);
  expect(toWa).not.toHaveProperty('timezone');
  expect(toWa).not.toHaveProperty('timezone_manual');
  expect(dbRow('5. state changed to WA')).toBe('WA|Australia/Perth|false');
  dialog = await openEditDialog(page);
  await expect(dialog.locator('#edit-school-timezone')).toHaveText(new RegExp(escape(automaticFor('Australia/Perth'))));
  await shot(page, '05-wa-automatic-follows-perth');

  // ---- Archive the test school from the detail menu ----
  await gotoDetail(page);
  await page.getByRole('button', { name: cat(en, 'Ops.detail.actions.menuLabel') }).click();
  await page.getByRole('menuitem', { name: cat(en, 'Ops.detail.actions.archive') }).click();
  await page.locator('#ops-typed-name-confirm').fill(SCHOOL_NAME);
  await apiUp(page);
  await page.getByRole('button', { name: cat(en, 'Ops.detail.actions.confirm.archive.cta') }).click();
  await expect(page.getByText(cat(en, 'Ops.detail.banner.archived.title'))).toBeVisible({ timeout: 30_000 });
  await shot(page, '06-test-school-archived');
  const archived = runSql(`select archived_at is not null from schools where document_id = '${documentId}'`).trim();
  evidence.push(`6. archived from the detail menu\n  archived_at is not null = ${archived}`);
  expect(archived).toBe('t');
});
