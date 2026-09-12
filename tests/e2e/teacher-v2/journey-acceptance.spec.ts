import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { createTranslator } from 'next-intl';

import enMessages from '@/i18n/messages/en.json';
import type { RosterRow } from '@/modules/results/types/roster.types';
import {
  createTestSessionResponseSchema,
  testSessionMonitorResponseSchema,
} from '@/modules/teacher/schemas/teacher-session.schema';
import type { DashboardClass } from '@/modules/teacher/types/teacher.types';
import { sittingStudentControlStateSchema } from '@/modules/test-day/schemas/test-day.schema';

import { cat } from '../helpers/i18n';
import { apiLoginRetried } from '../helpers/ops34-api-retry';
import { API_BASE } from '../helpers/teacher-auth-rail';
import { READY, frame, header, sectionTab } from '../helpers/teacher-class-detail';
import {
  fr,
  icu,
  recallReasonOf,
  restoreResultRow,
  snapshotResultRow,
  vm,
  type ResultRowSnapshot,
} from '../helpers/teacher-family-reports';
import {
  capture,
  freeStudentCount,
  liveSittingsOf,
  officialResultsOfClass,
  quietClass,
  readRoster,
  releaseTally,
  sessionStatusOf,
  sittingStatusOf,
  studentsMidAttempt,
  waitForClosedListing,
  waitForNothingLive,
  type StoredResult,
} from '../helpers/teacher-journey';
import { answerFirstItem } from '../helpers/teacher-live-monitor-join';
import { readClasses, readTests } from '../helpers/teacher-past-sessions-api';
import { en, signIn } from '../helpers/teacher-rail';
import { expectStartedSitting, joinSitting } from '../helpers/teacher-start-session-api';
import { choice, isLiveTab, isSessionWrite, modal, modalTab } from '../helpers/teacher-start-session-modal';

// A1 — ONE acceptance journey for the whole Teacher Portal v2, on the REAL API with no
// interception: the teacher opens Classes, opens the class, starts a two-student session
// from the Start-a-session modal, a student joins the way the DESKTOP app joins
// (POST /api/sittings/join) and answers a real question, the Live tab is driven (pause,
// resume, +5, force submit, close), the result lands on the Students and Family reports
// tabs, one held report is released to its carer and recalled, and the run leaves the
// class as it found it. Every number and name here is read back off the API or Postgres.
//
// It also captures the parity set into tests/e2e/proofs/teacher-v2/acceptance/, one file
// per design shot in $TPV2/design/design-shots/.

const t = createTranslator({ locale: 'en', messages: enMessages, namespace: 'TeacherPortal.live' });
const tStudents = createTranslator({
  locale: 'en',
  messages: enMessages,
  namespace: 'TeacherPortal.live.students',
});
const tStart = createTranslator({
  locale: 'en',
  messages: enMessages,
  namespace: 'TeacherPortal.startSession',
});
const tClose = createTranslator({
  locale: 'en',
  messages: enMessages,
  namespace: 'TeacherPortal.liveSessions.closeConfirm',
});
const kit = (key: string) => cat(en, `TeacherPortal.kit.${key}`);
const RECALL_REASON = 'A1 acceptance journey: released, recalled and restored by the spec';
const WORKING = new Set(['joined', 'in_progress', 'stalled', 'paused']);

test.describe.configure({ mode: 'serial' });

let request: APIRequestContext;
let page: Page;
let jwt = '';
let klass: DashboardClass;
let formLabel = '';
let sittingId = '';
let code = '';
let resultId = '';
let snapshot: ResultRowSnapshot | null = null;
let startingRoster: RosterRow[] = [];
let startingResults: Map<string, StoredResult> = new Map();
let startingClassCount = 0;
let startingFree = 0;
const closedBefore: string[] = [];
const endedByQuiet: string[] = [];
const joiner = { id: '', name: '', jwt: '', session: '' };
const waiter = { id: '', name: '' };

