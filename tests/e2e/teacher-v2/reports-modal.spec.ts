import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Download, type Page, type Response } from '@playwright/test';

import { classRosterResponseSchema } from '@/modules/results/schemas/roster.schema';
import type { RosterRow } from '@/modules/results/types/roster.types';
import { parseCsv } from '@/modules/teacher/lib/export/__fixtures__/parse-csv';
import { summariseClassResults } from '@/modules/teacher/lib/print/class-summary';
import { teachingInsights } from '@/modules/teacher/lib/v2/teaching-insights';
import { TEACHER_EXPORT_PROMPT_HEADING } from '@/modules/teacher/schemas/teacher-export.schema';

import { cat } from '../helpers/i18n';
import { READY, expectNoNewErrors, frame, header, setAsideErrors } from '../helpers/teacher-class-detail';
import { en, signIn } from '../helpers/teacher-rail';
import { watchErrors } from '../helpers/ui';

// S9 — "Reports and data" (Teacher Portal v2.dc.html:1626–1705; design shots overlay-reports*.png
// at 1440×900). Real sign-in, real API, no interception: every kind × format produces a real
// artefact, checked against the GET /api/my/students/results?class= body the page received.
const PROOFS = path.resolve(process.cwd(), 'tests', 'e2e', 'proofs', 'teacher-v2');
const label = (key: string) => cat(en, `TeacherPortal.reports.${key}`);
const modal = (page: Page) => page.locator('[data-surface="class-reports-modal"]');
const cta = (page: Page) => modal(page).locator('[data-slot="reports-generate"]');

/** The en catalog's ICU, resolved: plurals first, then plain arguments. */
function icu(template: string, values: Record<string, string | number>): string {
  return template
    .replace(/\{(\w+), plural, one \{([^}]*)\} other \{([^}]*)\}\}/g, (_all, key: string, one: string, other: string) =>
      (Number(values[key]) === 1 ? one : other).replace('#', String(values[key])),
    )
    .replace(/\{(\w+)\}/g, (all, key: string) => String(values[key] ?? all));
}

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

async function open(page: Page, kind: 'student' | 'class' | 'ai', format?: 'pdf' | 'csv' | 'print') {
  await header(page).locator('[data-slot="class-reports-button"]').click();
  await expect(modal(page)).toBeVisible();
  await modal(page).locator(`[data-slot="start-choice"][data-value="${kind}"]`).click();
  if (format !== undefined) await modal(page).locator(`[data-slot="reports-format"][data-value="${format}"]`).click();
  await expect(modal(page)).toHaveAttribute('data-kind', kind);
}

const readText = async (download: Download) => readFileSync(await download.path(), 'utf8').replace(/^\uFEFF/, '');

test.use({ viewport: { width: 1440, height: 900 } });

