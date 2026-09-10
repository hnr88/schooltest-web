import { expect, test } from '@playwright/test';

import {
  archiveImportProbes,
  attachImportShot,
  csvWithBadRows,
  deleteImportProbes,
} from './helpers/class-import';
import {
  apiClassDetail,
  EMPTY_CLASS_ID,
  gotoClassDetail,
  schoolAdminJwt,
} from './helpers/class-detail';
import { cat, loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';

// Journey 03 — a school admin imports a CSV of students onto a class. ONE test
// against the REAL Strapi on :5500 (no mocks): sign in -> class detail ->
// Import students -> a file with two good rows and two rows the server refuses
// -> the good rows land (success count from the server's own reply), the bad
// rows are named PER ROW with the server's reason, and the roster still holds
// the imported students after a FULL browser reload. 1440x900 shots land in
// .qa/journeys/03-import-students/shots/ via helpers/class-import.ts.
//
// Probes are created through the real UI flow and retired through the real
// writes: archived after the class-count assertion, then deleted by afterEach
// so a re-run starts from the same empty fixture class.
const en = loadMessages('en');
const STAMP = Date.now();
const GOOD_ROWS = [`Journey03 Probe ${STAMP}A`, `Journey03 Probe ${STAMP}B`];

const probeRegister: string[] = [];

test.afterEach(async ({ request }) => {
  await deleteImportProbes(request, probeRegister.splice(0));
});

test('a CSV with good and broken rows imports the good ones, names the bad ones per row, and they persist after reload', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await loginAs(page, 'schoolAdmin');
  const jwt = await schoolAdminJwt(page.request);
  const before = await apiClassDetail(page.request, jwt, EMPTY_CLASS_ID);

  await gotoClassDetail(page, EMPTY_CLASS_ID);
  await page
    .getByRole('button', { name: cat(en, 'Classes.detail.importStudents') })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  // Two good rows on csv lines 2-3, two broken ones on 4-5: a missing given
  // name and a date of birth that is not a date. Both are rows the SERVER
  // refuses, so the file exercises the real per-row refusal.
  await dialog
    .getByLabel(cat(en, 'StudentImport.pasteLabel'))
    .fill(csvWithBadRows(GOOD_ROWS));

  // BEFORE the submit the parser already names the lines, one row each.
  const rejects = dialog.locator('[data-slot="student-import-rejects"]');
  await expect(rejects).toBeVisible();
  await expect(rejects.locator('tbody tr')).toHaveCount(2);
  await expect(rejects.locator('tbody tr').nth(0)).toContainText('4');
  await expect(rejects.locator('tbody tr').nth(1)).toContainText('5');
  await attachImportShot(page, testInfo, 'j03-mixed-csv-parsed-rejects');

  await dialog.getByRole('button', { name: cat(en, 'Classes.detail.import.submit') }).click();

  // The success count comes from the SERVER's own reply: 2 of the 4 rows the
  // file offered.
  await expect(page.locator('[data-sonner-toast]')).toContainText('2 of 4');

  // The dialog STAYS OPEN with the server's refused rows named per row, each
  // carrying the server's own reason — not a whole-file refusal.
  await expect(dialog).toBeVisible();
  await expect(rejects.locator('tbody tr')).toHaveCount(2);
  await expect(rejects).toContainText('given name is required');
  await expect(rejects).toContainText('date of birth must be a real date in YYYY-MM-DD form');
  await attachImportShot(page, testInfo, 'j03-mixed-csv-server-rejects');

  // The SERVER really holds the two good students, on THIS class.
  const afterImport = await apiClassDetail(page.request, jwt, EMPTY_CLASS_ID);
  expect(afterImport.student_count).toBe(before.student_count + GOOD_ROWS.length);
  const created = afterImport.students.filter((student) =>
    GOOD_ROWS.some((name) => name.startsWith(student.given_name ?? '')),
  );
  expect(created.length).toBe(GOOD_ROWS.length);
  const probeIds = created.map((student) => student.documentId);
  probeRegister.push(...probeIds);

  // …and they survive a FULL browser reload on the roster itself.
  await dialog.getByRole('button', { name: cat(en, 'Classes.detail.import.cancel') }).click();
  await page.reload();
  const surface = page.locator('[data-surface="school-admin-class-detail"]');
  await expect(surface.locator('tbody tr')).toHaveCount(before.students.length + GOOD_ROWS.length);
  for (const name of GOOD_ROWS) {
    await expect(surface).toContainText(name.split(' ').slice(0, 2).join(' '));
  }
  await attachImportShot(page, testInfo, 'j03-roster-after-reload', true);

  // Archive, assert the class is back at its found count, afterEach deletes.
  await archiveImportProbes(page.request, jwt, probeIds);
  const restored = await apiClassDetail(page.request, jwt, EMPTY_CLASS_ID);
  expect(restored.student_count).toBe(before.student_count);
});
