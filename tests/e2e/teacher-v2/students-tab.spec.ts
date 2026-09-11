import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page, type Response } from '@playwright/test';

import { classRosterResponseSchema } from '@/modules/results/schemas/roster.schema';
import type { RosterRow } from '@/modules/results/types/roster.types';
import { TEACHER_EXPORT_PROMPT_HEADING } from '@/modules/teacher/schemas/teacher-export.schema';
import { studentsTabRows } from '@/modules/teacher/lib/v2/students-tab';
import type { StudentsSort } from '@/modules/teacher/types/v2-class-tabs.types';

import { READY, expectNoNewErrors, frame, setAsideErrors } from '../helpers/teacher-class-detail';
import { cat } from '../helpers/i18n';
import { en, signIn } from '../helpers/teacher-rail';
import { watchErrors } from '../helpers/ui';

// S3 — the Teacher Portal v2 Students tab (Teacher Portal v2.dc.html:663–721; design
// shots class-detail-sitting--results.png and …--search-empty.png at 1440×900). Real
// sign-in, real API, no interception: the rows, scores, count and every sort order are
// checked against the GET /api/my/students/results?class= body the page itself
// received; LLM is the server's Markdown file, PDF prints the student's own
// GET /api/results/:id.
const PROOFS = path.resolve(process.cwd(), 'tests', 'e2e', 'proofs', 'teacher-v2');
const label = (key: string) => cat(en, `TeacherPortal.students.${key}`);
const panel = (page: Page) => page.locator('[data-tab-panel="students"] [data-slot="students-tab-panel"]');
const rows = (page: Page) => panel(page).locator('[data-slot="student-results-row"]');
const rowOf = (page: Page, id: string) => panel(page).locator(`[data-slot="student-results-row"][data-student-id="${id}"]`);
const count = (page: Page) => panel(page).locator('[data-slot="students-count"]');
const domOrder = (page: Page) =>
  rows(page).evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-student-id')));
const expectedOrder = (roster: RosterRow[], sort: StudentsSort, query = '') =>
  studentsTabRows(roster, { sort, query }).rows.map((row) => row.studentDocumentId);

/** The en catalog's own count ICU, resolved ("20 students"). */
function countText(value: number): string {
  return label('count').replace(
    /\{count, plural, one \{([^}]*)\} other \{([^}]*)\}\}/,
    (_all, one: string, other: string) => (value === 1 ? one : other).replace('#', String(value)),
  );
}

/** The roster body the class detail itself received for this class. */
async function waitForRoster(page: Page, classId: string): Promise<RosterRow[]> {
  let body: unknown;
  await page.waitForResponse(async (response: Response) => {
    const url = new URL(response.url());
    if (url.pathname !== '/api/my/students/results' || url.searchParams.get('class') !== classId) return false;
    if (response.request().method() !== 'GET' || !response.ok()) return false;
    try {
      body = await response.json();
      return true;
    } catch {
      return false;
    }
  });
  return classRosterResponseSchema.parse(body);
}

test.use({ viewport: { width: 1440, height: 900 } });

