import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page, type Response } from '@playwright/test';

import { classRosterResponseSchema } from '@/modules/results/schemas/roster.schema';
import type { RosterRow } from '@/modules/results/types/roster.types';

import { expectNoHorizontalScroll } from '../helpers/teacher-a11y';
import { READY, expectNoNewErrors, frame, sectionTab, setAsideErrors } from '../helpers/teacher-class-detail';
import { cat } from '../helpers/i18n';
import { en, signIn } from '../helpers/teacher-rail';
import { watchErrors } from '../helpers/ui';

// S4 — Teacher Portal v2 Class progress (spec-teacher-portal-03). Real sign-in, real API, no
// interception. The rebuilt tab body: heading + sitting-count subtitle, the §3b dot map
// (one row per scored student, recomputed WITHOUT the view model from the roster body the
// page itself received), the §3c gains cards, the §3d subskill chips (eight band-carrying
// skills, Critical absent) and the §3e coming-soon class analysis.

const PROOFS = path.resolve(process.cwd(), 'tests', 'e2e', 'proofs', 'teacher-v2');
const label = (key: string) => cat(en, `TeacherPortal.progress.${key}`);

/** The en catalog's own plural ICU, resolved for a count of two or more. */
function otherBranch(template: string, count: number): string {
  const match = /other \{([^}]*)\}/.exec(template);
  if (match === null) throw new Error(`[e2e] no plural "other" branch in ${template}`);
  return match[1].replace('#', String(count));
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

type Scored = { sat_at: string; overall: number };

/** A result's SCORED history points (overall present), in server order. */
function scoredPoints(row: RosterRow): Scored[] {
  return (row.result?.history ?? []).flatMap((point) =>
    point.overall === null ? [] : [{ sat_at: point.sat_at, overall: point.overall }],
  );
}

/** The subtitle's sitting count: the most SCORED history points any row holds (unscored sittings never count). */
function sittingCount(roster: readonly RosterRow[]): number {
  return Math.max(0, ...roster.map((row) => scoredPoints(row).length));
}

/** The dot map's row set: every student whose result holds at least one scored overall point. */
function dotMapRowCount(roster: readonly RosterRow[]): number {
  return roster.filter((row) => scoredPoints(row).length > 0).length;
}

/** Spec 03 band edges (Beginning <45 ≤ Emerging <62 ≤ Developing <80 ≤ Consolidating), as a rank. */
function bandRank(score: number): number {
  return score >= 80 ? 3 : score >= 62 ? 2 : score >= 45 ? 1 : 0;
}

type Movement = 'up' | 'back' | 'held';

/**
 * Independently re-derived (no app code): a row MOVES only when the server says its delta is
 * reliable and it has ≥2 scored points; direction is latest vs FIRST scored overall. The summary
 * counts only moves that CHANGE band; everything else is "held".
 */
function expectedMovements(roster: readonly RosterRow[]) {
  const rows = roster.flatMap((row) => {
    const points = scoredPoints(row);
    if (points.length === 0) return [];
    const first = points[0].overall;
    const latest = points[points.length - 1].overall;
    const movement: Movement =
      row.result?.overall.delta_reliable !== true || points.length < 2 || latest === first
        ? 'held'
        : latest > first
          ? 'up'
          : 'back';
    return [{ id: row.student.document_id, movement, firstBand: bandRank(first), latestBand: bandRank(latest) }];
  });
  const up = rows.filter((row) => row.movement === 'up' && row.latestBand > row.firstBand).length;
  const down = rows.filter((row) => row.movement === 'back' && row.latestBand < row.firstBand).length;
  return { rows, up, down, held: rows.length - up - down };
}

/** The en classSummary sentence, resolved by hand ({total} pluralised). */
function summaryText(up: number, total: number, held: number, down: number): string {
  return `${up} of ${total} ${total === 1 ? 'student' : 'students'} moved up at least one ACARA phase since the first sitting; ${held} held and ${down} slipped.`;
}

