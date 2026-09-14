import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { createTranslator } from 'next-intl';

import enMessages from '@/i18n/messages/en.json';
import { createTestSessionResponseSchema } from '@/modules/teacher/schemas/teacher-session.schema';
import type { DashboardClass } from '@/modules/teacher/types/teacher.types';

import { cat } from '../helpers/i18n';
import { apiLoginRetried } from '../helpers/ops34-api-retry';
import { API_BASE } from '../helpers/teacher-auth-rail';
import { READY, frame, header, sectionTab } from '../helpers/teacher-class-detail';
import { readRoster } from '../helpers/teacher-journey';
import { answerFirstItem } from '../helpers/teacher-live-monitor-join';
import { readClasses, readTests } from '../helpers/teacher-past-sessions-api';
import { en } from '../helpers/teacher-rail';
import { expectStartedSitting, joinSitting } from '../helpers/teacher-start-session-api';
import {
  choice,
  isLiveTab,
  isSessionWrite,
  modal,
  modalTab,
} from '../helpers/teacher-start-session-modal';

// T1 wave run — the TEACHER journey driven through the REAL web UI on the REAL API,
// no interception: sign in through /sign-in as the journey teacher t1, open a seeded
// class that carries a roster, start a two-student session from the Start-a-session
// modal, verify the monitor (student tiles in not_joined/joined/in_progress states and
// the room controls), pause/resume/+5 the room, then close the sitting through the UI
// and leave the class as it was found. Screenshots go to /tmp/t1-web-shots/ and the
// console/page-error record is written beside them.
//
// The teacher is selected by E2E_TEACHER_EMAIL (the repo's own override mechanism);
// the run sets it to t1@schooltest.local, whose seeded journey class is
// "Reading 8A — Okonkwo".

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
const WORKING = new Set(['joined', 'in_progress', 'stalled', 'paused']);
const SHOTS = '/tmp/t1-web-shots';

test.describe.configure({ mode: 'serial' });

const shots: string[] = [];
const consoleErrors: string[] = [];
const pageErrors: string[] = [];
const failedRequests: string[] = [];

let request: APIRequestContext;
let page: Page;
let jwt = '';
let klass: DashboardClass;
let formLabel = '';
let sittingId = '';
let code = '';
const joiner = { id: '', name: '' };
const waiter = { id: '', name: '' };

const live = () => page.locator('[data-surface="teacher-test-day"]');
const students = () => page.locator('[data-slot="live-students"]');
const card = (id: string) =>
  students().locator(`[data-slot="live-student-card"][data-student-id="${id}"]`);

async function shot(name: string): Promise<string> {
  mkdirSync(SHOTS, { recursive: true });
  const file = path.join(SHOTS, `${name}.png`);
  await page.screenshot({ path: file, animations: 'disabled' });
  shots.push(`${name}.png`);
  return file;
}

async function monitor(): Promise<{
  paused: boolean;
  extra_seconds: number;
  extensions: number;
  states: string[];
}> {
  const response = await request.get(`${API_BASE}/api/teacher/test-sessions/${sittingId}/monitor`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(response.status(), 'GET /api/teacher/test-sessions/:id/monitor').toBe(200);
  const body = (await response.json()) as {
    sitting: { paused: boolean; extra_seconds: number; extensions: number };
    students: { state: string }[];
  };
  return {
    paused: body.sitting.paused,
    extra_seconds: body.sitting.extra_seconds,
    extensions: body.sitting.extensions,
    states: body.students.map((entry) => entry.state),
  };
}

test.beforeAll(async ({ browser, playwright }) => {
  test.setTimeout(240_000);
  request = await playwright.request.newContext();

  // The teacher identity is the repo's own override mechanism: the run sets
  // E2E_TEACHER_EMAIL=t1@schooltest.local, so ACCOUNTS.teacher (UI sign-in and
  // this API login both read it) IS the journey teacher t1, with the shared
  // seeded teacher secret from schooltest-api/.env.
  jwt = await apiLoginRetried(request, 'teacher');

  const [classes, tests] = await Promise.all([readClasses(request, jwt), readTests(request, jwt)]);
  const [form] = tests;
  if (form === undefined) throw new Error('the journey teacher owns no test');
  formLabel = form.label;
  const free = classes.filter(
    (entry) => entry.student_count >= 2 && entry.open_session_count === 0,
  );
  klass = free.find((entry) => entry.name.includes('Reading 8A')) ?? free[0];
  if (klass === undefined) {
    throw new Error('no seeded class with students and no open session was found for this teacher');
  }

  page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(`[console.error] ${message.text()}`);
  });
  page.on('pageerror', (error) => pageErrors.push(`[pageerror] ${error.message}`));
  page.on('requestfailed', (failed) =>
    failedRequests.push(
      `[requestfailed] ${failed.method()} ${failed.url()} — ${failed.failure()?.errorText ?? ''}`,
    ),
  );
});

