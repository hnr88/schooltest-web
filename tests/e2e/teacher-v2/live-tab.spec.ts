import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { createTranslator } from 'next-intl';

import enMessages from '@/i18n/messages/en.json';
import { SITTING_TOGGLE_KEYS } from '@/modules/teacher/constants/live-tab.constants';
import {
  createTestSessionResponseSchema,
  sittingActivityFeedSchema,
  testSessionBookingSchema,
  testSessionMonitorResponseSchema,
} from '@/modules/teacher/schemas/teacher-session.schema';
import type { DashboardClass } from '@/modules/teacher/types/teacher.types';

import { apiEnv } from '../helpers/auth-db';
import { apiLoginRetried } from '../helpers/ops34-api-retry';
import { API_BASE } from '../helpers/teacher-auth-rail';
import { freeStudents, schoolTimezone, wallDate, zonedIso } from '../helpers/teacher-live-sessions';
import { closeSession, readClasses, readSessions, readTests } from '../helpers/teacher-past-sessions-api';
import { signIn, signInTeacher } from '../helpers/teacher-rail';
import { joinSitting, openSittingsOf, releaseSitting } from '../helpers/teacher-start-session-api';

// S7a — the class Live tab ("Test day") room controls on the REAL API, no interception.
// Setup opens one real two-student sitting on a t2 class that has nothing else live and
// joins one student through the desktop's own join, so the room really has someone working.
// Every expected string is the en catalog; every expected number is read back off the API.

const PROOFS = path.resolve(process.cwd(), 'tests', 'e2e', 'proofs', 'teacher-v2');
const WORKING = new Set(['joined', 'in_progress', 'stalled', 'paused']);
const IDLE_TEACHER = 'teacher@schooltest.local';
const t = createTranslator({ locale: 'en', messages: enMessages, namespace: 'TeacherPortal.live' });
const tClose = createTranslator({
  locale: 'en',
  messages: enMessages,
  namespace: 'TeacherPortal.liveSessions.closeConfirm',
});

test.describe.configure({ mode: 'serial' });

let request: APIRequestContext;
let page: Page;
let jwt = '';
let klass: DashboardClass;
let sittingId = '';
let bookingId = '';
let formId = '';
let code = '';
let studentJwt = '';

const auth = () => ({ Authorization: `Bearer ${jwt}` });
const surface = () => page.locator('[data-surface="teacher-test-day"]');

async function monitor() {
  const response = await request.get(`${API_BASE}/api/teacher/test-sessions/${sittingId}/monitor`, {
    headers: auth(),
  });
  expect(response.status(), 'GET /api/teacher/test-sessions/:id/monitor').toBe(200);
  return testSessionMonitorResponseSchema.parse(await response.json());
}

async function studentStatus(): Promise<Record<string, unknown>> {
  const response = await request.get(`${API_BASE}/api/sittings/${sittingId}/status`, {
    headers: { Authorization: `Bearer ${studentJwt}` },
  });
  expect(response.status(), 'GET /api/sittings/:id/status as the student').toBe(200);
  return (await response.json()) as Record<string, unknown>;
}

async function activity() {
  const response = await request.get(`${API_BASE}/api/sittings/${sittingId}/activity`, {
    headers: auth(),
    params: { limit: 8 },
  });
  expect(response.status(), 'GET /api/sittings/:id/activity').toBe(200);
  const body = (await response.json()) as { data: unknown };
  return sittingActivityFeedSchema.parse(body.data);
}

const sittingRow = async () =>
  (await openSittingsOf(request, jwt, klass.class_document_id)).find(
    (row) => row.sitting_document_id === sittingId,
  );

const countWorking = (students: readonly { state: string }[]) =>
  students.filter((student) => WORKING.has(student.state)).length;

