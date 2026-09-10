import { expect, test, type BrowserContext, type Page, type Route } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { signIn } from './helpers/teacher-rail';

// ops/34 — the four proof captures for the migrated surfaces, at 1440x900.
// MOCKED-FEED BY DESIGN and labelled as such in proof/34.md: every API read the
// four surfaces make is intercepted and fulfilled from contract-shaped payloads,
// so this pass does not depend on :5500 at all (it is dead while scoring/08
// lands its runtime fix). The captures prove the RENDERING of the migrated
// kit surfaces, not the live wire — the wire-side specs are separate runs.

const SHOTS = path.resolve(process.cwd(), '../mvp/ops/proof/shots');
const BASE = 'http://localhost:3002';

const FIXTURE = JSON.parse(
  readFileSync(path.resolve(process.cwd(), '../mvp/contracts/scoring/fixtures/result-view.json'), 'utf8'),
) as Record<string, unknown>;

function view(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    ...FIXTURE, history: undefined, ...overrides,
    overall: { ...(FIXTURE.overall as object), ...(overrides.overall as object) },
  };
}

function rosterPayload() {
  const student = (id: string, name: string) => ({
    document_id: id, name, initials: name.slice(0, 2), eald_flag: false,
  });
  return [
    // scoring/10 — every row carries `release_state` beside `result` (result-grain
    // arms where an official Result exists, the session-grain `absent` where none
    // does); the strict roster mirror rejects a row without it.
    { student: student('stu-a', 'Ada Becker'), result: view({ student_document_id: 'stu-a', overall: { domain_score: 55, delta: -6, delta_reliable: true, delta_display: '-6' }, effort_valid: true, low_confidence: null }), release_state: 'released' },
    { student: student('stu-b', 'Ben Carter'), result: view({ student_document_id: 'stu-b', overall: { domain_score: 80, delta: 12, delta_reliable: true, delta_display: '+12' }, effort_valid: true, low_confidence: null }), release_state: 'released' },
    { student: student('stu-c', 'Cem Demir'), result: view({ student_document_id: 'stu-c', overall: { domain_score: 90, delta: null, delta_reliable: null, delta_display: null }, effort_valid: false, low_confidence: null }), release_state: 'released' },
    { student: student('stu-d', 'Dana Ekwe'), result: null, release_state: 'absent' },
  ];
}

async function installMocks(context: BrowserContext): Promise<void> {
  await context.route('**/api/teacher/tests*', (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ tests: [
        { form_document_id: 'forma1000000000000000000', variant: 'A', label: 'Test A', skill: 'reading' },
        { form_document_id: 'formb2000000000000000000', variant: 'B', label: 'Test B', skill: 'reading' },
      ] }),
    }));
  await context.route('**/api/teacher/dashboard*', (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ classes: [{
        class_document_id: 'cls330000000000000000000', name: '6B', year_band: null, student_count: 4,
        test_a: { completed: 3, total: 4 }, test_b: { completed: 2, total: 4 },
        top_gap: null, status: 'complete', open_session_count: 0,
      }], live_session: null, live_sessions: [] }),
    }));
  await context.route('**/api/teacher/test-sessions', (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ sessions: [
        { sitting_document_id: 'sita00000000000000000000', code: '340812', status: 'open', class: { document_id: 'clsa00000000000000000000', name: '6B' }, variant: 'A', opened_at: '2026-09-10T01:30:00.000Z', closed_at: null, completed: 2, expected: 4 },
        { sitting_document_id: 'sitb00000000000000000000', code: '755101', status: 'closed', class: { document_id: 'clsb00000000000000000000', name: '5A' }, variant: 'B', opened_at: '2026-09-09T01:00:00.000Z', closed_at: '2026-09-09T02:00:00.000Z', completed: 4, expected: 4 },
      ] }),
    }));
  await context.route('**/api/my/students/results*', (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rosterPayload()) }));
  await context.route(/\/api\/teacher\/test-sessions\/[^/]+\/monitor/, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        sitting: { document_id: 'sitl00000000000000000000', code: '512907', status: 'open', opened_at: '2026-09-10T01:20:00.000Z', class: { document_id: 'clsa00000000000000000000', name: '6B' }, variant: 'A' },
        stall_threshold_minutes: 15,
        summary: { expected: 4, joined: 3, in_progress: 1, submitted: 1, stalled: 1, scoring_failed: 0 },
        students: [
          { student_document_id: 'stua00000000000000000001', display_name: 'Ada Becker', state: 'in_progress', stage: 2, total_stages: 3, inactive_minutes: 0, proctoring: null },
          { student_document_id: 'stua00000000000000000002', display_name: 'Ben Carter', state: 'submitted', stage: null, total_stages: null, inactive_minutes: null, proctoring: null },
          { student_document_id: 'stua00000000000000000003', display_name: 'Cem Demir', state: 'stalled', stage: 1, total_stages: 3, inactive_minutes: 16, proctoring: null },
          { student_document_id: 'stua00000000000000000004', display_name: 'Dana Ekwe', state: 'not_joined', stage: null, total_stages: null, inactive_minutes: null, proctoring: null },
        ],
      }),
    }));
}

