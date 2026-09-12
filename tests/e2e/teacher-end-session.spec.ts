import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';
import { apiLogin } from './helpers/teacher-auth-rail';
import {
  closeSession,
  createSession,
  readClasses,
  readTests,
} from './helpers/teacher-past-sessions-api';
import { sittingRow } from './helpers/teacher-end-session';
import { signIn } from './helpers/teacher-rail';

// Task 038 — C-TS-4's ONE 400 ("already closed", E2-11), driven through the REAL
// control. Nothing is stubbed: the sitting is minted by C-TS-1 and the second
// closer is the same C-TS-4 route called from Node while the confirm is open.
//
// R1 PART B repointed this spec. The control used to live on the retired
// `/dashboard/test-sessions/<sitting>` grid; it is "Close sitting" on the class
// Live sessions tab now (`teacher/components/live/JoinCodeCell.tsx`), behind the
// design's confirm. The happy path (close cascade + Postgres + the tab falling
// back to "No sitting open") is covered end to end by
// `tests/e2e/teacher-v2/live-tab.spec.ts`; what only lives here is the RACE, so
// that is all this file keeps.
const en = loadMessages('en');
const SHOTS = path.resolve(process.cwd(), '..', '.qa', 'screenshots');

let teacherJwt = '';
let classDocumentId = '';
const opened: string[] = [];

/** A brand-new open sitting on the caller's first class, running Test A. */
async function openSitting(request: APIRequestContext): Promise<string> {
  const classes = await readClasses(request, teacherJwt);
  const tests = await readTests(request, teacherJwt);
  const testA = tests.find((entry) => entry.variant === 'A');
  expect(classes[0], 'the teacher owns no class').toBeTruthy();
  expect(testA, 'C-TD-2 offers no Test A form').toBeTruthy();
  classDocumentId = classes[0].class_document_id;
  const id = await createSession(
    request,
    teacherJwt,
    classDocumentId,
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

/** The class Live sessions tab, pinned to the sitting this spec opened. */
async function gotoLiveTab(page: Page, sittingDocumentId: string): Promise<void> {
  await page.goto(
    `/en/dashboard/results/${classDocumentId}?tab=live&session=${sittingDocumentId}`,
  );
  const surface = page.locator('[data-surface="teacher-test-day"]');
  await expect(surface).toHaveAttribute('data-status', 'ready', { timeout: 60_000 });
  await expect(surface).toHaveAttribute('data-sitting-id', sittingDocumentId);
}

test.afterAll(async ({ request }) => {
  // Leave no open sitting behind. Already-closed ones answer C-TS-4's own 400,
  // which is precisely what this spec proves is benign, so it is not asserted here.
  for (const id of opened) {
    if (sittingRow(id).status === 'open') await closeSession(request, teacherJwt, id);
  }
});

test('a sitting closed by another tab reports "already closed", never an error (C-TS-4 400)', async ({
  page,
  request,
}) => {
  test.setTimeout(120_000);
  teacherJwt = await apiLogin(request, 'teacher');
  const sittingDocumentId = await openSitting(request);

  await page.setViewportSize({ width: 1440, height: 900 });
  forbidNativeDialogs(page);
  await signIn(page, 'teacher');
  await gotoLiveTab(page, sittingDocumentId);

  const surface = page.locator('[data-surface="teacher-test-day"]');
  await surface
    .getByRole('button', { name: cat(en, 'TeacherPortal.live.room.close'), exact: true })
    .click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();

  // The race the contract calls out: someone else closes it while this dialog is
  // open. This is a REAL second closer — the same C-TS-4 route, from Node.
  await closeSession(request, teacherJwt, sittingDocumentId);
  expect(sittingRow(sittingDocumentId).status).toBe('closed');

  await dialog
    .getByRole('button', { name: cat(en, 'TeacherPortal.liveSessions.closeConfirm.cta'), exact: true })
    .click();
  await expect(page.locator('[data-sonner-toast][data-type="info"]')).toContainText(
    cat(en, 'Teacher.testSessions.live.alreadyClosedToast'),
  );
  await page.screenshot({
    path: path.join(SHOTS, 'vfy038-already-closed.png'),
    animations: 'disabled',
  });
  await expect(page.locator('[data-sonner-toast][data-type="error"]')).toHaveCount(0);
  await expect(dialog).toHaveCount(0);

  // The tab tells the truth after the race: the failed close still invalidated the
  // reads, they come back without this sitting among the class's open ones, and the
  // card stops presenting it as the live sitting.
  //
  // NOT asserted here: that it reappears under "Previous sessions". `historyRows`
  // shows the first ten sessions that RAN (`opened_at`, never cancelled or
  // scheduled) after the live ones, so whether this sitting is on screen depends on
  // how many others the class ran — a condition this spec neither creates nor
  // controls, and a list `live-tab.spec.ts` already asserts after a real close.
  await expect
    .poll(async () => surface.getAttribute('data-sitting-id'), { timeout: 30_000 })
    .not.toBe(sittingDocumentId);
});
