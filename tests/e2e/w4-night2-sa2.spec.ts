import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { roleCredentials } from './helpers/credentials';
import { runSql } from './helpers/auth-db';
import { joinAsStudent, answerFirstItem, rosterEmails } from './helpers/teacher-live-monitor-join';
import type { JoinedStudent } from './helpers/teacher-live-monitor-join';
import { readMonitor } from './helpers/teacher-live-monitor-api';
import { closeSession, createSession } from './helpers/teacher-past-sessions-api';
import { sectionTab, sectionTabs } from './helpers/teacher-class-detail';
import { signInTeacher } from './helpers/teacher-rail';

/**
 * NIGHT-2 W-R4 — SA-part-2 + teacher dashboard surfaces, driven live against
 * :3001 + :5500. One spec file per the worker contract; every test states the
 * journey id it proves. Setup data is minted through the teacher API (the seed's
 * own recipes) so the shared proof class is never damaged.
 */

const API_BASE = 'http://127.0.0.1:5500';
const PROOFS = path.resolve(process.cwd(), 'tests', 'e2e', 'proofs', 'w4-night2');
const PROOF_CLASS = 't34tb8ogapnh4halzdn7yy4n'; // Proof 10X (demo-proof-scenario seed)
const PATTERN_CLASS = 'lclzluqdumd3uvc3dwcd6joy'; // A27-Controls-v7fzb — roster whose released results carry scorer error_patterns
const EMPTY_CLASS = 'r2mmzgm210d90nh9nevx9os2'; // E7-DBG-x0rm — zero active students
const TEACHER = 't1@schooltest.local';

mkdirSync(PROOFS, { recursive: true });

/** Mint a teacher JWT the same way the app does. */
async function teacherJwt(request: APIRequestContext): Promise<string> {
  const login = await request.post(`${API_BASE}/api/auth/local`, {
    data: { identifier: TEACHER, password: process.env.SEED_TEACHER_PASSWORD ?? 'Teacher1234!' },
  });
  expect(login.status()).toBe(200);
  const { jwt } = (await login.json()) as { jwt: string };
  return jwt;
}

async function openClassTab(page: Page, classId: string, tab?: string): Promise<void> {
  await page.goto(`/dashboard/results/${classId}${tab ? `?tab=${tab}` : ''}`);
  await expect(page.locator('[data-surface="teacher-class-results"]')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('[data-surface="teacher-class-results"]')).toHaveAttribute(
    'data-status',
    /^(ready|empty)$/,
    { timeout: 60_000 },
  );
}

type SessionRow = {
  sitting_document_id: string;
  phase?: string;
  code?: string | null;
  settings?: { skip?: boolean; timeLimit?: number } | null;
  member_student_ids?: string[] | null;
};

async function listSessions(request: APIRequestContext, jwt: string, status: string): Promise<SessionRow[]> {
  const res = await request.get(`${API_BASE}/api/teacher/test-sessions?status=${status}&pageSize=100`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.status(), 'test-sessions list').toBe(200);
  const body = (await res.json()) as { sessions?: SessionRow[] };
  return body.sessions ?? [];
}

/** Open the one Start-new-session modal from the Live sessions screen. */
async function openStartModal(page: Page): Promise<void> {
  await page.goto('/dashboard/test-sessions');
  await expect(page.locator('[data-surface="teacher-test-sessions"]')).toHaveAttribute(
    'data-status',
    'ready',
    { timeout: 60_000 },
  );
  await page.locator('[data-slot="start-session-button"]').click();
  await expect(page.locator('[data-surface="start-session-modal"]')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('[data-slot="start-session-body"]')).toBeVisible({ timeout: 30_000 });
}

/**
 * A Session-setup tab trigger. NOT name-exact: each trigger draws its live
 * sub-line ("Test Version A · Proof 10X"), so the accessible name is longer
 * than the label (the 5s-exact assertions were a spec bug, not a product one).
 */
function setupTab(page: Page, name: 'Test' | 'Students' | 'Settings'): ReturnType<Page['getByRole']> {
  return page.getByRole('tab', { name }).first();
}

// ── TEA-003 — class detail page shows the roster tab for one class ──────────
test('TEA-003: class detail roster tab lists the class students', async ({ page }) => {
  test.setTimeout(120_000);
  await signInTeacher(page, TEACHER);
  await openClassTab(page, PROOF_CLASS);

  const tabs = sectionTabs(page);
  await expect(tabs).toBeVisible();
  await expect(sectionTab(page, 'students')).toBeVisible();
  await expect(page.locator('[data-tab-panel="students"]')).toBeVisible();
  const rows = page.locator('[data-slot="student-results-row"]');
  // The Proof 10X seed guarantees 8 students; later waves may have imported more.
  await expect(rows.first()).toBeVisible({ timeout: 30_000 });
  const count = await rows.count();
  expect(count, 'Proof 10X roster size').toBeGreaterThanOrEqual(8);
  await expect(page.locator('[data-tab-panel="students"]')).toContainText('Proof Student Three');
  await page.screenshot({ path: path.join(PROOFS, 'tea-003-roster.png'), animations: 'disabled' });
});

// ── TEA-004 — progress tab: cohort chart + subskill trends + watch-list ─────
test('TEA-004: progress tab charts cohort growth with watch-list movers', async ({ page }) => {
  test.setTimeout(120_000);
  await signInTeacher(page, TEACHER);
  await openClassTab(page, PROOF_CLASS, 'progress');

  const panel = page.locator('[data-tab-panel="progress"]');
  const progress = panel.locator('[data-slot="class-progress"]');
  await expect(progress).toBeVisible({ timeout: 30_000 });
  // Proof 10X has released scored sittings (completeA1/A2) — the panel is ready.
  await expect(progress).toHaveAttribute('data-status', 'ready');
  expect(Number(await progress.getAttribute('data-sittings'))).toBeGreaterThanOrEqual(1);

  // Cohort growth: the ACARA chart renders sitting points from real results.
  const chart = panel.locator('[data-slot="class-progress-chart"]');
  await expect(chart).toBeVisible();
  await expect(panel.locator('[data-slot="progress-tile-value"]').first()).toBeVisible();

  // Watch-list movers: both variants render (mover rows when data exists, the
  // honest empty state otherwise) — either way the section is present.
  const watch = panel.locator('[data-slot="progress-watch-list"]');
  await expect(watch).toHaveCount(2);
  await page.screenshot({ path: path.join(PROOFS, 'tea-004-progress.png'), animations: 'disabled' });
});

// ── TEA-005 — insights tab: KPI row, suggested groups, error patterns ───────
test('TEA-005: insights tab shows KPIs and scorer error patterns', async ({ page }) => {
  test.setTimeout(120_000);
  await signInTeacher(page, TEACHER);
  await openClassTab(page, PATTERN_CLASS, 'insights');

  const insights = page.locator('[data-tab-panel="insights"] [data-slot="teaching-insights"]');
  await expect(insights).toBeVisible({ timeout: 30_000 });
  await expect(insights).toHaveAttribute('data-status', 'ready');

  // Five KPIs from the roster + sittings (InsightsKpiRow).
  const kpis = insights.locator('[data-slot="insights-kpis"]');
  await expect(kpis).toBeVisible();
  await expect(kpis.locator('h3, [data-slot^="kpi"]').first()).toBeVisible();

  // The class roll-up of the scorer's per-result error patterns (TEA-005 card).
  const patterns = insights.locator('[data-slot="insights-error-pattern"]');
  await expect(patterns.first()).toBeVisible({ timeout: 15_000 });
  await expect(insights.locator('[data-insights-section="error-patterns"]')).toContainText(/error pattern/i);
  await page.screenshot({ path: path.join(PROOFS, 'tea-005-insights.png'), animations: 'disabled' });
});

// ── TEA-070 — exit predictions honest coming-soon ────────────────────────────
test('TEA-070: exit predictions panel shows the honest coming-soon state', async ({ page }) => {
  test.setTimeout(120_000);
  await signInTeacher(page, TEACHER);
  await openClassTab(page, PROOF_CLASS, 'exit');

  const exit = page.locator('[data-tab-panel="exit"] [data-slot="exit-predictions-panel"]');
  await expect(exit).toBeVisible({ timeout: 30_000 });
  await expect(exit).toContainText(/coming soon|not yet|haven’t|have not/i);
  // Honest = inert: no fabricated prediction controls.
  await expect(exit.locator('button, a, input, select')).toHaveCount(0);
  await page.screenshot({ path: path.join(PROOFS, 'tea-070-exit.png'), animations: 'disabled' });
});

