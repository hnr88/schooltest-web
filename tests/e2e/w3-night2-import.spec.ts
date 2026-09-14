import { readFileSync } from 'node:fs';

import { expect, test, type APIRequestContext } from '@playwright/test';

import {
  archiveImportProbes,
  createImportClass,
  deleteImportClasses,
  deleteImportProbes,
} from './helpers/class-import';
import { apiClassDetail, gotoClassDetail, schoolAdminJwt } from './helpers/class-detail';
import { cat, loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';

// NIGHT-2 W3 — the school-admin import journey chain (SA-011..SA-018):
//   SA-011 the template download is the header-only portal CSV
//   SA-012 a filled template uploads through the dropzone and previews before commit
//   SA-013 the paste-a-list intake feeds the same preview (class page + students page)
//   SA-014 invalid rows land in the per-row reject list; valid rows still preview
//   SA-015 commit succeeds, the summary counts created/skipped, the roster grows
//   SA-016 an oversized file is refused with the 5 MB message and imports nothing
//   SA-017 duplicates follow the documented dedupe rule (skip_existing / in-file repeat)
//   SA-018 the class-page dialog fixes the destination class
// ONE real Strapi, no mocks; probes are created through the real UI flow into a
// run-created class and retired by afterEach (archive -> delete -> class delete).
const en = loadMessages('en');
const STAMP = Date.now();

const probeRegister: string[] = [];
const classRegister: string[] = [];

test.afterEach(async ({ request }) => {
  await deleteImportProbes(request, probeRegister.splice(0));
  await deleteImportClasses(request, classRegister.splice(0));
});

test.describe.configure({ mode: 'serial' });
// Room for the patient sign-in retry (31s rate-limit window) plus dev-server
// route compiles under the overnight fleet's parallel load.
test.setTimeout(180_000);

/**
 * UI sign-in with ONE rate-limit retry. The shared API's auth limiter is
 * 20 POST /api/auth/local per minute per IP, and overnight the fleet's parallel
 * suites share that budget — a perfect-credential submit can still land 429 and
 * strand the form on /sign-in. Wait out the window and submit once more before
 * treating the login as broken.
 */
async function loginAsPatient(page: import('@playwright/test').Page) {
  try {
    await loginAs(page, 'schoolAdmin');
  } catch {
    await page.waitForTimeout(31_000);
    await loginAs(page, 'schoolAdmin');
  }
}

async function openClassImportDialog(page: import('@playwright/test').Page, classId: string) {
  // One retry: under the overnight fleet's parallel load the class-detail page
  // can transiently miss its surface render (shared API 429s, dev-server
  // compile). A second navigation is all it takes — same discipline as
  // helpers/api-named-retry.ts, scoped to this spec.
  const open = async () => {
    await gotoClassDetail(page, classId);
    await page
      .getByRole('button', { name: cat(en, 'Classes.detail.importStudents') })
      .first()
      .click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    return dialog;
  };
  try {
    return await open();
  } catch {
    await page.waitForTimeout(5_000);
    return await open();
  }
}

async function classStudentCount(request: APIRequestContext, jwt: string, classId: string) {
  const detail = await apiClassDetail(request, jwt, classId);
  return detail.student_count;
}

test('SA-011 + SA-018: class-page dialog fixes the class and the template download is the header-only portal CSV', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await loginAsPatient(page);
  const jwt = await schoolAdminJwt(page.request);
  const classId = await createImportClass(page.request, jwt, `W3 Template Class ${STAMP}`);
  classRegister.push(classId);

  const dialog = await openClassImportDialog(page, classId);

  // SA-018: the class is FIXED — the description names it and no class picker renders.
  await expect(dialog).toContainText(`Every row is added to W3 Template Class ${STAMP}`);
  await expect(dialog.getByLabel(cat(en, 'StudentImport.classLabel'))).toHaveCount(0);

  // SA-011: the template download is built in the browser and is HEADER-ONLY.
  const downloadPromise = page.waitForEvent('download');
  await dialog.getByRole('button', { name: cat(en, 'StudentImport.downloadTemplate') }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('student-import-template.csv');
  const path = await download.path();
  const content = readFileSync(path!, 'utf8');
  expect(content).toBe('given name,family name,date of birth,year level,home language\n');
  await testInfo.attach('w3-sa011-template.csv', {
    body: Buffer.from(content),
    contentType: 'text/csv',
  });
});

test('SA-012 + SA-014 + SA-015: dropzone upload previews, per-row rejects name lines, commit grows the roster', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  // The shared dev server compiles routes on demand; under the fleet's parallel
  // load the 5s per-expect default is too tight for first renders.
  page.setDefaultTimeout(30_000);
  await loginAsPatient(page);
  const jwt = await schoolAdminJwt(page.request);
  const classId = await createImportClass(page.request, jwt, `W3 Dropzone Class ${STAMP}`);
  classRegister.push(classId);
  const before = await classStudentCount(page.request, jwt, classId);

  const dialog = await openClassImportDialog(page, classId);
  const good = [`W3 Drop ${STAMP} A`, `W3 Drop ${STAMP} B`];
  const csv = [
    'given name,family name,date of birth,year level,home language',
    `${good[0]},Probe,2012-04-01,8,english`,
    `${good[1]},Probe,2012-04-02,8,korean`,
    ',NoGivenName,2012-04-03,8,english',
    'Broken Dob,Row,14/05/2012,8,english',
  ].join('\n');

  // SA-012: a REAL file through the dropzone's hidden input.
  await dialog
    .getByLabel(cat(en, 'StudentImport.fileInputLabel'))
    .setInputFiles({ name: 'w3-roster.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await expect(dialog).toContainText('2 rows ready to import');

  // SA-014: the two bad rows are named PER LINE in the reject list.
  const rejects = dialog.locator('[data-slot="student-import-rejects"]');
  await expect(rejects).toBeVisible();
  await expect(rejects.locator('tbody tr')).toHaveCount(2);
  await expect(rejects.locator('tbody tr').nth(0)).toContainText('4');
  await expect(rejects.locator('tbody tr').nth(1)).toContainText('5');
  await testInfo.attach('w3-sa014-preview.png', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });

  // SA-015: commit — the success count is the SERVER's own reply.
  await dialog.getByRole('button', { name: cat(en, 'Classes.detail.import.submit') }).click();
  await expect(page.locator('[data-sonner-toast]')).toContainText('2 of 4 students were imported');

  const afterImport = await classStudentCount(page.request, jwt, classId);
  expect(afterImport).toBe(before + 2);
  const detail = await apiClassDetail(page.request, jwt, classId);
  const created = detail.students.filter((s) => good.some((name) => s.given_name === name));
  expect(created.length).toBe(2);
  probeRegister.push(...created.map((s) => s.documentId));

  // The dialog stays open with the server's refused rows for fixing.
  await expect(dialog).toBeVisible();
  await expect(rejects.locator('tbody tr')).toHaveCount(2);
  await dialog.getByRole('button', { name: cat(en, 'Classes.detail.import.cancel') }).click();

  // …and the roster survives a FULL reload. (Dev-server route compile under the
  // parallel fleet can push the first roster render past the 5s default. The
  // directory table is an ARIA grid — `div[role="table"] > div[role="row"]`, no
  // HTML tbody — so the locator filters data rows by the probes' family name.)
  await page.reload();
  const surface = page.locator('[data-surface="school-admin-class-detail"]');
  await expect(
    surface.locator('[role="row"]').filter({ hasText: 'Probe' }),
  ).toHaveCount(before + 2, { timeout: 20_000 });
});

test('SA-013: paste-a-list parses into the same preview on the class page and the students page', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await loginAsPatient(page);
  const jwt = await schoolAdminJwt(page.request);
  const classId = await createImportClass(page.request, jwt, `W3 Paste Class ${STAMP}`);
  classRegister.push(classId);

  // Class page: the paste box feeds the same ready-count preview.
  const dialog = await openClassImportDialog(page, classId);
  await dialog
    .getByLabel(cat(en, 'StudentImport.pasteLabel'))
    .fill(
      [
        'given name,family name,date of birth,year level,home language',
        `W3 Paste ${STAMP} A,Probe,2012-04-01,8,english`,
        `W3 Paste ${STAMP} B,Probe,2012-04-02,8,vietnamese`,
      ].join('\n'),
    );
  await expect(dialog).toContainText('2 rows ready to import');
  await dialog.getByRole('button', { name: cat(en, 'Classes.detail.import.cancel') }).click();

  // Students page: the SAME dialog with the class picker shown.
  await page.goto('/dashboard/school/students');
  await page
    .getByRole('button', { name: cat(en, 'SchoolStudents.importButton') })
    .first()
    .click();
  const pickerDialog = page.getByRole('dialog');
  await expect(pickerDialog).toBeVisible();
  await pickerDialog.getByLabel(cat(en, 'StudentImport.classLabel')).click();
  // Radix portals the open listbox to <body>, outside the dialog subtree.
  await page.getByRole('option', { name: `W3 Paste Class ${STAMP}` }).click();
  await pickerDialog
    .getByLabel(cat(en, 'StudentImport.pasteLabel'))
    .fill(`W3 Paste ${STAMP} C,Probe,2012-04-03,8,english`);
  await expect(pickerDialog).toContainText('1 student ready to import');
  await pickerDialog.getByRole('button', { name: cat(en, 'SchoolStudents.import.cancel') }).click();
});

