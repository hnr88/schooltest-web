import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { cat } from './helpers/i18n';
import { en, SCREENSHOTS } from './helpers/teacher-rail';
import {
  openFirstClass,
  openResultsList,
  readClassStudentsLive,
  readLiveResults,
  signedInTeacherPage,
  type LiveResults,
} from './helpers/teacher-results-live';
import { expectStudentRows, studentCell, studentRow } from './helpers/teacher-students-table';
import {
  activeConfigBands,
  dbLatestPhase,
  expectDrillDownReady,
  expectSubskillTiles,
  openDrillDown,
  readDrillDownLive,
} from './helpers/teacher-drill-down-live';
import { expectTilesPaintedByServerBand } from './helpers/teacher-tile-bands';

// BRIEF FLOWS 13-16 (.qa/E2E-FLOWS.md) end to end on the REAL app (:3000), the
// REAL Strapi (:5500) and the REAL Postgres (:5540):
//   13 Results → class → the four tabs
//   14 Students rows carry status, score and ACARA level per test
//   15 clicking a row opens the drill-down subskill tiles with likelihood %
//   16 the tiles are green ≥ mastered cut, amber ≥ approaching cut, red below
// Every expected value is the SERVER'S: C-TR-1/C-TR-2 read live, the subskill
// names off the ACTIVE crosswalk row and the cuts off the ACTIVE Config row in
// Postgres. Flow 16 asserts the colour follows the server's `status` field — this
// file holds no 80 and no 50, so moving `Config.teacher_mastery_bands` moves what
// it expects (which is what brief flow 28 must be able to do).
test.describe.configure({ mode: 'serial' });

let live: LiveResults;
let page: Page;

const tabLabel = (key: string) => cat(en, `Teacher.results.tabs.${key}`);

test.beforeAll(async ({ browser, playwright }) => {
  live = await readLiveResults(playwright);
  page = await signedInTeacherPage(browser);
  await openResultsList(page);
  await openFirstClass(page, live);
});

test.afterAll(async () => {
  await page.close();
});

test('flow 13 — the class opens on four real tabs in wireframe order', async () => {
  await expect(page).toHaveURL(new RegExp(`/dashboard/results/${live.detail.class.document_id}$`));
  await expect(page.getByRole('heading', { level: 1 })).toContainText(live.detail.class.name);

  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveCount(4);
  await expect(tabs).toHaveText([
    tabLabel('students'),
    tabLabel('insights'),
    tabLabel('progress'),
    new RegExp(`${tabLabel('exit')}\\s*${tabLabel('comingSoon')}`),
  ]);
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');

  // Each tab must open its OWN real surface — no shared placeholder standing in.
  const surfaces = [
    'students-tab-panel',
    'teaching-insights',
    'class-progress',
    'exit-predictions-panel',
  ];
  for (const [index, slot] of surfaces.entries()) {
    await tabs.nth(index).click();
    await expect(tabs.nth(index)).toHaveAttribute('aria-selected', 'true');
    const panel = page.locator(`[data-slot="${slot}"]`);
    await expect(panel).toBeVisible({ timeout: 20_000 });
    // A panel that carries a live read must SETTLE — an error branch or a stuck
    // skeleton is a failure here, never a tab that merely "appeared".
    if (await panel.evaluate((node) => node.hasAttribute('data-status'))) {
      await expect(panel).toHaveAttribute('data-status', /^(ready|empty)$/, { timeout: 20_000 });
    }
  }
  await expect(page.locator('[data-slot="results-tab-pending"]')).toHaveCount(0);

  await tabs.nth(0).click();
  await page.screenshot({
    path: path.join(SCREENSHOTS, 'flow-13-results-four-tabs.png'),
    animations: 'disabled',
    fullPage: true,
  });
});

