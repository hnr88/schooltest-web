import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page, type Response } from '@playwright/test';
import {
  resultViewSchema,
  type AssessedBand,
  type AttributeName,
  type ResultView,
} from '@schooltest/scoring-contracts';

import { DISPLAY_SKILL_ORDER } from '@/modules/results/lib/display-skills';
import { firstNameOf } from '@/modules/teacher/lib/student-text';

import { expectNoNewErrors, setAsideErrors } from '../helpers/teacher-class-detail';
import { cat } from '../helpers/i18n';
import { en, signIn } from '../helpers/teacher-rail';
import { watchErrors } from '../helpers/ui';

// S3 — the Teacher Portal v2 student page (Spec 02, `02 Student report.html`). Real
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

/** The served band a breakdown row must print (the server's own judgement — no client thresholds). */
function servedBand(result: ResultView, skill: string): AssessedBand | null {
  if (skill === 'Critical') return null;
  if (skill === 'Vocab_B2') return result.academic_vocab.band;
  const attribute = result.attributes[skill as AttributeName];
  return attribute === undefined || attribute.status === 'not_assessed' ? null : attribute.status;
}

test.use({ viewport: { width: 1440, height: 900 } });

test('S3 — the student page per design: banner stat cards, band chart, breakdown table, analysis, export, Ask AI, coming soon', async ({ page }) => {
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

  // Breadcrumb, header and the banner's THREE stat cards.
  const crumbs = surface(page).locator('[data-slot="breadcrumb"]');
  await expect(crumbs.getByRole('link', { name: student('crumbClasses'), exact: true })).toHaveAttribute(
    'href',
    /\/dashboard\/results$/,
  );
  await expect(crumbs.locator('[aria-current="page"]')).toHaveText(name);
  await expect(header.locator('[data-slot="student-meta"]')).toHaveText(/ · Reading$/);
  await expect(header.getByRole('combobox', { name: student('skillLabel') })).toHaveValue('reading');
  await expect(header.locator('[data-slot="student-stat-cards"] > div')).toHaveCount(3);
  if (score !== null) await expect(header.locator('[data-slot="student-overall-score"]')).toHaveText(`${score}%`);

  // The growth pill is the history's own latest-minus-first delta; under two scored
  // sittings there is no pill at all.
  const scored = (result.history ?? []).filter((point) => point.overall !== null);
  if (scored.length >= 2) {
    const delta = (scored.at(-1)?.overall ?? 0) - (scored[0]?.overall ?? 0);
    const expected =
      delta === 0
        ? student('overallDelta.flat')
        : delta > 0
          ? student('overallDelta.up').replace('{points}', String(delta))
          : student('overallDelta.down').replace('{points}', String(-delta));
    await expect(header.locator('[data-slot="student-overall-delta"]')).toHaveText(expected);
  } else {
    await expect(header.locator('[data-slot="student-overall-delta"]')).toHaveCount(0);
  }
  // Momentum: a term pill over two scored sittings (the 5/10 provisional cuts of
  // Spec 02 §0.1), otherwise only the note.
  const momentumCard = header.locator('[data-slot="student-stat-momentum"]');
  if (scored.length >= 2) {
    const delta = (scored.at(-1)?.overall ?? 0) - (scored[0]?.overall ?? 0);
    const kind = delta < 0 ? 'slipping' : delta < 5 ? 'holding' : delta < 10 ? 'steady' : 'accelerating';
    await expect(momentumCard).toContainText(student(`momentum.${kind}`));
  } else {
    await expect(momentumCard).toContainText(student('momentumNote.none'));
  }

  // Progress: the chart ends on the served score; the latest tile prints it.
  const points = page.locator('[data-slot="student-chart-point"]');
  expect(await points.count()).toBeGreaterThan(0);
  await expect(page.locator('[data-slot="student-progress-tiles"] [data-tile]')).toHaveCount(4);
  if (score !== null) {
    await expect(points.last()).toHaveAttribute('data-value', String(score));
    await expect(page.locator('[data-tile="latest"] dd')).toHaveText(`${score}%`);
  }

  // Breakdown table: the NINE display rows in canonical order. Rows 1-8 print the
  // served band (or the kit dash); Academic vocabulary carries its provisional-cut
  // caveat; Critical reading alone prints the exit gate. No % anywhere.
  const dash = cat(en, 'TeacherPortal.kit.noValue');
  for (const skill of DISPLAY_SKILL_ORDER) {
    const row = page.locator(`[data-slot="student-breakdown-row"][data-skill="${skill}"]`);
    await expect(row).not.toContainText('%');
    if (skill === 'Critical') {
      const gate = result.gate.passed;
      await expect(row).toContainText(
        gate === null ? dash : cat(en, `TeacherPortal.viewModel.gate.${gate ? 'passed' : 'notYet'}`),
      );
      continue;
    }
    const band = servedBand(result, skill);
    if (band === null) {
      await expect(row).toContainText(dash);
    } else {
      await expect(row).toContainText(
        cat(en, `TeacherPortal.viewModel.band.${band === 'not_yet' ? 'notYet' : band}`),
      );
    }
    // The provisional-cut caveat annotates a BANDED Academic row only; an unbanded row is the bare dash.
    if (skill === 'Vocab_B2') {
      if (result.academic_vocab.provisional_cut && band !== null) {
        await expect(row).toContainText(student('breakdown.provisionalNote'));
      } else {
        await expect(row).not.toContainText(student('breakdown.provisionalNote'));
      }
    }
  }

  // The analysis card is its locked coming-soon state: a placeholder, never
  // generated prose, and no Copy button.
  await expect(page.locator('[data-slot="student-analysis-placeholder"]')).toHaveText(
    student('analysisComingSoon'),
  );
  await expect(page.locator('[data-slot="student-analysis"]')).toHaveCount(1);
  await expect(page.locator('[data-slot="student-analysis"]').getByRole('button')).toHaveCount(0);
  await page.screenshot({ path: path.join(PROOFS, 'student-page.png'), fullPage: true, animations: 'disabled' });
  expectNoNewErrors(errors, 'student page load');

  // Export for LLM downloads the server's Markdown and confirms it.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    header.getByRole('button', { name: student('export') }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.md$/);
  await expect(page.getByText(student('exported'))).toBeVisible();

  // Ask AI: the drawer opens on this student's own copy, and Escape closes it. The
  // conversation itself (C-TA-1, a real model answer or the contracted 503) is driven
  // by `ask-ai.spec.ts` — TB-09 removed the keyword router this used to assert.
  const askButton = header.getByRole('button', { name: student('askAi') });
  await askButton.click();
  const drawer = page.getByRole('dialog', { name: student('ask.title').replace('{first}', first) });
  await expect(drawer).toBeVisible();
  await expect(header.locator('[data-slot="student-ask-ai-button"]')).toHaveText(student('hideAi'));
  await expect(drawer.locator('[data-slot="ask-ai-suggestion"]')).toHaveCount(3);
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
