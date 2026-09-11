import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page, type Response } from '@playwright/test';
import { resultViewSchema, type ResultView } from '@schooltest/scoring-contracts';

import { displaySkills } from '@/modules/results/lib/display-skills';
import { firstNameOf } from '@/modules/teacher/lib/student-text';

import { expectNoNewErrors, setAsideErrors } from '../helpers/teacher-class-detail';
import { cat } from '../helpers/i18n';
import { en, signIn } from '../helpers/teacher-rail';
import { watchErrors } from '../helpers/ui';

// S3 — the Teacher Portal v2 student page (Teacher Portal v2.dc.html:301–513). Real
// sign-in, real API, no interception: every number is checked against the GET
// /api/results/:id body the page itself received — never a number written here.
const PROOFS = path.resolve(process.cwd(), 'tests', 'e2e', 'proofs', 'teacher-v2');
const student = (key: string) => cat(en, `TeacherPortal.student.${key}`);
const surface = (page: Page) => page.locator('[data-surface="teacher-student-drill-down"]');

async function waitForResult(page: Page): Promise<ResultView> {
  let body: unknown;
  await page.waitForResponse(async (response: Response) => {
    if (!/\/api\/results\/[^/?]+$/.test(new URL(response.url()).pathname)) return false;
    if (response.request().method() !== 'GET' || !response.ok()) return false;
    body = await response.json();
    return true;
  });
  return resultViewSchema.parse(body);
}

test.use({ viewport: { width: 1440, height: 900 } });

test('S3 — the student page per design: header, progress, subskills, analysis, export, Ask AI, coming soon', async ({ page }) => {
  test.setTimeout(240_000);
  mkdirSync(PROOFS, { recursive: true });
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  const errors = watchErrors(page);
  await signIn(page, 'teacher');
  await page.waitForURL('**/dashboard/results');

  // The first class, then the first Students-tab row that holds a scored result.
  const classRow = page.locator('[data-slot="results-class-row"]').first();
  await expect(classRow).toBeVisible({ timeout: 30_000 });
  const classId = await classRow.getAttribute('data-class-id');
  await page.goto(`/dashboard/results/${classId}`);
  const scoredRow = page.locator('[data-slot="student-results-row"][data-scored="true"]').first();
  await expect(scoredRow).toBeVisible({ timeout: 30_000 });
  const studentId = await scoredRow.getAttribute('data-student-id');
  setAsideErrors(errors, 'classes and class detail');

  const resultPromise = waitForResult(page);
  await page.goto(`/dashboard/results/${classId}/students/${studentId}`);
  const result = await resultPromise;
  await expect(surface(page)).toHaveAttribute('data-status', 'success', { timeout: 30_000 });
  const header = page.locator('[data-slot="student-drill-down-header"]');
  const name = (await header.locator('h1').innerText()).trim();
  const first = firstNameOf(name);
  const score = result.overall.domain_score;

  // Breadcrumb, header and the navy overall chip.
  const crumbs = surface(page).locator('[data-slot="breadcrumb"]');
  await expect(crumbs.getByRole('link', { name: student('crumbClasses'), exact: true })).toHaveAttribute(
    'href',
    /\/dashboard\/results$/,
  );
  await expect(crumbs.locator('[aria-current="page"]')).toHaveText(name);
  await expect(header.locator('[data-slot="student-meta"]')).toHaveText(/ · Reading$/);
  await expect(header.getByRole('combobox', { name: student('skillLabel') })).toHaveValue('reading');
  if (score !== null) await expect(header.locator('[data-slot="student-overall-score"]')).toHaveText(`${score}%`);

  // Progress: the chart ends on the served score; the latest tile prints it.
  const points = page.locator('[data-slot="student-chart-point"]');
  expect(await points.count()).toBeGreaterThan(0);
  await expect(page.locator('[data-slot="student-progress-tiles"] [data-tile]')).toHaveCount(4);
  if (score !== null) {
    await expect(points.last()).toHaveAttribute('data-value', String(score));
    await expect(page.locator('[data-tile="latest"] dd')).toHaveText(`${score}%`);
  }

  // Subskills: every served display tile, each with its own score or the kit dash.
  const tiles = displaySkills(result);
  await expect(page.locator('[data-slot="student-subskill"]')).toHaveCount(tiles.length);
  for (const tile of tiles) {
    await expect(
      page.locator(`[data-slot="student-subskill"][data-skill="${tile.skill}"] [data-slot="student-subskill-score"]`),
    ).toHaveText(tile.domain_score === null ? cat(en, 'TeacherPortal.kit.noValue') : `${tile.domain_score}%`);
  }
  const analysis = page.locator('[data-slot="student-analysis"] p');
  if (score !== null) await expect(analysis.first()).toContainText(`${first}’s overall reading score is ${score}%`);
  await page.screenshot({ path: path.join(PROOFS, 'student-page.png'), fullPage: true, animations: 'disabled' });
  expectNoNewErrors(errors, 'student page load');

  // Copy hands over the DE-IDENTIFIED analysis and says so.
  if ((await analysis.count()) > 0) {
    await page.locator('[data-slot="student-analysis"]').getByRole('button', { name: student('copy') }).click();
    await expect(page.getByText(student('copied'))).toBeVisible();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied.length).toBeGreaterThan(0);
    expect(copied).not.toContain(first);
  }

  // Export for LLM downloads the server's Markdown and confirms it.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    header.getByRole('button', { name: student('export') }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.md$/);
  await expect(page.getByText(student('exported'))).toBeVisible();

  // Ask AI: the drawer opens, a suggestion is answered under its topic, Escape closes it.
  const askButton = header.getByRole('button', { name: student('askAi') });
  await askButton.click();
  const drawer = page.getByRole('dialog', { name: student('ask.title').replace('{first}', first) });
  await expect(drawer).toBeVisible();
  await expect(header.locator('[data-slot="student-ask-ai-button"]')).toHaveText(student('hideAi'));
  await drawer.locator('[data-slot="student-ask-suggestion"][data-intent="focus"]').click();
  await expect(drawer.locator('[data-slot="student-ask-answer-title"]').last()).toHaveText(student('ask.answer.focus'));
  await page.screenshot({ path: path.join(PROOFS, 'student-ask-ai.png'), animations: 'disabled' });
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(askButton).toBeFocused();

  // A "soon" skill swaps the Reading body for the coming-soon block; Back returns.
  await header.getByRole('combobox', { name: student('skillLabel') }).selectOption('listening');
  await expect(surface(page)).toHaveAttribute('data-skill', 'listening');
  await expect(page.locator('[data-slot="coming-soon-panel"] h2')).toHaveText(
    cat(en, 'TeacherPortal.classDetail.comingSoonTitle').replace(
      '{skill}',
      cat(en, 'TeacherPortal.classDetail.skills.listening'),
    ),
  );
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(name);
  await page.screenshot({ path: path.join(PROOFS, 'student-coming-soon.png'), animations: 'disabled' });
  await page.getByRole('button', { name: cat(en, 'Teacher.results.drillDown.backToReading') }).click();
  await expect(header).toBeVisible();
  expectNoNewErrors(errors, 'student page interactions');
});