test('flow 14 — rows print the server status, score and ACARA level per test', async ({
  playwright,
}) => {
  await expectStudentRows(page, live.detail);

  // The row values survive a full reload: they are read live, not held in memory.
  await page.reload();
  await expect(page.locator('[data-surface="teacher-class-results"]')).toHaveAttribute(
    'data-status',
    'ready',
    { timeout: 20_000 },
  );
  await expectStudentRows(page, live.detail);

  // DOM = API = Postgres on the newest completed test of the first student: the
  // ACARA level in the cell is the phase the `results` row actually persists.
  const first = live.detail.students[0];
  const drill = await readDrillDownLive(playwright, live.detail.class.document_id, first.student_document_id);
  const latest = drill.tests[0];
  expect(latest, `[e2e] ${first.display_name} has no completed test`).toBeTruthy();
  const cell = latest.variant === 'A' ? first.test_a : first.test_b;
  expect(cell.acara_phase).toBe(latest.acara_phase);
  expect(dbLatestPhase(first.student_document_id)).toBe(latest.acara_phase);
  await expect(
    studentCell(studentRow(page, first.student_document_id), 'acara', latest.variant),
  ).toHaveText(latest.acara_phase ?? '');
  await expect(
    studentCell(studentRow(page, first.student_document_id), 'score', latest.variant),
  ).toHaveText(`${cell.score}`);
});

test('flow 15 — clicking a row opens subskill tiles with the likelihood %', async ({
  playwright,
}) => {
  const first = live.detail.students[0];
  const drill = await readDrillDownLive(
    playwright,
    live.detail.class.document_id,
    first.student_document_id,
  );

  // A REAL click on the row, from the Students table the previous flow asserted.
  await studentRow(page, first.student_document_id).locator('th[scope="row"] a').click();
  await expectDrillDownReady(page, first.student_document_id);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(drill.student.display_name);
  await expect(page.locator('[data-slot="subskill-tile-grid"]')).toBeVisible();
  await expectSubskillTiles(page, drill, first.student_document_id);

  // The tiles are the deep link's own state too, not a hand-off from the table.
  await page.reload();
  await expectDrillDownReady(page, first.student_document_id);
  await expectSubskillTiles(page, drill, first.student_document_id);
  await page.screenshot({
    path: path.join(SCREENSHOTS, 'flow-15-drill-down-subskill-tiles.png'),
    animations: 'disabled',
    fullPage: true,
  });
});

test('flow 16 — tile colour follows the SERVER band, green/amber/red', async ({ playwright }) => {
  const configBands = activeConfigBands();
  const seen = new Map<string, string>();
  const wanted = ['mastered', 'approaching', 'not_yet'];

  // Walk the teacher's real roster until every band has been PAINTED at least
  // once; no seeded student is assumed to hold all three.
  for (const owned of live.classes) {
    const roster = await readClassStudentsLive(playwright, owned.class_document_id);
    for (const student of roster.students) {
      const drill = await readDrillDownLive(
        playwright,
        owned.class_document_id,
        student.student_document_id,
      );
      if (drill.tests.length === 0) continue;

      // The cuts the page prints are the ACTIVE Config row's, echoed by C-TR-2.
      expect(drill.bands).toEqual(configBands);
      await openDrillDown(page, owned.class_document_id, student.student_document_id);
      const legend = page.locator('[data-slot="mastery-legend"]').first();
      await expect(legend).toHaveAttribute('data-mastered-cut', `${configBands.mastered_cut}`);
      await expect(legend).toHaveAttribute('data-approaching-cut', `${configBands.approaching_cut}`);

      await expectTilesPaintedByServerBand(page, drill, seen);
      if (wanted.every((band) => seen.has(band))) {
        await page.screenshot({
          path: path.join(SCREENSHOTS, 'flow-16-tile-colour-bands.png'),
          animations: 'disabled',
          fullPage: true,
        });
        break;
      }
    }
    if (wanted.every((band) => seen.has(band))) break;
  }

  // All three colour bands must genuinely be exhibited by real data, and each
  // band must own ONE distinct colour.
  expect([...seen.keys()].sort()).toEqual(expect.arrayContaining([...wanted].sort()));
  expect(new Set(seen.values()).size).toBe(seen.size);
});
