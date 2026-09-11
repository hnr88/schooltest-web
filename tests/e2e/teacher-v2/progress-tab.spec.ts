import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page, type Response } from '@playwright/test';

import { DISPLAY_SKILL_ORDER } from '@/modules/results/lib/display-skills';
import { classRosterResponseSchema } from '@/modules/results/schemas/roster.schema';
import type { RosterRow } from '@/modules/results/types/roster.types';
import { classProgress } from '@/modules/teacher/lib/v2/class-progress';

import { expectNoHorizontalScroll } from '../helpers/teacher-a11y';
import { READY, expectNoNewErrors, frame, sectionTab, setAsideErrors } from '../helpers/teacher-class-detail';
import { cat } from '../helpers/i18n';
import { en, signIn } from '../helpers/teacher-rail';
import { watchErrors } from '../helpers/ui';

// S4 — Teacher Portal v2 Class progress (Teacher Portal v2.dc.html:873–1002; design shots
// class-detail-{complete,sitting}--progress*.png at 1440×900). Real sign-in, real API, no
// interception. Every number is recomputed WITHOUT the view model from the roster body the
// page itself received; the two lists must name students on it, in the view model's order.

type HistoryPoint = NonNullable<NonNullable<RosterRow['result']>['history']>[number];

const PROOFS = path.resolve(process.cwd(), 'tests', 'e2e', 'proofs', 'teacher-v2');
const THRESHOLD = 3;
const label = (key: string) => cat(en, `TeacherPortal.progress.${key}`);
const vm = (key: string) => cat(en, `TeacherPortal.viewModel.${key}`);
const fill = (template: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, String(value)), template);
const signed = (value: number) => (value < 0 ? `−${Math.abs(value)}` : `+${value}`);
const mean = (values: readonly number[]) => Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
const monthYear = (iso: string) =>
  new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso));

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

/** The server's own overall deltas: the only input the four tiles may use. */
function serverDeltas(roster: readonly RosterRow[]): number[] {
  return roster.flatMap((row) => {
    const delta = row.result?.overall.delta;
    return delta === null || delta === undefined ? [] : [delta];
  });
}

/** The class mean of `read` per sitting: histories right-aligned, unscored slots dropped, dated by their latest `sat_at`. */
function sittingMeans(roster: readonly RosterRow[], read: (point: HistoryPoint) => number | null) {
  const histories = roster.flatMap((row) => (row.result?.history ? [row.result.history] : []));
  const span = Math.max(0, ...histories.map((history) => history.length));
  const slots = Array.from({ length: span }, () => ({ values: [] as number[], satAt: '' }));
  for (const history of histories) {
    history.forEach((point, index) => {
      const value = read(point);
      if (value === null) return;
      const slot = slots[span - history.length + index];
      slot.values.push(value);
      if (point.sat_at > slot.satAt) slot.satAt = point.sat_at;
    });
  }
  return slots.flatMap((slot, index) =>
    slot.values.length === 0 ? [] : [{ n: index + 1, value: mean(slot.values), satAt: slot.satAt }],
  );
}

/** The en catalog's own plural ICU, resolved for a count of two or more. */
function otherBranch(template: string, count: number): string {
  const match = /other \{([^}]*)\}/.exec(template);
  if (match === null) throw new Error(`[e2e] no plural "other" branch in ${template}`);
  return match[1].replace('#', String(count));
}

test.use({ viewport: { width: 1440, height: 900 } });

