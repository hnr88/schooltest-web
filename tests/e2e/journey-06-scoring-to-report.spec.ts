import path from 'node:path';

import { expect, test } from '@playwright/test';

import { displaySkills } from '@/modules/results/lib/display-skills';

import {
  JOURNEY_06_SHOTS,
  JOURNEY_06_VIEWPORT,
  generateStudentReport,
  latestSittingSection,
  pickScoredSitting,
  reportPreciseChange,
  reportSkillScore,
  reportStatedOveralls,
  signInAsJourneyTeacher,
  type ScoredSitting,
} from './helpers/journey-06-live';
import { TEACHER_EMAIL, bearer } from './helpers/teacher-results-live';
import { cat, loadMessages } from './helpers/i18n';

/**
 * JOURNEY 06 — scoring is correct and the teacher report reflects it.
 *
 * ONE real submitted sitting, carried the whole way: the score the API produced
 * (C-4 `GET /api/results/{id}`) -> the teacher's results surface -> the
 * GENERATED teacher report (C-TR-5, the server's own Markdown document).
 *
 * THERE IS NO EXPECTED NUMBER IN THIS FILE. Every assertion compares the DOM or
 * the generated document against the value the server itself served, read and
 * contract-parsed by `helpers/journey-06-live`. A number that appears in the UI
 * but not in the API response fails here — the one thing this journey exists to
 * catch.
 */
const en = loadMessages('en');