test.beforeAll(async ({ browser, playwright }) => {
  test.setTimeout(180_000);
  mkdirSync(PROOFS, { recursive: true });
  request = await playwright.request.newContext();
  jwt = await apiLoginRetried(request, 'teacher');
  const [classes, tests] = await Promise.all([readClasses(request, jwt), readTests(request, jwt)]);
  const [form] = tests;
  if (form === undefined) throw new Error('t2 owns no test');

  const picked = classes.find((candidate) => freeStudents(candidate.class_document_id).length >= 2);
  if (picked === undefined) throw new Error('t2 has no class with two free students');
  klass = picked;

  const members = freeStudents(klass.class_document_id).slice(0, 2);
  formId = form.form_document_id;
  const created = await request.post(`${API_BASE}/api/teacher/test-sessions`, {
    headers: auth(),
    data: {
      class_document_id: klass.class_document_id,
      form_document_id: formId,
      student_document_ids: members,
      settings: { lockdown: false, timeLimit: 35 },
      start: true,
    },
  });
  expect(created.status(), 'POST /api/teacher/test-sessions').toBe(201);
  const body = createTestSessionResponseSchema.parse(await created.json());
  sittingId = body.sitting_document_id;
  code = body.code;

  const joined = await joinSitting(request, code, members[0] ?? '');
  expect(joined.status, `POST /api/sittings/join ${JSON.stringify(joined.body)}`).toBe(200);
  studentJwt = joined.body.jwt ?? '';

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  page = await context.newPage();
  await signIn(page, 'teacher');
});

test.afterAll(async () => {
  if (bookingId !== '') await releaseSitting(request, jwt, bookingId, 'cancel');
  if (sittingId !== '') {
    const row = (await readSessions(request, jwt)).find((entry) => entry.sitting_document_id === sittingId);
    if (row?.status === 'open') await closeSession(request, jwt, sittingId);
  }
  await page?.context().close();
  await request.dispose();
});

test('the Live tab renders the sitting the API served', async () => {
  test.setTimeout(120_000);
  await page.goto(`/dashboard/results/${klass.class_document_id}?tab=live&session=${sittingId}`);
  await expect(surface()).toHaveAttribute('data-status', 'ready', { timeout: 60_000 });
  await expect(surface()).toHaveAttribute('data-sitting-id', sittingId);

  const row = await sittingRow();
  const board = await monitor();
  expect(row?.code, 'the served join code').toBe(code);
  const test_ = row?.form?.label ?? '';

  await expect(surface().getByRole('heading', { name: t('header.title'), level: 2 })).toBeVisible();
  await expect(surface().locator('[data-slot="live-subtitle"]')).toHaveText(
    t('header.subtitleLive', { className: klass.name, test: test_, count: row?.stats?.expected ?? 0 }),
  );
  await expect(surface().locator('[data-slot="live-join-code"]')).toHaveText(code);
  await expect(surface().locator('[data-slot="run-sitting-test"] p').first()).toHaveText(
    t('room.testTitle', { className: klass.name, test: test_ }),
  );
  await expect(surface().locator('[data-slot="run-sitting-stall"]')).toHaveText(
    t('room.stallMeta', { minutes: board.stall_threshold_minutes }),
  );
  const on = SITTING_TOGGLE_KEYS.filter((key) => row?.settings?.[key] === true).length;
  await expect(surface().locator('[data-slot="test-settings-button"]')).toContainText(
    t('room.settingsCount', { on, total: SITTING_TOGGLE_KEYS.length }),
  );

  const working = board.students.filter((student) => WORKING.has(student.state));
  await expect(surface().locator('[data-slot="live-connection-summary"]')).toHaveText(
    t('connection.summary', {
      online: working.filter((student) => student.connection === 'online').length,
      weak: working.filter((student) => student.connection === 'weak').length,
      offline: working.filter((student) => student.connection === 'offline').length,
      working: working.length,
    }),
  );
  await expect(surface().locator('[data-slot="room-meta"]')).toHaveText(t('room.metaRunning'));
  await page.screenshot({ path: path.join(PROOFS, 'live-tab.png'), animations: 'disabled' });
});

test('Copy code puts the real join code on the clipboard', async () => {
  const button = surface().locator('[data-slot="copy-code"]');
  await expect(button).toHaveText(t('room.copy'));
  await button.click();
  await expect(button).toHaveText(t('room.copied'));
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(code);
});