test.afterAll(async () => {
  // Leave no open sitting behind — the run's own session, closed the real way (C-TS-4).
  if (sittingId !== '') {
    const status = await request.post(`${API_BASE}/api/teacher/test-sessions/${sittingId}/close`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    if (status.status() !== 200 && status.status() !== 400) {
      throw new Error(`cleanup close answered ${status.status()}`);
    }
  }
  mkdirSync(SHOTS, { recursive: true });
  writeFileSync(
    path.join(SHOTS, 'console-report.json'),
    JSON.stringify({ consoleErrors, pageErrors, failedRequests, screenshots: shots }, null, 2),
  );
  await page?.context().close();
  await request.dispose();
});

test('1 · sign in as t1 through the web login page', async () => {
  test.setTimeout(180_000);
  await page.goto('/sign-in');
  await expect(page.getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true })).toBeVisible({
    timeout: 60_000,
  });
  await shot('01-sign-in-page');

  await page
    .getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true })
    .fill(process.env.E2E_TEACHER_EMAIL || 't1@schooltest.local');
  await page.getByLabel(cat(en, 'Auth.portal.passwordLabel'), { exact: true }).fill('Teacher1234!');
  await page.getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true }).click();
  await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 30_000 });

  const classes = page.locator('[data-surface="teacher-results"]');
  await expect(classes).toHaveAttribute('data-status', /^(ready|empty)$/, { timeout: 90_000 });
  await shot('02-dashboard-results-after-login');
});

test('2 · open the seeded class and its Live tab (no sitting open)', async () => {
  test.setTimeout(180_000);
  await page.goto('/dashboard/results');
  const row = page.locator(
    `[data-slot="results-class-row"][data-class-id="${klass.class_document_id}"]`,
  );
  await expect(row).toContainText(klass.name, { timeout: 60_000 });

  await row.getByRole('link').first().click();
  await page.waitForURL(`**/dashboard/results/${klass.class_document_id}**`);
  await expect(frame(page)).toHaveAttribute('data-status', READY, { timeout: 90_000 });
  await expect(header(page).getByRole('heading', { level: 1 })).toHaveText(klass.name);
  await shot('03-class-detail-overview');

  await sectionTab(page, 'live').click();
  await expect(
    page.locator('[data-tab-panel="live"] [data-surface="teacher-test-day"]'),
  ).toBeVisible({
    timeout: 90_000,
  });
  await expect(live()).toHaveAttribute('data-status', 'ready', { timeout: 90_000 });
  const empty = live().locator('[data-slot="live-no-sitting"]');
  await expect(empty).toBeVisible({ timeout: 30_000 });
  await expect(empty).toContainText(t('noSitting.title'));
  await shot('04-live-tab-no-sitting');
});