test('S4 — Class progress per design: tiles, chart, lists and subskill trends from the live roster', async ({ page }) => {
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

  const overall = sittingMeans(roster, (point) => point.overall);
  expect(overall.length, 'the first class’s history spans at least two sittings').toBeGreaterThanOrEqual(2);
  await expect(tab.getByRole('heading', { level: 2, name: label('title'), exact: true })).toBeVisible();
  await expect(tab.getByText(otherBranch(label('subtitle'), overall.length), { exact: true })).toBeVisible();

  // The four tiles: the server's own deltas against the design's ±3.
  const deltas = serverDeltas(roster);
  expect(deltas.length, 'at least one student carries a server comparison').toBeGreaterThan(0);
  const tile = (id: string) => tab.locator(`[data-slot="progress-tile-value"][data-tile="${id}"]`);
  await expect(tile('meanShift')).toHaveText(fill(label('points'), { value: signed(mean(deltas)) }));
  await expect(tile('gained')).toHaveText(String(deltas.filter((delta) => delta >= THRESHOLD).length));
  await expect(tile('held')).toHaveText(String(deltas.filter((delta) => Math.abs(delta) < THRESHOLD).length));
  await expect(tile('slipped')).toHaveText(String(deltas.filter((delta) => delta <= -THRESHOLD).length));

  // The chart: one point per sitting the history holds, at that sitting's class average.
  const chart = tab.locator('[data-slot="class-progress-chart"]');
  await expect(chart).toHaveAttribute('data-points', String(overall.length));
  const points = chart.locator('[data-slot="class-chart-point"]');
  await expect(points).toHaveCount(overall.length);
  expect(await points.evaluateAll((nodes) => nodes.map((node) => Number(node.getAttribute('data-value'))))).toEqual(
    overall.map((point) => point.value),
  );
  for (const [index, point] of overall.entries()) {
    await expect(points.nth(index).locator('title')).toHaveText(
      fill(vm('chart.classTip'), { n: point.n, when: monthYear(point.satAt), value: point.value }),
    );
  }
  const [first, last] = [overall[0], overall[overall.length - 1]];
  const difference = signed(last.value - first.value);
  await expect(tab.locator('[data-slot="progress-summary"]')).toHaveText(
    fill(label('chart.summary'), { from: first.value, to: last.value, count: overall.length, difference }),
  );

  // Top progress / Students to watch: students on this roster, in the view model's order;
  // a top-progress student always carries a reliable positive server delta.
  const view = classProgress(roster);
  const byId = new Map(roster.map((row) => [row.student.document_id, row]));
  for (const mover of view.topProgress) {
    const served = byId.get(mover.studentDocumentId)?.result?.overall;
    expect(served?.delta_reliable === true && (served.delta ?? 0) > 0, `${mover.name}: reliable gain`).toBe(true);
  }
  for (const [variant, movers] of [['gains', view.topProgress], ['support', view.watch]] as const) {
    const rows = tab.locator(`[data-slot="progress-watch-list"][data-variant="${variant}"] [data-slot="progress-mover"]`);
    await expect(rows).toHaveCount(movers.length);
    for (const [index, mover] of movers.entries()) {
      const row = byId.get(mover.studentDocumentId);
      if (row === undefined) throw new Error(`[e2e] ${mover.name} is not on the roster`);
      expect(row.student.name.startsWith(mover.firstName)).toBe(true);
      const shown = rows.nth(index);
      await expect(shown).toHaveAttribute('data-student-id', row.student.document_id);
      await expect(shown.locator('[data-slot="progress-mover-name"]')).toHaveText(mover.firstName);
      const score = row.result?.overall.domain_score ?? null;
      await expect(shown.locator('[data-slot="progress-mover-score"]')).toHaveText(
        score === null ? cat(en, 'TeacherPortal.kit.noValue') : fill(label('percent'), { value: score }),
      );
    }
  }

  // Subskill movement: one card per subskill with a class mean on record, weakest now first.
  const withData = DISPLAY_SKILL_ORDER.flatMap((skill) => {
    const means = sittingMeans(roster, (point) => point.attributes[skill]);
    return means.length === 0 ? [] : [{ skill, now: means[means.length - 1].value }];
  });
  const trends = tab.locator('[data-slot="progress-subskill-trend"]');
  await expect(trends).toHaveCount(withData.length);
  for (const { skill, now } of withData) {
    await expect(tab.locator(`[data-slot="progress-subskill-trend"][data-skill="${skill}"]`)).toContainText(
      fill(label('subskills.now'), { value: now }),
    );
  }
  expect(await trends.evaluateAll((nodes) => nodes.map((node) => Number(node.getAttribute('data-now'))))).toEqual(
    withData.map((entry) => entry.now).sort((a, b) => a - b),
  );
  await expect(tab.getByText(label('footnote'), { exact: true })).toBeVisible();

  await page.mouse.move(0, 0);
  await page.screenshot({ path: path.join(PROOFS, 'progress-tab.png'), animations: 'disabled' });
  await tab.locator('[data-slot="progress-subskill-trends"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(PROOFS, 'progress-tab-scroll.png'), animations: 'disabled' });
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
