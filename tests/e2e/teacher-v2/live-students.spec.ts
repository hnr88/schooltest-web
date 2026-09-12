import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import { createTranslator } from 'next-intl';

import enMessages from '@/i18n/messages/en.json';
import {
  createTestSessionResponseSchema,
  testSessionMonitorResponseSchema,
} from '@/modules/teacher/schemas/teacher-session.schema';
import { sittingMonitorSchema } from '@/modules/test-day/schemas/test-day.schema';
import type { DashboardClass } from '@/modules/teacher/types/teacher.types';

import { apiLoginRetried } from '../helpers/ops34-api-retry';
import { API_BASE } from '../helpers/teacher-auth-rail';
import { answerFirstItem } from '../helpers/teacher-live-monitor-join';
import { freeStudents } from '../helpers/teacher-live-sessions';
import { closeSession, readClasses, readSessions, readTests } from '../helpers/teacher-past-sessions-api';
import { signIn } from '../helpers/teacher-rail';

// S7b — the Live tab's student list (Teacher Portal v2.dc.html:1147–1242) against the
// REAL API, no interception. Setup opens one two-student sitting on an idle t2 class and
// drives the desktop's own join + one real answer, so one student is really mid-attempt
// and the other really has not signed in. Every row action here is a real write, read
// back off the monitor or off the student's own /status with the JWT their join minted.

const PROOFS = path.resolve(process.cwd(), 'tests', 'e2e', 'proofs', 'teacher-v2');
const t = createTranslator({ locale: 'en', messages: enMessages, namespace: 'TeacherPortal.live.students' });

test.describe.configure({ mode: 'serial' });

let request: APIRequestContext;
let page: Page;
let jwt = '';
let klass: DashboardClass;
let sittingId = '';
const working = { id: '', jwt: '', session: '', name: '', email: '' };
const waiting = { id: '', name: '', email: '' };

const auth = () => ({ Authorization: `Bearer ${jwt}` });
const section = () => page.locator('[data-slot="live-students"]');
const card = (studentId: string) =>
  section().locator(`[data-slot="live-student-card"][data-student-id="${studentId}"]`);

async function monitor() {
  const response = await request.get(`${API_BASE}/api/teacher/test-sessions/${sittingId}/monitor`, {
    headers: auth(),
  });
  expect(response.status(), 'GET /api/teacher/test-sessions/:id/monitor').toBe(200);
  return testSessionMonitorResponseSchema.parse(await response.json());
}

async function board() {
  const response = await request.get(`${API_BASE}/api/sittings/${sittingId}/monitor`, { headers: auth() });
  expect(response.status(), 'GET /api/sittings/:id/monitor').toBe(200);
  const body = (await response.json()) as { data: unknown };
  return sittingMonitorSchema.parse(body.data);
}

const tileOf = async (studentId: string) =>
  (await monitor()).students.find((tile) => tile.student_document_id === studentId);

async function studentStatus(): Promise<{ paused: boolean; extra_seconds: number | null; submitted_by_teacher: boolean }> {
  const response = await request.get(`${API_BASE}/api/sittings/${sittingId}/status`, {
    headers: { Authorization: `Bearer ${working.jwt}` },
  });
  expect(response.status(), 'GET /api/sittings/:id/status as the student').toBe(200);
  return (await response.json()) as { paused: boolean; extra_seconds: number | null; submitted_by_teacher: boolean };
}

/** Opens a row's kebab and returns its popup. */
async function openMenu(studentId: string): Promise<Locator> {
  await card(studentId).scrollIntoViewIfNeeded();
  await card(studentId).locator('[data-slot="live-row-menu"]').click();
  const menu = page.locator('[data-slot="dropdown-menu-content"]');
  await expect(menu).toBeVisible();
  await expect(menu).toHaveAttribute('data-open', '');
  return menu;
}

/** Runs one row action and, where the design asks first, confirms with the design's CTA. */
async function runAction(studentId: string, action: string, confirmLabel?: string): Promise<void> {
  const menu = await openMenu(studentId);
  await menu.locator(`[data-action="${action}"]`).click();
  if (confirmLabel === undefined) return;
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: confirmLabel, exact: true }).click();
  await expect(dialog).toBeHidden({ timeout: 30_000 });
}