const auth = () => ({ Authorization: `Bearer ${jwt}` });
const live = () => page.locator('[data-surface="teacher-test-day"]');
const students = () => page.locator('[data-slot="live-students"]');
const card = (id: string) => students().locator(`[data-slot="live-student-card"][data-student-id="${id}"]`);

async function monitor() {
  const response = await request.get(`${API_BASE}/api/teacher/test-sessions/${sittingId}/monitor`, {
    headers: auth(),
  });
  expect(response.status(), 'GET /api/teacher/test-sessions/:id/monitor').toBe(200);
  return testSessionMonitorResponseSchema.parse(await response.json());
}

/** What the joined student's own device reads (C-SIT-STATUS), with the JWT their join minted. */
async function deviceStatus(): Promise<Record<string, unknown>> {
  const response = await request.get(`${API_BASE}/api/sittings/${sittingId}/status`, {
    headers: { Authorization: `Bearer ${joiner.jwt}` },
  });
  expect(response.status(), 'GET /api/sittings/:id/status as the student').toBe(200);
  return (await response.json()) as Record<string, unknown>;
}

/** Opens one student row's kebab and runs an action, confirming where the design asks. */
async function rowAction(studentId: string, action: string, confirmLabel?: string): Promise<void> {
  await card(studentId).scrollIntoViewIfNeeded();
  await card(studentId).locator('[data-slot="live-row-menu"]').click();
  const menu = page.locator('[data-slot="dropdown-menu-content"]');
  await expect(menu).toBeVisible();
  await menu.locator(`[data-action="${action}"]`).click();
  if (confirmLabel === undefined) return;
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: confirmLabel, exact: true }).click();
  await expect(dialog).toBeHidden({ timeout: 30_000 });
}

async function openTab(key: string, body: string): Promise<void> {
  await sectionTab(page, key).click();
  await expect(page.locator(`[data-tab-panel="${key}"] ${body}`)).toBeVisible({ timeout: 60_000 });
}

test.beforeAll(async ({ browser, playwright }) => {
  test.setTimeout(240_000);
  request = await playwright.request.newContext();
  jwt = await apiLoginRetried(request, 'teacher');
  const [classes, tests] = await Promise.all([readClasses(request, jwt), readTests(request, jwt)]);
  const [form] = tests;
  if (form === undefined) throw new Error('the acceptance teacher owns no test');
  const [first] = classes;
  if (first === undefined) throw new Error('the acceptance teacher owns no class');
  klass = first;
  formLabel = form.label;
  startingClassCount = classes.length;

  // The journey has to reach "No sitting open", so it empties the room first — a real
  // close on the real endpoint. On this stack that is TB-36's pair of stale probe sittings.
  // Closing a sitting ENDS the attempts it holds, which mints a Result for those students;
  // they are recorded here, before the close, so the cleanup step can name them as the one
  // legitimate source of new Results besides the journey's own force submit.
  endedByQuiet.push(...studentsMidAttempt(klass.class_document_id));
  closedBefore.push(...(await quietClass(request, jwt, klass.class_document_id)));
  startingFree = freeStudentCount(klass.class_document_id);
  expect(startingFree, 'two students are free to sit').toBeGreaterThanOrEqual(2);
  startingRoster = await readRoster(request, jwt, klass.class_document_id);
  startingResults = officialResultsOfClass(klass.class_document_id);

  page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await signIn(page, 'teacher');
});

test.afterAll(async () => {
  if (snapshot !== null) restoreResultRow(snapshot);
  if (sittingId !== '' && (await sittingStatusOf(request, jwt, sittingId)) === 'open') {
    await request.post(`${API_BASE}/api/teacher/test-sessions/${sittingId}/close`, { headers: auth() });
  }
  await page?.context().close();
  await request.dispose();
});

