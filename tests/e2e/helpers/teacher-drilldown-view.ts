import { expect, type Locator, type Page } from '@playwright/test';

import type {
  StudentDrillDownResponse,
  StudentTestResult,
} from '@/modules/teacher/types/teacher-result.types';

import { cat } from './i18n';
import { en } from './teacher-rail';
import { drillLabel, tile } from './teacher-drill-down-live';
import { bandFromServerCuts } from './teacher-tile-bands';
import { dbLatestPreviousLikelihoods } from './teacher-drilldown-bands';

// Task 055's DOM-side assertions for brief flows 17 and 18. Every expected string
// is built from the REAL catalog and every expected number from C-TR-2's own body or
// the `results` row Postgres holds — no percentage, band word or delta lives here.

const DIRECTION_KEY = { up: 'directionUp', down: 'directionDown', flat: 'directionFlat' } as const;

/** `attribute -> data-band` for one slot (`subskill-tile` or `subskill-pill`). */
export async function readBands(page: Page, slot: string): Promise<Record<string, string>> {
  return page.evaluate((name) => {
    const out: Record<string, string> = {};
    for (const node of document.querySelectorAll(`[data-slot="${name}"]`)) {
      out[node.getAttribute('data-attribute') ?? ''] = node.getAttribute('data-band') ?? '';
    }
    return out;
  }, slot);
}

/** `attribute -> the likelihood text as rendered` for one slot. */
export async function readPercentText(page: Page, slot: string): Promise<Record<string, string>> {
  return page.evaluate((name) => {
    const out: Record<string, string> = {};
    for (const node of document.querySelectorAll(`[data-slot="${name}"]`)) {
      const value = node.querySelector(`[data-slot="${name}-likelihood"]`);
      out[node.getAttribute('data-attribute') ?? ''] = value?.textContent?.trim() ?? '';
    }
    return out;
  }, slot);
}

/** `band -> painted ink` for one slot, as Chromium computes the token. */
export async function readInkByBand(page: Page, slot: string): Promise<Map<string, string>> {
  const painted = await page.locator(`[data-slot="${slot}"]`).evaluateAll((nodes) =>
    nodes.map((node) => ({
      band: node.getAttribute('data-band') ?? '',
      ink: getComputedStyle(node).color,
    })),
  );
  const inks = new Map<string, string>();
  for (const paint of painted) {
    const previous = inks.get(paint.band);
    if (previous) expect(paint.ink, `${slot} ${paint.band} changed colour`).toBe(previous);
    inks.set(paint.band, paint.ink);
  }
  return inks;
}

/** FLOW 17 — the full test card must come BEFORE the collapsed one, in the DOM. */
export async function expectTestCardOrder(page: Page): Promise<void> {
  const slots = '[data-slot="student-test-card"], [data-slot="collapsed-test-summary"]';
  const order = await page
    .locator(slots)
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-slot')));
  expect(order).toEqual(['student-test-card', 'collapsed-test-summary']);
}

/**
 * FLOW 17 — the wireframe's `was 62% ↑16` on EVERY tile of the newest test.
 * `previous_likelihood` is checked three ways: against the persisted posterior minus
 * the persisted gated delta, against the likelihood the COLLAPSED older test prints
 * for the same attribute (the screen may not contradict itself), and against
 * `likelihood - previous`, which must be the `delta` the line's words render.
 */
export async function expectDeltaLines(
  page: Page,
  latest: StudentTestResult,
  earlier: StudentTestResult,
  studentDocumentId: string,
): Promise<void> {
  const stored = dbLatestPreviousLikelihoods(studentDocumentId);
  await expect(page.locator('[data-slot="subskill-delta"]')).toHaveCount(latest.subskills.length);

  for (const subskill of latest.subskills) {
    const { attribute, likelihood, previous_likelihood: previous, delta } = subskill;
    if (likelihood === null || previous === null || delta === null) {
      throw new Error(`[e2e] ${attribute} carries no reportable comparison on the newest test`);
    }
    expect(stored[attribute], `${attribute} vs results.attributes prob - delta`).toBe(previous);
    const older = earlier.subskills.find((item) => item.attribute === attribute);
    expect(older?.likelihood, `${attribute} "was" vs the collapsed card`).toBe(previous);
    expect(likelihood - previous, `${attribute} delta must add up on screen`).toBe(delta);

    const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
    const line = tile(page, attribute).locator('[data-slot="subskill-delta"]');
    await expect(line).toHaveAttribute('data-direction', direction);
    const key = `Teacher.results.progress.${DIRECTION_KEY[direction]}`;
    const magnitude = cat(en, key).replace('{change}', `${Math.abs(delta)}`);
    const was = drillLabel('previousLikelihood').replace('{previous}', `${previous}`);
    // Two sibling spans separated by a flex gap, so textContent carries no space.
    await expect(line).toHaveText(`${was}${magnitude}`);
  }
}

