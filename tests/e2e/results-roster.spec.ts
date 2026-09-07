import path from 'node:path';
import { readFileSync } from 'node:fs';

import { expect, test, type Page, type Route } from '@playwright/test';

import { cat, icu } from './helpers/i18n';
import { en, signIn } from './helpers/teacher-rail';

// Task 33 — Screen A, the class roster, proven against a FIXTURE roster payload
// served by route interception on `/api/my/students/results?class=` (the task 23
// contract: one row per roster student, `result: null` where no official Result
// exists). Sign-in is real; the roster data is not — the api half of task 23
// lands separately, and these assertions depend on the CONTRACT, not on which
// worker has shipped it yet.
//
// Done-when covered here: ONE network call serves the whole surface; an
// unscored row reads "No result yet" (never 0); the sort puts result-less rows
// LAST; the confidence marker appears only on flagged rows.

const noResultYet = cat(en, 'Teacher.results.students.noResultYet');
const flaggedLabel = cat(en, 'Teacher.results.students.flaggedLabel');

const FIXTURE = JSON.parse(
  readFileSync(path.resolve(process.cwd(), '../mvp/contracts/scoring/fixtures/result-view.json'), 'utf8'),
) as Record<string, unknown>;

function view(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    ...FIXTURE,
    history: undefined, // the roster read omits history by contract
    ...overrides,
    overall: { ...(FIXTURE.overall as Record<string, unknown>), ...(overrides.overall as object) },
  };
}

const student = (id: string, name: string) => ({ document_id: id, name, initials: '??', eald_flag: false });

function rosterPayload() {
  return [
    // Lowest score first, then higher, then the result-less students LAST.
    { student: student('stu-a', 'Ada Becker'), result: view({ overall: { domain_score: 55, delta: 5, delta_reliable: true, delta_display: '+5' }, effort_valid: true, low_confidence: null }) },
    { student: student('stu-b', 'Ben Carter'), result: view({ overall: { domain_score: 80, delta: 12, delta_reliable: true, delta_display: '+12' }, effort_valid: true, low_confidence: null }) },
    { student: student('stu-c', 'Cem Demir'), result: view({ overall: { domain_score: 90, delta: -4, delta_reliable: true, delta_display: '−4' }, effort_valid: false, low_confidence: null }) },
    { student: student('stu-d', 'Dana Ekwe'), result: null },
  ];
}

test.describe('task 33 — the class roster (Screen A)', () => {
  let rosterRequests: number;
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await signIn(page, 'teacher');
    rosterRequests = 0;
    await page.route('**/api/my/students/results*', async (route: Route) => {
      rosterRequests += 1;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rosterPayload()) });
    });
    await page.goto('/dashboard/results/cls-fixture-33');
    await expect(page.locator('[data-surface="teacher-class-results"]')).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('ONE roster call serves the surface; the table renders the whole roster', async () => {
    expect(rosterRequests, 'exactly one roster read').toBe(1);
    await expect(page.locator('[data-slot="students-results-table"]')).toBeVisible();
    await expect(page.locator('[data-slot="student-results-row"]')).toHaveCount(4);
    // The summary tiles describe the whole roster (4 students), from the same payload.
    await expect(page.locator('[data-slot="class-results-header"]')).toContainText(
      icu(cat(en, 'Teacher.results.detail.tileScoredValue'), { scored: '3', total: '4' }),
    );
  });

  test('an unscored student renders "No result yet" — never a 0', async () => {
    await expect(page.locator('[data-student-id="stu-d"]')).toBeVisible();
    await expect(page.locator('[data-student-id="stu-d"] [data-slot="roster-no-result"]')).toHaveText(noResultYet);
    const scoreCell = page.locator('[data-student-id="stu-d"] [data-slot="roster-score"]');
    await expect(scoreCell).not.toContainText('0');
  });

  test('sort puts the lowest score first and the result-less rows LAST', async () => {
    const rows = page.locator('[data-slot="student-results-row"]');
    await expect(rows.first()).toHaveAttribute('data-student-id', 'stu-a'); // 55
    await expect(rows.nth(1)).toHaveAttribute('data-student-id', 'stu-b'); // 80
    await expect(rows.nth(2)).toHaveAttribute('data-student-id', 'stu-c'); // 90
    await expect(rows.last()).toHaveAttribute('data-student-id', 'stu-d'); // no result: last
    await expect(rows.last()).toHaveAttribute('data-scored', 'false');
  });

  test('the confidence marker appears only on the flagged row', async () => {
    await expect(page.locator('[data-student-id="stu-c"] [data-slot="roster-confidence"]')).toHaveAttribute('data-flagged', 'true');
    await expect(page.locator('[data-student-id="stu-c"] [data-slot="roster-confidence"]')).toHaveAttribute('title', flaggedLabel);
    for (const id of ['stu-a', 'stu-b']) {
      await expect(page.locator(`[data-student-id="${id}"] [data-slot="roster-confidence"]`)).toHaveAttribute('data-flagged', 'false');
    }
    // The result-less row is not flagged either: null is not false, and no
    // result is nothing to warn about.
    await expect(page.locator('[data-student-id="stu-d"] [data-slot="roster-confidence"]')).toHaveAttribute('data-flagged', 'false');
  });
});