test('S9 — Reports and data: every kind and format produces a real artefact', async ({ page }) => {
  test.setTimeout(300_000);
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
  const className = (await header(page).getByRole('heading', { level: 1 }).textContent()) ?? '';
  const scored = roster
    .filter((row) => row.result !== null && row.result.overall.domain_score !== null)
    .sort((a, b) => a.student.name.localeCompare(b.student.name));
  expect(scored.length, 'the first class holds scored students').toBeGreaterThan(1);
  const students = scored.length;
  const reportName = (kind: string) => label(`kinds.${kind}.label`);

  // The modal as drawn: title, sub, three radio cards, PDF/CSV/Print, "Generate · N students".
  await open(page, 'student');
  await expect(modal(page).getByRole('heading', { level: 2 })).toHaveText(label('title'));
  await expect(modal(page).getByText(label('sub'))).toBeVisible();
  await expect(modal(page).getByRole('radio')).toHaveCount(3 + 3);
  await expect(modal(page).getByText(icu(label('kinds.class.desc'), { name: className }))).toBeVisible();
  await expect(modal(page).locator('[data-slot="reports-format"]')).toHaveText(['PDF', 'CSV', 'Print']);
  await expect(modal(page)).toHaveAttribute('data-format', 'pdf');
  await expect(cta(page)).toHaveText(icu(label('generate'), { count: students }));
  await page.mouse.move(0, 0);
  await page.screenshot({ path: path.join(PROOFS, 'reports-modal.png'), animations: 'disabled' });

  // Student reports · CSV: one record per ROSTER student, each score the served one.
  await modal(page).locator('[data-slot="reports-format"][data-value="csv"]').click();
  const [studentCsv] = await Promise.all([page.waitForEvent('download'), cta(page).click()]);
  expect(studentCsv.suggestedFilename()).toMatch(/-student-reports\.csv$/);
  const [head = [], ...records] = parseCsv(await readText(studentCsv));
  expect(head).toHaveLength(18);
  expect(records).toHaveLength(roster.length);
  for (const row of roster) {
    const record = records.find((entry) => entry[0] === row.student.name);
    const score = row.result?.overall.domain_score ?? null;
    expect(record?.[1], row.student.name).toBe(score === null ? '' : String(score));
  }
  await expect(modal(page)).toBeHidden();
  await expect(page.getByText(icu(label('toast.csvSaved'), { report: reportName('student'), name: className }))).toBeVisible();

  // Student reports · PDF and · Print: one page per scored student in one print window.
  for (const format of ['pdf', 'print'] as const) {
    await open(page, 'student', format);
    await expect(cta(page)).toHaveText(icu(label(format === 'print' ? 'openPrint' : 'generate'), { count: students }));
    const [popup] = await Promise.all([page.waitForEvent('popup'), cta(page).click()]);
    await expect(popup.locator('.page')).toHaveCount(students, { timeout: 30_000 });
    await expect(popup.locator('.page h1')).toHaveText(scored.map((row) => row.student.name));
    await expect(popup).toHaveTitle(icu(label('print.studentsTitle'), { name: className }));
    const first = scored[0]?.result?.overall.domain_score;
    await expect(popup.locator('.page').first().locator('.kpi .v').first()).toHaveText(`${first}%`);
    await popup.close();
    await expect(modal(page)).toBeHidden();
  }
  expectNoNewErrors(errors, 'student reports');

  // Class summary · PDF / Print: the class report; · CSV: the Teaching insights numbers.
  const summary = summariseClassResults(roster);
  for (const format of ['pdf', 'print'] as const) {
    await open(page, 'class', format);
    const [popup] = await Promise.all([page.waitForEvent('popup'), cta(page).click()]);
    await expect(popup.locator('h1')).toHaveText(className, { timeout: 30_000 });
    await expect(popup).toHaveTitle(cat(en, 'TeacherPortal.classes.print.title').replace('{name}', className));
    await expect(popup.locator('.kpi .v').first()).toHaveText(`${summary.mean}%`);
    await popup.close();
  }
  await open(page, 'class', 'csv');
  const [classCsv] = await Promise.all([page.waitForEvent('download'), cta(page).click()]);
  expect(classCsv.suggestedFilename()).toMatch(/-class-summary\.csv$/);
  const classRecords = parseCsv(await readText(classCsv));
  const insights = teachingInsights(roster);
  const valueOf = (measure: string) => classRecords.find((record) => record[0] === label(`csv.${measure}`))?.[1];
  expect(valueOf('classAverage')).toBe(String(insights.kpis.classAverage));
  expect(valueOf('scored')).toBe(String(students));
  expect(valueOf('roster')).toBe(String(roster.length));
  expectNoNewErrors(errors, 'class summary');

  // Data for AI: Markdown only; the server's de-identified profile per scored student, no names.
  await open(page, 'ai');
  await expect(modal(page).locator('[data-slot="reports-format"]')).toHaveText(['Markdown']);
  await expect(modal(page)).toHaveAttribute('data-format', 'markdown');
  await expect(cta(page)).toHaveText(icu(label('generate'), { count: students }));
  await expect(page.locator('[data-sonner-toast]')).toHaveCount(0, { timeout: 15_000 });
  await page.mouse.move(0, 0);
  await page.screenshot({ path: path.join(PROOFS, 'reports-modal-ai.png'), animations: 'disabled' });
  const downloads: Download[] = [];
  page.on('download', (download) => downloads.push(download));
  await cta(page).click();
  await expect.poll(() => downloads.length, { timeout: 180_000 }).toBe(students);
  await expect(page.getByText(icu(label('toast.aiSaved'), { count: students }))).toBeVisible({ timeout: 30_000 });
  const names = roster.flatMap((row) => [row.student.name, ...row.student.name.split(/\s+/).filter((part) => part.length > 2)]);
  for (const download of downloads) {
    expect(download.suggestedFilename()).toMatch(/\.md$/);
    const markdown = await readText(download);
    expect(markdown).toContain(TEACHER_EXPORT_PROMPT_HEADING);
    const leaked = names.filter((part) => new RegExp(`\\b${part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(markdown));
    expect(leaked, download.suggestedFilename()).toEqual([]);
  }
  await expect(modal(page)).toBeHidden();
  expectNoNewErrors(errors, 'data for AI');
});