test.describe('ops/34 — the four migrated surfaces, 1440x900 captures', () => {
  /**
 * ops/34 — navigation with one reload-retry: on a live dev server, a chunk
 * request can be aborted mid-load when a recompile invalidates chunk hashes
 * (transient ERR_ABORTED, observed as blank panels); a reload fetches the
 * fresh set and the surface settles.
 */
async function gotoSurface(page: Page, url: string, attempts = 2): Promise<void> {
  for (let i = 0; i < attempts; i += 1) {
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 60_000 });
      return;
    } catch {
      if (i === attempts - 1) throw new Error(`[ops/34] ${url} failed to load after ${attempts} attempts`);
      await page.waitForTimeout(3_000);
    }
  }
}

test('captures past sessions, students results, progress watch and the live monitor', async ({ browser }) => {
    test.setTimeout(240_000);
    mkdirSync(SHOTS, { recursive: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await installMocks(context);
    const page = await context.newPage();
    page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE-ERR:', m.text().slice(0, 350)); });
    page.on('response', (r) => { if (r.url().includes('/api/')) console.log('API', r.status(), r.request().method(), r.url().slice(0, 130)); });
    page.on('pageerror', (e) => console.log('PAGE-ERR:', String(e).slice(0, 350)));
    page.on('requestfailed', (r) => console.log('REQ-FAIL:', r.method(), r.url().slice(0, 140), r.failure()?.errorText));
    page.on('response', (r) => { if (r.url().includes('/api/') && (!r.ok() || r.url().includes('test-sessions') || r.url().includes('tests'))) console.log('API', r.status(), r.url().slice(0, 130)); });

    await signIn(page, 'teacher');

    // ops/34 — on a LIVE dev server another row's edits recompile chunks while
    // a page is loading (ERR_ABORTED), so every navigation retries up to three
    // times and each retry reloads fresh chunks before re-asserting readiness.
    const visit = async (url: string, ready: () => Promise<void>): Promise<void> => {
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        await page.goto(url, { waitUntil: 'load' });
        try {
          await ready();
          return;
        } catch (error) {
          console.log(`[ops/34] ${url} not settled (attempt ${attempt}): ${String(error).slice(0, 160)}`);
          if (attempt === 3) throw error;
          await page.waitForTimeout(4_000);
        }
      }
    };

    // 1 — past sessions (the sticky kit table)
    await visit(`${BASE}/dashboard/test-sessions`, async () => {
      await expect(page.locator('[data-slot="past-sessions"]')).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });
      await expect(page.locator('[data-slot="past-session-row"]').first()).toBeVisible();
    });
    // The kit table scrolls INSIDE its own sticky max-h-96 region, so the page
    // never grows past the viewport — frame the panel itself, not the page top.
    await page.locator('[data-slot="past-sessions"]').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(SHOTS, '34-past-sessions.png'), fullPage: true });

    // 2 — students results (the roster table on the kit)
    await visit(`${BASE}/dashboard/results/cls330000000000000000000`, async () => {
      await expect(page.locator('[data-surface="teacher-class-results"]')).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });
      await expect(page.locator('[data-slot="student-results-row"]')).toHaveCount(4);
    });
    await page.screenshot({ path: path.join(SHOTS, '34-students-results.png'), fullPage: true });

    // 3 — progress watch (the two ranked kit lists)
    await page.getByRole('tab').filter({ hasText: 'Progress' }).click();
    await expect(page.locator('[data-slot="progress-watch-list"][data-variant="gains"] [data-slot="progress-mover"]').first()).toBeVisible({ timeout: 20_000 });
    await page.screenshot({ path: path.join(SHOTS, '34-progress-watch.png'), fullPage: true });

    // 4 — the live monitor (tile board, kit states)
    await visit(`${BASE}/dashboard/test-sessions/sit-live`, async () => {
      await expect(page.locator('[data-surface="teacher-live-monitor"]')).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });
      await expect(page.locator('[data-slot="live-monitor-tile"]')).toHaveCount(4);
    });
    await page.screenshot({ path: path.join(SHOTS, '34-live-monitor.png'), fullPage: true });

    await context.close();
  });
});