test('1 · Classes → the class → a real session for two named students', async () => {
  test.setTimeout(240_000);
  test.info().annotations.push({
    type: 'closed-before-start',
    description: closedBefore.length === 0 ? 'nothing was open' : closedBefore.join(', '),
  });
  test.info().annotations.push({
    type: 'attempts-ended-by-that-close',
    description:
      endedByQuiet.length === 0
        ? 'no attempt was in flight'
        : `${endedByQuiet.join(', ')} — closing a sitting ends its attempts and mints a Result for each`,
  });
  await page.goto('/dashboard/results');
  const classes = page.locator('[data-surface="teacher-results"]');
  await expect(classes).toHaveAttribute('data-status', 'ready', { timeout: 60_000 });
  const row = page.locator(`[data-slot="results-class-row"][data-class-id="${klass.class_document_id}"]`);
  await expect(row).toContainText(klass.name);
  await capture(page, 'classes-list');

  const toggle = page.locator('[data-slot="directory-layout-toggle"]');
  await toggle.getByRole('button', { name: kit('tiles') }).click();
  await expect(page.locator('[data-layout="tiles"] [data-slot="results-class-row"]').first()).toBeVisible();
  await capture(page, 'classes-tiles');
  await toggle.getByRole('button', { name: kit('list') }).click();
  await expect(page.locator('[data-slot="teacher-classes-list"] table')).toBeVisible();

  await row.getByRole('link').first().click();
  await page.waitForURL(`**/dashboard/results/${klass.class_document_id}**`);
  await expect(frame(page)).toHaveAttribute('data-status', READY, { timeout: 60_000 });
  await expect(header(page).getByRole('heading', { level: 1 })).toHaveText(klass.name);

  await openTab('live', '[data-surface="teacher-test-day"]');
  await expect(live()).toHaveAttribute('data-status', 'ready', { timeout: 60_000 });
  const empty = live().locator('[data-slot="live-no-sitting"]');
  await expect(empty, 'the room the journey emptied reads "No sitting open"').toBeVisible({ timeout: 30_000 });
  await expect(empty).toContainText(t('noSitting.title'));

  await empty.getByRole('button', { name: t('noSitting.start'), exact: true }).click();
  const dialog = modal(page);
  await expect(dialog.getByRole('heading', { name: tStart('title') })).toBeVisible({ timeout: 30_000 });
  await expect(dialog.locator('[data-slot="start-session-class"]')).toHaveValue(klass.class_document_id);
  await expect(choice(dialog, 'now')).toHaveAttribute('data-checked', '');
  await capture(page, 'modal-start-test--test');

  // The two modes the journey does not start, captured on the way past (nothing is booked).
  await choice(dialog, 'later').click();
  await expect(dialog.getByText(tStart('sub.later'))).toBeVisible();
  await dialog.locator('[data-field="closes"]').fill('09:50');
  await expect(dialog.locator('[data-slot="start-session-schedule-errors"]')).toHaveCount(0);
  await capture(page, 'modal-start-test--schedule-later');
  await choice(dialog, 'demo').click();
  await expect(dialog.getByRole('heading', { name: tStart('titleDemo') })).toBeVisible();
  await capture(page, 'modal-start-test--demo');
  await choice(dialog, 'now').click();

  await modalTab(dialog, 'students').click();
  await choice(dialog, 'some').click();
  await expect(dialog.locator('[data-slot="start-session-student"]')).toHaveCount(klass.student_count);
  const free = dialog.locator('[data-slot="start-session-student"]:not([data-blocked])');
  joiner.id = (await free.nth(0).getAttribute('data-student-id')) ?? '';
  waiter.id = (await free.nth(1).getAttribute('data-student-id')) ?? '';
  const nameOf = (id: string) =>
    startingRoster.find((entry) => entry.student.document_id === id)?.student.name ?? '';
  joiner.name = nameOf(joiner.id);
  waiter.name = nameOf(waiter.id);
  expect(joiner.name.length * waiter.name.length, 'both picks are real roster students').toBeGreaterThan(0);
  await expect(free.nth(0)).toContainText(joiner.name);
  await expect(free.nth(1)).toContainText(waiter.name);
  await free.nth(0).click();
  await free.nth(1).click();
  await expect(dialog.locator('[data-slot="start-session-roster"]')).toContainText(
    tStart('students.pickCount', { count: 2, total: klass.student_count }),
  );

  const cta = dialog.locator('[data-slot="start-session-cta"]');
  await expect(cta).toHaveText(tStart('cta.start', { count: 2 }));
  const posted = page.waitForResponse((response) => isSessionWrite(response, 'POST'));
  await cta.click();
  const created = await posted;
  expect(created.status(), await created.text()).toBe(201);
  const body = createTestSessionResponseSchema.parse(await created.json());
  sittingId = body.sitting_document_id;
  await page.waitForURL(isLiveTab(klass.class_document_id, sittingId));
  await expect(dialog).toHaveCount(0);

  code = await expectStartedSitting(request, jwt, klass.class_document_id, sittingId, [joiner.id, waiter.id], {});
  expect(code, 'the modal and the API serve the same join code').toBe(body.code);
});

