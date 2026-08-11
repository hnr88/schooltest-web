import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { runSql } from './helpers/auth-db';
import { cat, loadMessages } from './helpers/i18n';
import { apiLogin } from './helpers/teacher-auth-rail';
import { readMonitor } from './helpers/teacher-live-monitor-api';
import { answerFirstItem, joinAsStudent, rosterEmails } from './helpers/teacher-live-monitor-join';
import {
  closeSession,
  createSession,
  readClasses,
  readTests,
} from './helpers/teacher-past-sessions-api';
import { sittingRow } from './helpers/teacher-end-session';
import { signIn } from './helpers/teacher-rail';

// Task 038 — "End session" (C-TS-4) driven through the REAL control on the REAL
// live-monitoring page. Nothing is stubbed: the sitting is minted by C-TS-1, a
// student really joins (C-SJ-1) and really answers (C-2) so the close cascade has
// an in-flight session to terminate, and the persisted effect is read back out of
// PostgreSQL — `.qa/CONTRACTS.md` §Persistence effects for C-TS-4.

const en = loadMessages('en');
const SHOTS = path.resolve(process.cwd(), '..', '.qa', 'screenshots');
const LIVE = 'Teacher.testSessions.live';
const TRIGGER = '[data-slot="end-session-trigger"]';
const DIALOG = '[data-slot="end-session-dialog"]';
const CONFIRM = '[data-slot="end-session-confirm"]';

let teacherJwt = '';
const opened: string[] = [];

/** A brand-new open sitting on the caller's first class, running Test A. */
async function openSitting(request: APIRequestContext): Promise<string> {
  const classes = await readClasses(request, teacherJwt);
  const tests = await readTests(request, teacherJwt);
  const testA = tests.find((entry) => entry.variant === 'A');
  expect(classes[0], 'the teacher owns no class').toBeTruthy();
  expect(testA, 'C-TD-2 offers no Test A form').toBeTruthy();
  const id = await createSession(
    request,
    teacherJwt,
    classes[0].class_document_id,
    testA?.form_document_id ?? '',
  );
  opened.push(id);
  return id;
}

/** A native confirm() would block automation — this fails the test if one appears. */
function forbidNativeDialogs(page: Page): void {
  page.on('dialog', (dialog) => {
    throw new Error(`a native ${dialog.type()} dialog appeared: ${dialog.message()}`);
  });
}

async function gotoMonitor(page: Page, sittingDocumentId: string): Promise<void> {
  await page.goto(`/en/dashboard/test-sessions/${sittingDocumentId}`);
  await expect(page.locator('[data-surface="teacher-live-monitor"]')).toHaveAttribute(
    'data-status',
    'ready',
  );
}

test.afterAll(async ({ request }) => {
  // Leave no open sitting behind. Already-closed ones answer C-TS-4's own 400,
  // which is precisely what this spec proves is benign, so it is not asserted here.
  for (const id of opened) {
    if (sittingRow(id).status === 'open') await closeSession(request, teacherJwt, id);
  }
});

