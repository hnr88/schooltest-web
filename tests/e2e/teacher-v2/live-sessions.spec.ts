import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { createTranslator } from 'next-intl';

import enMessages from '@/i18n/messages/en.json';
import { createTestSessionResponseSchema } from '@/modules/teacher/schemas/teacher-session.schema';
import type { DashboardClass } from '@/modules/teacher/types/teacher.types';

import { apiEnv, runSql } from '../helpers/auth-db';
import { apiLoginRetried } from '../helpers/ops34-api-retry';
import { API_BASE } from '../helpers/teacher-auth-rail';
import { freeStudents, liveOf } from '../helpers/teacher-live-sessions';
import {
  closeSession,
  readClasses,
  readSessions,
  readTests,
} from '../helpers/teacher-past-sessions-api';
import { signIn, signInTeacher } from '../helpers/teacher-rail';
import { busyStudentIds } from '../helpers/teacher-start-session-api';

// S12 — /dashboard/test-sessions per Teacher Portal v2.dc.html:218–299 on the REAL
// API, no interception. Setup opens a real two-student sitting on t2's class
// (C-TS-1); the page closes it (C-TS-4). Expected copy = the en catalog + API numbers.

const PROOFS = path.resolve(process.cwd(), 'tests', 'e2e', 'proofs', 'teacher-v2');
const IDLE_TEACHER = 'teacher@schooltest.local';
const t = createTranslator({ locale: 'en', messages: enMessages, namespace: 'TeacherPortal.liveSessions' });
const tClasses = createTranslator({ locale: 'en', messages: enMessages, namespace: 'TeacherPortal.classes' });

test.describe.configure({ mode: 'serial' });

let request: APIRequestContext;
let page: Page;
let jwt = '';
let klass: DashboardClass;
let sittingId = '';
let code = '';

const card = () => page.locator(`[data-slot="live-session-card"][data-sitting-id="${sittingId}"]`);

test.beforeAll(async ({ browser, playwright }) => {
  test.setTimeout(180_000);
  mkdirSync(PROOFS, { recursive: true });
  request = await playwright.request.newContext();
  jwt = await apiLoginRetried(request, 'teacher');
  const [classes, tests] = await Promise.all([readClasses(request, jwt), readTests(request, jwt)]);
  const [first] = classes;
  const [form] = tests;
  if (first === undefined || form === undefined) throw new Error('t2 owns no class or no test');
  klass = first;
  const members = freeStudents(klass.class_document_id).slice(0, 2);
  expect(members, 'two free students on the roster').toHaveLength(2);
  const response = await request.post(`${API_BASE}/api/teacher/test-sessions`, {
    headers: { Authorization: `Bearer ${jwt}` },
    data: {
      class_document_id: klass.class_document_id,
      form_document_id: form.form_document_id,
      student_document_ids: members,
      start: true,
    },
  });
  expect(response.status(), 'POST /api/teacher/test-sessions').toBe(201);
  const created = createTestSessionResponseSchema.parse(await response.json());
  sittingId = created.sitting_document_id;
  code = created.code;
  page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await signIn(page, 'teacher');
});

test.afterAll(async () => {
  const status = sittingId === '' ? '' : runSql(`select status from sittings where document_id = '${sittingId}'`);
  if (status === 'open') await closeSession(request, jwt, sittingId);
  await page?.context().close();
  await request.dispose();
});

test('the new sitting renders with its real code, members and counts', async () => {
  test.setTimeout(120_000);
  await page.goto('/dashboard/test-sessions');
  const surface = page.locator('[data-surface="teacher-test-sessions"]');
  await expect(surface).toHaveAttribute('data-status', 'ready', { timeout: 60_000 });
  const live = liveOf(await readSessions(request, jwt));
  const mine = live.filter((row) => row.class.document_id === klass.class_document_id);
  const row = mine.find((entry) => entry.sitting_document_id === sittingId);
  expect(row?.stats).toEqual({ expected: 2, joined: 0, submitted: 0 });

  const classes = new Set(live.map((entry) => entry.class.document_id)).size;
  await expect(surface.locator('h1')).toHaveText(t('title'));
  await expect(surface.locator('[data-slot="teacher-page-header"] p')).toHaveText(
    t('summary', { sessions: live.length, classes }),
  );
  await expect(surface.locator('[data-slot="start-session-button"]')).toHaveText(t('startSession'));

  const block = surface.locator(`[data-slot="live-class-block"][data-class-id="${klass.class_document_id}"]`);
  await expect(block.locator('h2')).toHaveText(klass.name);
  if (typeof klass.year_level === 'number') {
    const year = tClasses('yearLevel', { level: klass.year_level });
    await expect(block).toContainText(t('classMeta', { year, count: klass.student_count }));
  }
  const free = klass.student_count - (await busyStudentIds(request, jwt, klass.class_document_id)).size;
  await expect(block.locator('[data-slot="live-class-free"]')).toHaveText(
    free > 0 ? t('free', { count: free }) : t('everyoneBusy'),
  );
  await expect(block.locator('[data-slot="live-session-card"]')).toHaveCount(mine.length);

  await expect(card().locator('[data-slot="live-session-code"]')).toHaveText(code);
  await expect(card().locator('h3')).toHaveText(row?.form?.label ?? '');
  await expect(card()).toContainText(t('whoSelected', { count: 2 }));
  await expect(card().locator('[data-slot="live-session-progress"]')).toHaveText('0 joined · 0 submitted of 2');
  await page.screenshot({ path: path.join(PROOFS, 'live-sessions.png') });
});