test('2 · a real student joins the way the desktop app does and answers a question', async () => {
  test.setTimeout(180_000);
  const joined = await joinSitting(request, code, joiner.id);
  expect(joined.status, `POST /api/sittings/join ${JSON.stringify(joined.body)}`).toBe(200);
  joiner.jwt = joined.body.jwt ?? '';
  joiner.session = (joined.body as { session?: { document_id: string } }).session?.document_id ?? '';
  expect(joiner.jwt.length, 'the join minted a student JWT').toBeGreaterThan(0);
  expect((await deviceStatus()).phase, 'the desktop waiting room sees a running sitting').toBe('running');

  await answerFirstItem(request, {
    studentJwt: joiner.jwt,
    sessionDocumentId: joiner.session,
    studentDocumentId: joiner.id,
    displayName: joiner.name,
  });
  const tile = (await monitor()).students.find((entry) => entry.student_document_id === joiner.id);
  expect(tile?.state, 'the student who answered is mid-attempt on the API').toBe('in_progress');
  expect(sessionStatusOf(joiner.session), 'Postgres holds the attempt').toBe('in_progress');
});

test('3 · the Live tab shows the room, pauses it for the student, resumes and grants +5', async () => {
  test.setTimeout(240_000);
  await page.goto(`/dashboard/results/${klass.class_document_id}?tab=live&session=${sittingId}`);
  await expect(live()).toHaveAttribute('data-status', 'ready', { timeout: 60_000 });
  await expect(live()).toHaveAttribute('data-sitting-id', sittingId);
  await expect(live().locator('[data-slot="live-join-code"]')).toHaveText(code);
  await expect(live().locator('[data-slot="run-sitting-test"] p').first()).toHaveText(
    t('room.testTitle', { className: klass.name, test: formLabel }),
  );

  await expect(card(joiner.id)).toHaveAttribute('data-status', 'in_progress', { timeout: 60_000 });
  await expect(card(joiner.id)).toContainText(joiner.name);
  await expect(card(joiner.id)).toContainText(tStudents('status.in_progress'));
  await expect(card(waiter.id)).toHaveAttribute('data-status', 'not_joined');
  await expect(card(waiter.id)).toContainText(waiter.name);
  await expect(card(waiter.id)).toContainText(tStudents('status.not_joined'));
  await expect(students().locator('[data-slot="live-students-count"]')).toHaveText(
    tStudents('count', { shown: 2, total: 2 }),
  );
  await capture(page, 'class-detail-sitting--live');

  const working = (await monitor()).students.filter((entry) => WORKING.has(entry.state)).length;
  expect(working, 'the joined student is working').toBe(1);
  await live().locator('[data-slot="room-toggle"]').click();
  const pause = page.getByRole('alertdialog');
  await expect(pause).toContainText(t('room.pauseConfirm.body', { count: working }));
  await pause.getByRole('button', { name: t('room.pauseConfirm.cta'), exact: true }).click();
  await expect.poll(async () => (await monitor()).sitting.paused, { timeout: 30_000 }).toBe(true);
  expect((await deviceStatus()).paused, 'the student device reads paused').toBe(true);
  await expect(live().locator('[data-slot="room-toggle"]')).toHaveText(t('room.resume'));

  await live().locator('[data-slot="room-toggle"]').click();
  await expect.poll(async () => (await monitor()).sitting.paused, { timeout: 30_000 }).toBe(false);
  expect((await deviceStatus()).paused, 'the student device runs again').toBe(false);
  await expect(live().locator('[data-slot="room-toggle"]')).toHaveText(t('room.pause'));

  await live().getByRole('button', { name: t('room.extend', { minutes: 5 }), exact: true }).click();
  const extend = page.getByRole('alertdialog');
  await expect(extend).toContainText(t('room.extendConfirm.title', { minutes: 5 }));
  await extend.getByRole('button', { name: t('room.extendConfirm.cta', { minutes: 5 }), exact: true }).click();
  await expect.poll(async () => (await monitor()).sitting.extra_seconds, { timeout: 30_000 }).toBe(300);
  expect((await monitor()).sitting.extensions, 'one grant recorded').toBe(1);
  expect((await deviceStatus()).extra_seconds, 'the grant reached the student device').toBe(300);
});