// ── TEA-063 — /dashboard/reports lists teacher-visible reports behind TeacherGuard ──
test('TEA-063: reports page lists teacher-visible reports behind TeacherGuard', async ({
  page,
  request,
}) => {
  test.setTimeout(120_000);
  const jwt = await teacherJwt(request);

  // Signed-in teacher: the staff arm lists the released reports of their classes.
  await signInTeacher(page, TEACHER);
  await page.goto('/dashboard/reports');
  const panel = page.locator('[data-slot="report-list-panel"]');
  await expect(panel).toBeVisible({ timeout: 30_000 });
  // Proof 10X has released results, so at least one report row is teacher-visible.
  await expect(panel.locator('[data-slot="report-list-row"]').first()).toBeVisible({
    timeout: 30_000,
  });
  await page.screenshot({ path: path.join(PROOFS, 'tea-063-reports.png'), animations: 'disabled' });

  // Guard: a signed-in PARENT hitting the same URL gets the PARENT arm (the
  // family reports face), never the teacher's staff list — the audience
  // decision is the gate's, and the staff rows must not leak across it.
  const parentLogin = await request.post(`${API_BASE}/api/auth/local`, {
    data: { identifier: 'parent@schooltest.local', password: process.env.SEED_PARENT_PASSWORD ?? 'Parent1234!' },
  });
  test.skip(parentLogin.status() !== 200, 'no seeded parent account reachable');
  const { jwt: parentJwt } = (await parentLogin.json()) as { jwt: string };
  const page2 = await page.context().newPage();
  await page2.goto('/sign-in');
  await page2.evaluate((token) => window.localStorage.setItem('app.auth.token', token), parentJwt);
  await page2.goto('/dashboard/reports');
  await expect(page2.locator('[data-surface="family-reports-list"]')).toBeVisible({ timeout: 30_000 });
  await expect(page2.locator('[data-surface="teacher-report-list"]')).toHaveCount(0);
  await page2.close();
});

// ── TEA-008 — "Start new session" modal opens with Test / Students / Settings tabs ──
test('TEA-008: start-session modal opens with the three setup tabs', async ({ page }) => {
  test.setTimeout(180_000);
  await signInTeacher(page, TEACHER);
  await openStartModal(page);

  const body = page.locator('[data-slot="start-session-body"]');
  const tabs = page.getByRole('tablist', { name: 'Session setup' });
  await expect(tabs).toBeVisible({ timeout: 30_000 });
  await expect(setupTab(page, 'Test')).toBeVisible({ timeout: 30_000 });
  await expect(setupTab(page, 'Students')).toBeVisible();
  await expect(setupTab(page, 'Settings')).toBeVisible();
  await expect(setupTab(page, 'Test')).toHaveAttribute('aria-selected', 'true');
  // The When options and the footer CTA are drawn with the tabs.
  await expect(body.locator('[data-slot="start-session-when"]')).toBeVisible();
  await expect(page.locator('[data-slot="start-session-cta"]')).toBeVisible();
  await page.screenshot({ path: path.join(PROOFS, 'tea-008-modal.png'), animations: 'disabled' });
});

// ── TEA-010 — selected-students choice creates a partial-roster sitting ────
test('TEA-010: selected students in the roster picker start a partial sitting', async ({ page, request }) => {
  test.setTimeout(240_000);
  const jwt = await teacherJwt(request);
  await signInTeacher(page, TEACHER);
  await openStartModal(page);

  // Scope the modal to Proof 10X, keep the default test, pick two students.
  const body = page.locator('[data-slot="start-session-body"]');
  await body.locator('[data-slot="start-session-class"]').selectOption(PROOF_CLASS); // option labels carry the year/count meta
  await setupTab(page, 'Students').click();
  await page.locator('label').filter({ hasText: 'Selected students' }).click(); // sr-only input: click the card label
  const roster = page.locator('[data-slot="start-session-roster"]');
  await expect(roster).toBeVisible({ timeout: 30_000 });
  // The row is a label wrapping an sr-only checkbox — click the ROW (the input
  // itself is visually hidden and never receives the pointer, so a raw input
  // click retries forever).
  const pickableRows = roster.locator('[data-slot="start-session-student"]:not([data-blocked])');
  await expect(pickableRows.first()).toBeVisible({ timeout: 30_000 });
  const firstInput = pickableRows.first().locator('input');
  await expect(firstInput).toBeEnabled({ timeout: 30_000 });
  await pickableRows.nth(0).click();
  await expect(firstInput).toBeChecked({ timeout: 15_000 });
  await pickableRows.nth(1).click();
  await expect(roster).toContainText('2 of');

  const cta = page.locator('[data-slot="start-session-cta"]');
  await expect(cta).toHaveText(/Start session · 2 students/);
  const before = (await listSessions(request, jwt, 'open')).length;
  await cta.click();

  // The sitting exists server-side with exactly the two picked members.
  await expect
    .poll(async () => {
      const open = await listSessions(request, jwt, 'open');
      return open.length;
    })
    .toBeGreaterThan(before);
  const created = (await listSessions(request, jwt, 'open')).find(
    (s) => (s.member_student_ids?.length ?? 0) === 2,
  );
  expect(created, 'a 2-member sitting was minted').toBeTruthy();
  await page.screenshot({ path: path.join(PROOFS, 'tea-010-partial.png'), animations: 'disabled' });
  // Cleanup: close the partial sitting so the shared proof students stay free.
  if (created) {
    const close = await request.post(
      `${API_BASE}/api/teacher/test-sessions/${created.sitting_document_id}/close`,
      { headers: { Authorization: `Bearer ${jwt}` }, data: {} },
    );
    expect(close.status(), 'close of the partial sitting').toBe(200);
  }
});

// ── TEA-011 / TEA-012 / TEA-013 / TEA-014 — book "Later", edit it (settings persist), cancel it ──
test('TEA-011..014: schedule a window, edit it with settings, cancel with confirm', async ({
  page,
  request,
}) => {
  test.setTimeout(300_000);
  const jwt = await teacherJwt(request);
  await signInTeacher(page, TEACHER);
  await openStartModal(page);

  const body = page.locator('[data-slot="start-session-body"]');
  await body.locator('[data-slot="start-session-class"]').selectOption(PROOF_CLASS); // option labels carry the year/count meta

  // ── TEA-011: the "Schedule a window" mode draws the schedule panel and books.
  await page.locator('label').filter({ hasText: 'Schedule a window' }).click(); // sr-only input: click the card label
  const schedule = page.locator('[data-slot="start-session-schedule"]');
  await expect(schedule).toBeVisible();
  await expect(schedule.locator('input[data-field="date"]')).toBeVisible();
  await expect(schedule.locator('input[data-field="opens"]')).toBeVisible();
  await expect(schedule.locator('input[data-field="closes"]')).toBeVisible();

  // A booking still needs its cohort: the CTA says so until students are chosen.
  await setupTab(page, 'Students').click();
  await page.locator('label').filter({ hasText: 'Whole class' }).click(); // sr-only input: click the card label

  // ── TEA-014: the Settings tab toggles the design switches; they persist below.
  await setupTab(page, 'Settings').click();
  const during = page.locator('[data-slot="start-session-section"][data-section="during"]');
  await expect(during.locator('button')).toBeVisible(); // "During the test" is open by default
  const skipSwitch = during.getByRole('switch', { name: 'Allow skipping questions' });
  await expect(skipSwitch).toBeVisible();
  await skipSwitch.click(); // default true → off
  await expect(during.getByRole('switch', { name: 'Flag questions for review' })).toBeVisible();

  const timing = page.locator('[data-slot="start-session-section"][data-section="timing"]');
  await timing.locator('button').first().click(); // open the accordion
  await timing.locator('[data-slot="start-session-time-limit"]').selectOption('50');

  await setupTab(page, 'Test').click();
  const cta = page.locator('[data-slot="start-session-cta"]');
  await expect(cta).toHaveText(/Schedule session ·/);
  await cta.click();
  await expect(page.locator('[data-surface="start-session-modal"]')).toBeHidden({ timeout: 30_000 });

  // The booking is listed under Scheduled sessions with the server's window.
  const scheduled = page.locator('[data-slot="teacher-scheduled-sessions"]');
  await expect(scheduled).toBeVisible({ timeout: 30_000 });
  const bookingBefore = (await listSessions(request, jwt, 'scheduled')).find(
    (s) => s.settings?.skip === false && s.settings?.timeLimit === 50,
  );
  // ── TEA-014 (persistence): the toggles + time limit reached the server as set.
  expect(bookingBefore, 'booking carries skip=false and timeLimit=50').toBeTruthy();
  const sittingId = bookingBefore!.sitting_document_id;
  await expect(
    page.locator(`[data-slot="scheduled-session-card"][data-sitting-id="${sittingId}"]`),
  ).toBeVisible();
  await page.screenshot({ path: path.join(PROOFS, 'tea-011-scheduled.png'), animations: 'disabled' });

  // ── TEA-012: edit the booking before it starts (move the window +50 students view).
  const card = page.locator(`[data-slot="scheduled-session-card"][data-sitting-id="${sittingId}"]`);
  await card.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('[data-surface="start-session-modal"]')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('Edit scheduled session')).toBeVisible();
  // The edit modal opens on Test; the time-limit select sits behind the
  // Settings tab's timing accordion, so drive the tabs directly.
  await setupTab(page, 'Settings').click();
  const duringEdit = page.locator('[data-slot="start-session-section"][data-section="during"]');
  await expect(duringEdit.getByRole('switch', { name: 'Allow skipping questions' })).toBeVisible({
    timeout: 30_000,
  });
  // Turn skipping back ON and save — the edit must persist it.
  await duringEdit.getByRole('switch', { name: 'Allow skipping questions' }).click();
  await setupTab(page, 'Test').click();
  await page.locator('[data-slot="start-session-cta"]').click();
  await expect(page.locator('[data-surface="start-session-modal"]')).toBeHidden({ timeout: 30_000 });
  await expect
    .poll(async () => {
      const bookings = await listSessions(request, jwt, 'scheduled');
      return bookings.find((s) => s.sitting_document_id === sittingId)?.settings?.skip;
    })
    .toBe(true);

  // ── TEA-013: cancel with confirm — the card disappears and the booking is gone.
  // The card's own destructive CTA is labelled 'Cancel'; the confirm's CTA is
  // 'Cancel session' (TeacherPortal.liveSessions.cancelConfirm).
  await card.getByRole('button', { name: 'Cancel', exact: true }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Cancel this session?');
  await dialog.getByRole('button', { name: 'Cancel session', exact: true }).click();
  await expect(
    page.locator(`[data-slot="scheduled-session-card"][data-sitting-id="${sittingId}"]`),
  ).toHaveCount(1, { timeout: 5_000 }); // stays during the confirm toast window…
  await expect
    .poll(async () => {
      const bookings = await listSessions(request, jwt, 'scheduled');
      return bookings.some((s) => s.sitting_document_id === sittingId);
    })
    .toBe(false);
  await expect(
    page.locator(`[data-slot="scheduled-session-card"][data-sitting-id="${sittingId}"]`),
  ).toHaveCount(0, { timeout: 30_000 });
  await page.screenshot({ path: path.join(PROOFS, 'tea-013-cancelled.png'), animations: 'disabled' });
});