test('3 · start a two-student session through the Start-a-session modal', async () => {
  test.setTimeout(240_000);
  await live()
    .locator('[data-slot="live-no-sitting"]')
    .getByRole('button', { name: t('noSitting.start'), exact: true })
    .click();
  const dialog = modal(page);
  await expect(dialog.getByRole('heading', { name: tStart('title') })).toBeVisible({
    timeout: 30_000,
  });
  await expect(dialog.locator('[data-slot="start-session-class"]')).toHaveValue(
    klass.class_document_id,
  );
  await expect(choice(dialog, 'now')).toHaveAttribute('data-checked', '');

  await modalTab(dialog, 'students').click();
  await choice(dialog, 'some').click();
  await expect(dialog.locator('[data-slot="start-session-student"]')).toHaveCount(
    klass.student_count,
  );
  const free = dialog.locator('[data-slot="start-session-student"]:not([data-blocked])');
  joiner.id = (await free.nth(0).getAttribute('data-student-id')) ?? '';
  waiter.id = (await free.nth(1).getAttribute('data-student-id')) ?? '';
  const roster = await readRoster(request, jwt, klass.class_document_id);
  const nameOf = (id: string) =>
    roster.find((row) => row.student.document_id === id)?.student.name ?? '';
  joiner.name = nameOf(joiner.id);
  waiter.name = nameOf(waiter.id);
  expect(
    joiner.name.length * waiter.name.length,
    'both picks are real roster students',
  ).toBeGreaterThan(0);
  await free.nth(0).click();
  await free.nth(1).click();
  await expect(dialog.locator('[data-slot="start-session-roster"]')).toContainText(
    tStart('students.pickCount', { count: 2, total: klass.student_count }),
  );
  await shot('05-start-session-modal-students-picked');

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

  const apiCode = await expectStartedSitting(
    request,
    jwt,
    klass.class_document_id,
    sittingId,
    [joiner.id, waiter.id],
    {},
  );
  code = apiCode;
  expect(code, 'the modal and the API serve the same join code').toBe(body.code);
});

test('4 · the monitor renders both tiles as not_joined plus the room controls', async () => {
  test.setTimeout(180_000);
  await expect(live()).toHaveAttribute('data-status', 'ready', { timeout: 90_000 });
  await expect(live()).toHaveAttribute('data-sitting-id', sittingId);
  await expect(live().locator('[data-slot="live-join-code"]')).toHaveText(code);
  await expect(live().locator('[data-slot="run-sitting-test"] p').first()).toHaveText(
    t('room.testTitle', { className: klass.name, test: formLabel }),
  );

  await expect(card(joiner.id)).toHaveAttribute('data-status', 'not_joined', { timeout: 60_000 });
  await expect(card(joiner.id)).toContainText(tStudents('status.not_joined'));
  await expect(card(waiter.id)).toHaveAttribute('data-status', 'not_joined');
  await expect(card(waiter.id)).toContainText(waiter.name);
  await expect(students().locator('[data-slot="live-students-count"]')).toHaveText(
    tStudents('count', { shown: 2, total: 2 }),
  );

  // The room-control affordances the design puts on the monitor.
  const roomControls = live().locator('[data-slot="room-controls"]');
  await expect(roomControls).toBeVisible();
  await expect(live().locator('[data-slot="room-toggle"]')).toHaveText(t('room.pause'));
  await expect(
    roomControls.getByRole('button', { name: t('room.extend', { minutes: 5 }), exact: true }),
  ).toBeVisible();
  await expect(live().getByRole('button', { name: t('room.close'), exact: true })).toBeVisible();
  await shot('06-monitor-not-joined');

  // The tiles sit below the fold at 1440×900; capture them in their not_joined state.
  await card(waiter.id).scrollIntoViewIfNeeded();
  await shot('06b-student-tiles-not-joined');
});