test('4 · parity set: the six class-detail tabs, the student page, Reports and Live sessions', async () => {
  test.setTimeout(300_000);
  await openTab('students', '[data-slot="students-tab-panel"]');
  await expect(page.locator('[data-slot="student-results-row"]')).toHaveCount(startingRoster.length);
  await capture(page, 'class-detail-sitting--results');

  await header(page).locator('[data-slot="class-reports-button"]').click();
  const reports = page.locator('[data-surface="class-reports-modal"]');
  await expect(reports).toBeVisible({ timeout: 30_000 });
  await expect(reports).toHaveAttribute('data-kind', 'student');
  await capture(page, 'overlay-reports');
  await reports.locator('[data-slot="reports-cancel"]').click();
  await expect(reports).toHaveCount(0);

  await openTab('progress', '[data-slot="class-progress"]');
  await capture(page, 'class-detail-sitting--progress');
  await openTab('insights', '[data-slot="teaching-insights"]');
  await capture(page, 'class-detail-sitting--insights');
  await openTab('exit', '[data-slot="exit-predictions-panel"]');
  await capture(page, 'class-detail-sitting--exit');
  await openTab('reports', '[data-slot="family-reports"]');
  await expect(page.locator('[data-slot="family-report-row"]')).toHaveCount(startingRoster.length);
  await capture(page, 'class-detail-sitting--reports');

  const scored = startingRoster.find((entry) => (entry.result?.overall.domain_score ?? null) !== null);
  expect(scored, 'the class has a scored student to draw the student page from').toBeDefined();
  await page.goto(`/dashboard/results/${klass.class_document_id}/students/${scored?.student.document_id}`);
  const drill = page.locator('[data-surface="teacher-student-drill-down"]');
  await expect(drill).toHaveAttribute('data-status', 'success', { timeout: 60_000 });
  await expect(drill.locator('[data-slot="student-drill-down-header"] h1')).toHaveText(scored?.student.name ?? '');
  await expect(drill.locator('[data-slot="student-overall-score"]')).toHaveText(
    `${scored?.result?.overall.domain_score}%`,
  );
  await capture(page, 'student-detail-sitting');

  await page.goto('/dashboard/test-sessions');
  const sessions = page.locator('[data-surface="teacher-test-sessions"]');
  await expect(sessions).toHaveAttribute('data-status', 'ready', { timeout: 60_000 });
  const liveCard = sessions.locator(`[data-slot="live-session-card"][data-sitting-id="${sittingId}"]`);
  await expect(liveCard).toBeVisible({ timeout: 30_000 });
  await expect(liveCard.locator('[data-slot="live-session-code"]')).toHaveText(code);
  await capture(page, 'live-sessions');
});