test('Test settings lists what the sitting is running with', async () => {
  const row = await sittingRow();
  const on = SITTING_TOGGLE_KEYS.filter((key) => row?.settings?.[key] === true).length;
  await surface().locator('[data-slot="test-settings-button"]').click();
  const modal = page.locator('[data-slot="session-settings-modal"]');
  await expect(modal).toBeVisible();
  await expect(modal).toHaveAttribute('data-settings-count', `${on} of ${SITTING_TOGGLE_KEYS.length} on`);
  await expect(modal.getByRole('heading', { name: t('settingsPanel.title') })).toBeVisible();
  await expect(modal).toContainText(t('settingsPanel.subtitle', { on, total: SITTING_TOGGLE_KEYS.length }));
  await expect(modal.locator('[data-slot="session-settings-row"]')).toHaveCount(SITTING_TOGGLE_KEYS.length + 1);
  // Created with lockdown off and a 35 minute limit: the panel shows those, not the defaults.
  await expect(
    modal.locator('[data-slot="session-settings-row"]', { hasText: t('settingsPanel.rows.lockdown.label') }),
  ).toContainText(t('settingsPanel.off'));
  await expect(modal.locator('[data-slot="session-settings-row"]').last()).toContainText(
    t('settingsPanel.minutes', { minutes: row?.settings?.timeLimit ?? 0 }),
  );
  await expect(modal).toContainText(t('settingsPanel.fixed'));
  await page.screenshot({ path: path.join(PROOFS, 'live-settings-panel.png'), animations: 'disabled' });
  await modal.getByRole('button', { name: t('settingsPanel.close') }).click();
  await expect(modal).toHaveCount(0);
});

test('Pause test stops the room for the student, Resume releases it', async () => {
  test.setTimeout(120_000);
  const working = countWorking((await monitor()).students);
  expect(working, 'the joined student is working').toBeGreaterThan(0);

  await surface().locator('[data-slot="room-toggle"]').click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText(t('room.pauseConfirm.title'));
  await expect(dialog).toContainText(t('room.pauseConfirm.body', { count: working }));
  await page.screenshot({ path: path.join(PROOFS, 'live-pause-confirm.png'), animations: 'disabled' });
  await dialog.getByRole('button', { name: t('room.pauseConfirm.cta'), exact: true }).click();

  await expect.poll(async () => (await monitor()).sitting.paused, { timeout: 30_000 }).toBe(true);
  expect((await studentStatus()).paused, 'the student device reads paused').toBe(true);
  await expect(surface().locator('[data-slot="room-controls"]')).toHaveAttribute('data-paused', 'true');
  await expect(surface().locator('[data-slot="room-toggle"]')).toHaveText(t('room.resume'));
  await expect(surface().locator('[data-slot="room-paused-at"]')).toBeVisible();
  await expect(surface().locator('[data-slot="room-meta"]')).toContainText(t('room.metaPaused'));
  await page.screenshot({ path: path.join(PROOFS, 'live-tab-paused.png'), animations: 'disabled' });

  await surface().locator('[data-slot="room-toggle"]').click();
  await expect.poll(async () => (await monitor()).sitting.paused, { timeout: 30_000 }).toBe(false);
  expect((await studentStatus()).paused, 'the student device runs again').toBe(false);
  await expect(surface().locator('[data-slot="room-toggle"]')).toHaveText(t('room.pause'));
});