test('SA-017: duplicates follow the dedupe rule — re-upload skips, in-file repeat is refused by row', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await loginAsPatient(page);
  const jwt = await schoolAdminJwt(page.request);
  const classId = await createImportClass(page.request, jwt, `W3 Dedupe Class ${STAMP}`);
  classRegister.push(classId);
  const before = await classStudentCount(page.request, jwt, classId);

  const row = `W3 Dup ${STAMP},Probe,2012-04-01,8,english`;

  // First import: the student exists after this.
  const dialog1 = await openClassImportDialog(page, classId);
  await dialog1
    .getByLabel(cat(en, 'StudentImport.pasteLabel'))
    .fill(`given name,family name,date of birth,year level,home language\n${row}`);
  await dialog1.getByRole('button', { name: cat(en, 'Classes.detail.import.submit') }).click();
  await expect(page.locator('[data-sonner-toast]')).toContainText('1 student was imported');
  const afterFirst = await classStudentCount(page.request, jwt, classId);
  expect(afterFirst).toBe(before + 1);
  const detail = await apiClassDetail(page.request, jwt, classId);
  const dup = detail.students.find((s) => s.given_name === `W3 Dup ${STAMP}`);
  probeRegister.push(dup!.documentId);
  // A FULLY successful commit closes the dialog itself (onDone) — Cancel only
  // exists while the dialog is still open.
  await expect(dialog1).toBeHidden({ timeout: 10_000 });

  // Re-upload the SAME identity: skip_existing wins — nothing is created twice.
  const dialog2 = await openClassImportDialog(page, classId);
  await dialog2
    .getByLabel(cat(en, 'StudentImport.pasteLabel'))
    .fill(`given name,family name,date of birth,year level,home language\n${row}`);
  await dialog2.getByRole('button', { name: cat(en, 'Classes.detail.import.submit') }).click();
  await expect(page.locator('[data-sonner-toast]')).toContainText(
    'Every student in this file is already in your school.',
  );
  expect(await classStudentCount(page.request, jwt, classId)).toBe(before + 1);
  await expect(dialog2).toBeHidden({ timeout: 10_000 });

  // An existing identity PLUS a new one in one file: created/skipped summary.
  const dialog3 = await openClassImportDialog(page, classId);
  await dialog3
    .getByLabel(cat(en, 'StudentImport.pasteLabel'))
    .fill(
      `given name,family name,date of birth,year level,home language\n${row}\nW3 Fresh ${STAMP},Probe,2012-04-02,8,english`,
    );
  await dialog3.getByRole('button', { name: cat(en, 'Classes.detail.import.submit') }).click();
  await expect(page.locator('[data-sonner-toast]')).toContainText('1 imported, 1 already enrolled');
  expect(await classStudentCount(page.request, jwt, classId)).toBe(before + 2);
  const detail3 = await apiClassDetail(page.request, jwt, classId);
  const fresh = detail3.students.find((s) => s.given_name === `W3 Fresh ${STAMP}`);
  probeRegister.push(fresh!.documentId);
  await expect(dialog3).toBeHidden({ timeout: 10_000 });

  // A repeat WITHIN one file: the second row is refused BY ROW, not merged.
  const dialog4 = await openClassImportDialog(page, classId);
  const twin = `W3 Twin ${STAMP},Probe,2012-04-05,8,english`;
  await dialog4
    .getByLabel(cat(en, 'StudentImport.pasteLabel'))
    .fill(`given name,family name,date of birth,year level,home language\n${twin}\n${twin}`);
  await dialog4.getByRole('button', { name: cat(en, 'Classes.detail.import.submit') }).click();
  await expect(page.locator('[data-sonner-toast]')).toContainText('1 of 2 students were imported');
  const rejects = dialog4.locator('[data-slot="student-import-rejects"]');
  await expect(rejects).toContainText(
    'this file already lists a student with this name and date of birth',
  );
  expect(await classStudentCount(page.request, jwt, classId)).toBe(before + 3);
  const detail4 = await apiClassDetail(page.request, jwt, classId);
  const twin2 = detail4.students.find((s) => s.given_name === `W3 Twin ${STAMP}`);
  probeRegister.push(twin2!.documentId);
});

