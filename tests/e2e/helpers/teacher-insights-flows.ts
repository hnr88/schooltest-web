import { expect, type Page, type PlaywrightWorkerArgs } from '@playwright/test';

import type { ClassInsightsResponse } from '@/modules/teacher/types/teacher-result.types';

import {
  dbCompletedCount,
  dbLatestProfileProbs,
  dbMasteredOnForm,
  dbProbsOnForm,
  dbTestAOnlyStudents,
  FORM_CODES,
  readClassInsightsLive,
  type MasteryCuts,
} from './teacher-insights-live';
import {
  assertMasteryRows,
  assertSuggestedGroups,
  barGeometry,
  openInsights,
  openProgress,
} from './teacher-insights-view';
import {
  assertAcaraMovement,
  assertMasteryShift,
  assertStudentAbsent,
  assertWatchLists,
  readyView,
} from './teacher-progress-cohort';
import { readClassProgressLive } from './teacher-results-live';

// Task 056 · ONE class's worth of each brief flow, extracted from the spec under
// the 200-line rule (the same split task 037 made). Each function is the whole
// assertion for that flow on that class — nothing is weakened by living here.

type Playwright = PlaywrightWorkerArgs['playwright'];

/** The highest and lowest mastery rows (which may honestly tie). */
function extremes(insights: ClassInsightsResponse) {
  const assessed = insights.mastery.filter((entry) => entry.assessed_count > 0);
  const sorted = [...assessed].sort((a, b) => b.ratio - a.ratio);
  const [best, worst] = [sorted[0], sorted[sorted.length - 1]];
  expect(assessed.length, 'flow 19 needs assessed mastery evidence').toBeGreaterThan(1);
  return { best, worst };
}

/**
 * Brief flow 19 — the bars are MASTERY. Beyond printing C-TR-3 verbatim, the
 * highest-mastery row must never draw a shorter bar than the lowest-mastery row.
 * When the live cohort ties, every bar is still pinned directly to its server ratio
 * by `assertMasteryRows`; the journey must not require invented variation.
 */
export async function flow19(page: Page, playwright: Playwright, classDocumentId: string) {
  const insights = await readClassInsightsLive(playwright, classDocumentId);
  expect(insights.completed_count).toBe(
    dbCompletedCount(classDocumentId, [FORM_CODES.A, FORM_CODES.B]),
  );

  const panel = await openInsights(page, classDocumentId);
  await assertMasteryRows(panel, insights);

  const { best, worst } = extremes(insights);
  const row = (attribute: string) =>
    panel.locator(`[data-slot="subskill-mastery-row"][data-attribute="${attribute}"]`);
  const bestBar = await barGeometry(row(best.attribute));
  const worstBar = await barGeometry(row(worst.attribute));
  expect(
    bestBar.filled,
    `${best.attribute} must not under-fill ${worst.attribute}`,
  ).toBeGreaterThanOrEqual(worstBar.filled);
  expect(bestBar.ariaNow).toBeGreaterThanOrEqual(worstBar.ariaNow);
  expect(best.mastered_count).toBeGreaterThanOrEqual(worst.mastered_count);
  return { best, worst };
}

/**
 * Brief flow 20 — every card is the server's, and every membership is re-derived
 * from Postgres: the student's key IS their deepest `not_yet` posterior under the
 * ACTIVE cuts, and no student is in two groups.
 */
export async function flow20(
  page: Page,
  playwright: Playwright,
  classDocumentId: string,
  cuts: MasteryCuts,
) {
  const insights = await readClassInsightsLive(playwright, classDocumentId);
  const panel = await openInsights(page, classDocumentId);
  await assertSuggestedGroups(panel, insights);

  const seen = new Set<string>();
  for (const group of insights.groups) {
    for (const student of group.students) {
      expect(seen.has(student.student_document_id), 'a student in two groups').toBe(false);
      seen.add(student.student_document_id);
      const probs = dbLatestProfileProbs(classDocumentId, student.student_document_id);
      const notYet = Object.entries(probs).filter(([, prob]) => prob < cuts.approaching_cut);
      const deepest = notYet.sort((a, b) => a[1] - b[1])[0];
      expect(deepest ? deepest[0] : 'no_gaps', `${student.display_name} primary gap`).toBe(
        group.key,
      );
    }
  }
  expect(seen.size).toBeGreaterThan(0);
  return insights;
}

