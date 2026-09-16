/**
 * F3 — the ops Students tab: the ?status= QUERY PARAM (spelled exactly
 * `status`), the student profile panel, and deactivate -> confirm -> archived
 * -> reactivate -> active. Runs on its OWN F3 scratch school (created through
 * the real fixture contracts, deleted afterwards) so the shared demo school is
 * never polluted by archived students.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import {
  CAPTURES,
  apiJwt,
  f3Stamp,
  schoolDetail,
  signInAsOps,
  studentRows,
  studentsList,
  studentsTotalLine,
} from './fleet3-helpers';
import {
  OpsFixtureLedger,
  createOpsFixtureSchool,
  createOpsFixtureStudents,
  setOpsFixtureSeats,
} from './helpers/ops-portal';
import { deleteStudents } from './helpers/student-cleanup';

const rowOf = (page: Page, index: number) =>
  page.locator(`[data-directory-row-index="${index}"]`);

test.describe('F3 ops students tab: ?status= param, profile panel, deactivate/reactivate', () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(120_000);

  let schoolId = '';
  let studentIds: string[] = [];
  const ledger = new OpsFixtureLedger();

  test.beforeAll(async ({ request }) => {
    await mkdir(CAPTURES, { recursive: true });
    const school = await createOpsFixtureSchool(request, ledger, `F3-students ${f3Stamp()}`);
    schoolId = school.documentId;
    await setOpsFixtureSeats(request, schoolId, 25);
    studentIds = await createOpsFixtureStudents(request, schoolId, 3);
    expect(studentIds).toHaveLength(3);
  });

  test.afterAll(async ({ request }) => {
    await deleteStudents(request, studentIds);
    await ledger.cleanup(request);
  });

  test('?status=archived drives the server filter and keeps the `status` spelling', async ({
    page,
    request,
  }) => {
    const jwt = await apiJwt(request);
    await signInAsOps(page);

    // A deep link lands on the students tab, filtered; the URL keeps `status`.
    await page.goto(`/dashboard/ops/schools/${schoolId}?tab=students&status=archived`);
    await expect(studentsTotalLine(page)).toBeVisible({ timeout: 30_000 });
    expect(page.url(), 'the query param keeps the `status` spelling').toContain('status=archived');
    expect(page.url()).toContain('tab=students');
    await expect(studentRows(page)).toHaveCount(0, { timeout: 30_000 });

    // Clicking a chip rewrites the URL with the SAME param name.
    await page.getByRole('button', { name: 'Active', exact: true }).click();
    await expect(page).toHaveURL(/status=active/, { timeout: 30_000 });
    await expect(studentRows(page)).toHaveCount(3, { timeout: 30_000 });

    // The served list for ?status=active matches the UI total (server filter).
    const served = await studentsList(request, jwt, schoolId, { status: 'active', pageSize: 200 });
    await expect(studentsTotalLine(page)).toContainText(
      String(served.meta.pagination.total),
      { timeout: 30_000 },
    );
    await page.screenshot({ path: path.join(CAPTURES, '20-students-status-active.png') });
    console.log('CAPTURE 20 — url:', page.url());
  });

  test('profile panel opens from the row, deactivate -> confirm -> archived, reactivate back', async ({
    page,
    request,
  }) => {
    const jwt = await apiJwt(request);
    const detailBefore = await schoolDetail(request, jwt, schoolId);

    await signInAsOps(page);
    await page.goto(`/dashboard/ops/schools/${schoolId}?tab=students`);
    await expect(studentRows(page)).toHaveCount(3, { timeout: 30_000 });

    // PROFILE PANEL: clicking the row opens the student's record modal.
    await rowOf(page, 0).click();
    const profile = page.getByRole('dialog').filter({ hasText: 'Student details' });
    await expect(profile).toBeVisible({ timeout: 30_000 });
    await page.screenshot({ path: path.join(CAPTURES, '21-student-profile-panel.png') });
    console.log('CAPTURE 21');
    await page.keyboard.press('Escape');
    await expect(profile).toBeHidden({ timeout: 30_000 });

    // DEACTIVATE via the row menu -> confirm dialog.
    await rowOf(page, 0).locator('[data-directory-row-menu] button').click();
    await page.getByRole('menuitem', { name: 'Deactivate student', exact: true }).click();
    // The confirm renders as role=alertdialog (OpsConfirmDialog), not dialog.
    const confirm = page.getByRole('alertdialog').filter({ hasText: 'Deactivate' });
    await expect(confirm).toBeVisible({ timeout: 30_000 });
    await page.screenshot({ path: path.join(CAPTURES, '22-deactivate-confirm.png') });
    console.log('CAPTURE 22');
    await confirm.getByRole('button', { name: 'Deactivate', exact: true }).click();

    // The row leaves the ACTIVE view (server-filtered list refreshes).
    await expect(studentRows(page)).toHaveCount(2, { timeout: 30_000 });

    // API cross-check: archived server-side; a status change, not a delete.
    const archived = await studentsList(request, jwt, schoolId, { status: 'archived' });
    expect(archived.meta.pagination.total).toBe(1);
    expect(archived.data[0].documentId).toBe(studentIds[0]);
    const detailAfter = await schoolDetail(request, jwt, schoolId);
    expect(detailAfter.student_count).toBe(detailBefore.student_count);
    await page.screenshot({ path: path.join(CAPTURES, '23-after-deactivate.png') });
    console.log('CAPTURE 23');

    // Reactivate the same student from the ARCHIVED view via ?status=archived.
    await page.goto(`/dashboard/ops/schools/${schoolId}?tab=students&status=archived`);
    await expect(studentRows(page)).toHaveCount(1, { timeout: 30_000 });
    await rowOf(page, 0).locator('[data-directory-row-menu] button').click();
    await page.getByRole('menuitem', { name: 'Reactivate student', exact: true }).click();
    const reactivateConfirm = page.getByRole('dialog').filter({ hasText: 'Reactivate' });
    await expect(reactivateConfirm).toBeVisible({ timeout: 30_000 });
    await reactivateConfirm.getByRole('button', { name: 'Reactivate', exact: true }).click();
    await expect(studentRows(page)).toHaveCount(0, { timeout: 30_000 });

    const active = await studentsList(request, jwt, schoolId, { status: 'active' });
    expect(active.meta.pagination.total).toBe(3);
    await page.screenshot({ path: path.join(CAPTURES, '24-after-reactivate.png') });
    console.log('CAPTURE 24');
  });
});
