import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';
import { createTranslator } from 'next-intl';

import enMessages from '@/i18n/messages/en.json';
import { createTestSessionResponseSchema } from '@/modules/teacher/schemas/teacher-session.schema';

import { runSql } from './helpers/auth-db';
import { apiLoginRetried } from './helpers/ops34-api-retry';
import { readMonitor } from './helpers/teacher-live-monitor-api';
import { readSessions, readTests } from './helpers/teacher-past-sessions-api';
import { signIn } from './helpers/teacher-rail';
import { releaseSitting } from './helpers/teacher-start-session-api';
import { choice, isLiveTab, isSessionWrite, modal, waitForModalData } from './helpers/teacher-start-session-modal';
import { rosterSize } from './helpers/teacher-test-sessions-flow';

// Journey 04 — the teacher assigns a test to a class and opens the sitting. ONE chained
// drive on the REAL stack (web :3002, Strapi :5500, Postgres), no interception: sign in
// as the journey teacher (t2), open "Start new session" on Live sessions, give the whole
// class the first test and Start now (C-TS-1's real POST), land on the class's Live tab
// with that sitting, then reload Live sessions and find the same sitting — on the page,
// in C-TS-2, in C-TS-3 and in Postgres. Every value is the server's own answer.
const t = createTranslator({ locale: 'en', messages: enMessages, namespace: 'TeacherPortal.startSession' });
const tLive = createTranslator({ locale: 'en', messages: enMessages, namespace: 'TeacherPortal.liveSessions' });
const SHOTS = path.resolve(process.cwd(), '..', '.qa', 'journeys', '04-teacher-assign-test', 'shots');

test.describe.configure({ mode: 'serial' });

let jwt = '';
let sittingId = '';

/** 1440x900 capture into the journey's evidence folder, attached for Tests. */
async function shot(page: Page, name: string): Promise<void> {
  const file = path.join(SHOTS, name);
  await page.screenshot({ path: file, fullPage: true });
  await test.info().attach(name, { path: file });
}

test.afterAll(async ({ playwright }) => {
  // Leave no sitting of this journey's own making open behind (C-TS-4).
  test.setTimeout(120_000);
  if (sittingId === '' || runSql(`select status from sittings where document_id = '${sittingId}'`) !== 'open') return;
  const api = await playwright.request.newContext();
  try {
    expect(await releaseSitting(api, jwt, sittingId, 'close')).toBe(200);
  } finally {
    await api.dispose();
  }
});

test('assign a test to a class, open the sitting, and it all persists on reload', async ({ page, request }) => {
  test.setTimeout(240_000);
  jwt = await apiLoginRetried(request, 'teacher');
  await page.setViewportSize({ width: 1440, height: 900 });
  // The managed runner may reuse a tab carrying another run's session; /sign-in bounces
  // an authenticated user, so start from clean storage.
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await signIn(page, 'teacher');
  const [chosen] = await readTests(request, jwt);
  if (chosen === undefined) throw new Error('C-TD-2 offers no test');

  // ASSIGN: the one Start-new-session modal, the whole class, the first test, Start now.
  await page.goto('/dashboard/test-sessions');
  await page.locator('[data-slot="start-session-button"]').click();
  const dialog = modal(page);
  await expect(dialog.getByRole('heading', { name: t('title') })).toBeVisible({ timeout: 30_000 });
  await waitForModalData(page);
  const classId = await dialog.locator('[data-slot="start-session-class"]').inputValue();
  await choice(dialog, chosen.form_document_id).click();
  await expect(choice(dialog, 'now')).toHaveAttribute('data-checked', '');
  const posted = page.waitForResponse((response) => isSessionWrite(response, 'POST'));
  await dialog.locator('[data-slot="start-session-cta"]').click();
  const response = await posted;
  expect(response.status(), await response.text()).toBe(201);
  sittingId = createTestSessionResponseSchema.parse(await response.json()).sitting_document_id;

  // OPEN THE SITTING: Start now walks the teacher onto the class's Live tab with it.
  await page.waitForURL(isLiveTab(classId, sittingId), { timeout: 60_000 });
  await expect(page.locator(`[data-tab-panel="live"][data-session-id="${sittingId}"]`)).toBeVisible();
  await shot(page, '04-1-assignment-open.png');

  // The server holds it: open and running, six digits, this class and this test.
  const row = (await readSessions(request, jwt)).find((entry) => entry.sitting_document_id === sittingId);
  expect(row?.status).toBe('open');
  expect(row?.phase).toBe('running');
  expect(row?.class.document_id).toBe(classId);
  expect(row?.form?.document_id).toBe(chosen.form_document_id);
  const code = row?.code ?? '';
  expect(code).toMatch(/^\d{6}$/);
  expect(runSql(`select status, code from sittings where document_id = '${sittingId}'`)).toBe(`open|${code}`);

  // The ASSIGNED STUDENTS: the monitor lists exactly who sits it — the whole active
  // roster, or the free students the server kept when some were mid-test elsewhere.
  const members = row?.member_student_ids ?? null;
  const expected = members === null ? rosterSize(classId) : members.length;
  const monitor = await readMonitor(request, jwt, sittingId);
  expect(monitor.summary.expected).toBe(expected);
  expect(monitor.students).toHaveLength(expected);
  if (members !== null) {
    expect(monitor.students.map((student) => student.student_document_id).sort()).toEqual([...members].sort());
  }

  // FULL RELOAD: Live sessions re-serves the same sitting, its code and who sits it.
  await page.goto('/dashboard/test-sessions');
  await page.reload();
  const card = page.locator(`[data-slot="live-session-card"][data-sitting-id="${sittingId}"]`);
  await expect(card.locator('[data-slot="live-session-code"]')).toHaveText(code, { timeout: 60_000 });
  await expect(card).toContainText(
    members === null ? tLive('whoWhole', { count: expected }) : tLive('whoSelected', { count: expected }),
  );
  expect(runSql(`select status from sittings where document_id = '${sittingId}'`)).toBe('open');
  await shot(page, '04-2-after-reload-live-sessions.png');
});
