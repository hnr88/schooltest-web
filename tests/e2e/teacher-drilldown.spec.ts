import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { SCREENSHOTS } from './helpers/teacher-rail';
import { mediumDate } from './helpers/teacher-past-sessions';
import {
  openClassResults,
  readLiveResults,
  signedInTeacherPage,
  type LiveResults,
} from './helpers/teacher-results-live';
import { studentRow } from './helpers/teacher-students-table';
import {
  activeConfigBands,
  expectDrillDownReady,
  expectSubskillTiles,
  openDrillDown,
  readDrillDownLive,
  tiles,
} from './helpers/teacher-drill-down-live';
import { bandFromServerCuts, expectTilesPaintedByServerBand } from './helpers/teacher-tile-bands';
import {
  dbCompletedFormCodes,
  dbLatestProbs,
  findBothTestsSubject,
  FORM_CODES,
  masteryBandsJson,
  retunedCuts,
  writeMasteryBands,
  type BothTestsSubject,
  type MasteryBandsRow,
} from './helpers/teacher-drilldown-bands';
import {
  expectCollapsedSummary,
  expectComparisonStrip,
  expectDeltaLines,
  expectPillsColouredByBand,
  expectTestCardOrder,
  readBands,
  readPercentText,
} from './helpers/teacher-drilldown-view';

// BRIEF FLOWS 17, 18 and 28 (.qa/E2E-FLOWS.md) on the REAL app (:3000), the REAL
// Strapi (:5500) and the REAL Postgres (:5540):
//   17 both tests done → Test B first, every tile carrying its delta
//   18 both tests done → Test A collapsed to a summary row of coloured pills
//   28 retuning Config.teacher_mastery_bands MOVES the tile colour bands
// The subject student is DISCOVERED (the first with a comparable A→B pair, so no
// delta is invented), the retuned cuts are computed from the posteriors Postgres
// stores, and the ORIGINAL cut pair — a GLOBAL row — is restored and re-proven
// through the live page before this file ends.
test.describe.configure({ mode: 'serial' });

let live: LiveResults;
let page: Page;
let subject: BothTestsSubject;
let originalBands: string;

test.beforeAll(async ({ browser, playwright }) => {
  live = await readLiveResults(playwright);
  subject = await findBothTestsSubject(
    playwright,
    live.classes.map((owned) => owned.class_document_id),
  );
  originalBands = masteryBandsJson();
  page = await signedInTeacherPage(browser);
});

test.afterAll(async () => {
  // Safety net: this lane mutates a GLOBAL config row, so it is restored here too.
  writeMasteryBands(JSON.parse(originalBands) as MasteryBandsRow);
  expect(masteryBandsJson()).toBe(originalBands);
  await page.close();
});

test('flow 17 — Test B shows first and every tile carries the server delta', async () => {
  const [latest, earlier] = subject.drill.tests;

  // Recency is the PERSISTED order: the newest complete sitting is the one on the
  // Test B form — the server's own constant, never a form-code literal.
  const formCodes = dbCompletedFormCodes(subject.studentDocumentId);
  expect(formCodes.slice(0, 2)).toEqual([FORM_CODES.B, FORM_CODES.A]);
  expect(FORM_CODES[latest.variant]).toBe(formCodes[0]);
  expect(FORM_CODES[earlier.variant]).toBe(formCodes[1]);

  // A REAL click on the row, from the Students table of the subject's own class.
  await openClassResults(page, subject.classDocumentId);
  await studentRow(page, subject.studentDocumentId).locator('th[scope="row"] a').click();
  await expectDrillDownReady(page, subject.studentDocumentId);

  // Exactly ONE test is shown in full, it is Test B, and it precedes the collapsed one.
  const fullCard = page.locator('[data-slot="student-test-card"]');
  await expect(fullCard).toHaveCount(1);
  await expect(fullCard).toHaveAttribute('data-variant', latest.variant);
  await expectTestCardOrder(page);
  await expectSubskillTiles(page, subject.drill, subject.studentDocumentId);
  await expectDeltaLines(page, latest, earlier, subject.studentDocumentId);

  // The comparison strip prints C-TR-2's own progress object, not a recomputation.
  await expectComparisonStrip(page, subject.drill);

  // Persistence: the deltas survive a full reload — they are read, not held.
  await page.reload();
  await expectDrillDownReady(page, subject.studentDocumentId);
  await expectDeltaLines(page, latest, earlier, subject.studentDocumentId);
  await page.screenshot({
    path: path.join(SCREENSHOTS, 'flow-17-test-b-first-with-deltas.png'),
    animations: 'disabled',
    fullPage: true,
  });
});