test('Monitor opens the class on its Live tab with this sitting', async () => {
  await card().getByRole('link', { name: t('monitor'), exact: true }).click();
  await page.waitForURL(
    (url) =>
      url.pathname.endsWith(`/dashboard/results/${klass.class_document_id}`) &&
      url.searchParams.get('tab') === 'live' &&
      url.searchParams.get('session') === sittingId,
    { timeout: 60_000 },
  );
});

test('Close asks first, then the API reports the sitting closed and the card is gone', async () => {
  test.setTimeout(120_000);
  await page.goto('/dashboard/test-sessions');
  await expect(card()).toBeVisible({ timeout: 60_000 });
  const row = liveOf(await readSessions(request, jwt)).find((entry) => entry.sitting_document_id === sittingId);
  const working = (row?.stats?.joined ?? 0) - (row?.stats?.submitted ?? 0);

  await card().getByRole('button', { name: t('close'), exact: true }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText(
    working > 0 ? t('closeConfirm.titleWorking', { count: working }) : t('closeConfirm.title'),
  );
  await expect(dialog).toContainText(t('closeConfirm.body', { code, className: klass.name }));
  await page.screenshot({
    path: path.join(PROOFS, 'live-sessions-close-confirm.png'),
    animations: 'disabled',
  });

  await dialog.getByRole('button', { name: t('closeConfirm.cta'), exact: true }).click();
  await expect(card()).toHaveCount(0, { timeout: 30_000 });
  const closed = (await readSessions(request, jwt)).find((entry) => entry.sitting_document_id === sittingId);
  expect(closed?.status).toBe('closed');
  expect(closed?.closed_at).toBeTruthy();
});

test('a teacher with nothing running sees the empty state and one chip per idle class', async ({ browser }) => {
  test.setTimeout(120_000);
  const login = await request.post(`${API_BASE}/api/auth/local`, {
    data: { identifier: IDLE_TEACHER, password: apiEnv('SEED_TEACHER_PASSWORD') },
  });
  expect(login.status(), `POST /api/auth/local as ${IDLE_TEACHER}`).toBe(200);
  const { jwt: token } = (await login.json()) as { jwt: string };
  const classes = await readClasses(request, token);
  const live = liveOf(await readSessions(request, token));
  const busy = new Set(live.map((row) => row.class.document_id));
  const idle = classes.filter((entry) => !busy.has(entry.class_document_id));
  expect(idle.length, `${IDLE_TEACHER} has a class with nothing running`).toBeGreaterThan(0);

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const idlePage = await context.newPage();
  await signInTeacher(idlePage, IDLE_TEACHER);
  await idlePage.goto('/dashboard/test-sessions');
  const surface = idlePage.locator('[data-surface="teacher-test-sessions"]');
  await expect(surface).toHaveAttribute('data-status', 'ready', { timeout: 60_000 });
  await expect(surface.locator('[data-slot="teacher-idle-classes"] button')).toHaveText(
    idle.map((entry) => t('idleChip', { name: entry.name, count: entry.student_count })),
  );
  if (live.length === 0) {
    await expect(surface.locator('[data-slot="teacher-page-header"] p')).toHaveText(t('summaryNone'));
    await expect(surface.locator('[data-slot="teacher-live-rollup"]')).toHaveText(t('empty'));
    await idlePage.screenshot({ path: path.join(PROOFS, 'live-sessions-none.png') });
  }
  await context.close();
});