test('S3 — Students tab per design: roster, scores, sort, search, LLM and PDF exports, row link', async ({ page }) => {
  test.setTimeout(240_000);
  mkdirSync(PROOFS, { recursive: true });
  const errors = watchErrors(page);
  await signIn(page, 'teacher');
  await page.waitForURL('**/dashboard/results');

  const classRow = page.locator('[data-slot="results-class-row"]').first();
  await expect(classRow).toBeVisible({ timeout: 30_000 });
  const classId = await classRow.getAttribute('data-class-id');
  if (classId === null) throw new Error('[e2e] the first Classes row carries no class id');
  setAsideErrors(errors, 'classes-list');

  const rosterPromise = waitForRoster(page, classId);
  await page.goto(`/dashboard/results/${classId}`);
  const roster = await rosterPromise;
  await expect(frame(page)).toHaveAttribute('data-status', READY, { timeout: 30_000 });

  // One row per roster student, the design's columns, the count, name A–Z by default.
  await expect(rows(page)).toHaveCount(roster.length);
  await expect(panel(page)).toHaveAttribute('data-student-count', String(roster.length));
  await expect(count(page)).toHaveText(countText(roster.length));
  await expect(panel(page).getByRole('columnheader')).toHaveText(
    ['student', 'score', 'growth', 'weakest', 'phase', 'export'].map((key) => label(`columns.${key}`)),
  );
  expect(await domOrder(page)).toEqual(expectedOrder(roster, 'name'));

  // Scores are the served domain scores; an unscored student prints the dash and no exports.
  const scored = roster.flatMap((row) =>
    row.result === null || row.result.overall.domain_score === null
      ? []
      : [{ row, resultId: row.result.document_id, score: row.result.overall.domain_score }],
  );
  expect(scored.length, 'the first class holds at least two scored students').toBeGreaterThanOrEqual(2);
  for (const { row, score } of scored.slice(0, 2)) {
    const tableRow = rowOf(page, row.student.document_id);
    await expect(tableRow).toHaveAttribute('data-scored', 'true');
    await expect(tableRow.locator('[data-slot="student-name"]')).toHaveText(row.student.name);
    await expect(tableRow.locator('[data-slot="student-score"]')).toHaveText(label('percent').replace('{value}', String(score)));
    await expect(tableRow.locator('[data-export]')).toHaveCount(2);
  }
  const unscored = roster.find((row) => row.result === null || row.result.overall.domain_score === null);
  if (unscored !== undefined) {
    const tableRow = rowOf(page, unscored.student.document_id);
    await expect(tableRow).toHaveAttribute('data-scored', 'false');
    await expect(tableRow.locator('[data-slot="student-score"]')).toHaveText(cat(en, 'TeacherPortal.kit.noValue'));
    await expect(tableRow.locator('[data-export]')).toHaveCount(0);
    await expect(tableRow.getByRole('link')).toHaveCount(0);
  }
  await page.mouse.move(0, 0);
  await page.screenshot({ path: path.join(PROOFS, 'students-tab.png'), animations: 'disabled' });
  expectNoNewErrors(errors, 'Students tab load');

  // Every sort reorders the rows exactly as the view model orders the served roster.
  const sort = panel(page).getByRole('combobox', { name: label('sortLabel') });
  await expect(sort.locator('option')).toHaveText(['name', 'high', 'low', 'phase'].map((key) => label(`sort.${key}`)));
  for (const key of ['high', 'low', 'phase', 'name'] as const) {
    await sort.selectOption(key);
    await expect.poll(() => domOrder(page)).toEqual(expectedOrder(roster, key));
  }
  await sort.selectOption('high');
  const top = Math.max(...scored.map((entry) => entry.score));
  await expect(rows(page).first().locator('[data-slot="student-score"]')).toHaveText(
    label('percent').replace('{value}', String(top)),
  );
  expect(await domOrder(page)).not.toEqual(expectedOrder(roster, 'name'));
  await sort.selectOption('name');

  // Search matches the name; no match shows the design's empty line and "0 students".
  const search = panel(page).getByRole('searchbox', { name: label('searchLabel') });
  const [firstName = ''] = scored[0].row.student.name.split(/\s+/);
  await search.fill(firstName);
  const matched = expectedOrder(roster, 'name', firstName);
  await expect.poll(() => domOrder(page)).toEqual(matched);
  await expect(count(page)).toHaveText(countText(matched.length));
  await search.fill('zzz');
  expect(expectedOrder(roster, 'name', 'zzz')).toEqual([]);
  await expect(rows(page)).toHaveCount(0);
  await expect(panel(page).locator('[data-slot="students-empty"]')).toHaveText(label('empty'));
  await expect(count(page)).toHaveText(countText(0));
  await page.screenshot({ path: path.join(PROOFS, 'students-tab-search-empty.png'), animations: 'disabled' });
  await search.fill('');
  await expect(rows(page)).toHaveCount(roster.length);
  expectNoNewErrors(errors, 'Students tab sort and search');

  // LLM saves the server's de-identified Markdown for that student.
  const target = scored[0];
  const targetRow = rowOf(page, target.row.student.document_id);
  const [download] = await Promise.all([page.waitForEvent('download'), targetRow.locator('[data-export="llm"]').click()]);
  expect(download.suggestedFilename()).toMatch(/\.md$/);
  const markdown = readFileSync(await download.path(), 'utf8');
  expect(markdown.length).toBeGreaterThan(0);
  expect(markdown).toContain(TEACHER_EXPORT_PROMPT_HEADING);
  await expect(page.getByText(label('export.saved'))).toBeVisible();

  // PDF prints the student's own GET /api/results/:id in a print window.
  const [popup, resultResponse] = await Promise.all([
    page.waitForEvent('popup'),
    page.waitForResponse(
      (response) => new URL(response.url()).pathname === `/api/results/${target.resultId}` && response.ok(),
    ),
    targetRow.locator('[data-export="pdf"]').click(),
  ]);
  expect(resultResponse.status()).toBe(200);
  await expect(popup.locator('h1')).toHaveText(target.row.student.name, { timeout: 30_000 });
  await expect(popup).toHaveTitle(label('print.title').replace('{name}', target.row.student.name));
  await expect(popup.locator('.kpis .kpi .v').first()).toHaveText(`${target.score}%`);
  await popup.close();
  await expect(page.getByText(label('export.opened').replace('{name}', target.row.student.name))).toBeVisible();
  expectNoNewErrors(errors, 'Students tab exports');

  // A click anywhere on a scored row opens that student's page.
  await targetRow.click({ position: { x: 300, y: 20 } });
  await page.waitForURL(`**/dashboard/results/${classId}/students/${target.row.student.document_id}`);
  await expect(page.locator('[data-surface="teacher-student-drill-down"]')).toBeVisible({ timeout: 30_000 });
});