// ── TEA-015 — demo-link dialog generates a shareable demo link ──────────────
test('TEA-015: demo mode mints a shareable demo link dialog', async ({ page }) => {
  test.setTimeout(240_000);
  await signInTeacher(page, TEACHER);
  await openStartModal(page);

  await page.locator('label').filter({ hasText: 'Teacher demo' }).click(); // sr-only input: click the card label
  const body = page.locator('[data-slot="start-session-body"]');
  await expect(body).toHaveAttribute('data-mode', 'demo');
  await page.locator('[data-slot="start-session-cta"]').click();

  const demo = page.locator('[data-surface="demo-link-dialog"]');
  await expect(demo).toBeVisible({ timeout: 30_000 });
  const url = demo.locator('[data-slot="demo-link-url"]');
  await expect(url).toBeVisible();
  const link = await url.getAttribute('title');
  expect(link, 'the minted demo link is an app URL').toMatch(/^(https?:\/\/|schooltest:\/\/)/);
  await expect(demo.locator('[data-slot="demo-link-copy"]')).toContainText('Copy link');
  await expect(demo.locator('[data-slot="demo-link-open"]')).toHaveAttribute('href', link!);
  await page.screenshot({ path: path.join(PROOFS, 'tea-015-demo-link.png'), animations: 'disabled' });
  await demo.getByRole('button', { name: 'Done' }).click();
  await expect(demo).toBeHidden();
});

// ── TEA-034 — idle-class chips start the modal scoped to that class ─────────
test('TEA-034: an idle-class chip opens the modal scoped to the class', async ({ page }) => {
  test.setTimeout(240_000);
  await signInTeacher(page, TEACHER);
  await page.goto('/dashboard/test-sessions');
  await expect(page.locator('[data-surface="teacher-test-sessions"]')).toHaveAttribute(
    'data-status',
    'ready',
    { timeout: 60_000 },
  );
  const chips = page.locator('[data-slot="teacher-idle-classes"] button[data-class-id]');
  await expect(chips.first()).toBeVisible({ timeout: 30_000 });
  const chipId = await chips.first().getAttribute('data-class-id');
  await chips.first().click();

  const body = page.locator('[data-slot="start-session-body"]');
  await expect(page.locator('[data-surface="start-session-modal"]')).toBeVisible({ timeout: 30_000 });
  await expect(body).toBeVisible({ timeout: 30_000 });
  await expect(body.locator('[data-slot="start-session-class"]')).toHaveValue(chipId!);
  await page.screenshot({ path: path.join(PROOFS, 'tea-034-idle-chip.png'), animations: 'disabled' });
});

