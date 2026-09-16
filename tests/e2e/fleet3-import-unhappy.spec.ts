/**
 * F3 — the import UNHAPPY paths, with REQUEST-COUNT evidence for the loop fix.
 *
 * TODAY'S BUG (fixed): a preview failure used to leave the auto-preview effect
 * armed, so it re-fired on its own error state and retried the same doomed
 * request forever. The guard (`previewMutation.isError`) plus the reset inside
 * `invalidate()` mean: each failure previews EXACTLY ONCE, and CHANGING an
 * input (class or file) re-arms the auto-preview for exactly ONE more request.
 *
 * Every case below records the preview-request count it observed. Server
 * verdicts pinned live against the API on 2026-09-16:
 *   - missing email column -> HTTP 400 MISSING_COLUMNS ("csv is missing template columns: email")
 *   - malformed email      -> HTTP 200, reject {row 2, "email must be a valid email address"}
 *   - headers only         -> HTTP 400 NO_ROWS ("csv has no data rows")
 *   - duplicate in file    -> HTTP 200, create row 2 + reject row 3 ("this file already lists a student with this email")
 *   - existing email       -> HTTP 200, skip_existing row 2 (dupes card)
 * Client-only refusals (no request at all): non-csv type, >5 MB.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import {
  CAPTURES,
  PORTAL_HEADER,
  f3Stamp,
  liveDemoSchoolId,
  openImportModal,
  pickClass,
  portalRow,
  signInAsOps,
  trackRequests,
} from './fleet3-helpers';

const CLASS_NAME = 'EAL/D Year 7 - Room 4';
const OTHER_CLASS = 'EAL/D Year 9 - Room 6';
/** How long we watch to prove a retry storm is NOT happening. */
const QUIET_MS = 6_000;

const panelOf = (page: Page) => page.locator('[data-surface="ops-student-import"]');

async function openArmedModal(page: Page) {
  const schoolId = await liveDemoSchoolId();
  await signInAsOps(page);
  await openImportModal(page, schoolId);
  await mkdir(CAPTURES, { recursive: true });
}

async function loadCsv(page: Page, name: string, csv: string) {
  await panelOf(page)
    .locator('#ops-import-file')
    .setInputFiles({ name, mimeType: 'text/csv', buffer: Buffer.from(csv) });
}

const NO_EMAIL_CSV = (stamp: string) =>
  [
    'given name,family name,date of birth,year level,home language',
    `F3,NoEmail ${stamp},2013-03-04,8,english`,
  ].join('\n');

test.describe.configure({ retries: 1 });
test.setTimeout(120_000);

test('missing email column: HTTP 400 once, failed card, NO retry storm', async ({ page }) => {
  const stamp = f3Stamp();
  await openArmedModal(page);
  const panel = panelOf(page);
  const previews = trackRequests(page, '/import-students/preview');

  await loadCsv(page, `f3-no-email-${stamp}.csv`, NO_EMAIL_CSV(stamp));
  await pickClass(page, CLASS_NAME);

  // The failure card: "Import did not complete" + the server's own message.
  await expect(panel).toHaveAttribute('data-card', 'failed', { timeout: 30_000 });
  await expect(panel.getByText('Import did not complete')).toBeVisible();
  await expect(
    panel.getByText('csv is missing template columns: email', { exact: true }),
  ).toBeVisible();

  // NO RETRY STORM: one request, and the wire stays quiet afterwards.
  expect(previews.count(), 'preview fires EXACTLY ONCE for the doomed csv').toBe(1);
  await page.waitForTimeout(QUIET_MS);
  expect(previews.count(), 'still exactly one after the quiet window').toBe(1);

  await panel.screenshot({ path: path.join(CAPTURES, '06-card-failed-missing-email.png') });
  console.log('CAPTURE 06 — preview request count:', previews.count(), previews.urls);
});

test('after a failed preview, picking a DIFFERENT class re-arms auto-preview (exactly one new request)', async ({
  page,
}) => {
  const stamp = f3Stamp();
  await openArmedModal(page);
  const panel = panelOf(page);
  const previews = trackRequests(page, '/import-students/preview');

  await loadCsv(page, `f3-rearm-${stamp}.csv`, NO_EMAIL_CSV(stamp));
  await pickClass(page, CLASS_NAME);
  await expect(panel).toHaveAttribute('data-card', 'failed', { timeout: 30_000 });
  expect(previews.count()).toBe(1);

  // THE FIX UNDER TEST: a class change invalidates + resets the mutation, so
  // the auto-preview effect fires again — for the NEW input, exactly once.
  await pickClass(page, OTHER_CLASS);
  await expect(panel).toHaveAttribute('data-card', 'failed', { timeout: 30_000 }); // fails again, ONCE
  expect(previews.count(), 'class change re-armed exactly ONE new preview').toBe(2);
  await page.waitForTimeout(QUIET_MS);
  expect(previews.count(), 'and no further retries').toBe(2);
  expect(previews.bodies[1]).toContain('class_documentId');
  console.log('CLASS-REARM — request count after class change:', previews.count());
});

