import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { expect, test, type Download, type Locator, type Page } from '@playwright/test';

import { liveDemoSchoolId, openImportModal, pickClass, signInAsOps } from './fleet3-helpers';
import { runSql } from './helpers/auth-db';
import { API, gotoClassDetail, schoolAdminJwt } from './helpers/class-detail';
import { createImportClass } from './helpers/class-import';
import { cat, loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';

// Every imported student gets an email and a linked student account — proven
// in the REAL portal against the REAL API (:5500), no mocks, no page.route:
//
//  1. school admin: class detail -> Import students -> the downloaded template's
//     header carries `email` -> a file with 2 new students + 1 row without an
//     email -> 2 imported, the email-less row named with the server's reason ->
//     the live DB holds both students WITH their email and a student account.
//  2. ops: school -> Students -> Import -> the template columns and the
//     "every column is required" note -> the downloaded header -> a file with
//     1 new student + 1 row without an email -> Created: 1, Rejected: 1.
//
// The class (teacher t3) and its imported students are KEPT: the desktop spec
// schooltest-app/tests/e2e-live/student-import-join-desktop.spec.ts joins a
// real sitting as one of them. Shots: ../.qa/journeys/student-email-accounts/.

const en = loadMessages('en');
const STAMP = Date.now();
const SHOTS = path.resolve(process.cwd(), '..', '.qa', 'journeys', 'student-email-accounts', 'shots');
const TEACHER_EMAIL = 't3@schooltest.local';
const PORTAL_HEADER = 'given name,family name,email,date of birth,year level,home language';

const demoEmail = (index: number) => `demo-import-${STAMP}-${index}@schooltest.local`;

interface AccountRow {
  email: string;
  userEmail: string;
  role: string;
  className: string;
  teacher: string;
}

/** Live DB read-back: the student row, its linked account + role, its class. */
function accountRows(emailPrefix: string): AccountRow[] {
  const out = runSql(
    // Distinct aliases: the TCP transport returns rows keyed by column name.
    `select s.email as email, coalesce(u.email, '') as user_email, coalesce(r.type, '') as role_type, coalesce(c.name, '') as class_name, coalesce(t.email, '') as teacher_email
     from students s
     left join students_user_lnk l on l.student_id = s.id
     left join up_users u on u.id = l.user_id
     left join up_users_role_lnk rl on rl.user_id = u.id
     left join up_roles r on r.id = rl.role_id
     left join students_class_lnk cl on cl.student_id = s.id
     left join classes c on c.id = cl.class_id
     left join students_teacher_lnk tl on tl.student_id = s.id
     left join up_users t on t.id = tl.user_id
     where s.email like '${emailPrefix}%' order by s.email`,
  );
  return out === ''
    ? []
    : out.split('\n').map((line) => {
        const [email, userEmail, role, className, teacher] = line.split('|');
        return { email, userEmail, role, className, teacher };
      });
}

async function shot(page: Page | Locator, name: string): Promise<void> {
  await mkdir(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) });
}

async function downloadedHeader(download: Download): Promise<string> {
  const file = await download.path();
  const text = await readFile(file, 'utf8');
  return text.replace(/^﻿/, '').split(/\r?\n/)[0];
}

test.describe.configure({ mode: 'serial' });
test.setTimeout(180_000);

let classId = '';
let className = '';