test('5 · force submit the joined student; the API records it and the Live tab shows it', async () => {
  test.setTimeout(240_000);
  await page.goto(`/dashboard/results/${klass.class_document_id}?tab=live&session=${sittingId}`);
  await expect(live()).toHaveAttribute('data-status', 'ready', { timeout: 60_000 });
  await expect(card(joiner.id)).toHaveAttribute('data-status', 'in_progress', { timeout: 60_000 });

  const submitted = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname ===
        `/api/sittings/${sittingId}/students/${joiner.id}/submit`,
  );
  await rowAction(joiner.id, 'forceSubmit', tStudents('confirm.forceSubmit.cta'));
  const response = await submitted;
  expect(response.status(), await response.text()).toBe(200);
  const state = sittingStudentControlStateSchema.parse(((await response.json()) as { data: unknown }).data);
  expect(state.submitted_by_teacher, 'the API marked the attempt teacher-submitted').toBe(true);
  expect(state.session_status, 'the attempt ended').toBe('terminated');
  expect(state.result_document_id, 'the force submit named a Result').not.toBeNull();
  resultId = state.result_document_id ?? '';

  const device = await deviceStatus();
  expect(device.submitted_by_teacher, 'the student device reads "ended by teacher"').toBe(true);
  expect(device.phase, 'the student device reads closed').toBe('closed');
  await expect
    .poll(async () => (await monitor()).students.find((row) => row.student_document_id === joiner.id)?.state, {
      timeout: 30_000,
    })
    .toBe('submitted');
  await expect(card(joiner.id)).toHaveAttribute('data-status', 'submitted', { timeout: 30_000 });
  await expect(card(joiner.id)).toContainText(tStudents('status.submitted'));

  await rowAction(joiner.id, 'review');
  const drawer = page.locator('[data-surface="result-review"]');
  await expect(drawer).toBeVisible({ timeout: 30_000 });
  await expect(drawer.locator('[data-slot="sheet-title"]')).toHaveText(joiner.name);
  await capture(page, 'overlay-review');
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden({ timeout: 30_000 });
});

