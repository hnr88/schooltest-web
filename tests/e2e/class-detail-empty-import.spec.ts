import { expect, test } from '@playwright/test';

import {
  archiveImportProbes,
  attachImportShot,
  createImportClass,
  csvFor,
  csvWithBadRows,
  deleteImportClasses,
  retireImportProbes,
} from './helpers/class-import';
import {
  apiClassDetail,
  EMPTY_CLASS_ID,
  gotoClassDetail,
  schoolAdminJwt,
} from './helpers/class-detail';
import { cat, loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';

// Spec §1 empty state + the class-scoped CSV import. Flow 12 asserts the
// shared EMPTY fixture; the import flows create and dispose of their own
// class, so a mid-flow death can never poison flow 12's invariant.
const en = loadMessages('en');
const STAMP = Date.now();
const PROBE_ROWS = [`Import Probe ${STAMP}A`, `Import Probe ${STAMP}B`];
/** The good rows of the MIXED file (flow 13b) — a separate run-created class. */
const MIXED_GOOD_ROWS = [`Mixed Probe ${STAMP}A`, `Mixed Probe ${STAMP}B`];

// Every probe and run-created class is retired after each test, even a failed
// one, so the next run starts from the same state.
const probeRegister: string[] = [];
const classRegister: string[] = [];

test.afterEach(async ({ request }) => {
  await retireImportProbes(request, probeRegister.splice(0), STAMP);
  await deleteImportClasses(request, classRegister.splice(0));
});

test.describe.configure({ mode: 'serial' });

test.describe('class detail empty state + import (spec §1)', () => {
  test('flow 12: a class with no students shows the proper empty state', async ({ page }) => {
    await loginAs(page, 'schoolAdmin');
    const detail = await apiClassDetail(
      page.request,
      await schoolAdminJwt(page.request),
      EMPTY_CLASS_ID,
    );
    expect(detail.students.length, 'fixture empty class must have no students').toBe(0);

    await gotoClassDetail(page, EMPTY_CLASS_ID);
    const empty = page.locator('[data-slot="empty-state"]');
    await expect(empty).toBeVisible();
    await expect(empty).toContainText(cat(en, 'Classes.detail.empty.title'));
    await expect(empty).toContainText(cat(en, 'Classes.detail.empty.description'));
    await expect(
      empty.getByRole('button', { name: cat(en, 'Classes.detail.empty.import') }),
    ).toBeVisible();
    // The design system renders a link-button as <a role="button">.
    await expect(
      empty.getByRole('button', { name: cat(en, 'Classes.detail.empty.addStudent') }),
    ).toBeVisible();

    const text = await page.locator('[data-surface="school-admin-class-detail"]').innerText();
    expect(text).not.toContain('No active children');
    expect(text.toLowerCase()).not.toContain('children');
  });

  test('flow 13: importing a CSV from this page really creates the students in this class', async ({
    page,
  }) => {
    await loginAs(page, 'schoolAdmin');
    const jwt = await schoolAdminJwt(page.request);
    const classId = await createImportClass(page.request, jwt, `Import Probe Class ${STAMP}A`);
    classRegister.push(classId);
    const before = await apiClassDetail(page.request, jwt, classId);

    await gotoClassDetail(page, classId);
    await page
      .getByRole('button', { name: cat(en, 'Classes.detail.importStudents') })
      .first()
      .click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // The class is fixed to the one being viewed — no class selector to get wrong.
    await expect(dialog.getByLabel(cat(en, 'StudentImport.classLabel'))).toHaveCount(0);

    await dialog.getByLabel(cat(en, 'StudentImport.pasteLabel')).fill(csvFor(PROBE_ROWS));
    await expect(dialog).toContainText('2');
    await dialog.getByRole('button', { name: cat(en, 'Classes.detail.import.submit') }).click();
    await expect(dialog).toBeHidden({ timeout: 20_000 });

    await expect(page.locator('[data-surface="school-admin-class-detail"] tbody tr')).toHaveCount(
      before.students.length + PROBE_ROWS.length,
    );

    // …the SERVER really holds it…
    const afterImport = await apiClassDetail(page.request, jwt, classId);
    expect(afterImport.student_count).toBe(before.student_count + PROBE_ROWS.length);
    expect(afterImport.summary.students).toBe(before.summary.students + PROBE_ROWS.length);
    const created = afterImport.students.filter((student) =>
      PROBE_ROWS.some((name) => name.startsWith(student.given_name ?? '')),
    );
    expect(created.length).toBe(PROBE_ROWS.length);
    const probeIds = created.map((student) => student.documentId);
    probeRegister.push(...probeIds);
    // A brand-new student has both tests not started, with no invented evidence.
    for (const student of created) {
      expect(student.tests.map((test) => test.status)).toEqual(['not_started', 'not_started']);
      expect(student.tests.every((test) => test.overall_score === null)).toBe(true);
    }

    // …and it survives a full reload.
    await page.reload();
    await expect(page.locator('[data-surface="school-admin-class-detail"] tbody tr')).toHaveCount(
      before.students.length + PROBE_ROWS.length,
    );

    // Archived through the app's real write; the afterEach then deletes them.
    await archiveImportProbes(page.request, jwt, probeIds);
    const restored = await apiClassDetail(page.request, jwt, classId);
    expect(restored.student_count).toBe(before.student_count);
  });

  test('flow 13b: a file with broken rows imports the good rows and names the bad ones per row', async ({
    page,
  }, testInfo) => {
    await loginAs(page, 'schoolAdmin');
    const jwt = await schoolAdminJwt(page.request);
    const classId = await createImportClass(page.request, jwt, `Import Probe Class ${STAMP}B`);
    classRegister.push(classId);
    const before = await apiClassDetail(page.request, jwt, classId);

    await gotoClassDetail(page, classId);
    await page
      .getByRole('button', { name: cat(en, 'Classes.detail.importStudents') })
      .first()
      .click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Two good rows on csv lines 2-3, two broken ones on 4-5 — both rows the
    // SERVER refuses, so the file exercises the real per-row refusal.
    await dialog
      .getByLabel(cat(en, 'StudentImport.pasteLabel'))
      .fill(csvWithBadRows(MIXED_GOOD_ROWS));

    // BEFORE the submit the parser already names the lines, one row each.
    const rejects = dialog.locator('[data-slot="student-import-rejects"]');
    await expect(rejects).toBeVisible();
    await expect(rejects.locator('tbody tr')).toHaveCount(2);
    await expect(rejects.locator('tbody tr').nth(0)).toContainText('4');
    await expect(rejects.locator('tbody tr').nth(1)).toContainText('5');
    await attachImportShot(page, testInfo, 'j03-mixed-csv-parsed-rejects');

    await dialog.getByRole('button', { name: cat(en, 'Classes.detail.import.submit') }).click();

    // The good rows landed; the toast reports the SERVER's own counts (2 of 4).
    await expect(page.locator('[data-sonner-toast]')).toContainText('2 of 4');

    // The dialog STAYS OPEN with the server's refused rows named per row, each
    // carrying the server's own reason — not a whole-file refusal.
    await expect(dialog).toBeVisible();
    await expect(rejects.locator('tbody tr')).toHaveCount(2);
    await expect(rejects).toContainText('given name is required');
    await expect(rejects).toContainText('date of birth must be a real date in YYYY-MM-DD form');
    await attachImportShot(page, testInfo, 'j03-mixed-csv-server-rejects');

    // The SERVER really holds the two good students, on THIS class.
    const afterImport = await apiClassDetail(page.request, jwt, classId);
    expect(afterImport.student_count).toBe(before.student_count + MIXED_GOOD_ROWS.length);
    const created = afterImport.students.filter((student) =>
      MIXED_GOOD_ROWS.some((name) => name.startsWith(student.given_name ?? '')),
    );
    expect(created.length).toBe(MIXED_GOOD_ROWS.length);
    const probeIds = created.map((student) => student.documentId);
    probeRegister.push(...probeIds);

    // …and they survive a FULL browser reload on the roster itself.
    await dialog.getByRole('button', { name: cat(en, 'Classes.detail.import.cancel') }).click();
    await page.reload();
    const roster = page.locator('[data-surface="school-admin-class-detail"] tbody tr');
    await expect(roster).toHaveCount(before.students.length + MIXED_GOOD_ROWS.length);
    for (const name of MIXED_GOOD_ROWS) {
      await expect(page.locator('[data-surface="school-admin-class-detail"]')).toContainText(
        name.split(' ').slice(0, 2).join(' '),
      );
    }
    await attachImportShot(page, testInfo, 'j03-roster-after-reload', true);

    // Same two-step retirement as flow 13: archive, assert, afterEach deletes.
    await archiveImportProbes(page.request, jwt, probeIds);
    const restored = await apiClassDetail(page.request, jwt, classId);
    expect(restored.student_count).toBe(before.student_count);
  });
});