test('End session closes the sitting in Postgres and the UI still says closed after a reload', async ({
  page,
  request,
}) => {
  test.setTimeout(120_000);
  teacherJwt = await apiLogin(request, 'teacher');
  const sittingDocumentId = await openSitting(request);

  // A real student mid-test, so the close cascade has something to terminate.
  const before = await readMonitor(request, teacherJwt, sittingDocumentId);
  const emails = rosterEmails(before.sitting.class.document_id);
  expect(emails.length, 'no roster emails for the class').toBeGreaterThan(0);
  const student = await joinAsStudent(request, teacherJwt, before.sitting.code ?? '', emails[0]);
  await answerFirstItem(request, student);
  expect(sittingRow(sittingDocumentId)).toEqual({ status: 'open', closed_at: '' });

  await page.setViewportSize({ width: 1280, height: 900 });
  forbidNativeDialogs(page);
  await signIn(page, 'teacher');
  await gotoMonitor(page, sittingDocumentId);

  const trigger = page.getByRole('button', { name: cat(en, `${LIVE}.endSession`), exact: true });
  await expect(trigger).toBeVisible();
  const box = await trigger.boundingBox();
  expect(box?.height ?? 0, 'WCAG 2.2 AA target size').toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: path.join(SHOTS, 'vfy038-live-open.png'), fullPage: true });

  // The repo's AlertDialog convention, not window.confirm.
  await trigger.click();
  const dialog = page.locator(DIALOG);
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(
    cat(en, `${LIVE}.endDialogTitle`).replace('{className}', before.sitting.class.name),
  );
  await expect(dialog).toContainText(cat(en, `${LIVE}.endDialogDescription`));
  await page.screenshot({
    path: path.join(SHOTS, 'vfy038-confirm-dialog.png'),
    animations: 'disabled',
  });

  await page.locator(CONFIRM).click();
  await expect(page.locator('[data-sonner-toast][data-type="success"]')).toContainText(
    cat(en, `${LIVE}.endedToast`),
  );
  await page.screenshot({
    path: path.join(SHOTS, 'vfy038-ended-toast.png'),
    animations: 'disabled',
  });

  // The badge flips to the WORD "Closed" (never colour alone) and the control goes.
  await expect(page.locator('[data-slot="live-monitor-header"]')).toContainText(
    cat(en, `${LIVE}.badgeClosed`),
  );
  await expect(page.locator(TRIGGER)).toHaveCount(0);
  await page.screenshot({ path: path.join(SHOTS, 'vfy038-closed.png'), fullPage: true });

  // The persistence effect C-TS-4 promises, straight out of PostgreSQL.
  const row = sittingRow(sittingDocumentId);
  expect(row.status).toBe('closed');
  expect(row.closed_at.length, 'closed_at was not stamped').toBeGreaterThan(0);
  expect(
    runSql(`select status from sessions where document_id = '${student.sessionDocumentId}'`).trim(),
    'the in-flight session was not terminated by the cascade',
  ).toBe('terminated');

  // Survives a reload — the closed state is the server's, not local component state.
  await page.reload();
  await expect(page.locator('[data-surface="teacher-live-monitor"]')).toHaveAttribute(
    'data-status',
    'ready',
  );
  await expect(page.locator('[data-slot="live-monitor-header"]')).toContainText(
    cat(en, `${LIVE}.badgeClosed`),
  );
  await expect(page.locator(TRIGGER)).toHaveCount(0);
  expect((await readMonitor(request, teacherJwt, sittingDocumentId)).sitting.status).toBe('closed');
});

test('a sitting closed by another tab reports "already closed", never an error (C-TS-4 400)', async ({
  page,
  request,
}) => {
  test.setTimeout(120_000);
  teacherJwt = await apiLogin(request, 'teacher');
  const sittingDocumentId = await openSitting(request);

  await page.setViewportSize({ width: 1280, height: 900 });
  forbidNativeDialogs(page);
  await signIn(page, 'teacher');
  await gotoMonitor(page, sittingDocumentId);
  await page.locator(TRIGGER).click();
  await expect(page.locator(DIALOG)).toBeVisible();

  // The race the contract calls out: someone else closes it while this dialog is
  // open. This is a REAL second closer — the same C-TS-4 route, from Node.
  await closeSession(request, teacherJwt, sittingDocumentId);
  expect(sittingRow(sittingDocumentId).status).toBe('closed');

  await page.locator(CONFIRM).click();
  await expect(page.locator('[data-sonner-toast][data-type="info"]')).toContainText(
    cat(en, `${LIVE}.alreadyClosedToast`),
  );
  await page.screenshot({
    path: path.join(SHOTS, 'vfy038-already-closed.png'),
    animations: 'disabled',
  });
  await expect(page.locator('[data-sonner-toast][data-type="error"]')).toHaveCount(0);
  await expect(page.locator(DIALOG)).toHaveCount(0);
  await expect(page.locator('[data-slot="live-monitor-header"]')).toContainText(
    cat(en, `${LIVE}.badgeClosed`),
  );
  await expect(page.locator(TRIGGER)).toHaveCount(0);
});