test('flow 18 — Test A collapses to one summary row of coloured pills', async () => {
  const [latest, earlier] = subject.drill.tests;
  // Deep link, so the collapsed row is proven to be this page's own state.
  await openDrillDown(page, subject.classDocumentId, subject.studentDocumentId);

  const collapsed = page.locator('[data-slot="collapsed-test-summary"]');
  await expect(collapsed).toHaveCount(1);
  await expectCollapsedSummary(collapsed, earlier, mediumDate);
  await expect(tiles(page)).toHaveCount(latest.subskills.length);
  await expectPillsColouredByBand(page, collapsed, earlier, subject.drill.bands);

  await page.reload();
  await expectDrillDownReady(page, subject.studentDocumentId);
  await expectCollapsedSummary(collapsed, earlier, mediumDate);
  await page.screenshot({
    path: path.join(SCREENSHOTS, 'flow-18-test-a-collapsed-pills.png'),
    animations: 'disabled',
    fullPage: true,
  });
});

test('flow 28 — retuning Config.teacher_mastery_bands moves the colour bands', async ({
  playwright,
}) => {
  await openDrillDown(page, subject.classDocumentId, subject.studentDocumentId);
  const before = {
    bands: activeConfigBands(),
    tiles: await readBands(page, 'subskill-tile'),
    pills: await readBands(page, 'subskill-pill'),
    percent: await readPercentText(page, 'subskill-tile'),
  };
  expect(subject.drill.bands).toEqual(before.bands);

  const retuned = retunedCuts(dbLatestProbs(subject.studentDocumentId), before.bands);
  const legend = page.locator('[data-slot="mastery-legend"]').first();
  try {
    expect(JSON.parse(writeMasteryBands(retuned)) as MasteryBandsRow).toEqual(retuned);

    // A RELOAD ONLY — no code change, no restart: the page re-reads the server.
    await page.reload();
    await expectDrillDownReady(page, subject.studentDocumentId);
    await expect(legend).toHaveAttribute('data-mastered-cut', `${retuned.mastered_cut}`);
    await expect(legend).toHaveAttribute('data-approaching-cut', `${retuned.approaching_cut}`);

    const moved = await readDrillDownLive(
      playwright,
      subject.classDocumentId,
      subject.studentDocumentId,
    );
    expect(moved.bands).toEqual(retuned);
    await expectTilesPaintedByServerBand(page, moved, new Map());

    // The BANDS moved; the measurement did not.
    const after = {
      tiles: await readBands(page, 'subskill-tile'),
      pills: await readBands(page, 'subskill-pill'),
      percent: await readPercentText(page, 'subskill-tile'),
    };
    expect(after.percent).toEqual(before.percent);
    const ladder = ['not_yet', 'approaching', 'mastered'];
    const shifts = Object.keys(before.tiles).map(
      (key) => ladder.indexOf(after.tiles[key]) - ladder.indexOf(before.tiles[key]),
    );
    expect(
      shifts.some((shift) => shift !== 0),
      'no tile changed band',
    ).toBe(true);
    for (const subskill of moved.tests[0].subskills) {
      expect(bandFromServerCuts(subskill.likelihood, retuned)).toContain(subskill.status);
    }
    await page.screenshot({
      path: path.join(SCREENSHOTS, 'flow-28-bands-retuned.png'),
      animations: 'disabled',
      fullPage: true,
    });
  } finally {
    expect(writeMasteryBands(before.bands)).toBe(originalBands);
  }

  // RESTORED — and proven restored through the same live page, not just in SQL.
  await page.reload();
  await expectDrillDownReady(page, subject.studentDocumentId);
  await expect(legend).toHaveAttribute('data-mastered-cut', `${before.bands.mastered_cut}`);
  await expect(legend).toHaveAttribute('data-approaching-cut', `${before.bands.approaching_cut}`);
  expect(await readBands(page, 'subskill-tile')).toEqual(before.tiles);
  expect(await readBands(page, 'subskill-pill')).toEqual(before.pills);
  expect(masteryBandsJson()).toBe(originalBands);
});