test('SA-016: an oversized CSV is refused with the 5 MB message and imports nothing', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await loginAsPatient(page);
  const jwt = await schoolAdminJwt(page.request);
  const classId = await createImportClass(page.request, jwt, `W3 TooBig Class ${STAMP}`);
  classRegister.push(classId);
  const before = await classStudentCount(page.request, jwt, classId);

  const dialog = await openClassImportDialog(page, classId);
  // > 5 MiB of valid-looking rows: the server's byte gate fires BEFORE parsing.
  const line = 'W3 Big,Row,2012-04-01,8,english,padding-to-make-each-line-fat-'.padEnd(600, 'x');
  const rows = ['given name,family name,date of birth,year level,home language,student key'];
  for (let i = 0; i < 9500; i += 1) rows.push(`${line}${i}`);
  const csv = rows.join('\n');
  expect(Buffer.byteLength(csv, 'utf8')).toBeGreaterThan(5 * 1024 * 1024);

  await dialog
    .getByLabel(cat(en, 'StudentImport.fileInputLabel'))
    .setInputFiles({ name: 'w3-too-big.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await expect(dialog).toContainText('9,500 rows ready to import', { timeout: 30_000 });
  await dialog.getByRole('button', { name: cat(en, 'Classes.detail.import.submit') }).click();
  await expect(page.locator('[data-sonner-toast]')).toContainText(
    'That file is too large. The limit is 5 MB.',
  );
  await testInfo.attach('w3-sa016-too-big.png', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
  expect(await classStudentCount(page.request, jwt, classId)).toBe(before);

  // An unsupported (non-CSV) file is ignored by the intake: its content never
  // enters the paste box (the previous file's text stays untouched).
  await dialog
    .getByLabel(cat(en, 'StudentImport.fileInputLabel'))
    .setInputFiles({ name: 'w3-notes.txt', mimeType: 'text/plain', buffer: Buffer.from('not a csv') });
  await page.waitForTimeout(1000);
  await expect(dialog.getByLabel(cat(en, 'StudentImport.pasteLabel'))).not.toContainText('not a csv');
});