test('6 · close the sitting: the API says closed and the tab falls back to No sitting open', async () => {
  test.setTimeout(240_000);
  const board = await monitor();
  const notJoined = board.students.filter((row) => row.state === 'not_joined').length;
  await live().getByRole('button', { name: t('room.close'), exact: true }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText(tClose('title'));
  if (notJoined > 0) await expect(dialog).toContainText(t('room.closeConfirm.notJoined', { count: notJoined }));
  // The close invalidates ['teacher'], so the tab re-reads its open-sittings query; the
  // fall back is asserted on THAT read landing empty, not on a locator winning a race with
  // the dev server's recompiles. Armed before the click that triggers it.
  const noneLive = waitForNothingLive(page, klass.class_document_id);
  await dialog.getByRole('button', { name: tClose('cta'), exact: true }).click();

  await expect.poll(async () => sittingStatusOf(request, jwt, sittingId), { timeout: 30_000 }).toBe('closed');
  expect(
    (await liveSittingsOf(request, jwt, klass.class_document_id)).map((row) => row.sitting_document_id),
    'nothing is live on the class any more',
  ).toEqual([]);
  await noneLive;
  const empty = live().locator('[data-slot="live-no-sitting"]');
  await expect(empty).toBeVisible({ timeout: 30_000 });
  await expect(empty).toContainText(t('noSitting.title'));
  await expect(empty).toContainText(t('noSitting.body'));
});

/**
 * Previous sessions cannot list the sitting the teacher just closed, and the cause is the
 * API's own ordering, not this spec's timing. `GET /teacher/test-sessions?status=closed`
 * sorts `opened_at:desc, createdAt:desc`, and Postgres puts NULLs FIRST on a DESC sort; a
 * CANCELLED booking never opens, so its `opened_at` is NULL and it outranks every session
 * that really ran. The Live tab reads one page (HISTORY_PAGE_SIZE = 50): measured live on
 * t2's class, page 1 is 50/50 rows with `opened_at: null` and the newest really-opened
 * sitting first appears on page 2. Turn this test on (drop `.fixme`) when the API sorts
 * NULLs last, or excludes cancelled bookings from the history list.
 */
test.fixme('6b · Previous sessions lists the sitting just closed', async () => {
  test.setTimeout(240_000);
  await waitForClosedListing(page, klass.class_document_id, sittingId);
  const history = live().locator(`[data-slot="live-history-row"][data-sitting-id="${sittingId}"]`);
  await expect(history).toBeVisible({ timeout: 30_000 });
  await expect(history).toContainText(t('history.closed'));
});

test('7 · the Students and Family reports tabs carry the result; release and recall one report', async () => {
  test.setTimeout(300_000);
  await expect
    .poll(
      async () =>
        (await readRoster(request, jwt, klass.class_document_id)).find(
          (row) => row.student.document_id === joiner.id,
        )?.result?.document_id,
      { timeout: 30_000 },
    )
    .toBe(resultId);
  const roster = await readRoster(request, jwt, klass.class_document_id);
  const mine = roster.find((row) => row.student.document_id === joiner.id);
  const score = mine?.result?.overall.domain_score ?? null;

  await openTab('students', '[data-slot="students-tab-panel"]');
  const studentRow = page.locator(`[data-slot="student-results-row"][data-student-id="${joiner.id}"]`);
  await expect(studentRow).toBeVisible({ timeout: 30_000 });
  await expect(studentRow.locator('[data-slot="student-name"]')).toHaveText(joiner.name);
  await expect(studentRow.locator('[data-slot="student-score"]')).toHaveText(
    score === null ? kit('noValue') : `${score}%`,
  );

  await openTab('reports', '[data-slot="family-reports"]');
  const familyRow = page.locator(`[data-slot="family-report-row"][data-student-id="${joiner.id}"]`);
  await expect(familyRow).toHaveAttribute('data-status', mine?.release_state ?? '');
  await expect(familyRow).toContainText(vm(`release.label.${mine?.release_state}`));

  const target = roster.find(
    (row) => row.release_state === 'held' && (row.result?.overall.domain_score ?? null) !== null,
  );
  expect(target, 'the class holds a scored, held report to release').toBeDefined();
  const heldId = target?.result?.document_id ?? '';
  const heldName = target?.student.name ?? '';
  const row = page.locator(`[data-slot="family-report-row"][data-result-id="${heldId}"]`);

  await row.getByRole('button', { name: fr('actions.preview'), exact: true }).click();
  const preview = page.locator('[data-slot="carer-report-preview"]');
  await expect(preview.getByRole('heading', { name: heldName, exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(preview.locator('[data-slot="carer-report-score"]')).toHaveText(
    `${target?.result?.overall.domain_score} / 100`,
  );
  await capture(page, 'overlay-carer-preview');
  await preview.getByRole('button', { name: fr('preview.close'), exact: true }).click();
  await expect(preview).toBeHidden();

  snapshot = snapshotResultRow(heldId);
  expect(snapshot, 'the release can only be undone with the row snapshot').not.toBeNull();

  await row.getByRole('button', { name: fr('actions.release'), exact: true }).click();
  const confirm = page.getByRole('alertdialog');
  await expect(confirm).toContainText(icu(fr('release.title'), { name: heldName }));
  await confirm.getByRole('button', { name: fr('release.cta'), exact: true }).click();
  await expect(row).toHaveAttribute('data-status', 'released', { timeout: 30_000 });
  await expect
    .poll(async () => (await readRoster(request, jwt, klass.class_document_id)).find((entry) => entry.result?.document_id === heldId)?.release_state, { timeout: 30_000 })
    .toBe('released');

  await row.getByRole('button', { name: fr('actions.recall'), exact: true }).click();
  const recall = page.locator('[data-slot="recall-report-dialog"]');
  await expect(recall).toContainText(icu(fr('recall.title'), { name: heldName }));
  await recall.getByLabel(fr('recall.reasonLabel')).fill(RECALL_REASON);
  await recall.getByRole('button', { name: fr('recall.cta'), exact: true }).click();
  await expect(row).toHaveAttribute('data-status', 'recalled', { timeout: 30_000 });
  await expect
    .poll(async () => (await readRoster(request, jwt, klass.class_document_id)).find((entry) => entry.result?.document_id === heldId)?.release_state, { timeout: 30_000 })
    .toBe('recalled');
  expect(recallReasonOf(heldId), 'the carer-facing recall reason is the one typed').toBe(RECALL_REASON);
});

test('8 · cleanup: the journey leaves the class as it found it', async () => {
  test.setTimeout(180_000);
  if (snapshot !== null) {
    const removed = restoreResultRow(snapshot);
    test.info().annotations.push({
      type: 'restored',
      description: `${snapshot.resultId}; notifications removed: ${removed.join(',') || 'none'}`,
    });
    snapshot = null;
  }

  // STORAGE LEVEL — the real "as found" property, and the strict one: every Result the run
  // found still exists, with the release columns it had. Nothing was released, recalled or
  // deleted behind the journey's back.
  const endingResults = officialResultsOfClass(klass.class_document_id);
  for (const [id, before] of startingResults) {
    expect(endingResults.get(id)?.columns, `result ${id} (${before.student}) ends as found`).toBe(before.columns);
  }

  // The only Results this run may have created are its own force submit and, for a student
  // whose in-flight attempt the pre-run close ended, the Result that close mints.
  const allowedAuthors = new Set([joiner.id, ...endedByQuiet]);
  const created = [...endingResults].filter(([id]) => !startingResults.has(id));
  for (const [id, row] of created) {
    expect(allowedAuthors.has(row.student), `result ${id} was created for an untouched student`).toBe(true);
  }
  const createdFor = new Set(created.map(([, row]) => row.student));

  // ROSTER LEVEL — strict for every student the roster still serves the SAME result. A
  // student whose served result CHANGED cannot be compared like for like; the journey
  // proves its innocence above (no Result created for them) and the drift is recorded, not
  // absorbed: TB-46/LIST_LIMIT moves a row's state for students nobody touched.
  const roster = await readRoster(request, jwt, klass.class_document_id);
  const drifted: string[] = [];
  for (const row of roster) {
    const id = row.student.document_id;
    if (id === joiner.id || endedByQuiet.includes(id)) continue;
    const start = startingRoster.find((entry) => entry.student.document_id === id);
    const was = start?.result?.document_id ?? null;
    const now = row.result?.document_id ?? null;
    if (now === was) {
      expect(row.release_state, `${row.student.name} ends in the state the run found`).toBe(start?.release_state);
      continue;
    }
    expect(createdFor.has(id), `the run wrote no result for ${row.student.name}`).toBe(false);
    drifted.push(`${row.student.name}: ${was ?? 'none'} → ${now ?? 'none'} (${start?.release_state} → ${row.release_state})`);
  }
  const tally = releaseTally(roster);
  test.info().annotations.push({ type: 'release-tally', description: JSON.stringify(tally) });
  test.info().annotations.push({
    type: 'roster-drift-not-caused-by-this-run',
    description:
      drifted.length === 0
        ? 'none'
        : `the roster serves a different result for: ${drifted.join('; ')} — no Result was written for them (asserted above); the class holds more official results than the roster's LIST_LIMIT window`,
  });

  expect(await sittingStatusOf(request, jwt, sittingId), 'the sitting the journey opened is closed').toBe('closed');
  expect(
    (await liveSittingsOf(request, jwt, klass.class_document_id)).map((row) => row.sitting_document_id),
    'no sitting is left open on the class',
  ).toEqual([]);
  const scheduled = await request.get(`${API_BASE}/api/teacher/test-sessions`, {
    headers: auth(),
    params: { status: 'scheduled', class: klass.class_document_id },
  });
  expect(scheduled.status()).toBe(200);
  expect(
    ((await scheduled.json()) as { sessions: { sitting_document_id: string }[] }).sessions.map(
      (entry) => entry.sitting_document_id,
    ),
    'the journey booked nothing',
  ).not.toContain(sittingId);

  expect(sessionStatusOf(joiner.session), 'the attempt is finished, not left in flight').not.toBe('in_progress');
  expect(freeStudentCount(klass.class_document_id), 'every student is free to sit again').toBe(startingFree);
  expect((await readClasses(request, jwt)).length, 'the journey created no class').toBe(startingClassCount);
  expect(roster.length, 'the journey created no student').toBe(startingRoster.length);
});