test('after a failed preview, choosing a NEW FILE re-arms auto-preview (exactly one new request)', async ({
  page,
}) => {
  const stamp = f3Stamp();
  await openArmedModal(page);
  const panel = panelOf(page);
  const previews = trackRequests(page, '/import-students/preview');

  await loadCsv(page, `f3-file-rearm-a-${stamp}.csv`, NO_EMAIL_CSV(stamp));
  await pickClass(page, CLASS_NAME);
  await expect(panel).toHaveAttribute('data-card', 'failed', { timeout: 30_000 });
  expect(previews.count()).toBe(1);

  // Change file: a VALID csv this time — auto-preview re-fires exactly once
  // and now SUCCEEDS (ready card), proving the re-arm is not a blind retry.
  const goodCsv = [
    PORTAL_HEADER,
    portalRow('F3', `Rearm ${stamp}`, `f3.rearm.${stamp}@import.invalid`),
  ].join('\n');
  await loadCsv(page, `f3-file-rearm-b-${stamp}.csv`, goodCsv);
  await expect(panel).toHaveAttribute('data-card', 'ready', { timeout: 30_000 });
  expect(previews.count(), 'file change re-armed exactly ONE new preview').toBe(2);
  await page.waitForTimeout(QUIET_MS);
  expect(previews.count()).toBe(2);
  await panel.screenshot({ path: path.join(CAPTURES, '07-rearmed-after-file-change.png') });
  console.log('CAPTURE 07 — request count after file change:', previews.count());
});

test('malformed email row: rowErrors card, one request, legible row reject', async ({ page }) => {
  const stamp = f3Stamp();
  await openArmedModal(page);
  const panel = panelOf(page);
  const previews = trackRequests(page, '/import-students/preview');

  const csv = [PORTAL_HEADER, portalRow('F3', `BadEmail ${stamp}`, 'not-an-email')].join('\n');
  await loadCsv(page, `f3-bad-email-${stamp}.csv`, csv);
  await pickClass(page, CLASS_NAME);

  await expect(panel).toHaveAttribute('data-card', 'rowErrors', { timeout: 30_000 });
  await expect(panel.getByText('1 rows need fixing')).toBeVisible();
  const preview = panel.locator('[data-surface="ops-import-preview"]');
  await expect(
    preview.getByText('email must be a valid email address', { exact: true }),
  ).toBeVisible();
  expect(previews.count()).toBe(1);
  await page.waitForTimeout(QUIET_MS);
  expect(previews.count()).toBe(1);
  await panel.screenshot({ path: path.join(CAPTURES, '08-card-rowerrors-bad-email.png') });
  console.log('CAPTURE 08 — request count:', previews.count());
});

test('non-csv file type: badType card with ZERO preview requests', async ({ page }) => {
  const stamp = f3Stamp();
  await openArmedModal(page);
  const panel = panelOf(page);
  const previews = trackRequests(page, '/import-students/preview');

  // Class first (nothing to preview yet), then a .pdf lands -> badType.
  await pickClass(page, CLASS_NAME);
  await panel.locator('#ops-import-file').setInputFiles({
    name: `f3-roster-${stamp}.pdf`,
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 not really a pdf'),
  });

  await expect(panel).toHaveAttribute('data-card', 'badType', { timeout: 30_000 });
  await expect(panel.getByText("isn't a CSV")).toBeVisible();
  // The CTA is soft-disabled (aria-disabled + opacity, still clickable —
  // `OpsStudentImport.tsx` keeps the guard in runCta, not a native disabled)
  // but Playwright's actionability check refuses aria-disabled elements, so
  // the guard-probing click is forced. It still refuses with the form-level
  // message — never a request.
  await panel.locator('[data-surface="ops-import-cta"]').click({ force: true });
  await expect(panel.getByText("This file can't be imported. Choose another file.")).toBeVisible();
  expect(previews.count(), 'client-side type refusal sends NOTHING').toBe(0);
  await page.waitForTimeout(QUIET_MS);
  expect(previews.count()).toBe(0);
  await panel.screenshot({ path: path.join(CAPTURES, '09-card-badtype.png') });
  console.log('CAPTURE 09 — request count:', previews.count());
});