test.beforeAll(async ({ browser, playwright }) => {
  test.setTimeout(180_000);
  mkdirSync(PROOFS, { recursive: true });
  request = await playwright.request.newContext();
  jwt = await apiLoginRetried(request, 'teacher');
  const [classes, tests] = await Promise.all([readClasses(request, jwt), readTests(request, jwt)]);
  const [form] = tests;
  if (form === undefined) throw new Error('t2 owns no test');

  // Any class with two students free to sit: this spec addresses its own sitting
  // through `?session=`, so another sitting already live on the class is harmless.
  let picked: DashboardClass | undefined;
  for (const candidate of classes) {
    if (freeStudents(candidate.class_document_id).length >= 2) {
      picked = candidate;
      break;
    }
  }
  if (picked === undefined) throw new Error('t2 has no class with two free students');
  klass = picked;

  const members = freeStudents(klass.class_document_id).slice(0, 2);
  const created = await request.post(`${API_BASE}/api/teacher/test-sessions`, {
    headers: auth(),
    data: {
      class_document_id: klass.class_document_id,
      form_document_id: form.form_document_id,
      student_document_ids: members,
      start: true,
    },
  });
  expect(created.status(), 'POST /api/teacher/test-sessions').toBe(201);
  const body = createTestSessionResponseSchema.parse(await created.json());
  sittingId = body.sitting_document_id;
  working.id = members[0] ?? '';
  waiting.id = members[1] ?? '';

  const joined = await request.post(`${API_BASE}/api/sittings/join`, {
    data: { code: body.code, student_document_id: working.id },
  });
  expect(joined.status(), 'POST /api/sittings/join').toBe(200);
  const join = (await joined.json()) as { jwt: string; session: { document_id: string } };
  working.jwt = join.jwt;
  working.session = join.session.document_id;
  await answerFirstItem(request, {
    studentJwt: working.jwt,
    sessionDocumentId: working.session,
    studentDocumentId: working.id,
    displayName: '',
  });

  for (const row of (await board()).students) {
    const target = row.documentId === working.id ? working : row.documentId === waiting.id ? waiting : null;
    if (target === null) continue;
    target.name = `${row.given_name} ${row.family_name}`;
    target.email = row.email ?? '';
  }

  page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await signIn(page, 'teacher');
  await page.goto(`/dashboard/results/${klass.class_document_id}?tab=live&session=${sittingId}`);
  await expect(section()).toHaveAttribute('data-status', 'ready', { timeout: 60_000 });
});

test.afterAll(async () => {
  if (sittingId !== '') {
    const row = (await readSessions(request, jwt)).find((entry) => entry.sitting_document_id === sittingId);
    if (row?.status === 'open') await closeSession(request, jwt, sittingId);
  }
  await page?.context().close();
  await request.dispose();
});

test('every member is drawn with the state, progress and email the API reports', async () => {
  const tiles = await monitor();
  const inProgress = tiles.students.find((tile) => tile.student_document_id === working.id);
  expect(inProgress?.state, 'the student who answered is mid-attempt').toBe('in_progress');

  await expect(card(working.id)).toHaveAttribute('data-status', 'in_progress');
  await expect(card(working.id)).toContainText(working.name);
  await expect(card(working.id)).toContainText(working.email);
  await expect(card(working.id)).toContainText(t('status.in_progress'));
  const stage = inProgress?.stage ?? null;
  const totalStages = inProgress?.total_stages ?? null;
  await expect(card(working.id).locator('[data-slot="live-student-detail"]')).toHaveText(
    stage === null
      ? t('detail.joined')
      : totalStages === null
        ? t('detail.stageOnly', { stage })
        : t('detail.stage', { stage, total: totalStages }),
  );

  await expect(card(waiting.id)).toHaveAttribute('data-status', 'not_joined');
  await expect(card(waiting.id)).toContainText(t('status.not_joined'));
  await expect(card(waiting.id).locator('[data-slot="live-student-detail"]')).toHaveText(t('detail.notJoined'));

  await expect(section().locator('[data-slot="live-students-count"]')).toHaveText(t('count', { shown: 2, total: 2 }));
  await expect(section().locator('[data-slot="live-students-footnote"]')).toHaveText(
    t('footnote', { count: 1, total: 2 }),
  );
  await section().locator('[data-slot="live-students-board"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(PROOFS, 'live-students.png') });
});

test('the filter pills and the search narrow the list to the real states', async () => {
  const pills = section().locator('[data-slot="filter-pills"]');
  await pills.getByRole('button', { name: t('filter.inProgress'), exact: true }).click();
  await expect(section().locator('[data-slot="live-students-count"]')).toHaveText(t('count', { shown: 1, total: 2 }));
  await expect(card(working.id)).toBeVisible();
  await expect(card(waiting.id)).toHaveCount(0);

  await pills.getByRole('button', { name: t('filter.notJoined'), exact: true }).click();
  await expect(card(waiting.id)).toBeVisible();
  await expect(card(working.id)).toHaveCount(0);

  await pills.getByRole('button', { name: t('filter.submitted'), exact: true }).click();
  await expect(section().locator('[data-slot="live-students-empty"]')).toHaveText(t('empty'));

  await pills.getByRole('button', { name: t('filter.all'), exact: true }).click();
  await section().getByRole('searchbox', { name: t('searchLabel') }).fill(waiting.name);
  await expect(section().locator('[data-slot="live-students-count"]')).toHaveText(t('count', { shown: 1, total: 2 }));
  await section().getByRole('searchbox', { name: t('searchLabel') }).fill('');
  await expect(section().locator('[data-slot="live-students-count"]')).toHaveText(t('count', { shown: 2, total: 2 }));
});

test('the row menu pauses and resumes that student’s own attempt', async () => {
  const menu = await openMenu(working.id);
  await expect(menu.locator('[data-action="pause"]')).toHaveText(t('action.pause'));
  await expect(menu.locator('[data-action="extend"]')).toHaveText(t('action.extend'));
  await expect(menu.locator('[data-action="forceSubmit"]')).toHaveText(t('action.forceSubmit'));
  await expect(menu.locator('[data-action="incident"]')).toHaveText(t('action.incident'));
  // The popup fades in (Base UI, 100ms); catching it mid-animation would prove nothing.
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(PROOFS, 'live-row-menu.png') });
  await page.keyboard.press('Escape');

  await runAction(working.id, 'pause', t('confirm.pause.cta'));
  await expect.poll(async () => (await studentStatus()).paused, { timeout: 30_000 }).toBe(true);
  await expect(card(working.id)).toHaveAttribute('data-status', 'paused', { timeout: 30_000 });
  await expect(card(working.id)).toContainText(t('status.paused'));

  await runAction(working.id, 'resume');
  await expect.poll(async () => (await studentStatus()).paused, { timeout: 30_000 }).toBe(false);
  await expect(card(working.id)).toHaveAttribute('data-status', 'in_progress', { timeout: 30_000 });
});

