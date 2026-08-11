import path from 'node:path';

import { expect, test, type APIRequestContext } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';
import { apiLogin } from './helpers/teacher-auth-rail';
import {
  answerFirstItem,
  joinAsStudent,
  readMonitor,
  rosterEmails,
} from './helpers/teacher-live-monitor-api';
import {
  closeSession,
  createSession,
  readClasses,
  readTests,
} from './helpers/teacher-past-sessions-api';
import { signIn } from './helpers/teacher-rail';

// Task 037's done criterion: "a student joining flips their tile without a manual
// reload". Proven the only honest way — a REAL sitting (C-TS-1), a REAL join
// (C-SJ-1) and a REAL answer (C-2) land while the page stays open, and the tile
// is re-read by the TanStack Query refetchInterval, never by a navigation. A
// sentinel planted on `window` proves no reload happened in between.

const en = loadMessages('en');
const SHOTS = path.resolve(process.cwd(), '..', '.qa', 'screenshots');
const LIVE = 'Teacher.testSessions.live';
const FLIP_TIMEOUT = 20_000;

let teacherJwt = '';
let sittingDocumentId = '';

async function openSitting(request: APIRequestContext): Promise<string> {
  const classes = await readClasses(request, teacherJwt);
  const tests = await readTests(request, teacherJwt);
  const testA = tests.find((entry) => entry.variant === 'A');
  expect(classes[0], 'the teacher owns no class').toBeTruthy();
  expect(testA, 'C-TD-2 offers no Test A form').toBeTruthy();
  return createSession(
    request,
    teacherJwt,
    classes[0].class_document_id,
    testA?.form_document_id ?? '',
  );
}

test.afterAll(async ({ request }) => {
  // Closing the sitting this spec opened also terminates the session it created,
  // which frees that student for the next run: the spec is re-runnable and leaves
  // no open sitting behind.
  if (teacherJwt && sittingDocumentId) await closeSession(request, teacherJwt, sittingDocumentId);
});

test('a student joining flips their tile with no manual reload (C-TS-3 poll)', async ({
  page,
  request,
}) => {
  test.setTimeout(120_000);
  teacherJwt = await apiLogin(request, 'teacher');
  sittingDocumentId = await openSitting(request);

  const opened = await readMonitor(request, teacherJwt, sittingDocumentId);
  expect(opened.summary.joined, 'a brand-new sitting cannot have a joined student').toBe(0);
  expect(opened.students.every((student) => student.state === 'not_joined')).toBe(true);
  const code = opened.sitting.code;
  expect(code, 'C-TS-1 minted no code').toBeTruthy();

  await page.setViewportSize({ width: 1280, height: 900 });
  await signIn(page, 'teacher');
  await page.goto(`/en/dashboard/test-sessions/${sittingDocumentId}`);
  await expect(page.locator('[data-surface="teacher-live-monitor"]')).toHaveAttribute(
    'data-status',
    'ready',
  );
  await expect(page.locator('[data-slot="live-monitor-tile"][data-state="not_joined"]')).toHaveCount(
    opened.students.length,
  );

  // Survives everything except a reload.
  await page.evaluate(() => {
    (window as unknown as { __t037: string }).__t037 = 'no-reload';
  });

  const emails = rosterEmails(opened.sitting.class.document_id);
  expect(emails.length, 'no roster emails for the class').toBeGreaterThan(0);
  const student = await joinAsStudent(request, teacherJwt, code ?? '', emails[0]);
  const tile = page.locator(
    `[data-slot="live-monitor-tile"][data-student-id="${student.studentDocumentId}"]`,
  );

  // JOINED — flipped by the poll alone, no page.reload() anywhere in this spec.
  await expect(tile).toHaveAttribute('data-state', 'joined', { timeout: FLIP_TIMEOUT });
  await expect(tile).toContainText(cat(en, `${LIVE}.stateJoined`));
  await expect(page.locator('[data-slot="live-monitor-stat"][data-stat="joined"]')).toContainText(
    '1',
    { timeout: FLIP_TIMEOUT },
  );
  await page.screenshot({ path: path.join(SHOTS, 'vfy037-flip-joined.png'), fullPage: true });

  // IN PROGRESS — one real answered item, so the tile prints "Stage 1 of 3".
  await answerFirstItem(request, student);
  const after = await readMonitor(request, teacherJwt, sittingDocumentId);
  const wire = after.students.find((row) => row.student_document_id === student.studentDocumentId);
  expect(wire?.state, 'the server did not move the answered student to in_progress').toBe(
    'in_progress',
  );
  await expect(tile).toHaveAttribute('data-state', 'in_progress', { timeout: FLIP_TIMEOUT });
  await expect(tile).toContainText(
    cat(en, `${LIVE}.stageOf`)
      .replace('{stage}', String(wire?.stage))
      .replace('{total}', String(wire?.total_stages)),
  );

  expect(
    await page.evaluate(() => (window as unknown as { __t037?: string }).__t037),
    'the page reloaded — the flip must come from the poll',
  ).toBe('no-reload');

  await page.screenshot({ path: path.join(SHOTS, 'vfy037-flip-in-progress.png'), fullPage: true });
});