test('school admin: the template has email, a row without one is refused, imported students get accounts', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await loginAs(page, 'schoolAdmin');
  const jwt = await schoolAdminJwt(page.request);

  // A class of its own, taught by a seeded teacher, so a sitting can run on it.
  className = `Import Demo ${STAMP}`;
  classId = await createImportClass(page.request, jwt, className);
  const teacherId = runSql(`select document_id as id from up_users where email = '${TEACHER_EMAIL}'`);
  const assign = await page.request.patch(`${API}/api/schools/me/classes/${classId}`, {
    headers: { Authorization: `Bearer ${jwt}` },
    data: { teacher_documentIds: [teacherId] },
  });
  expect(assign.status(), await assign.text()).toBe(200);

  await gotoClassDetail(page, classId);
  await page.getByRole('button', { name: cat(en, 'Classes.detail.importStudents') }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(cat(en, 'StudentImport.requiredColumnsHint'))).toBeVisible();

  // The template the admin downloads names `email` as a column.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    dialog.getByRole('button', { name: cat(en, 'StudentImport.downloadTemplate') }).click(),
  ]);
  const header = await downloadedHeader(download);
  expect(header).toBe(PORTAL_HEADER);
  await shot(page, '01-school-admin-import-dialog-template');

  // The filled template: two NEW students and one row with no email.
  const csv = [
    header,
    `Mia,Demo${STAMP},${demoEmail(1)},2013-04-12,8,english`,
    `Noah,Demo${STAMP},${demoEmail(2)},2012-10-03,8,vietnamese`,
    `Nomail,Demo${STAMP},,2013-01-20,8,english`,
  ].join('\n');
  await dialog.getByLabel(cat(en, 'StudentImport.pasteLabel')).fill(csv);
  const rejects = dialog.locator('[data-slot="student-import-rejects"]');
  await expect(rejects.locator('tbody tr')).toHaveCount(1);
  await expect(rejects.locator('tbody tr').first()).toContainText('4');
  await shot(page, '02-school-admin-parsed-row-without-email');

  await dialog.getByRole('button', { name: cat(en, 'Classes.detail.import.submit') }).click();
  await expect(page.locator('[data-sonner-toast]')).toContainText('2 of 3');
  await expect(rejects.locator('tbody tr')).toHaveCount(1);
  await expect(rejects).toContainText('email is required');
  await shot(page, '03-school-admin-2-imported-1-refused');

  // The live DB: both students hold their email AND a student account, and the
  // class's teacher (the link a sitting on this class needs to admit them).
  expect(accountRows(`demo-import-${STAMP}-`)).toEqual([
    { email: demoEmail(1), userEmail: demoEmail(1), role: 'student', className, teacher: TEACHER_EMAIL },
    { email: demoEmail(2), userEmail: demoEmail(2), role: 'student', className, teacher: TEACHER_EMAIL },
  ]);
  expect(runSql(`select count(*) as n from students where family_name = 'Demo${STAMP}' and given_name = 'Nomail'`)).toBe('0');

  await dialog.getByRole('button', { name: cat(en, 'Classes.detail.import.cancel') }).click();
  await page.reload();
  const roster = page.locator('[data-surface="school-admin-class-detail"]');
  await expect(roster).toContainText(`Mia Demo${STAMP}`);
  await expect(roster).toContainText(`Noah Demo${STAMP}`);
  await shot(page, '04-school-admin-class-roster');
});

test('ops: the template columns say email is required; a row without one is rejected, the other gets an account', async ({
  page,
}) => {
  expect(classId, 'the school-admin test created the class').not.toBe('');
  await page.setViewportSize({ width: 1440, height: 900 });
  const schoolId = await liveDemoSchoolId();
  await signInAsOps(page);
  const panel = await openImportModal(page, schoolId);

  await expect(panel.locator('[data-surface="ops-import-template-columns"]')).toContainText(
    'given name, family name, email, date of birth, year level, home language',
  );
  await expect(panel.locator('[data-surface="ops-import-template-required"]')).toHaveText(
    cat(en, 'Ops.import.templateRequiredNote'),
  );
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    panel.locator('[data-surface="ops-import-template-download"]').click(),
  ]);
  expect(await downloadedHeader(download)).toBe(PORTAL_HEADER);
  await shot(page, '05-ops-import-template-columns');

  const csv = [
    PORTAL_HEADER,
    `Ava,Demo${STAMP},${demoEmail(3)},2013-06-30,8,korean`,
    `Opsnomail,Demo${STAMP},,2013-02-02,8,english`,
  ].join('\n');
  await panel.locator('#ops-import-file').setInputFiles({
    name: `import-demo-${STAMP}.csv`,
    mimeType: 'text/csv',
    buffer: Buffer.from(csv),
  });
  await pickClass(page, className);
  const preview = panel.locator('[data-surface="ops-import-preview"]');
  await expect(preview).toBeVisible({ timeout: 30_000 });
  await expect(preview).toContainText('email is required');
  await preview.getByText('email is required').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await shot(page, '06-ops-preview-row-without-email');

  await panel.locator('[data-surface="ops-import-cta"]').click();
  const result = panel.locator('[data-surface="ops-import-result"]');
  await expect(result).toBeVisible({ timeout: 30_000 });
  await expect(result).toContainText('Created: 1. Already existed: 0. Rejected: 1.');
  await result.scrollIntoViewIfNeeded();
  await shot(page, '07-ops-result-1-created-1-rejected');

  expect(accountRows(demoEmail(3))).toEqual([
    { email: demoEmail(3), userEmail: demoEmail(3), role: 'student', className, teacher: TEACHER_EMAIL },
  ]);
  expect(runSql(`select count(*) as n from students where given_name = 'Opsnomail' and family_name = 'Demo${STAMP}'`)).toBe('0');
});