test.describe('journey 06 — scoring to teacher report', () => {
  // Three surfaces, two page loads and ~25 assertions do not fit the 30s
  // default: measured 7s quiet but 29.2s under fleet load. Every wait is bounded.
  test.slow();

  test('a real scored sitting reaches the results surface and the generated report unchanged', async ({
    page,
    playwright,
  }) => {
    const request = await playwright.request.newContext();
    let sitting: ScoredSitting;
    let report: string;
    try {
      const jwt = await bearer(request, TEACHER_EMAIL);
      sitting = await pickScoredSitting(request, jwt);
      report = await generateStudentReport(request, jwt, sitting);
    } finally {
      await request.dispose();
    }
    const { view } = sitting;
    const overall = view.overall.domain_score;
    expect(overall, 'the chosen sitting is scored by construction').not.toBeNull();

    // The `page` fixture, never `browser.newPage()`: the managed runner drives the
    // project's own visible Browser tab and refuses a context of our making.
    await page.setViewportSize(JOURNEY_06_VIEWPORT);
    {
      await signInAsJourneyTeacher(page);

      // ── 1. THE RESULTS SURFACE ────────────────────────────────────────────
      await page.goto(
        `/dashboard/results/${sitting.classDocumentId}/students/${sitting.studentDocumentId}`,
      );
      const surface = page.locator('[data-surface="teacher-student-drill-down"]');
      await expect(surface).toHaveAttribute('data-status', 'success', { timeout: 30_000 });

      // The headline is `overall.domain_score` — never a mean of the cards.
      const headline = page.locator('[data-slot="overall-score"]');
      await expect(headline).toBeInViewport();
      await expect(headline).toHaveText(`${overall}%`);

      // …and each of the seven display tiles carries ITS OWN server value: the
      // blend for Vocabulary, the gate score for Critical, the attribute
      // elsewhere — and an absence renders as an absence, never as 0.
      for (const tile of displaySkills(view)) {
        const card = page.locator(`[data-slot="skill-card"][data-skill="${tile.skill}"]`);
        await expect(card).toHaveAttribute('data-assessed', String(tile.domain_score !== null));
        if (tile.domain_score === null) {
          await expect(card.locator('[data-slot="skill-score"]')).toHaveCount(0);
          await expect(card.locator('[data-slot="skill-gap"]')).toBeVisible();
        } else {
          await expect(card.locator('[data-slot="skill-score"]')).toHaveText(`${tile.domain_score}%`);
        }
      }
      if (view.acara_phase !== null) {
        await expect(page.locator('[data-slot="acara-badge"]')).toHaveText(
          cat(en, 'Results.acaraBadge').replace('{phase}', view.acara_phase),
        );
      }
      await page.locator('[data-slot="skill-card-grid"]').scrollIntoViewIfNeeded();
      await page.screenshot({
        path: path.join(JOURNEY_06_SHOTS, '01-results-surface.png'),
        fullPage: true,
      });

      // ── 2. THE TEACHER REPORT SCREEN ──────────────────────────────────────
      await page.goto(`/dashboard/reports/${view.document_id}`);
      await expect(page.locator('[data-surface="teacher-report"]')).toBeVisible({ timeout: 30_000 });
      if (view.acara_phase !== null) {
        await expect(page.locator('[data-slot="report-display-label-value"]')).toHaveText(
          view.acara_phase,
        );
      }
      // This surface is keyed by MODEL ATTRIBUTE (Vocab_A2/Vocab_B1 separately),
      // so it is compared against `attributes`, not against the display tiles.
      for (const [name, attribute] of Object.entries(view.attributes)) {
        const row = page.locator(`[data-slot="report-attribute-row"][data-attribute="${name}"]`);
        await expect(row).toHaveCount(1);
        if (attribute.status === 'not_assessed') {
          await expect(row.locator('[data-slot="report-attribute-score"]')).toHaveCount(0);
        } else {
          await expect(row.locator('[data-slot="report-attribute-score"]')).toHaveText(
            String(attribute.domain_score),
          );
        }
      }
      await page.locator('[data-slot="report-attributes"]').scrollIntoViewIfNeeded();
      await page.screenshot({
        path: path.join(JOURNEY_06_SHOTS, '02-report-screen.png'),
        fullPage: true,
      });

      // ── 3. THE GENERATED REPORT ───────────────────────────────────────────
      // A DIFFERENT server producer over the same sitting, so this is the real
      // drift check: the same numbers, not merely similar ones.
      const section = latestSittingSection(report);
      expect(section).toContain(`| Overall score | ${overall} / 100 |`);
      if (view.acara_phase !== null) {
        expect(section).toContain(`| ACARA phase | ${view.acara_phase} |`);
      }
      for (const tile of displaySkills(view)) {
        expect(
          reportSkillScore(section, tile.skill),
          `generated report ${tile.skill} must equal C-4`,
        ).toBe(tile.domain_score === null ? null : String(tile.domain_score));
      }
      // Growth is the server's: the precise delta in the producer's signed format.
      if (view.overall.delta !== null) {
        const precise = reportPreciseChange(view.overall.delta);
        expect(report).toContain(`| Overall change (precise) | ${precise} |`);
        expect(report).toContain(`| Overall change (as reported) | ${view.overall.delta_display} |`);
      }
    }
  });

  // THE REGRESSION THIS JOURNEY EXISTS FOR.
  //
  // `selectHistory` sorted the 8-point trend window by `sat_at`, a calendar DAY.
  // Same-day sittings therefore TIED, the ties held the sibling read's own
  // `createdAt:desc` order, and `.slice(-8)` kept the OLDEST eight — so a
  // student's recent SCORED sittings arrived as `overall: null`, and the trend
  // chart stayed blank about a change the generated report states in words.
  // Measured live: `history[].overall` = [null x7, 41] for a student whose prior
  // sittings scored 76 and 84, while the report printed "84 -> 41".
  //
  // FIXED in schooltest-api/src/utils/result-view-v2.ts, pinned by its unit spec
  // (the 14 real sitting timestamps replayed). Ran gated behind
  // J06_API_RESTARTED while :5500 served a pre-fix dist/; after the 23:03
  // rebuild the window read [null x5, 76, 84, 41] and the gate came off.
  test('the trend window carries every scored sitting the generated report names', async ({
    playwright,
  }) => {
    const request = await playwright.request.newContext();
    try {
      const jwt = await bearer(request, TEACHER_EMAIL);
      // requireGrowth: a delta means a comparable previous scored sitting EXISTS,
      // so this can never pass vacuously on a first-sitting student.
      const sitting = await pickScoredSitting(request, jwt, { requireGrowth: true });
      const report = await generateStudentReport(request, jwt, sitting);
      const history = sitting.view.history ?? [];
      expect(history.length, 'a history read must carry the window').toBeGreaterThan(0);

      // CONTAINMENT, NOT EQUALITY — the widths differ ON PURPOSE: the document
      // reports the latest sitting and its predecessor ("Reportable sittings
      // shown | 2") while the window carries up to RESULT_HISTORY_MAX_POINTS,
      // so equality reds on a three-sitting student (measured). The defect is
      // one-way: the trend must never LACK a score the report states.
      const stated = reportStatedOveralls(report);
      expect(stated.length, 'a growth sitting means the report names 2+ sittings').toBeGreaterThan(1);
      const charted = history.map((point) => point.overall).filter((s): s is number => s !== null);
      expect(
        charted.length,
        'the trend cannot plot fewer scored sittings than the report names',
      ).toBeGreaterThanOrEqual(stated.length);
      for (const score of stated) {
        expect(charted, `the trend window must carry the ${score} the report states`).toContain(
          score,
        );
      }
    } finally {
      await request.dispose();
    }
  });
});