test('marking the not-joined student absent moves them into the re-sit list, and undo brings them back', async () => {
  await runAction(waiting.id, 'markAbsent', t('confirm.markAbsent.cta'));
  await expect.poll(async () => (await tileOf(waiting.id))?.state, { timeout: 30_000 }).toBe('absent');
  await expect(card(waiting.id)).toHaveAttribute('data-status', 'absent', { timeout: 30_000 });
  const entry = section().locator(`[data-slot="live-resit-entry"][data-student-id="${waiting.id}"]`);
  await expect(entry).toHaveAttribute('data-reason', 'absent');
  await expect(entry).toContainText(t('resit.reason.absent'));
  await expect(section().locator('[data-slot="live-resit-start"]')).toHaveText(t('resit.start', { count: 1 }));

  await runAction(waiting.id, 'undoAbsent', t('confirm.undoAbsent.cta'));
  await expect.poll(async () => (await tileOf(waiting.id))?.state, { timeout: 30_000 }).toBe('not_joined');
  await expect(card(waiting.id)).toHaveAttribute('data-status', 'not_joined', { timeout: 30_000 });
  await expect(entry).toHaveCount(0);
});

test('the batch bar gives extra time to the eligible student only', async () => {
  await section().getByRole('checkbox', { name: t('selectAll'), exact: true }).click();
  await expect(section().locator('[data-slot="live-students-selection"]')).toHaveText(t('selected', { count: 2 }));
  const extend = section().locator('[data-batch="extend"]');
  await expect(extend).toContainText(t('batch.tally', { hit: 1, selected: 2 }));

  await section().locator('[data-slot="live-students-board"]').scrollIntoViewIfNeeded();
  // The tick boxes fill over 150ms; a shot taken mid-transition proves nothing.
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(PROOFS, 'live-students-batch.png') });

  await extend.click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText(t('batch.skipped', { count: 1, reason: t('batch.extend.only') }));
  await dialog.getByRole('button', { name: t('batch.extend.cta'), exact: true }).click();
  await expect(dialog).toBeHidden({ timeout: 30_000 });

  await expect.poll(async () => (await tileOf(working.id))?.extra_minutes, { timeout: 30_000 }).toBe(10);
  expect((await tileOf(waiting.id))?.extra_minutes, 'the student who never joined got nothing').toBe(0);
  expect((await studentStatus()).extra_seconds, 'the student reads their own grant').toBe(600);
});

test('force submit ends the attempt and its submission opens in the review drawer', async () => {
  await runAction(working.id, 'forceSubmit', t('confirm.forceSubmit.cta'));
  await expect.poll(async () => (await tileOf(working.id))?.state, { timeout: 30_000 }).toBe('submitted');
  await expect(card(working.id)).toHaveAttribute('data-status', 'submitted', { timeout: 30_000 });
  expect((await studentStatus()).submitted_by_teacher, 'the student reads the teacher submit').toBe(true);

  await runAction(working.id, 'review');
  const drawer = page.locator('[data-surface="result-review"]');
  await expect(drawer).toBeVisible({ timeout: 30_000 });
  await expect(drawer).toContainText(working.name);
  await page.screenshot({ path: path.join(PROOFS, 'live-students-review.png') });
});