test('a >5 MB csv: tooBig card with ZERO preview requests', async ({ page }) => {
  const stamp = f3Stamp();
  await openArmedModal(page);
  const panel = panelOf(page);
  const previews = trackRequests(page, '/import-students/preview');

  await pickClass(page, CLASS_NAME);
  const pad = 'x'.repeat(400);
  const rows: string[] = [PORTAL_HEADER];
  for (let i = 0; rows.join('\n').length <= 5 * 1024 * 1024 + 1; i += 1) {
    rows.push(portalRow('F3', `Big ${i} ${pad}`, `f3.big.${stamp}.${i}@import.invalid`));
  }
  const bigCsv = rows.join('\n');
  expect(Buffer.byteLength(bigCsv)).toBeGreaterThan(5 * 1024 * 1024);

  await loadCsv(page, `f3-big-${stamp}.csv`, bigCsv);

  await expect(panel).toHaveAttribute('data-card', 'tooBig', { timeout: 30_000 });
  await expect(panel.getByText('File is too large')).toBeVisible();
  await expect(panel.getByText('The limit is 5 MB. Split the roster by year level.')).toBeVisible();
  expect(previews.count(), '5 MB refusal sends NOTHING').toBe(0);
  await panel.screenshot({ path: path.join(CAPTURES, '10-card-toobig.png') });
  console.log('CAPTURE 10 — request count:', previews.count(), 'bytes:', Buffer.byteLength(bigCsv));
});

test('headers-only csv: the server refuses with NO_ROWS, card fails ONCE (no loop)', async ({
  page,
}) => {
  const stamp = f3Stamp();
  await openArmedModal(page);
  const panel = panelOf(page);
  const previews = trackRequests(page, '/import-students/preview');

  await loadCsv(page, `f3-empty-${stamp}.csv`, `${PORTAL_HEADER}\n`);
  await pickClass(page, CLASS_NAME);

  // The SERVER answers 400 "csv has no data rows" — the failed card renders,
  // and the message is the server's own, not a generic toast.
  await expect(panel).toHaveAttribute('data-card', 'failed', { timeout: 30_000 });
  await expect(panel.getByText('csv has no data rows', { exact: true })).toBeVisible();
  expect(previews.count()).toBe(1);
  await page.waitForTimeout(QUIET_MS);
  expect(previews.count(), 'no retry storm on the empty file').toBe(1);
  await panel.screenshot({ path: path.join(CAPTURES, '11-card-failed-no-rows.png') });
  console.log('CAPTURE 11 — request count:', previews.count());
});

test('duplicate emails inside one file: create + legible duplicate-row reject', async ({
  page,
}) => {
  const stamp = f3Stamp();
  await openArmedModal(page);
  const panel = panelOf(page);
  const previews = trackRequests(page, '/import-students/preview');

  const email = `f3.twice.${stamp}@import.invalid`;
  const csv = [
    PORTAL_HEADER,
    portalRow('F3', `Twice A ${stamp}`, email),
    portalRow('F3', `Twice B ${stamp}`, email),
  ].join('\n');
  await loadCsv(page, `f3-dup-file-${stamp}.csv`, csv);
  await pickClass(page, CLASS_NAME);

  await expect(panel).toHaveAttribute('data-card', 'rowErrors', { timeout: 30_000 });
  const preview = panel.locator('[data-surface="ops-import-preview"]');
  await expect(
    preview.getByText('this file already lists a student with this email', { exact: true }),
  ).toBeVisible();
  // The summary is ICU-pluralized (en.json previewSummary): count 1 renders
  // the singular — "1 student will be created … 1 row needs fixing".
  await expect(
    preview.getByText('1 student will be created, 0 already exist, 1 row needs fixing', {
      exact: true,
    }),
  ).toBeVisible();
  expect(previews.count()).toBe(1);
  await panel.screenshot({ path: path.join(CAPTURES, '12-card-rowerrors-dup-in-file.png') });
  console.log('CAPTURE 12 — request count:', previews.count());
});

test("an existing student's email: dupes card, skip_existing with the matched student", async ({
  page,
}) => {
  const stamp = f3Stamp();
  await openArmedModal(page);
  const panel = panelOf(page);
  const previews = trackRequests(page, '/import-students/preview');

  const csv = [PORTAL_HEADER, portalRow('Sofia', 'Petrov', 'a1s01@schooltest.local')].join('\n');
  await loadCsv(page, `f3-existing-${stamp}.csv`, csv);
  await pickClass(page, CLASS_NAME);

  await expect(panel).toHaveAttribute('data-card', 'dupes', { timeout: 30_000 });
  await expect(panel.getByText('1 students are already enrolled')).toBeVisible();
  const preview = panel.locator('[data-surface="ops-import-preview"]');
  await expect(
    preview.getByText('0 students will be created, 1 already exists, 0 rows need fixing', {
      exact: true,
    }),
  ).toBeVisible();
  // The skip table names the matched student by documentId.
  await expect(preview.getByText('bs87dui4ebaqrmupidvybn02', { exact: true })).toBeVisible();
  expect(previews.count()).toBe(1);
  await panel.screenshot({ path: path.join(CAPTURES, '13-card-dupes-existing.png') });
  console.log('CAPTURE 13 — request count:', previews.count());
});