test('5 · a real student joins and answers, the tile turns in_progress', async () => {
  test.setTimeout(180_000);
  const joined = await joinSitting(request, code, joiner.id);
  expect(joined.status, `POST /api/sittings/join ${JSON.stringify(joined.body)}`).toBe(200);
  const joinedBody = joined.body as { jwt?: string; session?: { document_id?: string } };
  expect(joinedBody.jwt?.length ?? 0, 'the join minted a student JWT').toBeGreaterThan(0);
  const sessionDocumentId = joinedBody.session?.document_id ?? '';

  await answerFirstItem(request, {
    studentJwt: joinedBody.jwt ?? '',
    sessionDocumentId,
    studentDocumentId: joiner.id,
    displayName: joiner.name,
  });

  await expect(card(joiner.id)).toHaveAttribute('data-status', 'in_progress', { timeout: 60_000 });
  await expect(card(joiner.id)).toContainText(tStudents('status.in_progress'));
  await expect(card(waiter.id)).toHaveAttribute('data-status', 'not_joined');
  const states = (await monitor()).states;
  expect(
    states.filter((state) => WORKING.has(state)).length,
    'one student is working per the API',
  ).toBe(1);
  await card(joiner.id).scrollIntoViewIfNeeded();
  await shot('07-monitor-student-in-progress');
});

test('6 · room controls: pause with confirm, resume, +5 minutes', async () => {
  test.setTimeout(240_000);
  await live().locator('[data-slot="room-toggle"]').click();
  const pauseDialog = page.getByRole('alertdialog');
  await expect(pauseDialog).toBeVisible();
  await expect(pauseDialog).toContainText(t('room.pauseConfirm.body', { count: 1 }));
  await shot('08-room-pause-confirm');
  await pauseDialog.getByRole('button', { name: t('room.pauseConfirm.cta'), exact: true }).click();
  await expect(pauseDialog).toBeHidden({ timeout: 30_000 });
  await expect.poll(async () => (await monitor()).paused, { timeout: 30_000 }).toBe(true);
  await expect(live().locator('[data-slot="room-toggle"]')).toHaveText(t('room.resume'), {
    timeout: 30_000,
  });
  await shot('09-room-paused');

  await live().locator('[data-slot="room-toggle"]').click();
  await expect.poll(async () => (await monitor()).paused, { timeout: 30_000 }).toBe(false);
  await expect(live().locator('[data-slot="room-toggle"]')).toHaveText(t('room.pause'), {
    timeout: 30_000,
  });

  await live()
    .getByRole('button', { name: t('room.extend', { minutes: 5 }), exact: true })
    .click();
  const extendDialog = page.getByRole('alertdialog');
  await expect(extendDialog).toBeVisible();
  await expect(extendDialog).toContainText(t('room.extendConfirm.title', { minutes: 5 }));
  await shot('10-room-extend-confirm');
  await extendDialog
    .getByRole('button', { name: t('room.extendConfirm.cta', { minutes: 5 }), exact: true })
    .click();
  await expect(extendDialog).toBeHidden({ timeout: 30_000 });
  await expect.poll(async () => (await monitor()).extra_seconds, { timeout: 30_000 }).toBe(300);
  expect((await monitor()).extensions, 'one grant recorded').toBe(1);
});

test('7 · close the session through the UI; the Live tab returns to no sitting', async () => {
  test.setTimeout(180_000);
  await live()
    .getByRole('button', { name: t('room.close'), exact: true })
    .click();
  const closeDialog = page.getByRole('alertdialog');
  await expect(closeDialog).toBeVisible();
  // The dialog's title/body are computed from the monitor's facts; the fixed
  // affordances are the CTA and cancel labels the shipped catalog pins.
  await expect(closeDialog.getByRole('button', { name: tClose('cta'), exact: true })).toBeVisible();
  await shot('11-close-session-confirm');
  await closeDialog.getByRole('button', { name: tClose('cta'), exact: true }).click();
  await expect(closeDialog).toBeHidden({ timeout: 30_000 });

  const empty = live().locator('[data-slot="live-no-sitting"]');
  await expect(empty).toBeVisible({ timeout: 60_000 });
  await expect(empty).toContainText(t('noSitting.title'));
  await shot('12-live-tab-after-close');
  sittingId = ''; // afterAll's safety close is no longer needed
});
