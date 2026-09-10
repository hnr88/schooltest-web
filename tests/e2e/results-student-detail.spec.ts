import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { expect, test, type Page, type TestInfo } from '@playwright/test';

import { signIn } from './helpers/teacher-rail';

/**
 * Task 31 e2e — Screen C part 2 over route interception (NO live Strapi: the
 * /api/results/:id call is fulfilled with the contract fixture, which is what
 * proves the CLIENT contract without owning the server).
 *
 * WIRED (teacher/15 re-point): the rich body now renders on the SURVIVING
 * route `/en/dashboard/results/:class/students/:student` — the drill-down
 * screen mounts Screen C through the same canonical reads (roster + result),
 * which these specs intercept alongside the roster and dashboard reads the
 * drill-down composes. The CLIENT contract is what they prove.
 *
 * When unblocked, the assertions are the ones the orchestrator pinned:
 * - sparkline section ABSENT with one sitting, PRESENT with three;
 * - the error-pattern section hidden for an empty array;
 * - the consolidating fixture shows the banner, not the checklist;
 * - `page.emulateMedia({ media: 'print' })` — the print snapshot carries NO
 *   buttons (the shared .print-hidden pair is what hides them);
 * - the Critical card shows a gate state, never a band (task 30 ruling);
 * - a not-assessed skill is a gap, never a 0 (task 30 ruling).
 */

const FIXTURE = resolve(process.cwd(), '../mvp/contracts/scoring/fixtures/result-view.json');
const SERVED_RESULTS_FIXTURE = resolve(process.cwd(), 'tests/fixtures/my-students-results-wire.json');
const PROOF_SHOTS = resolve(process.cwd(), '../mvp/scoring/proof/shots');
const LEGACY_RESULT_ID = 'res-legacy-browser-0001';

const view = (): Record<string, unknown> => JSON.parse(readFileSync(FIXTURE, 'utf8'));
const legacyView = (): Record<string, unknown> => {
  const rows: Array<Record<string, unknown>> = JSON.parse(
    readFileSync(SERVED_RESULTS_FIXTURE, 'utf8'),
  );
  const scoringFailed = rows.find((row) => row.status === 'scoring_failed');
  if (scoringFailed === undefined) {
    throw new Error('served result fixture must retain its scoring_failed population');
  }

  return {
    ...scoringFailed,
    document_id: LEGACY_RESULT_ID,
    status: 'complete',
    model_version: 'legacy-r7',
    legacy_caveat: 'pilot_diagnostic_earlier_model',
    attributes: {
      Decoding: {
        status: 'developing',
        prob: 0.61,
        prob_se: 0.05,
        items: 6,
        delta: 0.08,
      },
    },
  };
};

async function captureProof(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  mkdirSync(PROOF_SHOTS, { recursive: true });
  const body = await page.screenshot({ path: resolve(PROOF_SHOTS, name) });
  await testInfo.attach(name, { body, contentType: 'image/png' });
}

// The route sits behind TeacherGuard, so every test signs in first — the
// precondition the assertions always assumed; this file shipped before the
// route had a guard and never carried it.
test.beforeEach(async ({ page }) => {
  await signIn(page, 'teacher');
});

const SCREEN_ROUTE = '/en/dashboard/results/class0001aaaaaaaaaaaaaaaaaaa/students/student-0001'; // the SURVIVING drill-down route (teacher/15)

/**
 * teacher/15 — the drill-down composes TWO reads beside the intercepted result:
 * the class roster (which names the student and carries the result reference)
 * and the C-TD-1 dashboard (the class name). The roster row's `result` IS the
 * same fixture the result route serves, so `result.document_id` matches the
 * intercepted URL and the ONE result read fires exactly once.
 */
async function stubRosterAndDashboard(page: Page): Promise<void> {
  await page.route('**/api/my/students/results*', (route) =>
    route.fulfill({
      json: [
        {
          student: {
            document_id: 'student-0001',
            name: 'Alvarez Student',
            initials: 'AS',
            eald_flag: false,
          },
          result: view(),
          release_state: 'released',
        },
      ],
    }),
  );
  await page.route('**/api/teacher/dashboard*', (route) =>
    route.fulfill({
      json: {
        classes: [
          {
            class_document_id: 'class0001aaaaaaaaaaaaaaaaaaa',
            name: 'Reading 8B — Alvarez',
            year_band: '7_9',
            student_count: 20,
            test_a: { completed: 0, total: 20 },
            test_b: { completed: 0, total: 20 },
            top_gap: null,
            status: 'complete',
            open_session_count: 0,
          },
        ],
        live_session: null,
        live_sessions: [],
      },
    }),
  );
}

