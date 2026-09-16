/**
 * F3 — commit guards: double-click commits ONCE; closing the modal mid-commit
 * refuses ("Still saving — hold on"); a refresh mid-commit can never produce a
 * silent double import (the add-only server verdict answers the reopened
 * preview with skip_existing, and the counts move exactly once).
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import {
  CAPTURES,
  PORTAL_HEADER,
  apiJwt,
  entitlement,
  f3Stamp,
  liveDemoSchoolId,
  openImportModal,
  pickClass,
  portalRow,
  schoolDetail,
  signInAsOps,
  trackRequests,
} from './fleet3-helpers';

const CLASS_NAME = 'EAL/D Year 7 - Room 4';
const panelOf = (page: Page) => page.locator('[data-surface="ops-student-import"]');

test.describe.configure({ retries: 1 });
test.setTimeout(180_000);

/** One-row csv, file loaded, class picked, ready card shown. */
async function armReadyCard(page: Page, stamp: string) {
  const schoolId = await liveDemoSchoolId();
  await signInAsOps(page);
  const panel = await openImportModal(page, schoolId);
  await mkdir(CAPTURES, { recursive: true });
  const email = `f3.guard.${stamp}@import.invalid`;
  const csv = [PORTAL_HEADER, portalRow('F3', `Guard ${stamp}`, email)].join('\n');
  await panel
    .locator('#ops-import-file')
    .setInputFiles({ name: `f3-guard-${stamp}.csv`, mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await pickClass(page, CLASS_NAME);
  await expect(panel).toHaveAttribute('data-card', 'ready', { timeout: 30_000 });
  return { schoolId, email };
}

test('double-click Commit sends exactly ONE POST /commit', async ({ page, request }) => {
  const stamp = f3Stamp();
  const jwt = await apiJwt(request);
  const { schoolId, email } = await armReadyCard(page, stamp);
  const panel = panelOf(page);
  const commits = trackRequests(page, '/import-students/commit');
  const detailBefore = await schoolDetail(request, jwt, schoolId);

  // Two clicks back to back — the guard (`card === 'uploading'`) must eat the second.
  const cta = panel.locator('[data-surface="ops-import-cta"]');
  await cta.click();
  await cta.click({ timeout: 2_000, force: true }).catch(() => undefined);

  const result = panel.locator('[data-surface="ops-import-result"]');
  await expect(result).toBeVisible({ timeout: 30_000 });
  await expect(result).toContainText('Import finished. Created: 1.');
  await page.waitForTimeout(1_500);
  expect(commits.count(), 'exactly ONE commit POST for a double-click').toBe(1);
  const detailAfter = await schoolDetail(request, jwt, schoolId);
  expect(detailAfter.student_count).toBe(detailBefore.student_count + 1);

  await panel.screenshot({ path: path.join(CAPTURES, '30-double-commit-single-result.png') });
  console.log('CAPTURE 30 — commit request count:', commits.count());

  // Clean up through the modal's own Undo.
  await result.getByRole('button', { name: 'Undo import', exact: true }).click();
  await expect(result).toBeHidden({ timeout: 30_000 });
});

test('closing the modal mid-commit refuses: toast, modal stays, one commit', async ({ page }) => {
  const stamp = f3Stamp();
  const { schoolId } = await armReadyCard(page, stamp);
  const panel = panelOf(page);
  const commits = trackRequests(page, '/import-students/commit');

  // Slow the commit down so "mid-commit" is observable.
  await page.route('**/import-students/commit*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 4_000));
    await route.continue();
  });

  await panel.locator('[data-surface="ops-import-cta"]').click();
  await expect(panel).toHaveAttribute('data-card', 'uploading', { timeout: 30_000 });
  expect(commits.count()).toBeGreaterThanOrEqual(1);

  // Close attempts while committing: Escape, the X button, the footer Cancel.
  await page.keyboard.press('Escape');
  await expect(panel).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('Still saving — hold on')).toBeVisible({ timeout: 10_000 });
  await page.screenshot({ path: path.join(CAPTURES, '31-close-blocked-toast.png') });
  console.log('CAPTURE 31 — close refused mid-commit');

  // The footer Cancel button refuses the same way.
  await panel.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(panel).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('Still saving — hold on')).toBeVisible({ timeout: 10_000 });

  // The commit completes; exactly one POST despite the close attempts.
  const result = panel.locator('[data-surface="ops-import-result"]');
  await expect(result).toBeVisible({ timeout: 30_000 });
  expect(commits.count()).toBe(1);

  await result.getByRole('button', { name: 'Undo import', exact: true }).click();
  await expect(result).toBeHidden({ timeout: 30_000 });
});

test('refresh mid-commit, then reopen: never a silent double import', async ({ page, request }) => {
  const stamp = f3Stamp();
  const jwt = await apiJwt(request);
  const { schoolId, email } = await armReadyCard(page, stamp);
  const panel = panelOf(page);
  const detailBefore = await schoolDetail(request, jwt, schoolId);
  const seatsBefore = await entitlement(request, jwt, schoolId);

  await page.route('**/import-students/commit*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 3_000));
    await route.continue();
  });
  await panel.locator('[data-surface="ops-import-cta"]').click();
  await expect(panel).toHaveAttribute('data-card', 'uploading', { timeout: 30_000 });

  // The operator gives up and reloads MID-COMMIT.
  await page.reload();
  await expect(page.getByRole('tabpanel', { name: 'Students' })).toBeVisible({ timeout: 60_000 });

  // The server-side commit still lands exactly once.
  let detailAfter = await schoolDetail(request, jwt, schoolId);
  await expect
    .poll(async () => (await schoolDetail(request, jwt, schoolId)).student_count, {
      timeout: 30_000,
    })
    .toBe(detailBefore.student_count + 1);
  detailAfter = await schoolDetail(request, jwt, schoolId);

  // Reopen the import modal with the SAME csv: the preview must answer
  // skip_existing (add-only) — the reopened flow can never double import.
  const reopened = await openImportModal(page, schoolId);
  await reopened
    .locator('#ops-import-file')
    .setInputFiles({
      name: `f3-reimport-${stamp}.csv`,
      mimeType: 'text/csv',
      buffer: Buffer.from(
        [PORTAL_HEADER, portalRow('F3', `Guard ${stamp}`, email)].join('\n'),
      ),
    });
  await pickClass(page, CLASS_NAME);
  await expect(reopened).toHaveAttribute('data-card', 'dupes', { timeout: 30_000 });
  const preview = reopened.locator('[data-surface="ops-import-preview"]');
  await expect(
    preview.getByText('0 students will be created, 1 already exists, 0 rows need fixing', {
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({ path: path.join(CAPTURES, '32-reopen-after-refresh-skip.png') });
  console.log('CAPTURE 32 — reopened preview: 0 create / 1 skip (no double import)');

  // Seats moved exactly once, too.
  const seatsAfter = await entitlement(request, jwt, schoolId);
  expect(seatsAfter.seats_used).toBe(seatsBefore.seats_used + 1);
  void detailAfter;

  // Cleanup: remove the imported student through the admin route.
  const roster = await request.get(
    `http://127.0.0.1:5500/api/ops/schools/${schoolId}/students?pageSize=200&q=${encodeURIComponent(email)}`,
    { headers: { Authorization: `Bearer ${jwt}` } },
  );
  const created = ((await roster.json()) as { data: { documentId: string }[] }).data;
  const { deleteStudents } = await import('./helpers/student-cleanup');
  await deleteStudents(request, created.map((row) => row.documentId));
});
