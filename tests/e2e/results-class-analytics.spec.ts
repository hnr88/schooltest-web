import path from 'node:path';
import { readFileSync } from 'node:fs';

import { expect, test, type Page, type Route } from '@playwright/test';

import { cat, icu } from './helpers/i18n';
import { en, signIn } from './helpers/teacher-rail';

// Task 34 — Screen B, the class analytics, proven against a FIXTURE roster
// payload served by route interception (same contract shape as the roster spec).
//
// Done-when covered here: switching tabs issues NO new request (both analytics
// tabs consume the ONE Screen A payload); the class progress chart renders its
// honest deferred placeholder; and no retired `insights`/`progress` result URL
// is ever requested — the gate that unblocks the api-side route retirement
// (task 24).

const chartTitle = cat(en, 'Teacher.results.progress.chartDeferredTitle');

const FIXTURE = JSON.parse(
  readFileSync(path.resolve(process.cwd(), '../mvp/contracts/scoring/fixtures/result-view.json'), 'utf8'),
) as Record<string, unknown>;

function view(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    ...FIXTURE,
    history: undefined,
    ...overrides,
    overall: { ...(FIXTURE.overall as Record<string, unknown>), ...(overrides.overall as object) },
  };
}

const student = (id: string, name: string) => ({ document_id: id, name, initials: '??', eald_flag: false });

function rosterPayload() {
  return [
    { student: student('stu-a', 'Ada Becker'), result: view({ overall: { domain_score: 55, delta: -6, delta_reliable: true, delta_display: '−6' }, effort_valid: true, low_confidence: null }) },
    { student: student('stu-b', 'Ben Carter'), result: view({ overall: { domain_score: 80, delta: 12, delta_reliable: true, delta_display: '+12' }, effort_valid: true, low_confidence: null }) },
    { student: student('stu-c', 'Cem Demir'), result: view({ overall: { domain_score: 70, delta: null, delta_reliable: null, delta_display: null }, effort_valid: true, low_confidence: null }) },
  ];
}

test.describe('task 34 — class analytics (Screen B)', () => {
  let rosterRequests: number;
  let retiredRequests: string[];
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await signIn(page, 'teacher');
    rosterRequests = 0;
    retiredRequests = [];
    await page.route('**/api/my/students/results*', async (route: Route) => {
      rosterRequests += 1;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rosterPayload()) });
    });
    // The retired C-TR-3/C-TR-4 result routes must never be touched again.
    const retired = (url: string): boolean =>
      url.includes('/teacher/classes/') && (url.includes('/insights') || url.includes('/progress'));
    page.on('request', (request) => {
      if (retired(request.url())) retiredRequests.push(request.url());
    });
    await page.goto('/dashboard/results/cls-fixture-34');
    await expect(page.locator('[data-surface="teacher-class-results"]')).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('switching tabs issues no new request', async () => {
    const tabs = page.getByRole('tab');
    await tabs.filter({ hasText: cat(en, 'Teacher.results.tabs.insights') }).click();
    await expect(page.locator('[data-slot="teaching-insights"]')).toBeVisible();
    await tabs.filter({ hasText: cat(en, 'Teacher.results.tabs.progress') }).click();
    await expect(page.locator('[data-slot="class-progress"]')).toBeVisible();
    await tabs.filter({ hasText: cat(en, 'Teacher.results.tabs.students') }).click();
    await expect(page.locator('[data-slot="students-results-table"]')).toBeVisible();
    // The ONE roster read served every tab; nothing else fired.
    expect(rosterRequests, 'one roster read for all four tab visits').toBe(1);
  });

  test('the class progress chart is an honest deferred placeholder', async () => {
    await page.getByRole('tab').filter({ hasText: cat(en, 'Teacher.results.tabs.progress') }).click();
    const placeholder = page.locator('[data-slot="progress-chart-placeholder"]');
    await expect(placeholder).toBeVisible();
    await expect(placeholder).toContainText(chartTitle);
    // No fabricated chart beside it: no SVG/canvas chart lives on this tab.
    await expect(page.locator('[data-slot="class-progress"] svg.chart, [data-slot="class-progress"] canvas')).toHaveCount(0);
  });

  test('the ranked lists render from the payload — reliable gains and needs support', async () => {
    await page.getByRole('tab').filter({ hasText: cat(en, 'Teacher.results.tabs.progress') }).click();
    // Top gains: Ben (+12) before Cem — wait, Cem has no reliable delta and is
    // dropped; Ada's −6 is a reliable NEGATIVE and is not a gain.
    const gains = page.locator('[data-slot="progress-watch-list"][data-variant="gains"] [data-slot="progress-mover"]');
    await expect(gains).toHaveCount(1);
    await expect(gains.first()).toHaveAttribute('data-student-id', 'stu-b');
    // Needs support: Ada's reliable decline ranks FIRST, ahead of Cem's steady 70.
    const support = page.locator('[data-slot="progress-watch-list"][data-variant="support"] [data-slot="progress-mover"]');
    await expect(support).toHaveCount(2);
    await expect(support.first()).toHaveAttribute('data-student-id', 'stu-a');
    await expect(support.last()).toHaveAttribute('data-student-id', 'stu-c');
  });

  test('no retired insights/progress result URL is ever requested', async () => {
    for (const tab of ['insights', 'progress', 'students']) {
      await page.getByRole('tab').filter({ hasText: cat(en, `Teacher.results.tabs.${tab}`) }).click();
    }
    expect(retiredRequests, JSON.stringify(retiredRequests)).toEqual([]);
  });
});