test('sparklines: absent with one sitting, present with two', async ({ page }) => {
  await page.route('**/api/results/res-fixture-0001*', (route) => route.fulfill({ json: view() }));
  await stubRosterAndDashboard(page);
  await page.goto(SCREEN_ROUTE);
  await expect(page.locator('[data-slot="movement-sparklines"]')).toHaveCount(1);
  await expect(page.locator('[data-slot="movement-row"]')).toHaveCount(5);
  await expect(page.locator('[data-slot="movement-row"][data-skill="Critical"]')).toHaveCount(0);
});

test('error patterns: present with patterns, absent for an empty array', async ({ page }) => {
  await page.route('**/api/results/res-fixture-0001*', (route) => route.fulfill({ json: view() }));
  await stubRosterAndDashboard(page);
  await page.goto(SCREEN_ROUTE);
  await expect(page.locator('[data-slot="error-patterns"]')).toHaveCount(1);
  await expect(page.locator('[data-slot="error-pattern"]')).toHaveCount(2);
  await expect(page.locator('[data-slot="error-pattern-insight"]')).toContainText('most common slip');
});

test('consolidating: the banner replaces the checklist', async ({ page }) => {
  await page.route('**/api/results/res-fixture-0001*', (route) =>
    route.fulfill({ json: { ...view(), acara_phase: 'consolidating' } }),
  );
  await stubRosterAndDashboard(page);
  await page.goto(SCREEN_ROUTE);
  await expect(page.locator('[data-slot="consolidating-checklist"]')).toHaveCount(0);
  await expect(page.locator('[data-slot="consolidating-banner-text"]')).toHaveText(
    'Consolidating — meets all requirements',
  );
});

test('print: the print-media snapshot carries no buttons', async ({ page }) => {
  await page.route('**/api/results/res-fixture-0001*', (route) => route.fulfill({ json: view() }));
  await stubRosterAndDashboard(page);
  await page.goto(SCREEN_ROUTE);
  await expect(page.locator('[data-slot="print-report-button"]')).toBeVisible();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('[data-slot="print-report-button"]')).toBeHidden();
  await page.emulateMedia({ media: 'screen' });
});

test('the guardrails hold on the wired screen (task 30 rulings)', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route('**/api/results/res-fixture-0001*', (route) => route.fulfill({ json: view() }));
  await stubRosterAndDashboard(page);
  await page.goto(SCREEN_ROUTE);
  await expect(page.locator('[data-slot="skill-card"][data-skill="Gist"]')).toHaveAttribute('data-assessed', 'false');
  await expect(page.locator('[data-slot="skill-card"][data-skill="Critical"]')).not.toHaveAttribute('data-band');
  // Scoped to the rendered surface per the receipt-vs-render ruling: posteriors in API payloads for audit; the guard is on what a teacher SEES.
  // body.textContent would sweep Next's RSC flight payload (catalog text like
  // "Report a problem" matches /prob/i) and assert the wrong rule.
  const screen = page.locator('[data-slot="result-screen"]');
  expect(await screen.textContent()).not.toMatch(/prob|theta/i);
  await screen.scrollIntoViewIfNeeded();
  await captureProof(page, testInfo, '02-student-result-v2.png');
});

test('the one result read dispatches a legacy fixture to text-only teacher proof', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  let resultRequests = 0;
  await page.route(`**/api/results/${LEGACY_RESULT_ID}*`, (route) => {
    resultRequests += 1;
    return route.fulfill({ json: legacyView() });
  });

  await page.goto(`/en/dashboard/reports/${LEGACY_RESULT_ID}`);
  const legacy = page.locator('[data-surface="legacy-report"]');
  await expect(legacy).toBeVisible();
  await expect(legacy.getByRole('note')).toBeVisible();
  await expect(legacy.getByText('Decoding', { exact: true })).toBeVisible();
  await expect(legacy).not.toContainText(/prob|theta|0\.61|0\.05/i);
  expect(resultRequests).toBe(1);
  await legacy.scrollIntoViewIfNeeded();
  await captureProof(page, testInfo, '02-teacher-report-legacy.png');
});
