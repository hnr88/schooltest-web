import path from 'node:path';

import { expect, test, type APIRequestContext, type Page, type TestInfo } from '@playwright/test';

import {
  createImportClass,
  deleteImportClasses,
} from './helpers/class-import';
import { apiClassDetail, gotoClassDetail, schoolAdminJwt } from './helpers/class-detail';
import { cat, loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';
import { deleteStudents } from './helpers/student-cleanup';
import { watchErrors } from './helpers/ui';

// FLEET 6 scratch — the class-page roster PASTE intake, happy AND unhappy:
//   happy 3-row paste -> preview -> commit -> roster grows (server-verified)
//   missing email cell  -> per-row refusal, valid rows still preview
//   garbage lines       -> per-row refusal
//   duplicate email twice in one paste -> product behaviour recorded
//   already-enrolled re-paste -> skip_existing
//   extras: refresh mid-preview, Escape mid-commit (exactly one write)
// Screenshots into tests/e2e/captures/fleet6/; data stamped F6-<epoch>.
const en = loadMessages('en');
const CAPTURES = path.resolve(process.cwd(), 'tests', 'e2e', 'captures', 'fleet6');
const API = process.env.API_BASE_URL ?? 'http://127.0.0.1:5500';
const STAMP = Date.now();

let shotIndex = 0;

async function shot(page: Page, testInfo: TestInfo, slug: string, fullPage = false): Promise<void> {
  shotIndex += 1;
  const name = `${String(shotIndex).padStart(2, '0')}-${slug}.png`;
  const body = await page.screenshot({ path: path.join(CAPTURES, name), fullPage });
  await testInfo.attach(name, { body, contentType: 'image/png' });
}

async function loginAsPatient(page: Page): Promise<void> {
  try {
    await loginAs(page, 'schoolAdmin');
  } catch {
    await page.waitForTimeout(31_000);
    await loginAs(page, 'schoolAdmin');
  }
}

const HEADER = 'given name,family name,email,date of birth,year level,home language';

function rowFor(given: string, email: string, extra: Partial<{ family: string; dob: string; language: string; level: string }> = {}): string {
  return [
    given,
    extra.family ?? 'Probe',
    email,
    extra.dob ?? '2012-06-15',
    extra.level ?? '8',
    extra.language ?? 'english',
  ].join(',');
}

async function openImportDialog(page: Page, classId: string) {
  await gotoClassDetail(page, classId);
  await page
    .getByRole('button', { name: cat(en, 'Classes.detail.importStudents') })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  return dialog;
}

async function paste(page: Page, dialog: ReturnType<Page['getByRole']>, text: string) {
  await dialog.getByLabel(cat(en, 'StudentImport.pasteLabel')).fill(text);
}

async function commit(page: Page) {
  await page
    .getByRole('dialog')
    .getByRole('button', { name: cat(en, 'Classes.detail.import.submit') })
    .click();
}

function rosterRows(page: Page) {
  return page
    .locator('[data-surface="school-admin-class-detail"]')
    .locator('[data-directory-row]');
}

test.describe.configure({ mode: 'serial' });
test.setTimeout(180_000);

test.describe('fleet6: roster paste intake', () => {
  const happyClass = `F6-${STAMP} Paste Happy`;
  const messyClass = `F6-${STAMP} Paste Messy`;
  const dupClass = `F6-${STAMP} Paste Dedupe`;
  const classRegister: string[] = [];
  const probeRegister: string[] = [];

  test.afterAll(async ({ request }) => {
    await deleteStudents(request, probeRegister.splice(0)).catch(() => {});
    await deleteImportClasses(request, classRegister.splice(0));
  });

  test('01 happy paste: 3 new students preview, commit, roster grows', async ({ page }, testInfo) => {
    const jwt = await schoolAdminJwt(page.request);
    const classId = await createImportClass(page.request, jwt, happyClass);
    classRegister.push(classId);
    const before = await apiClassDetail(page.request, jwt, classId);
    expect(before.student_count).toBe(0);

    await loginAsPatient(page);
    const dialog = await openImportDialog(page, classId);
    await paste(page, dialog, [
      HEADER,
      rowFor(`F6 Joy ${STAMP} A`, `f6-joy-${STAMP}-a@invalid.test`, { language: 'korean' }),
      rowFor(`F6 Joy ${STAMP} B`, `f6-joy-${STAMP}-b@invalid.test`, { dob: '2011-02-02' }),
      rowFor(`F6 Joy ${STAMP} C`, `f6-joy-${STAMP}-c@invalid.test`, { level: '9' }),
    ].join('\n'));

    await expect(dialog).toContainText('3 rows ready to import');
    await shot(page, testInfo, 'paste-happy-preview');

    await commit(page);
    await expect(page.locator('[data-sonner-toast]')).toContainText('3 students were imported');
    await shot(page, testInfo, 'paste-happy-toast');

    // Roster grew in the UI AND on the server; the count chip agrees.
    await expect(rosterRows(page)).toHaveCount(3, { timeout: 30_000 });
    const surface = page.locator('[data-surface="school-admin-class-detail"]');
    await expect(surface).toContainText('3 students');
    await shot(page, testInfo, 'paste-happy-roster', true);

    const after = await apiClassDetail(page.request, jwt, classId);
    expect(after.student_count).toBe(3);
    expect(after.student_count).toBe(after.students.length); // no [LOGIC] drift
    for (const student of after.students) {
      probeRegister.push(student.documentId);
      expect(student.tests.map((t) => t.status)).toEqual(['not_started', 'not_started']);
    }

    // Survives a full reload.
    await page.reload();
    await expect(rosterRows(page)).toHaveCount(3, { timeout: 30_000 });
  });

  test('02 missing email cell: row refused by line, valid rows still preview', async ({
    page,
  }, testInfo) => {
    const jwt = await schoolAdminJwt(page.request);
    const classId = await createImportClass(page.request, jwt, messyClass);
    classRegister.push(classId);

    await loginAsPatient(page);
    const dialog = await openImportDialog(page, classId);

    // Line 2 has NO email column value at all; line 3 is valid.
    await paste(page, dialog, [
      HEADER,
      rowFor(`F6 NoMail ${STAMP}`, ''),
      rowFor(`F6 Good ${STAMP}`, `f6-good-${STAMP}@invalid.test`),
    ].join('\n'));

    await expect(dialog).toContainText('1 row ready to import');
    const rejects = dialog.locator('[data-slot="student-import-rejects"]');
    await expect(rejects).toBeVisible();
    await expect(rejects.locator('tbody tr')).toHaveCount(1);
    await expect(rejects).toContainText('2');
    await shot(page, testInfo, 'paste-missing-email-rejects');

    // Commit imports ONLY the valid row.
    await commit(page);
    await expect(page.locator('[data-sonner-toast]')).toContainText('1 of 2 students were imported');
    await expect(rosterRows(page)).toHaveCount(1, { timeout: 30_000 });
    await shot(page, testInfo, 'paste-missing-email-committed', true);

    const after = await apiClassDetail(page.request, jwt, classId);
    expect(after.student_count).toBe(1);
    probeRegister.push(after.students[0].documentId);
  });

  test('03 column-count garbage: whole-file refusal naming the row', async ({ page }, testInfo) => {
    const jwt = await schoolAdminJwt(page.request);
    const garbageId = await createImportClass(page.request, jwt, `F6-${STAMP} Paste Garbage`);
    classRegister.push(garbageId);

    await loginAsPatient(page);
    const dialog = await openImportDialog(page, garbageId);
    // 7 values under a 6-column header (the triple comma) — the SERVER refuses
    // the whole file with its own shape message; nothing is imported.
    await paste(page, dialog, [
      HEADER,
      '!!!,,,nonsense,not-a-date,99,klingon',
      rowFor(`F6 Clean ${STAMP}`, `f6-clean-${STAMP}@invalid.test`),
    ].join('\n'));
    await expect(dialog).toContainText('1 row ready to import');
    await shot(page, testInfo, 'paste-column-count-preview');

    await commit(page);
    await expect(page.locator('[data-sonner-toast]')).toContainText(
      'row 2 has 7 values but the header declares 6',
    );
    await shot(page, testInfo, 'paste-column-count-refused');

    const after = await apiClassDetail(page.request, jwt, garbageId);
    expect(after.student_count).toBe(0);
  });

  test('03b multi-bad row: one reject per field, all naming the line; clean row still imports', async ({
    page,
  }, testInfo) => {
    const jwt = await schoolAdminJwt(page.request);
    const garbageId = await createImportClass(page.request, jwt, `F6-${STAMP} Paste Fields`);
    classRegister.push(garbageId);

    await loginAsPatient(page);
    const dialog = await openImportDialog(page, garbageId);
    await paste(page, dialog, [
      HEADER,
      '!!!,nope,nonsense,not-a-date,99,klingon',
      '   ',
      rowFor(`F6 Clean ${STAMP}`, `f6-clean-${STAMP}@invalid.test`),
    ].join('\n'));

    await expect(dialog).toContainText('1 row ready to import');
    const rejects = dialog.locator('[data-slot="student-import-rejects"]');
    await expect(rejects).toBeVisible();
    // One reject row PER FIELD ERROR, each quoting its line; the whitespace
    // line is skipped silently (parse-student-csv isBlank).
    const rejectRows = rejects.locator('tbody tr');
    const rejectCount = await rejectRows.count();
    expect(rejectCount).toBeGreaterThanOrEqual(2);
    for (let index = 0; index < rejectCount; index += 1) {
      await expect(rejectRows.nth(index)).toContainText('2');
    }
    await shot(page, testInfo, 'paste-garbage-rejects');

    await commit(page);
    // The server re-validates the raw csv: created 1 + rejected 1 = the
    // partial toast counts TWO (the skipped whitespace line never counted).
    await expect(page.locator('[data-sonner-toast]')).toContainText('1 of 2 students were imported');
    await expect(rosterRows(page)).toHaveCount(1, { timeout: 30_000 });
    await shot(page, testInfo, 'paste-garbage-committed');

    const after = await apiClassDetail(page.request, jwt, garbageId);
    expect(after.student_count).toBe(1);
    probeRegister.push(after.students[0].documentId);
  });

  test('04 duplicate email twice in one paste: the dedupe keys on name+dob, not email', async ({
    page,
  }, testInfo) => {
    const jwt = await schoolAdminJwt(page.request);
    const classId = await createImportClass(page.request, jwt, dupClass);
    classRegister.push(classId);

    await loginAsPatient(page);
    const dialog = await openImportDialog(page, classId);
    const sameEmail = `f6-twincare-${STAMP}@invalid.test`;
    await paste(page, dialog, [
      HEADER,
      rowFor(`F6 Twin ${STAMP} A`, sameEmail, { dob: '2012-03-03' }),
      rowFor(`F6 Twin ${STAMP} B`, sameEmail, { dob: '2012-04-04' }),
    ].join('\n'));

    // Two DIFFERENT names with ONE email: the client parser counts both rows —
    // screenshot whatever the product shows, then commit.
    const preview = await dialog.innerText();
    expect(preview).toMatch(/rows ready to import/);
    await shot(page, testInfo, 'paste-duplicate-emails-preview');

    await commit(page);
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toBeVisible();
    const toastText = await toast.innerText();
    await shot(page, testInfo, 'paste-duplicate-emails-toast');

    const after = await apiClassDetail(page.request, jwt, classId);
    // Record the actual rule: if both rows created, email is NOT a dedupe key
    // (the schema exposes no email on class students — the names are the proof).
    if (after.student_count === 2) {
      expect(toastText).toContain('2 students were imported');
      const givenNames = after.students.map((s) => s.given_name).sort();
      expect(givenNames).toEqual([`F6 Twin ${STAMP} A`, `F6 Twin ${STAMP} B`].sort());
    } else {
      expect(after.student_count).toBe(1);
    }
    for (const student of after.students) probeRegister.push(student.documentId);
  });

  test('05 re-paste of an enrolled student skips, never duplicates', async ({ page }, testInfo) => {
    const jwt = await schoolAdminJwt(page.request);
    const classId = await createImportClass(page.request, jwt, `F6-${STAMP} Paste Reskip`);
    classRegister.push(classId);
    const enrollRow = rowFor(`F6 Reskip ${STAMP}`, `f6-reskip-${STAMP}@invalid.test`);

    await loginAsPatient(page);
    // First commit enrols the student.
    const dialog = await openImportDialog(page, classId);
    await paste(page, dialog, [HEADER, enrollRow].join('\n'));
    await expect(dialog).toContainText('1 row ready to import');
    await commit(page);
    await expect(page.locator('[data-sonner-toast]')).toContainText('1 student was imported');
    const enrolled = await apiClassDetail(page.request, jwt, classId);
    expect(enrolled.student_count).toBe(1);
    probeRegister.push(enrolled.students[0].documentId);

    // Re-paste the SAME identity: skip_existing — nothing is created twice.
    const dialog2 = await openImportDialog(page, classId);
    await paste(page, dialog2, [HEADER, enrollRow].join('\n'));
    await expect(dialog2).toContainText('1 row ready to import');
    await commit(page);

    await expect(page.locator('[data-sonner-toast]')).toContainText(
      cat(en, 'Classes.detail.import.alreadyImportedToast'),
    );
    await shot(page, testInfo, 'paste-existing-skipped-toast');

    const after = await apiClassDetail(page.request, jwt, classId);
    expect(after.student_count).toBe(1);
  });

  test('06 refresh mid-preview leaves no stuck state', async ({ page }, testInfo) => {
    const jwt = await schoolAdminJwt(page.request);
    const classId = await createImportClass(page.request, jwt, `F6-${STAMP} Paste Refresh`);
    classRegister.push(classId);
    const before = (await apiClassDetail(page.request, jwt, classId)).student_count;

    await loginAsPatient(page);
    const dialog = await openImportDialog(page, classId);
    await paste(page, dialog, [
      HEADER,
      rowFor(`F6 Refresh ${STAMP}`, `f6-refresh-${STAMP}@invalid.test`),
    ].join('\n'));
    await expect(dialog).toContainText('1 row ready to import');

    await page.reload();
    // The dialog is gone and nothing was written.
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const after = await apiClassDetail(page.request, jwt, classId);
    expect(after.student_count).toBe(before);
    await expect(rosterRows(page)).toHaveCount(before === 0 ? 0 : after.student_count);
    const surface = page.locator('[data-surface="school-admin-class-detail"]');
    await expect(surface.getByRole('button', { name: cat(en, 'Classes.detail.importStudents') }).first()).toBeVisible();
    await shot(page, testInfo, 'paste-refresh-mid-preview-clean');
  });

  test('07 Escape mid-commit refuses to abandon the write; exactly one commit lands', async ({
    page,
  }, testInfo) => {
    const jwt = await schoolAdminJwt(page.request);
    const classId = await createImportClass(page.request, jwt, `F6-${STAMP} Paste Escape`);
    classRegister.push(classId);
    const before = (await apiClassDetail(page.request, jwt, classId)).student_count;

    await loginAsPatient(page);
    const dialog = await openImportDialog(page, classId);
    await paste(page, dialog, [
      HEADER,
      rowFor(`F6 Esc ${STAMP} A`, `f6-esc-${STAMP}-a@invalid.test`),
      rowFor(`F6 Esc ${STAMP} B`, `f6-esc-${STAMP}-b@invalid.test`),
    ].join('\n'));
    await expect(dialog).toContainText('2 rows ready to import');

    await commit(page);
    // Hammer Escape while the write is in flight — the dialog must not be
    // abandoned into an unknown state.
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');

    await expect(page.locator('[data-sonner-toast]')).toContainText('2 students were imported', {
      timeout: 30_000,
    });
    const after = await apiClassDetail(page.request, jwt, classId);
    expect(after.student_count).toBe(before + 2); // ONE write, both rows
    for (const student of after.students) probeRegister.push(student.documentId);
    await shot(page, testInfo, 'paste-escape-mid-commit-committed', true);
  });
});
