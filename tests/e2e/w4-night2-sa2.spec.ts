import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { signInTeacher } from './helpers/teacher-rail';
import { sectionTab, sectionTabs } from './helpers/teacher-class-detail';

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