/**
 * FLOW 17's comparison strip — `Overall score 49 → 53` and `4 improved · 1 stable ·
 * 2 regressed`, printed from C-TR-2's `progress` object VERBATIM (subskill COUNTS).
 */
export async function expectComparisonStrip(
  page: Page,
  drill: StudentDrillDownResponse,
): Promise<void> {
  const [latest, earlier] = drill.tests;
  const progress = drill.progress;
  if (!progress) throw new Error('[e2e] C-TR-2 sent no progress object for this pair');

  const strip = page.locator('[data-slot="student-comparison-strip"]');
  await expect(strip).toHaveAttribute('data-from', earlier.variant);
  await expect(strip).toHaveAttribute('data-to', latest.variant);
  await expect(strip.locator('[data-stat="subskills"] dd')).toContainText(
    drillLabel('subskillCounts')
      .replace('{improved}', `${progress.improved}`)
      .replace('{stable}', `${progress.stable}`)
      .replace('{regressed}', `${progress.regressed}`),
  );
  await expect(strip.locator('[data-stat="overall-score"] dd')).toContainText(
    drillLabel('scoreArrow')
      .replace('{from}', `${earlier.score}`)
      .replace('{to}', `${latest.score}`),
  );
}

/**
 * FLOW 18 — the collapsed older test: ONE summary line carrying the date, the overall
 * score and the ACARA phase, plus one pill per subskill and NO tile grid.
 */
export async function expectCollapsedSummary(
  collapsed: Locator,
  earlier: StudentTestResult,
  mediumDate: (iso: string) => string,
): Promise<void> {
  const { completed_at: completedAt, score, acara_phase: phase } = earlier;
  if (completedAt === null || score === null || phase === null) {
    throw new Error(`[e2e] the collapsed Test ${earlier.variant} lost a summary value`);
  }
  await expect(collapsed).toHaveAttribute('data-variant', earlier.variant);
  await expect(collapsed.getByRole('heading', { level: 2 })).toHaveText(
    drillLabel('testHeading').replace('{variant}', earlier.variant),
  );
  await expect(collapsed.locator('[data-slot="subskill-tile"]')).toHaveCount(0);
  await expect(collapsed.locator('[data-slot="subskill-tile-grid"]')).toHaveCount(0);
  await expect(collapsed.locator('[data-slot="subskill-pill"]')).toHaveCount(
    earlier.subskills.length,
  );
  await expect(collapsed.locator('[data-slot="collapsed-test-meta"]')).toHaveText(
    [
      drillLabel('completedOn').replace('{date}', mediumDate(completedAt)),
      drillLabel('collapsedScore').replace('{score}', `${score}`),
      drillLabel('collapsedPhase').replace('{phase}', phase),
    ].join(drillLabel('metaSeparator')),
  );
}

/**
 * …and its pills are genuinely COLOURED by the server's band: the crosswalk name,
 * the server's likelihood, `data-band` = `status` (which the echoed cuts imply),
 * more than one band in the row, one colour per band, and — for every band the
 * full card also shows — the SAME ink as that card's tiles.
 */
export async function expectPillsColouredByBand(
  page: Page,
  collapsed: Locator,
  earlier: StudentTestResult,
  bands: { mastered_cut: number; approaching_cut: number },
): Promise<void> {
  for (const subskill of earlier.subskills) {
    const pill = collapsed.locator(
      `[data-slot="subskill-pill"][data-attribute="${subskill.attribute}"]`,
    );
    await expect(pill).toHaveAttribute('data-band', subskill.status);
    expect(bandFromServerCuts(subskill.likelihood, bands)).toContain(subskill.status);
    await expect(pill).toContainText(subskill.name);
    const value = pill.locator('[data-slot="subskill-pill-likelihood"]');
    // An unassessed attribute prints NO percentage — the other honest branch.
    if (subskill.likelihood === null) await expect(value).toHaveCount(0);
    else
      await expect(value).toHaveText(
        drillLabel('likelihoodValue').replace('{likelihood}', `${subskill.likelihood}`),
      );
  }

  const pillInk = await readInkByBand(page, 'subskill-pill');
  const tileInk = await readInkByBand(page, 'subskill-tile');
  expect(pillInk.size, 'the pill row must be coloured, not one flat tint').toBeGreaterThan(1);
  expect(new Set(pillInk.values()).size, 'each band owns one colour').toBe(pillInk.size);
  const shared = [...pillInk.keys()].filter((band) => tileInk.has(band));
  expect(shared.length, 'pills and tiles share no band to compare').toBeGreaterThan(0);
  for (const band of shared) expect(pillInk.get(band), band).toBe(tileInk.get(band));
}