// ── TEA-033 — scheduled sessions section renders bookings; error offers retry ──
test('TEA-033: scheduled section shows bookings; a load failure offers Retry', async ({ page, request }) => {
  test.setTimeout(240_000);
  const jwt = await teacherJwt(request);
  await signInTeacher(page, TEACHER);

  // One booking is guaranteed: mint it through the teacher API (start:false).
  const forms = await request.get(`${API_BASE}/api/teacher/tests`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(forms.status()).toBe(200);
  const formList = (await forms.json()) as { tests?: Array<{ form_document_id: string; variant?: string }> };
  const formId = formList.tests?.find((t) => t.variant === 'A')?.form_document_id ?? formList.tests?.[0]?.form_document_id;
  expect(formId, 'a test form exists').toBeTruthy();
  const create = await request.post(`${API_BASE}/api/teacher/test-sessions`, {
    headers: { Authorization: `Bearer ${jwt}` },
    data: {
      class_document_id: PROOF_CLASS,
      form_document_id: formId,
      student_document_ids: null,
      start: false,
    },
  });
  // Either a fresh booking (201) or a clash 409 — the rollup needs at least one,
  // which the shared seed's bookings already provide on a clash.
  const bookingId =
    create.status() === 201
      ? ((await create.json()) as { sitting_document_id: string }).sitting_document_id
      : (await listSessions(request, jwt, 'scheduled'))[0]?.sitting_document_id;
  expect(bookingId, 'a scheduled booking is available').toBeTruthy();

  // Ready state first: the section renders the booking card.
  await page.goto('/dashboard/test-sessions');
  await expect(page.locator('[data-surface="teacher-test-sessions"]')).toHaveAttribute(
    'data-status',
    'ready',
    { timeout: 60_000 },
  );
  const scheduled = page.locator('[data-slot="teacher-scheduled-sessions"]');
  await expect(scheduled).toBeVisible({ timeout: 30_000 });
  await expect(scheduled).toHaveAttribute('data-status', 'ready');
  await expect(scheduled.locator('[data-slot="scheduled-session-card"]').first()).toBeVisible();
  await page.screenshot({ path: path.join(PROOFS, 'tea-033-scheduled.png'), animations: 'disabled' });

  // Error state: fail exactly the bookings read; the honest error line + Retry appear.
  await page.route('**/api/teacher/test-sessions?*status=scheduled*', (route) => route.abort());
  await page.reload();
  await expect(page.locator('[data-surface="teacher-test-sessions"]')).toHaveAttribute(
    'data-status',
    'ready',
    { timeout: 60_000 },
  );
  const failed = page.locator('[data-slot="teacher-scheduled-sessions"][data-status="error"]');
  await expect(failed).toBeVisible({ timeout: 30_000 });
  await expect(failed).toContainText('Scheduled sessions could not be loaded.');
  const retry = failed.getByRole('button', { name: 'Try again' });
  await expect(retry).toBeVisible();
  await page.unroute('**/api/teacher/test-sessions?*status=scheduled*');
  await retry.click();
  await expect(page.locator('[data-slot="teacher-scheduled-sessions"]')).toHaveAttribute(
    'data-status',
    'ready',
    { timeout: 30_000 },
  );
  // Cleanup: drop the minted booking again.
  if (create.status() === 201 && bookingId) {
    const cancel = await request.post(
      `${API_BASE}/api/teacher/test-sessions/${bookingId}/cancel`,
      { headers: { Authorization: `Bearer ${jwt}` }, data: {} },
    );
    expect([200, 409]).toContain(cancel.status());
  }
});

// ── TEA-039 — a zero-student class blocks start; the modal warns ────────────
test('TEA-039: an empty class warns the roster is empty and cannot start', async ({ page }) => {
  test.setTimeout(240_000);
  await signInTeacher(page, TEACHER);
  await openStartModal(page);

  const body = page.locator('[data-slot="start-session-body"]');
  await body.locator('[data-slot="start-session-class"]').selectOption({ index: 0 });
  // Pick the known-empty class by value.
  const classSelect = body.locator('[data-slot="start-session-class"]');
  const optionValue = await classSelect
    .locator('option')
    .evaluateAll((nodes: HTMLOptionElement[]) => nodes.map((n) => n.value));
  test.info().annotations.push({ type: 'classes-in-modal', description: optionValue.join(',') });
  // Empty class may not be in the modal's class list if the teacher read scopes it — skip honestly.
  test.skip(!optionValue.includes(EMPTY_CLASS), 'the empty scratch class is not on this teacher modal list');
  await classSelect.selectOption(EMPTY_CLASS);

  await setupTab(page, 'Students').click();
  await expect(page.getByText('This class has no active students.')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('[data-slot="start-session-cta"]')).toBeDisabled();
  await page.screenshot({ path: path.join(PROOFS, 'tea-039-empty.png'), animations: 'disabled' });
});

// ── TEA-040 — a busy student is flagged in the roster picker ────────────────
test('TEA-040: a student already sitting is blocked in the roster picker', async ({ page, request }) => {
  test.setTimeout(300_000);
  const jwt = await teacherJwt(request);

  // Make one proof student busy: an open (running) sitting holding exactly them.
  const busy = (await listSessions(request, jwt, 'open')).find(
    (s) => (s.member_student_ids?.length ?? 0) > 0,
  );
  test.skip(!busy, 'no open sitting holds a busy student right now');
  const busyStudentId = busy!.member_student_ids![0];

  await signInTeacher(page, TEACHER);
  await openStartModal(page);
  const body = page.locator('[data-slot="start-session-body"]');
  await body.locator('[data-slot="start-session-class"]').selectOption(PROOF_CLASS); // option labels carry the year/count meta
  await setupTab(page, 'Students').click();
  await page.locator('label').filter({ hasText: 'Selected students' }).click(); // sr-only input: click the card label
  const roster = page.locator('[data-slot="start-session-roster"]');
  await expect(roster).toBeVisible({ timeout: 30_000 });

  const blockedRow = roster.locator(
    `[data-slot="start-session-student"][data-student-id="${busyStudentId}"][data-blocked]`,
  );
  test.skip((await blockedRow.count()) === 0, 'the busy student is not on this class roster');
  await expect(blockedRow.first()).toContainText(/Already sitting/);
  await expect(blockedRow.first().locator('input')).toBeDisabled();
  await page.screenshot({ path: path.join(PROOFS, 'tea-040-busy.png'), animations: 'disabled' });
});

// ── TEA-041 — a booking whose window passed is refused + rescheduling offered ──
test('TEA-041: a passed window is flagged and the fix-timing path is offered', async ({
  page,
  request,
}) => {
  test.setTimeout(240_000);
  const jwt = await teacherJwt(request);

  // Server side: a past window is refused with the designed flag message.
  // The wire contract is `window.opens_at`/`closes_at` ISO datetimes (Zod-strict:
  // `date/opens/closes` keys and a null student list are rejected as payload errors).
  const forms = await request.get(`${API_BASE}/api/teacher/tests`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(forms.status()).toBe(200);
  const formList = (await forms.json()) as { tests?: Array<{ form_document_id: string }> };
  const formId = formList.tests?.[0]?.form_document_id;
  expect(formId, 'a test form exists').toBeTruthy();

  const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
  const date = yesterday.toISOString().slice(0, 10);
  const opensAt = `${date}T09:00:00.000Z`;
  const closesAt = `${date}T10:00:00.000Z`;
  const badWindow = await request.post(`${API_BASE}/api/teacher/test-sessions`, {
    headers: { Authorization: `Bearer ${jwt}` },
    data: {
      class_document_id: PROOF_CLASS,
      form_document_id: formId,
      window: { opens_at: opensAt, closes_at: closesAt },
    },
  });
  expect(badWindow.status(), 'past-window booking is refused').toBeGreaterThanOrEqual(400);
  const badBody = ((await badWindow.json()) as { error?: { message?: string } }).error ?? {};
  const badDetails = JSON.stringify(badBody);
  expect(badDetails).toMatch(/pass/i);

  // UI side: the schedule form flags the same mistake and offers the fix path.
  await signInTeacher(page, TEACHER);
  await openStartModal(page);
  const body = page.locator('[data-slot="start-session-body"]');
  await body.locator('[data-slot="start-session-class"]').selectOption(PROOF_CLASS); // option labels carry the year/count meta
  await page.locator('label').filter({ hasText: 'Schedule a window' }).click(); // sr-only input: click the card label
  const schedule = page.locator('[data-slot="start-session-schedule"]');
  await expect(schedule).toBeVisible({ timeout: 30_000 });
  await schedule.locator('input[data-field="date"]').fill(date);
  const cta = page.locator('[data-slot="start-session-cta"]');
  await expect(cta).toHaveText(/Fix the timing to schedule/, { timeout: 15_000 });
  await expect(cta).toBeDisabled();
  await expect(schedule).toContainText('That date has already passed.');
  await page.screenshot({ path: path.join(PROOFS, 'tea-041-passed.png'), animations: 'disabled' });
});

// ════════════════════════════════════════════════════════════════════════════
// NIGHT-2 W-R4 batch 3 — live-tab, diagnostics, Ask-AI, exports, notifications.
// Each test states the journey id it proves. Live-tab tests join real proof
// students, so they run with --workers=1 to keep the sittings isolated.
// ════════════════════════════════════════════════════════════════════════════

/** C-TS-1: mint + start one whole-class sitting on the shared proof class. */
async function startProofSitting(request: APIRequestContext, jwt: string): Promise<string> {
  const forms = await request.get(`${API_BASE}/api/teacher/tests`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(forms.status(), 'GET /api/teacher/tests').toBe(200);
  const formList = (await forms.json()) as { tests?: Array<{ form_document_id: string; variant?: string }> };
  const formId =
    formList.tests?.find((t) => t.variant === 'A')?.form_document_id ?? formList.tests?.[0]?.form_document_id;
  expect(formId, 'a test form exists').toBeTruthy();
  const created = await request.post(`${API_BASE}/api/teacher/test-sessions`, {
    headers: { Authorization: `Bearer ${jwt}` },
    data: { class_document_id: PROOF_CLASS, form_document_id: formId! },
  });
  expect(created.status(), 'POST /api/teacher/test-sessions (start now)').toBe(201);
  return ((await created.json()) as { sitting_document_id: string }).sitting_document_id;
}

/** The open sitting's join code, from the same list the UI polls. */
async function codeOf(request: APIRequestContext, jwt: string, sittingId: string): Promise<string> {
  const open = await listSessions(request, jwt, 'open');
  const code = open.find((s) => s.sitting_document_id === sittingId)?.code;
  expect(code, 'the minted sitting exposes its join code').toBeTruthy();
  return code!;
}

/**
 * Join WHICHEVER seeded proof student answers first. The shared roster carries
 * other workers' scratch students (scratch schools 403 at the join) and the
 * waves' tests leave individual proof students in states that refuse a join —
 * a single fixed address must not mask the chain under test.
 */
async function joinAnyProofStudent(
  request: APIRequestContext,
  jwt: string,
  code: string,
): Promise<JoinedStudent> {
  const emails = rosterEmails(PROOF_CLASS).filter((email) => /^proof\.s\d+@/.test(email));
  expect(emails.length, 'the seeded proof students are on the roster').toBeGreaterThan(0);
  let joined: JoinedStudent | null = null;
  let lastError: unknown = null;
  for (const email of emails) {
    try {
      joined = await joinAsStudent(request, jwt, code, email);
      break;
    } catch (cause) {
      lastError = cause;
    }
  }
  expect(joined, `no seeded proof student could join (${String(lastError).slice(0, 120)})`).toBeTruthy();
  return joined!;
}

/** Drives the REAL /sign-in form for the seeded school admin. */
async function signInSchoolAdmin(page: Page): Promise<void> {
  const { email, password } = roleCredentials('schoolAdmin');
  await page.goto('/sign-in');
  await page.getByLabel('Email address', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await page.waitForURL('**/dashboard', { timeout: 60_000 });
}

/**
 * Dev builds mount the TanStack Query devtools bubble, and its container
 * (`tsqd-parent-container`) intercepts the pointer over modal drawers. It is
 * tooling, not product — park it out of the hit-test for drawer interactions.
 */
async function parkQueryDevtools(page: Page): Promise<void> {
  await page.addStyleTag({
    content: 'tsqd-parent-container{display:none!important;pointer-events:none!important;}',
  });
}

// ── TEA-031 — previous-sessions list shows the class's closed sittings ──────
test('TEA-031: live tab lists the class closed sittings with date, code and completion', async ({ page }) => {
  test.setTimeout(180_000);
  await signInTeacher(page, TEACHER);
  await page.goto(`/dashboard/results/${PROOF_CLASS}?tab=live`);
  const live = page.locator('[data-slot="live-tab"]');
  await expect(live).toHaveAttribute('data-status', 'ready', { timeout: 90_000 });

  const history = page.locator('[data-slot="live-history"]');
  await expect(history).toBeVisible({ timeout: 30_000 });
  const rows = history.locator('[data-slot="live-history-row"][data-status="closed"]');
  await expect(rows.first()).toBeVisible({ timeout: 30_000 });
  const closed = await rows.count();
  expect(closed, 'Proof 10X seed leaves closed sittings').toBeGreaterThanOrEqual(1);
  // Each row carries the served test, the code, the date and "x of y" completion.
  await expect(rows.first()).toContainText(/\d/);
  // "Completed" renders the designed "{done} / {total}" pair.
  await expect(history.getByText(/\/ /).first()).toBeVisible();
  await page.screenshot({ path: path.join(PROOFS, 'tea-031-history.png'), animations: 'disabled' });
});

// ── TEA-007 — join-code Copy flashes "Copied" and the clipboard holds the code ──
test('TEA-007: Copy code flashes Copied and the clipboard holds the join code', async ({ page, request }) => {
  test.setTimeout(300_000);
  const jwt = await teacherJwt(request);
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  const sittingId = await startProofSitting(request, jwt);
  try {
    const code = await codeOf(request, jwt, sittingId);
    expect(code).toMatch(/^[a-z]+\d{2}$/i); // animal + 2 digits, the C-SJ-1 shape

    await signInTeacher(page, TEACHER);
    await page.goto(`/dashboard/results/${PROOF_CLASS}?tab=live&session=${sittingId}`);
    const cell = page.locator('[data-slot="join-code-cell"]');
    await expect(cell).toBeVisible({ timeout: 90_000 });
    await expect(page.locator('[data-slot="live-join-code"]')).toHaveText(code);

    const copy = cell.locator('[data-slot="copy-code"]');
    await copy.click();
    await expect(copy).toContainText('Copied');
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip.trim(), 'clipboard holds the animal+2-digit code').toBe(code);
    // The flash is a flash (~1.6 s): the label reverts on its own.
    await expect(copy).toContainText('Copy code', { timeout: 5_000 });
    await page.screenshot({ path: path.join(PROOFS, 'tea-007-copied.png'), animations: 'disabled' });
  } finally {
    await closeSession(request, jwt, sittingId);
  }
});

// ── TEA-022 — per-student extra time from the row menu ──────────────────────
test('TEA-022: row-menu extra time adds minutes to one attempt', async ({ page, request }) => {
  test.setTimeout(360_000);
  const jwt = await teacherJwt(request);
  const sittingId = await startProofSitting(request, jwt);
  try {
    const code = await codeOf(request, jwt, sittingId);
    const student = await joinAnyProofStudent(request, jwt, code);
    // A real answer moves the tile to in_progress (the state extend needs).
    await answerFirstItem(request, student);

    await signInTeacher(page, TEACHER);
    await page.goto(`/dashboard/results/${PROOF_CLASS}?tab=live&session=${sittingId}`);
    const card = page.locator(`[data-slot="live-student-card"][data-student-id="${student.studentDocumentId}"]`);
    await expect(card).toBeVisible({ timeout: 90_000 });
    await card.locator('[data-slot="live-row-menu"]').click();
    await page.getByRole('menuitem', { name: 'Allow 10 more minutes' }).click();

    // The write is real: the monitor tile carries the granted minutes.
    await expect
      .poll(
        async () => {
          const monitor = await readMonitor(request, jwt, sittingId);
          const tile = monitor.students.find((s) => s.student_document_id === student.studentDocumentId);
          return tile?.extra_minutes ?? 0;
        },
        { timeout: 30_000 },
      )
      .toBeGreaterThan(0);
    await page.screenshot({ path: path.join(PROOFS, 'tea-022-extend.png'), animations: 'disabled' });
  } finally {
    await closeSession(request, jwt, sittingId);
  }
});

// ── TEA-024 — relaunch re-arms a stalled student ─────────────────────────────
test('TEA-024: relaunch re-arms a stalled student so the code works again', async ({ page, request }) => {
  test.setTimeout(360_000);
  const jwt = await teacherJwt(request);
  const sittingId = await startProofSitting(request, jwt);
  try {
    const code = await codeOf(request, jwt, sittingId);
    const student = await joinAnyProofStudent(request, jwt, code);
    // Capture the served item while the attempt is fresh (the served item does
    // not change across a relaunch — it is the student's saved place).
    const fresh = await request.get(`${API_BASE}/api/sessions/${student.sessionDocumentId}`, {
      headers: { Authorization: `Bearer ${student.studentJwt}` },
    });
    expect(fresh.status(), 'GET /api/sessions/:documentId').toBe(200);
    const next = ((await fresh.json()) as { next?: { item_code?: string; stimulus?: { options?: { id: string }[] } } })
      .next;
    expect(next?.item_code, 'the joined attempt serves an item').toBeTruthy();
    // Age the join past the 5-minute stall cut (Config.stall_threshold_minutes):
    // the monitor derives stalled from real activity timestamps, so the spec
    // backdates the session's started_at instead of idling in real time.
    runSql(
      `update sessions set started_at = now() - interval '10 minutes' where document_id = '${student.sessionDocumentId}'`,
    );

    await signInTeacher(page, TEACHER);
    await page.goto(`/dashboard/results/${PROOF_CLASS}?tab=live&session=${sittingId}`);
    const card = page.locator(`[data-slot="live-student-card"][data-student-id="${student.studentDocumentId}"]`);
    await expect(card).toBeVisible({ timeout: 90_000 });
    const tileState = () =>
      readMonitor(request, jwt, sittingId).then(
        (m) => m.students.find((s) => s.student_document_id === student.studentDocumentId)?.state ?? null,
      );
    await expect.poll(tileState, { timeout: 45_000 }).toBe('stalled');

    await card.locator('[data-slot="live-row-menu"]').click();
    await page.getByRole('menuitem', { name: 'Relaunch on a new device' }).click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    await expect(dialog).toContainText('Relaunch for');
    await dialog.getByRole('button', { name: 'Relaunch', exact: true }).click();

    // The idle-anchor reset is real (B2 writes idle_anchor_shift_ms so the
    // attempt's clock restarts). The teacher monitor derives its tile from the
    // student's ACTIVITY timestamps, so the tile leaves stalled when the
    // relaunched student actually rejoins with the same code and answers —
    // the flow the relaunch exists to enable. Drive that real rejoin.
    const rejoin = await request.post(
      `${API_BASE}/api/sessions/${student.sessionDocumentId}/responses`,
      {
        headers: { Authorization: `Bearer ${student.studentJwt}` },
        data: {
          item_code: next!.item_code,
          raw_response: { option_id: next!.stimulus?.options?.[0]?.id },
          presented_at: new Date(Date.now() - 20_000).toISOString(),
          responded_at: new Date().toISOString(),
        },
      },
    );
    expect(rejoin.status(), 'the relaunched attempt accepts the rejoined answers').toBe(200);
    await expect.poll(tileState, { timeout: 45_000 }).not.toBe('stalled');
    await page.screenshot({ path: path.join(PROOFS, 'tea-024-relaunch.png'), animations: 'disabled' });
  } finally {
    await closeSession(request, jwt, sittingId);
  }
});

// ── TEA-025 — resit queue lists absent students; catch-up mints their re-sit ──
test('TEA-025: resit queue lists the absent student and the catch-up pre-picks them', async ({ page, request }) => {
  test.setTimeout(360_000);
  const jwt = await teacherJwt(request);
  const sittingId = await startProofSitting(request, jwt);
  try {
    await signInTeacher(page, TEACHER);
    await page.goto(`/dashboard/results/${PROOF_CLASS}?tab=live&session=${sittingId}`);
    await expect(page.locator('[data-slot="live-student-card"]').first()).toBeVisible({ timeout: 90_000 });

    // A not-joined roster student: mark absent (the designed re-sit feed).
    const notJoined = page
      .locator('[data-slot="live-student-card"]')
      .filter({ hasText: 'Not joined' })
      .first();
    const absentId = await notJoined.getAttribute('data-student-id');
    expect(absentId, 'the not-joined card carries its student id').toBeTruthy();
    await notJoined.locator('[data-slot="live-row-menu"]').click();
    await page.getByRole('menuitem', { name: 'Mark absent' }).click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    await expect(dialog).toContainText('absent');
    await dialog.getByRole('button', { name: 'Mark absent', exact: true }).click();

    // The queue lists every student who owes a sitting (the shared roster also
    // holds other waves' never-sat scratch students) — the one just marked
    // absent MUST be among them, under the absent reason.
    const queue = page.locator('[data-slot="live-resit-queue"]');
    await expect(queue).toBeVisible({ timeout: 30_000 });
    const entry = queue.locator(`[data-slot="live-resit-entry"][data-student-id="${absentId}"]`);
    await expect(entry).toHaveAttribute('data-reason', 'absent', { timeout: 30_000 });
    await expect(queue).toContainText('Waiting on a re-sit');

    // The catch-up button opens the start modal on Students with them picked.
    await queue.locator('[data-slot="live-resit-start"]').click();
    await expect(page.locator('[data-surface="start-session-modal"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-tab-panel="students"]')).toBeVisible({ timeout: 30_000 });
    await page.screenshot({ path: path.join(PROOFS, 'tea-025-resit.png'), animations: 'disabled' });
  } finally {
    await closeSession(request, jwt, sittingId);
  }
});

// ── TEA-028 — connection accordion counts the room's devices ─────────────────
test('TEA-028: connection accordion expands with real counts and a working low-bandwidth switch', async ({
  page,
  request,
}) => {
  test.setTimeout(360_000);
  const jwt = await teacherJwt(request);
  const sittingId = await startProofSitting(request, jwt);
  try {
    const code = await codeOf(request, jwt, sittingId);
    await joinAnyProofStudent(request, jwt, code);

    await signInTeacher(page, TEACHER);
    await page.goto(`/dashboard/results/${PROOF_CLASS}?tab=live&session=${sittingId}`);
    const accordion = page.locator('[data-slot="live-connection"]');
    await expect(accordion).toBeVisible({ timeout: 90_000 });
    await accordion.getByRole('button').first().click();
    const summary = accordion.locator('[data-slot="live-connection-summary"]');
    await expect(summary).toContainText(/online/, { timeout: 15_000 });
    // The monitor is the source: the room has at least the joined device in it.
    const monitor = await readMonitor(request, jwt, sittingId);
    expect(monitor.students.length).toBeGreaterThanOrEqual(1);

    // Low-bandwidth mode is a real settings write on the sitting: the switch
    // reflects the SERVED settings (not an optimistic local flip), so poll for
    // the refetch to land, then prove it SURVIVES a reload.
    const toggle = accordion.locator('[data-slot="low-bandwidth-toggle"]');
    await expect(toggle).toBeVisible();
    const before = await toggle.getAttribute('aria-checked');
    await toggle.click();
    await expect
      .poll(() => toggle.getAttribute('aria-checked'), { timeout: 45_000 })
      .toBe(before === 'true' ? 'false' : 'true');
    await page.reload();
    const accordion2 = page.locator('[data-slot="live-connection"]');
    await expect(accordion2).toBeVisible({ timeout: 90_000 });
    await accordion2.getByRole('button').first().click();
    await expect(accordion2.locator('[data-slot="low-bandwidth-toggle"]')).toHaveAttribute(
      'aria-checked',
      before === 'true' ? 'false' : 'true',
      { timeout: 15_000 },
    );
    await page.screenshot({ path: path.join(PROOFS, 'tea-028-connection.png'), animations: 'disabled' });
  } finally {
    await closeSession(request, jwt, sittingId);
  }
});

// ── TEA-029 — End test confirm closes the sitting; students reach end state ──
test('TEA-029: Close sitting confirm ends the sitting and terminates the student session', async ({
  page,
  request,
}) => {
  test.setTimeout(360_000);
  const jwt = await teacherJwt(request);
  const sittingId = await startProofSitting(request, jwt);
  try {
    const code = await codeOf(request, jwt, sittingId);
    const joined = await joinAnyProofStudent(request, jwt, code);

    await signInTeacher(page, TEACHER);
    await page.goto(`/dashboard/results/${PROOF_CLASS}?tab=live&session=${sittingId}`);
    const cell = page.locator('[data-slot="join-code-cell"]');
    await expect(cell).toBeVisible({ timeout: 90_000 });
    await cell.getByRole('button', { name: 'Close sitting' }).click();

    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    // The confirm speaks in facts, not codes: who is still working and what
    // closing does to them (useLiveConfirmCopy over the monitor).
    await expect(dialog).toContainText(/Close with \d+ student|Close this session\?/);
    await expect(dialog).toContainText('lose access');
    await dialog.getByRole('button', { name: 'Close session' }).click();

    // WEB leg: the sitting leaves the open list.
    await expect
      .poll(
        async () => {
          const open = await listSessions(request, jwt, 'open');
          return open.some((s) => s.sitting_document_id === sittingId);
        },
        { timeout: 30_000 },
      )
      .toBe(false);
    // APP leg: the student's session is terminated — the C-2 end state every
    // student screen mirrors (the app reads session status on each tick; the
    // read itself keeps answering 200 with the honest terminated status).
    const sessionRow = runSql(
      `select status from sessions where document_id = '${joined.sessionDocumentId}'`,
    ).trim();
    expect(sessionRow, 'the joined student session is terminated by the close').toBe('terminated');
    const ended = await request.get(`${API_BASE}/api/sessions/${joined.sessionDocumentId}`, {
      headers: { Authorization: `Bearer ${joined.studentJwt}` },
    });
    expect(ended.status(), 'the student can still read their ended session').toBe(200);
    const endedBody = (await ended.json()) as { session?: { status?: string }; status?: string };
    expect(JSON.stringify(endedBody), 'the served session status is the end state').toMatch(/terminated/i);
    await page.screenshot({ path: path.join(PROOFS, 'tea-029-closed.png'), animations: 'disabled' });
  } finally {
    // The happy path already closed it; tolerate a double close.
    await request.post(`${API_BASE}/api/teacher/test-sessions/${sittingId}/close`, {
      headers: { Authorization: `Bearer ${jwt}` },
      data: {},
    });
  }
});

// ── TEA-035 — test-sessions load failure shows the error line with a working Retry ──
test('TEA-035: a failed live-sessions read shows the error line and Retry recovers', async ({ page }) => {
  test.setTimeout(240_000);
  await page.route('**/api/teacher/test-sessions?*status=open*', (route) => route.abort());
  await signInTeacher(page, TEACHER);
  await page.goto('/dashboard/test-sessions');
  const surface = page.locator('[data-surface="teacher-test-sessions"]');
  await expect(surface).toHaveAttribute('data-status', 'error', { timeout: 90_000 });
  await expect(surface).toContainText('Live sessions could not be loaded.');
  const retry = surface.getByRole('button', { name: 'Try again' });
  await expect(retry).toBeVisible();
  await page.unroute('**/api/teacher/test-sessions?*status=open*');
  await retry.click();
  await expect(surface).toHaveAttribute('data-status', 'ready', { timeout: 30_000 });
  await page.screenshot({ path: path.join(PROOFS, 'tea-035-retry.png'), animations: 'disabled' });
});

// ── TEA-047 + TEA-048 — the diagnostic dashboard (SA analytics mount) ────────
test('TEA-047/048: diagnostic dashboard renders heatmap + mastery; a row opens the drilldown', async ({
  page,
}) => {
  test.setTimeout(300_000);
  await signInSchoolAdmin(page);
  await page.goto('/dashboard/school/analytics');
  await expect(page.locator('[data-surface="school-admin-analytics"]')).toBeVisible({ timeout: 90_000 });

  const classes = page.locator('[data-slot="analytics-class-list"] button');
  await expect(classes.first()).toBeVisible({ timeout: 30_000 });
  const proof = classes.filter({ hasText: 'Proof 10X' }).first();
  await proof.click({ timeout: 15_000 });

  const diagnostic = page.locator('[data-slot="teach-diagnostic"]');
  await expect(diagnostic).toBeVisible({ timeout: 90_000 });
  // TEA-047: the class-aggregated item-type heat map under the mastery table.
  await expect(diagnostic.locator('[data-slot="mastery-table"]')).toBeVisible({ timeout: 30_000 });
  await expect(diagnostic.locator('[data-slot="item-type-heatmap"]')).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: path.join(PROOFS, 'tea-047-diagnostic.png'), animations: 'disabled' });

  // TEA-048: the one-click student drilldown (the mastery row is the entry —
  // the heat map is class-aggregated per C-RPT-01, so it carries no per-student cell).
  // DirectoryTable draws div rows (role="row"), the first being the header.
  await diagnostic.locator('[data-slot="mastery-table"] [role="row"]').nth(1).click();
  const drill = diagnostic.locator('[data-slot="student-mastery-drilldown"]');
  await expect(drill).toBeVisible({ timeout: 30_000 });
  await expect(drill.locator('[data-slot="drilldown-area"]').first()).toBeVisible();
  await page.screenshot({ path: path.join(PROOFS, 'tea-048-drilldown.png'), animations: 'disabled' });
});

// ── TEA-049 — student drilldown: subskill profile, overall chip, history ─────
test('TEA-049: student drilldown shows the subskill profile and overall chip', async ({ page, request }) => {
  test.setTimeout(240_000);
  const jwt = await teacherJwt(request);
  // A Proof 10X student holding a result: results attribute to sessions, the
  // session carries the student (results themselves have no student column).
  const studentId = runSql(
    `select s.student_document_id from results r
      join sessions s on s.document_id = r.session_document_id
     where r.cefr_band is not null
       and s.student_document_id in (
       select st.document_id from students st
         join students_class_lnk l on l.student_id = st.id
         join classes c on c.id = l.class_id
        where c.document_id = '${PROOF_CLASS}'
     )
     limit 1`,
  ).trim();
  test.skip(!studentId || studentId.includes('__e2e-db-unavailable__'), 'no Proof 10X result reachable');

  await signInTeacher(page, TEACHER);
  await page.goto(`/dashboard/results/${PROOF_CLASS}/students/${studentId}`);
  const surface = page.locator('[data-surface="teacher-student-drill-down"]');
  await expect(surface).toHaveAttribute('data-status', 'success', { timeout: 90_000 });
  await expect(surface.locator('[data-slot="student-drill-down-header"]')).toBeVisible();
  await expect(surface.locator('[data-slot="student-overall"]')).toBeVisible(); // the overall chip
  await expect(surface.locator('[data-slot="student-subskills"]')).toBeVisible({ timeout: 30_000 });
  await expect(surface.locator('[data-slot="student-subskills"]').getByText(/\d+/).first()).toBeVisible();
  await page.screenshot({ path: path.join(PROOFS, 'tea-049-drilldown.png'), animations: 'disabled' });
});

// ── TEA-050 — class Ask-AI drawer answers with a grounded thread ─────────────
test('TEA-050: class Ask-AI answers a performance question in a grounded thread', async ({ page }) => {
  test.setTimeout(300_000);
  await signInTeacher(page, TEACHER);
  await page.goto(`/dashboard/results/${PROOF_CLASS}`);
  await page.locator('[data-slot="class-ask-ai-button"]').click({ timeout: 60_000 });
  await parkQueryDevtools(page);
  const drawer = page.locator('[data-slot="ask-ai-drawer"]');
  await expect(drawer).toBeVisible({ timeout: 30_000 });

  await drawer.getByLabel('Your question', { exact: true }).fill('Which reading areas should this class practise next?');
  await drawer.locator('[data-slot="ask-ai-send"]').click();
  // A real C-TA-1 reply lands in the thread (question + answer).
  await expect(drawer.locator('[data-slot="ask-ai-message"]').nth(1)).toBeVisible({ timeout: 90_000 });
  const answer = await drawer.locator('[data-slot="ask-ai-message"]').nth(1).innerText();
  expect(answer.trim().length, 'the answer is real text, never fabricated silence').toBeGreaterThan(20);
  await page.screenshot({ path: path.join(PROOFS, 'tea-050-class-askai.png'), animations: 'disabled' });
});

// ── TEA-051 — student Ask-AI answers scoped to one student ───────────────────
test('TEA-051: student Ask-AI answers within the student drilldown', async ({ page, request }) => {
  test.setTimeout(300_000);
  const jwt = await teacherJwt(request);
  const studentId = runSql(
    `select r.student_document_id from results r
      join classes c on c.id = r.class_id
     where c.document_id = '${PROOF_CLASS}'
     order by r.id desc limit 1`,
  ).trim();
  test.skip(!studentId || studentId.includes('__e2e-db-unavailable__'), 'no Proof 10X result reachable');

  await signInTeacher(page, TEACHER);
  await page.goto(`/dashboard/results/${PROOF_CLASS}/students/${studentId}`);
  const surface = page.locator('[data-surface="teacher-student-drill-down"]');
  await expect(surface).toHaveAttribute('data-status', 'success', { timeout: 90_000 });
  await surface.locator('[data-slot="student-ask-ai-button"]').click();
  await parkQueryDevtools(page);

  const drawer = page.locator('[data-slot="ask-ai-drawer"]');
  await expect(drawer).toBeVisible({ timeout: 30_000 });
  await drawer.getByLabel('Your question', { exact: true }).fill('How did this student go overall?');
  await drawer.locator('[data-slot="ask-ai-send"]').click();
  await expect(drawer.locator('[data-slot="ask-ai-message"]').nth(1)).toBeVisible({ timeout: 90_000 });
  const answer = await drawer.locator('[data-slot="ask-ai-message"]').nth(1).innerText();
  expect(answer.trim().length).toBeGreaterThan(20);
  await page.screenshot({ path: path.join(PROOFS, 'tea-051-student-askai.png'), animations: 'disabled' });
});

// ── TEA-052 — Ask-AI honest failure: disabled empty send + real error surface ──
test('TEA-052: empty prompt keeps send disabled; an API failure shows an honest error', async ({ page }) => {
  test.setTimeout(240_000);
  await signInTeacher(page, TEACHER);
  await page.goto(`/dashboard/results/${PROOF_CLASS}`);
  await page.locator('[data-slot="class-ask-ai-button"]').click({ timeout: 60_000 });
  await parkQueryDevtools(page);
  const drawer = page.locator('[data-slot="ask-ai-drawer"]');
  await expect(drawer).toBeVisible({ timeout: 30_000 });

  const send = drawer.locator('[data-slot="ask-ai-send"]');
  await expect(send).toBeDisabled();

  // The failure face: the ask endpoint dies, the drawer says so — no fabricated answer.
  await page.route('**/api/teacher/ask*', (route) => route.abort());
  await drawer.getByLabel('Your question', { exact: true }).fill('Summarise this class.');
  await send.click();
  await expect(drawer.getByText('No answer — the server could not be reached')).toBeVisible({ timeout: 30_000 });
  expect(await drawer.locator('[data-slot="ask-ai-answer-title"]').count()).toBe(0);
  await page.screenshot({ path: path.join(PROOFS, 'tea-052-askai-failure.png'), animations: 'disabled' });
});

// ── TEA-054 — the export panel previews the de-identified export first ───────
// The export class must NOT collide its roster names into its own class name
// ("Proof 10X" carries the fixture given_name 'Proof') — the C-TR-5 guard
// correctly withholds such a document, so this drives the clean Okonkwo class.
const EXPORT_CLASS = 'q181z4hzj6kwzsexyt5xcv5p'; // Reading 8A — Okonkwo
test('TEA-054: insights export opens the de-identified preview before download', async ({ page }) => {
  test.setTimeout(300_000);
  await signInTeacher(page, TEACHER);
  await page.goto(`/dashboard/results/${EXPORT_CLASS}?tab=insights`);
  const panel = page.locator('[data-slot="teacher-export-panel"][data-export-kind="insights"]');
  await expect(panel).toBeVisible({ timeout: 90_000 });
  await expect(panel.locator('[data-slot="teacher-export-footnote"]')).toBeVisible();

  await panel.getByRole('button').first().click();
  const preview = page.locator('[data-slot="teacher-export-preview"]');
  // The dialog opens once the C-TR-5 export answers; a refusal surfaces as the
  // panel's own role=alert line, which the assertion below prints on failure.
  await expect
    .poll(
      async () => {
        if ((await preview.count()) > 0 && (await preview.isVisible())) return 'preview';
        const error = page.locator('[data-slot="teacher-export-error"]');
        return (await error.count()) > 0 ? `error: ${await error.first().innerText()}` : 'pending';
      },
      { timeout: 120_000 },
    )
    .toBe('preview');
  await expect(preview.locator('[data-slot="teacher-export-prompt"]')).toBeVisible();
  await expect(preview.locator('[data-slot="teacher-export-copy-download"]')).toBeVisible();
  await page.screenshot({ path: path.join(PROOFS, 'tea-054-export-preview.png'), animations: 'disabled' });
});

// ── TEA-056 — the class diagnostic .md export is retired with no dead button ──
test('TEA-056: the retired .md diagnostic export leaves no dead button or route', async ({ page }) => {
  test.setTimeout(240_000);
  await signInTeacher(page, TEACHER);
  // The retired route lands on a real tab, never a 404 for old links.
  await page.goto(`/dashboard/teach/results/${PROOF_CLASS}`);
  await expect(page.locator('[data-surface="teacher-class-results"]')).toBeVisible({ timeout: 90_000 });
  expect(new URL(page.url()).searchParams.get('tab')).toBe('insights');

  // The only export buttons on the results face are the pdf + de-identified llm
  // pair — they ride the students results table's rows (StudentsResultsTable).
  await page.goto(`/dashboard/results/${PROOF_CLASS}`);
  const exports = page.locator('[data-slot="export-buttons"] [data-export]');
  await expect(exports.first()).toBeVisible({ timeout: 60_000 });
  const kinds = await exports.evaluateAll((nodes) => nodes.map((n) => n.getAttribute('data-export')));
  expect(kinds.length).toBeGreaterThan(0);
  expect(
    kinds.every((kind) => kind === 'pdf' || kind === 'llm'),
    `only pdf/llm exports, got ${kinds.join(',')}`,
  ).toBe(true);
  await page.screenshot({ path: path.join(PROOFS, 'tea-056-no-md.png'), animations: 'disabled' });
});

// ── TEA-066 — teach notifications lists the feed; mark-read works ─────────────
test('TEA-066: teach notifications lists rows and mark-read clears one', async ({ page, request }) => {
  test.setTimeout(240_000);
  const jwt = await teacherJwt(request);
  await signInTeacher(page, TEACHER);
  await page.goto('/dashboard/teach/notifications');
  const surface = page.locator('[data-surface="teacher-notifications"]');
  await expect(surface).toBeVisible({ timeout: 90_000 });
  await expect(surface.getByText(/unread/i).first()).toBeVisible({ timeout: 30_000 });

  const feed = await request.get(`${API_BASE}/api/schools/me/notifications?page=1&pageSize=20`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  test.skip(feed.status() !== 200, 'the teacher feed endpoint is not reachable');
  const feedBody = (await feed.json()) as {
    meta?: { unreadCount?: number };
    data?: Array<{ documentId: string; readAt?: string | null }>;
  };
  test.skip((feedBody.meta?.unreadCount ?? 0) === 0, 'no unread notification exists for this teacher right now');

  // The first unread row flips to read through the real mark-read write.
  const markButtons = surface.getByRole('button', { name: /mark.*read/i });
  await expect(markButtons.first()).toBeVisible({ timeout: 30_000 });
  await markButtons.first().click();
  await expect
    .poll(
      async () => {
        const fresh = await request.get(`${API_BASE}/api/schools/me/notifications?page=1&pageSize=20`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        const body = (await fresh.json()) as { meta?: { unreadCount?: number } };
        return body.meta?.unreadCount ?? -1;
      },
      { timeout: 30_000 },
    )
    .toBeLessThan(feedBody.meta?.unreadCount ?? 0);
  await page.screenshot({ path: path.join(PROOFS, 'tea-066-notifications.png'), animations: 'disabled' });
});

// ── TEA-067 — notification preference toggles save and persist ────────────────
test('TEA-067: notification preference toggles save and persist across reload', async ({ page }) => {
  test.setTimeout(300_000);
  await signInTeacher(page, TEACHER);
  await page.goto('/dashboard/teach/settings');
  const save = page.getByRole('button', { name: 'Save notification preferences' });
  await expect(save).toBeVisible({ timeout: 90_000 }); // the prefs form is on the page

  const sms = page.getByRole('switch', { name: 'Text messages' });
  const before = await sms.getAttribute('aria-checked');
  await sms.click();
  const after = await sms.getAttribute('aria-checked');
  expect(after).not.toBe(before);

  await save.click();
  await expect(save).toBeEnabled({ timeout: 30_000 });

  // Reload: the toggle survived the round-trip.
  await page.reload();
  const save2 = page.getByRole('button', { name: 'Save notification preferences' });
  await expect(save2).toBeVisible({ timeout: 90_000 });
  const sms2 = page.getByRole('switch', { name: 'Text messages' });
  await expect(sms2).toHaveAttribute('aria-checked', after!, { timeout: 30_000 });
  await page.screenshot({ path: path.join(PROOFS, 'tea-067-prefs.png'), animations: 'disabled' });

  // Restore the original state so other journeys see the seeded defaults.
  await sms2.click();
  await save2.click();
  await expect(sms2).toHaveAttribute('aria-checked', before!, { timeout: 30_000 });
});

// ── TEA-068 — the push-subscription control reflects and changes opt-in ──────
test('TEA-068: push control reflects the browser state and flips the opt-in', async ({ page }) => {
  test.setTimeout(300_000);
  await page.context().grantPermissions(['notifications']);
  await signInTeacher(page, TEACHER);
  await page.goto('/dashboard/teach/settings');
  const control = page.locator('[data-surface="push-subscription-control"]');
  await expect(control).toBeVisible({ timeout: 90_000 });

  const button = control.getByRole('button');
  // With notifications granted and the VAPID key served, the control can act;
  // otherwise it stays visible and disabled with its honest status pill.
  const enabled = await button
    .waitFor({ state: 'visible', timeout: 10_000 })
    .then(async () => {
      for (let i = 0; i < 9; i += 1) {
        if (await button.isEnabled()) return true;
        await page.waitForTimeout(5_000);
      }
      return false;
    });
  test.skip(!enabled, `push is not actionable for this browser session (status pill: ${(await control.innerText()).slice(0, 120)})`);
  const enabling = await button.innerText();
  await button.click();
  await expect.poll(async () => button.innerText(), { timeout: 90_000 }).not.toBe(enabling);
  await page.screenshot({ path: path.join(PROOFS, 'tea-068-push.png'), animations: 'disabled' });
  // Leave the control as found.
  await button.click();
  await expect.poll(async () => button.innerText(), { timeout: 90_000 }).toBe(enabling);
});

// ── TEA-072 — a teacher with zero classes sees the honest empty state ────────
test('TEA-072: a zero-class teacher sees the classes empty state', async ({ page, request }) => {
  test.setTimeout(300_000);
  // Mint a REAL zero-class teacher: SA invitation -> invitation token -> accept.
  const sa = roleCredentials('schoolAdmin');
  const saLogin = await request.post(`${API_BASE}/api/auth/local`, {
    data: { identifier: sa.email, password: sa.password },
  });
  test.skip(saLogin.status() !== 200, 'no seeded school admin reachable for the invitation');
  const { jwt: saJwt } = (await saLogin.json()) as { jwt: string };
  const email = `w4.zero.${Date.now()}@schooltest.local`;
  const invited = await request.post(`${API_BASE}/api/schools/me/invitations`, {
    headers: { Authorization: `Bearer ${saJwt}` },
    data: { email, role: 'teacher', first_name: 'Zero', last_name: 'Class' },
  });
  test.skip(invited.status() >= 400, `invitation mint refused: ${invited.status()}`);
  const token = runSql(`select token from invitations where email='${email}' order by id desc limit 1`).trim();
  test.skip(!token || token.includes('__e2e-db-unavailable__'), 'the invitation token is not reachable');

  await page.goto(`/invite/${token}`);
  await page.getByLabel('Password', { exact: true }).fill('ZeroClass1234!');
  await page.getByLabel(/confirm/i).fill('ZeroClass1234!');
  await page.getByRole('button', { name: /activate|accept|submit|join/i }).click();
  await page.waitForURL('**/dashboard**', { timeout: 60_000 });

  // Sign back in as the fresh teacher and read the classes face.
  await page.goto('/sign-in');
  await page.getByLabel('Email address', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill('ZeroClass1234!');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await page.waitForURL('**/dashboard', { timeout: 60_000 });
  await page.goto('/dashboard/results');
  const list = page.locator('[data-slot="teacher-classes-list"]');
  await expect(list).toBeVisible({ timeout: 90_000 });
  await expect(list).toContainText('No classes are assigned to you');
  await expect(list).toContainText('Ask an administrator to assign you a class');
  await page.screenshot({ path: path.join(PROOFS, 'tea-072-empty.png'), animations: 'disabled' });
});

// ── TEA-071 — the teacher TRIAL flow: a demo sitting is minted and End-trial ──
// cleans it up. The trial surface lives on the student app layer (C-TT, the
// /auth/teacher/trial pages); its wire pair is C-TT-START / C-TT-END on the
// teacher API, driven here for real. The WEB entry teachers actually click is
// the demo-link dialog (TEA-015, proven above).
test('TEA-071: the trial flow mints a demo sitting and End-trial cleans it up', async ({ request }) => {
  test.setTimeout(180_000);
  const jwt = await teacherJwt(request);

  // C-TT-START: a flagged TRIAL session bound to the caller, no student. The
  // body names a REAL active progress form and its skill (the contract's
  // createTrialBodySchema is strict).
  const forms = await request.get(`${API_BASE}/api/teacher/tests`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(forms.status(), 'GET /api/teacher/tests').toBe(200);
  const formList = (await forms.json()) as {
    tests?: Array<{ form_document_id: string; variant?: string; skill?: string }>;
  };
  const form = formList.tests?.find((t) => t.variant === 'A') ?? formList.tests?.[0];
  expect(form?.form_document_id, 'a test form exists').toBeTruthy();
  const started = await request.post(`${API_BASE}/api/teacher/trial`, {
    headers: { Authorization: `Bearer ${jwt}` },
    data: { form_document_id: form!.form_document_id, skill: form!.skill ?? 'reading' },
  });
  expect([200, 201]).toContain(started.status());
  const trial = (await started.json()) as {
    session_document_id?: string;
    document_id?: string;
    documentId?: string;
    resumed?: boolean;
    data?: { document_id?: string; session?: { document_id?: string } };
  };
  const trialId =
    trial.session_document_id ?? trial.document_id ?? trial.documentId ?? trial.data?.session?.document_id ?? trial.data?.document_id;
  expect(trialId, 'the trial session is identified').toBeTruthy();

  // C-TT-END: the single end path — trial branch writes status/ended_at and
  // deliberately skips the Result row + scoring enqueues.
  const ended = await request.post(`${API_BASE}/api/teacher/trial/${trialId}/end`, {
    headers: { Authorization: `Bearer ${jwt}` },
    data: {},
  });
  expect(ended.status(), 'C-TT-END answers 200').toBe(200);

  // The cleanup is real: no result row and no scored sitting left behind.
  const sessionRow = runSql(
    `select status, ended_at is not null from sessions where document_id = '${trialId}'`,
  ).trim();
  expect(sessionRow, 'the trial session is ended').toMatch(/\|t$|ended|terminated/);
  const resultRow = runSql(
    `select count(*) from results where session_document_id = '${trialId}'`,
  ).trim();
  expect(resultRow, 'a trial never mints a Result').toBe('0');
});