test('+5 min grants the room five real minutes', async () => {
  test.setTimeout(120_000);
  await surface().getByRole('button', { name: t('room.extend', { minutes: 5 }), exact: true }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText(t('room.extendConfirm.title', { minutes: 5 }));
  await expect(dialog).toContainText(t('room.extendConfirm.body', { minutes: 5 }));
  await dialog.getByRole('button', { name: t('room.extendConfirm.cta', { minutes: 5 }), exact: true }).click();

  await expect.poll(async () => (await monitor()).sitting.extra_seconds, { timeout: 30_000 }).toBe(300);
  expect((await monitor()).sitting.extensions).toBe(1);
  expect((await studentStatus()).extra_seconds, 'the student device gets the grant').toBe(300);
  await expect(surface().locator('[data-slot="room-meta"]')).toContainText(
    t('room.extraSoFar', { minutes: 5, count: 1 }),
  );
});

test('Low-bandwidth mode writes the sitting settings and survives a reload', async () => {
  test.setTimeout(120_000);
  await surface().locator('[data-slot="live-connection"] button').first().click();
  const toggle = surface().locator('[data-slot="low-bandwidth-toggle"]');
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await expect(toggle).toContainText(t('connection.lowBwOff'));
  await toggle.click();
  await expect.poll(async () => (await sittingRow())?.settings?.lowBw, { timeout: 30_000 }).toBe(true);

  await page.reload();
  await expect(surface()).toHaveAttribute('data-status', 'ready', { timeout: 60_000 });
  await surface().locator('[data-slot="live-connection"] button').first().click();
  const after = surface().locator('[data-slot="low-bandwidth-toggle"]');
  await expect(after).toHaveAttribute('aria-checked', 'true');
  await expect(after).toContainText(t('connection.lowBwOn'));
  await page.screenshot({ path: path.join(PROOFS, 'live-connection.png'), animations: 'disabled' });
});

test('Session activity lists the room actions the server recorded', async () => {
  test.setTimeout(120_000);
  const rows = surface().locator('[data-slot="live-activity-row"]');
  await expect.poll(async () => rows.count(), { timeout: 30_000 }).toBeGreaterThanOrEqual(3);
  const feed = await activity();
  await expect(rows).toHaveCount(feed.entries.length);
  for (const [index, entry] of feed.entries.entries()) {
    await expect(rows.nth(index)).toContainText(entry.action);
    await expect(rows.nth(index)).toContainText(entry.actor_label);
  }
  const actions = feed.entries.map((entry) => entry.action).join(' | ');
  expect(actions).toContain('Paused the whole room');
  expect(actions).toContain('Resumed the whole room');
  expect(actions).toContain('Added 5 minutes for the whole room');
});

test('Booked for later lists this class\u2019s own bookings', async () => {
  test.setTimeout(120_000);
  const zone = schoolTimezone(klass.class_document_id);
  const day = wallDate(Date.now() + 24 * 60 * 60 * 1000, zone);
  const booked = await request.post(`${API_BASE}/api/teacher/test-sessions`, {
    headers: auth(),
    data: {
      class_document_id: klass.class_document_id,
      form_document_id: formId,
      window: { opens_at: zonedIso(day, '09:00', zone), closes_at: zonedIso(day, '10:00', zone) },
    },
  });
  expect(booked.status(), `POST /api/teacher/test-sessions (window) ${await booked.text()}`).toBe(201);
  const booking = testSessionBookingSchema.parse(await booked.json());
  bookingId = booking.sitting_document_id;

  await page.goto(`/dashboard/results/${klass.class_document_id}?tab=live&session=${sittingId}`);
  await expect(surface()).toHaveAttribute('data-status', 'ready', { timeout: 60_000 });
  const section = surface().locator('[data-slot="live-booked"]');
  await expect(section).toContainText(t('history.bookedTitle'));
  const card = section.locator(`[data-slot="scheduled-session-card"][data-sitting-id="${bookingId}"]`);
  await expect(card).toBeVisible({ timeout: 30_000 });
  await expect(card.locator('h3')).toHaveText(booking.form.label);
  await expect(card.locator('[data-slot="scheduled-session-when"]')).toContainText('09:00');
  // Settle the polled reads before the proof shot, so it shows the loaded tab, not a mid-load frame.
  await expect(surface().locator('[data-slot="room-meta"]')).toContainText(t('room.metaRunning'));
  await card.scrollIntoViewIfNeeded();
  // A booking is never the live sitting, and never a row of Previous sessions.
  await expect(surface()).toHaveAttribute('data-sitting-id', sittingId);
  await expect(surface().locator(`[data-slot="live-history-row"][data-sitting-id="${bookingId}"]`)).toHaveCount(0);
  await page.screenshot({ path: path.join(PROOFS, 'live-booked.png'), animations: 'disabled' });
});

test('Close sitting closes it and the tab falls back to No sitting open', async () => {
  test.setTimeout(120_000);
  const board = await monitor();
  const working = countWorking(board.students);
  const notJoined = board.students.filter((student) => student.state === 'not_joined').length;

  await surface().getByRole('button', { name: t('room.close'), exact: true }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText(working > 0 ? tClose('titleWorking', { count: working }) : tClose('title'));
  if (notJoined > 0) {
    await expect(dialog).toContainText(t('room.closeConfirm.notJoined', { count: notJoined }));
  }
  await expect(dialog).toContainText(t('room.closeConfirm.undone'));
  await page.screenshot({ path: path.join(PROOFS, 'live-close-confirm.png'), animations: 'disabled' });
  await dialog.getByRole('button', { name: tClose('cta'), exact: true }).click();

  await expect
    .poll(
      async () =>
        (await readSessions(request, jwt)).find((entry) => entry.sitting_document_id === sittingId)?.status,
      { timeout: 30_000 },
    )
    .toBe('closed');
  // This class also carries sittings an earlier run left open, which this spec does not
  // touch. The tab drops the closed one either way: to the navy card when nothing else is
  // live, otherwise to the next live sitting of the class.
  const stillLive = (await openSittingsOf(request, jwt, klass.class_document_id)).filter(
    (row) => row.sitting_document_id !== sittingId,
  );
  if (stillLive.length === 0) {
    const card = surface().locator('[data-slot="live-no-sitting"]');
    await expect(card).toBeVisible({ timeout: 30_000 });
    await expect(card).toContainText(t('noSitting.title'));
    await expect(card).toContainText(t('noSitting.body'));
  } else {
    await expect
      .poll(async () => surface().getAttribute('data-sitting-id'), { timeout: 30_000 })
      .not.toBe(sittingId);
  }
  await expect(surface().locator(`[data-slot="live-history-row"][data-sitting-id="${sittingId}"]`)).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    surface().locator(`[data-slot="live-history-row"][data-sitting-id="${sittingId}"]`),
  ).toContainText(t('history.closed'));
});

test('a class with nothing running shows the design\u2019s No sitting open card', async ({ browser }) => {
  test.setTimeout(120_000);
  const login = await request.post(`${API_BASE}/api/auth/local`, {
    data: { identifier: IDLE_TEACHER, password: apiEnv('SEED_TEACHER_PASSWORD') },
  });
  expect(login.status(), `POST /api/auth/local as ${IDLE_TEACHER}`).toBe(200);
  const { jwt: token } = (await login.json()) as { jwt: string };
  const classes = await readClasses(request, token);
  let idle: DashboardClass | undefined;
  for (const candidate of classes) {
    if ((await openSittingsOf(request, token, candidate.class_document_id)).length === 0) {
      idle = candidate;
      break;
    }
  }
  if (idle === undefined) test.skip(true, `${IDLE_TEACHER} has no class with nothing running`);

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const idlePage = await context.newPage();
  await signInTeacher(idlePage, IDLE_TEACHER);
  await idlePage.goto(`/dashboard/results/${idle?.class_document_id ?? ''}?tab=live`);
  const idleSurface = idlePage.locator('[data-surface="teacher-test-day"]');
  await expect(idleSurface).toHaveAttribute('data-status', 'ready', { timeout: 60_000 });
  const card = idleSurface.locator('[data-slot="live-no-sitting"]');
  await expect(card).toBeVisible({ timeout: 30_000 });
  await expect(card).toContainText(t('noSitting.title'));
  await expect(card).toContainText(t('noSitting.body'));
  await expect(card.getByRole('button', { name: t('noSitting.start'), exact: true })).toBeVisible();
  await expect(idleSurface.locator('[data-slot="live-subtitle"]')).toContainText('no sitting open');
  await expect(idleSurface.locator('[data-slot="run-sitting"]')).toHaveCount(0);
  await idlePage.screenshot({ path: path.join(PROOFS, 'live-no-sitting.png'), animations: 'disabled' });
  await context.close();
});