/** Highest gains: reliable positive server deltas, largest first, top 4. Lowest: reliable deltas ascending, never a Highest student, top 4. */
function expectedGains(roster: readonly RosterRow[]) {
  const reliable = roster.flatMap((row) =>
    row.result !== null && row.result.overall.delta_reliable === true && row.result.overall.delta !== null
      ? [{ id: row.student.document_id, delta: row.result.overall.delta }]
      : [],
  );
  const top = reliable.filter((entry) => entry.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 4);
  const topIds = new Set(top.map((entry) => entry.id));
  const low = reliable.filter((entry) => !topIds.has(entry.id)).sort((a, b) => a.delta - b.delta).slice(0, 4);
  return { reliable, top, low };
}

test.use({ viewport: { width: 1440, height: 900 } });

test('S4 — Class progress heading and sitting count from the live roster', async ({ page }) => {
  test.setTimeout(180_000);
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
  await page.goto(`/dashboard/results/${classId}?tab=progress`);
  const roster = await rosterPromise;
  await expect(frame(page)).toHaveAttribute('data-status', READY, { timeout: 30_000 });
  await expect(sectionTab(page, 'progress')).toHaveAttribute('aria-selected', 'true');
  const tab = page.locator('[data-tab-panel="progress"] [data-slot="class-progress"]');
  await expect(tab).toHaveAttribute('data-status', 'ready');

  const sittings = sittingCount(roster);
  expect(sittings, 'the first class’s history spans at least two sittings').toBeGreaterThanOrEqual(2);
  await expect(tab).toHaveAttribute('data-sittings', String(sittings));
  await expect(tab.getByRole('heading', { level: 2, name: label('title'), exact: true })).toBeVisible();
  await expect(tab.getByText(otherBranch(label('subtitle'), sittings), { exact: true })).toBeVisible();

  // §3b — the dot map: header + sub, the growth/latest toggle, one row per scored student.
  const dotMap = tab.locator('[data-slot="progress-dot-map"]');
  await expect(dotMap).toBeVisible();
  await expect(dotMap.getByRole('heading', { level: 3, name: label('dotMap.title'), exact: true })).toBeVisible();
  await expect(dotMap.getByText(label('dotMap.sub'), { exact: true })).toBeVisible();
  await expect(dotMap.getByRole('button', { name: label('dotMap.modeGrowth'), exact: true })).toBeVisible();
  await expect(dotMap.getByRole('button', { name: label('dotMap.modeLatest'), exact: true })).toBeVisible();
  await expect(dotMap.getByText(label('dotMap.legendUp'), { exact: true })).toBeVisible();
  await expect(dotMap.getByText(label('dotMap.endLabel'), { exact: true })).toBeVisible();
  const expectedRows = dotMapRowCount(roster);
  expect(expectedRows, 'the first class has scored students to draw').toBeGreaterThanOrEqual(1);
  await expect(dotMap.locator('[data-slot="progress-dot-row"]')).toHaveCount(expectedRows);
  // The class summary sentence: the exact en copy with the independently re-derived counts.
  const moves = expectedMovements(roster);
  await expect(dotMap.locator('[data-slot="progress-dot-summary"]')).toHaveText(
    summaryText(moves.up, expectedRows, moves.held, moves.down),
  );
  // Every dot row carries the re-derived movement.
  for (const row of moves.rows) {
    await expect(dotMap.locator(`[data-slot="progress-dot-row"][data-student-id="${row.id}"]`)).toHaveAttribute(
      'data-movement',
      row.movement,
    );
  }
  // Growth mode draws exactly one arrowhead per moving row; "Latest only" draws none.
  const arrowheads = dotMap.locator('[data-slot="progress-dot-row"] div[style*="12px solid"]');
  await expect(arrowheads).toHaveCount(moves.rows.filter((row) => row.movement !== 'held').length);
  const latestOnly = dotMap.getByRole('button', { name: label('dotMap.modeLatest'), exact: true });
  await latestOnly.click();
  await expect(latestOnly).toHaveAttribute('aria-pressed', 'true');
  await expect(dotMap.getByRole('button', { name: label('dotMap.modeGrowth'), exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await expect(arrowheads).toHaveCount(0);
  await expect(dotMap.locator('[data-slot="progress-dot-row"] [data-dot="latest"]')).toHaveCount(expectedRows);
  await dotMap.getByRole('button', { name: label('dotMap.modeGrowth'), exact: true }).click();

  // §3c — the two gains cards, re-derived from the roster's SERVER deltas without the view model.
  const gains = expectedGains(roster);
  if (gains.reliable.length === 0) {
    test.info().annotations.push({
      type: 'fixture-gap',
      description: 'no roster row carries a reliable overall delta — the gains ranking is only checked empty',
    });
  }
  const gainIds = (slot: string) =>
    tab.locator(`[data-slot="${slot}"] [data-slot="progress-gain"]`).evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('data-student-id')),
    );
  await expect(tab.locator('[data-slot="progress-gains-top"]')).toBeVisible();
  await expect(tab.locator('[data-slot="progress-gains-low"]')).toBeVisible();
  const topIds = await gainIds('progress-gains-top');
  const lowIds = await gainIds('progress-gains-low');
  expect(topIds).toEqual(gains.top.map((entry) => entry.id));
  expect(lowIds).toEqual(gains.low.map((entry) => entry.id));
  expect(lowIds.filter((id) => topIds.includes(id)), 'Lowest never repeats a Highest student').toEqual([]);

  // Retired surfaces stay gone: no tiles, no class line chart, no watch list, no subskill trend sparklines.
  for (const slot of ['progress-tile-value', 'class-progress-chart', 'progress-watch-list', 'progress-subskill-trend']) {
    await expect(page.locator(`[data-slot="${slot}"]`), `${slot} is retired`).toHaveCount(0);
  }

  // §3d — subskill growth renders only once the roster carries BUG-009 `attribute_bands`; then it
  // shows exactly the eight band-carrying chips, Critical reading absent.
  const submap = tab.locator('[data-slot="progress-submap"]');
  const carriesBands = roster.some((row) => row.result?.history?.some((point) => point.attribute_bands !== undefined));
  if (carriesBands) {
    await expect(submap).toBeVisible();
    await expect(submap.locator('[data-slot="progress-submap-chip"]')).toHaveCount(8);
    expect(await submap.locator('[data-slot="progress-submap-chip"]').allInnerTexts()).not.toContain(
      cat(en, 'TeacherPortal.viewModel.skill.critical'),
    );
  } else {
    await expect(submap).toHaveCount(0);
  }

  // §3e — class analysis stays visible in its honest coming-soon state (no Copy button).
  const analysis = tab.locator('[data-slot="progress-analysis"]');
  await expect(analysis).toBeVisible();
  await expect(analysis).toContainText(label('analysis.comingSoon'));
  await expect(analysis.getByRole('button')).toHaveCount(0);

  await page.mouse.move(0, 0);
  await page.screenshot({ path: path.join(PROOFS, 'progress-tab.png'), animations: 'disabled' });
  expectNoNewErrors(errors, 'Class progress load');

  // No serious or critical axe finding in this tab's panel or the frame's skill strip, and no sideways scroll on a phone.
  const skillStrip = `[role="tablist"][aria-label="${cat(en, 'TeacherPortal.classDetail.skillsLabel')}"]`;
  await expect(page.locator(skillStrip).locator('[data-skill]')).toHaveCount(4);
  const axe = await new AxeBuilder({ page }).include('[data-tab-panel="progress"]').include(skillStrip).analyze();
  const severe = axe.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical');
  expect(severe.map((violation) => `${violation.id} → ${violation.nodes.map((node) => node.target.join(' ')).join(' | ')}`)).toEqual([]);
  await page.setViewportSize({ width: 375, height: 812 });
  await expectNoHorizontalScroll(page, 'Class progress @ 375px');
  expectNoNewErrors(errors, 'Class progress accessibility');
});