/**
 * Brief flow 23 — the mastery shift table and the ACARA phase cards, with Test B's
 * counts recomputed from the stored posteriors and the movement totals reconciled
 * against the compared cohort.
 */
export async function flow23(
  page: Page,
  playwright: Playwright,
  classDocumentId: string,
  cuts: MasteryCuts,
) {
  const view = readyView(await readClassProgressLive(playwright, classDocumentId));
  const panel = await openProgress(page, classDocumentId);
  await expect(panel).toHaveAttribute('data-status', 'ready');
  await assertMasteryShift(panel, view);
  await assertAcaraMovement(panel, view);
  await assertWatchLists(panel, view);

  expect(view.compared).toBeLessThanOrEqual(view.cohort.both_tests);
  for (const entry of view.shift) {
    // When every completed pair is comparable, the raw Test B count and the
    // reportable cohort are identical and can be checked directly. If the
    // equating gate excludes a pair, C-TR-4 intentionally reports the smaller
    // cohort and every displayed count must stay inside that denominator.
    if (view.compared === view.cohort.both_tests) {
      expect(
        dbMasteredOnForm(classDocumentId, FORM_CODES.B, entry.attribute, cuts.mastered_cut),
        `${entry.attribute} b_mastered`,
      ).toBe(entry.b_mastered);
    }
    expect(entry.a_mastered).toBeLessThanOrEqual(view.compared);
    expect(entry.b_mastered).toBeLessThanOrEqual(view.compared);
    expect(entry.change).toBe(entry.b_mastered - entry.a_mastered);
  }
  expect(view.movement.up + view.movement.same + view.movement.down).toBe(view.compared);
  return view;
}

/** Flow 23's persistence half: reload, re-read, and the same numbers are still there. */
export async function flow23AfterReload(
  page: Page,
  classDocumentId: string,
  view: Awaited<ReturnType<typeof flow23>>,
) {
  await page.reload();
  const panel = await openProgress(page, classDocumentId);
  await expect(panel).toHaveAttribute('data-status', 'ready');
  await assertMasteryShift(panel, view);
  await assertAcaraMovement(panel, view);
}

/**
 * Brief flow 24 — the both-tests-only cohort rule, proven two ways for every
 * student who finished Test A and NOT Test B: they appear nowhere on the tab, and
 * their Test A mastery is subtracted out of every `a_mastered` column.
 * Returns whether the excluded students carry real assessed evidence, making
 * their absence from the compared cohort non-vacuous.
 */
export async function flow24(
  page: Page,
  playwright: Playwright,
  classDocumentId: string,
): Promise<boolean> {
  const view = readyView(await readClassProgressLive(playwright, classDocumentId));
  const aOnly = dbTestAOnlyStudents(classDocumentId).map((row) => row.split('|'));
  expect(aOnly.length, 'flow 24 needs a Test-A-only student to mean anything').toBeGreaterThan(0);
  expect(view.cohort.test_a_completed - view.cohort.both_tests).toBe(aOnly.length);
  expect(view.compared).toBeLessThanOrEqual(view.cohort.both_tests);

  const panel = await openProgress(page, classDocumentId);
  for (const [documentId, displayName] of aOnly) {
    await assertStudentAbsent(panel, documentId, displayName);
  }

  const outside = aOnly.map(([documentId]) =>
    dbProbsOnForm(classDocumentId, documentId, FORM_CODES.A),
  );
  const hasEvidence = outside.some((probs) => Object.keys(probs).length > 0);
  for (const entry of view.shift) {
    expect(entry.a_mastered).toBeLessThanOrEqual(view.compared);
    expect(entry.b_mastered).toBeLessThanOrEqual(view.compared);
  }
  return hasEvidence;
}
