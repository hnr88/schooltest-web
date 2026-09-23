import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { bridgeApiCors } from './helpers/api-cors-bridge';
import { apiClassDetail, schoolAdminJwt, API } from './helpers/class-detail';
import { cat, loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';
import {
  AREA_CODES,
  areaLabel,
  areasOf,
  expectedAggregate,
  expectedMasteryTable,
  openBandedClass,
  openSchoolAnalytics,
  renderedAggregate,
  renderedMasteryTable,
} from './helpers/school-admin-diagnostic';
import { watchErrors } from './helpers/ui';

// BUG-008 follow-up — no single "Vocabulary" figure is left on the school-admin surfaces.
// Everyday (Vocab_A2) and Classroom (Vocab_B1) Vocabulary are two rows of the school aggregate
// (each counting each student once), two columns of the class mastery table and two rows of its
// drill-down (each its own strand, never the weaker of the two), and two tiles of the class
// student drill-down (a strand the sitting never reached claims nothing).
//
// Tests 1-2 are web-only and run against the live API. Test 3 reads the class-detail contract the
// API change introduces (vocab_a2 / vocab_b1, per-tile null) and passes only once that is deployed.
const en = loadMessages('en');
const PROOF = path.join(process.env.E2E_PROOF_DIR ?? path.resolve('test-results'), 'BUG-008-followup');
const EVERYDAY = cat(en, 'Report.attributes.Vocab_A2');
const CLASSROOM = cat(en, 'Report.attributes.Vocab_B1');
const RETIRED = cat(en, 'Teach.diagnostic.areas.R2');

async function shot(page: Page, name: string, target?: ReturnType<Page['locator']>): Promise<void> {
  await (target ?? page).screenshot({ path: path.join(PROOF, `${name}.png`), animations: 'disabled' });
}

test.describe.configure({ mode: 'serial' });
test.use({ viewport: { width: 1440, height: 900 } });
test.beforeAll(() => mkdirSync(PROOF, { recursive: true }));
test.beforeEach(async ({ context }) => bridgeApiCors(context));

test('school aggregate: Everyday and Classroom are two rows, each counting each student once', async ({ page }) => {
  test.setTimeout(180_000);
  const { bodies, table, failed } = await openSchoolAnalytics(page, watchErrors(page));
  const rendered = await renderedAggregate(table);
  const expected = expectedAggregate(bodies);
  expect(rendered).toEqual(expected.map((row) => ({ label: areaLabel(row.code), cells: row.counts.map(String) })));

  const labels = rendered.map((row) => row.label);
  expect(labels).toContain(EVERYDAY);
  expect(labels).toContain(CLASSROOM);
  expect(labels, 'the blended Vocabulary row is gone').not.toContain(RETIRED);

  // Counted once: a strand row's total is the number of students with a cell on that strand, and
  // never more than the students the diagnostics carry (the defect counted every student twice).
  const students = bodies.flatMap((body) => body.mastery);
  for (const [code, label] of [['Vocab_A2', EVERYDAY], ['Vocab_B1', CLASSROOM]] as const) {
    const row = rendered.find((entry) => entry.label === label)!;
    const total = row.cells.reduce((sum, cell) => sum + Number(cell), 0);
    const onStrand = students.filter((student) => student.attributes.some((attribute) => areasOf(attribute).includes(code))).length;
    expect(total, `${label} total`).toBe(onStrand);
    expect(total, `${label} counts each student at most once`).toBeLessThanOrEqual(students.length);
  }
  test.info().annotations.push({ type: 'aggregate', description: JSON.stringify(rendered) });
  await shot(page, '01-school-aggregate-two-vocabulary-rows', table);
  expect(failed, 'no failing request').toEqual([]);
});

test('mastery table + drill-down: an Everyday and a Classroom column, each its own strand', async ({ page }) => {
  test.setTimeout(180_000);
  const { bodies } = await openSchoolAnalytics(page, watchErrors(page));
  const target = await openBandedClass(page, bodies);
  const mastery = page.locator('[data-slot="mastery-table"]');
  await expect(mastery).toBeVisible();

  // The directory kit labels every cell with its column: one Everyday and one Classroom cell per
  // row, and no cell labelled with the blended "Vocabulary".
  const cells = await mastery
    .locator('[data-directory-row]')
    .first()
    .getByRole('cell')
    .evaluateAll((nodes) => nodes.map((node) => (node.textContent ?? '').replace(/\s+/g, ' ').trim()));
  expect(cells.filter((text) => text.endsWith(EVERYDAY))).toHaveLength(1);
  expect(cells.filter((text) => text.endsWith(CLASSROOM))).toHaveLength(1);
  expect(
    cells.filter((text) => text.endsWith(RETIRED) && !text.endsWith(EVERYDAY) && !text.endsWith(CLASSROOM)),
    'no blended Vocabulary column',
  ).toEqual([]);

  const expectedRows = expectedMasteryTable(target);
  expect(await renderedMasteryTable(mastery)).toEqual(expectedRows);
  // Each vocabulary cell is its OWN strand's wire status — never the weaker strand standing in.
  const vocabCells = await mastery
    .locator('[data-slot="mastery-area"][data-area="Vocab_A2"], [data-slot="mastery-area"][data-area="Vocab_B1"]')
    .count();
  expect(vocabCells).toBe(expectedRows.length * 2);
  await shot(page, '02-mastery-table-two-vocabulary-columns', mastery);

  // Drill into a student whose two strands differ when the class has one, else the first banded.
  const differ = expectedRows.findIndex((row) => row.areas[1] !== row.areas[3]);
  const index = differ >= 0 ? differ : expectedRows.findIndex((row) => row.areas.some((status) => status !== 'none' && status !== 'not_assessed'));
  const row = expectedRows[index]!;
  await mastery.locator('[data-directory-row]').nth(index).locator('[data-row-select]').click();
  const drilldown = page.locator('[data-slot="student-mastery-drilldown"]');
  await expect(drilldown).toContainText(row.ref);
  const areaRows = drilldown.locator('[data-slot="drilldown-area"]');
  await expect(areaRows).toHaveCount(AREA_CODES.length);
  expect(await areaRows.evaluateAll((rows) => rows.map((entry) => entry.getAttribute('data-status') ?? ''))).toEqual(row.areas);
  await expect(drilldown.locator('[data-area="Vocab_A2"]')).toContainText(EVERYDAY);
  await expect(drilldown.locator('[data-area="Vocab_B1"]')).toContainText(CLASSROOM);
  test.info().annotations.push({ type: 'drilldown', description: JSON.stringify(row) });
  await shot(page, '03-mastery-drilldown-two-vocabulary-rows', drilldown);
});

test('class student drill-down: Everyday and Classroom tiles; a strand never reached claims nothing (post-integration)', async ({
  page,
}) => {
  test.setTimeout(180_000);
  const jwt = await schoolAdminJwt(page.request);
  const list = await page.request.get(`${API}/api/schools/me/classes`, { headers: { Authorization: `Bearer ${jwt}` } });
  expect(list.status()).toBe(200);
  const classIds = ((await list.json()) as { data: { documentId: string }[] }).data.map((klass) => klass.documentId);

  // The case the reviewer found: a completed sitting that reached exactly ONE vocabulary strand.
  let found: { classId: string; studentId: string; slot: 'A' | 'B'; tiles: Record<string, string | null> } | null = null;
  for (const classId of classIds) {
    const detail = await apiClassDetail(page.request, jwt, classId);
    for (const student of detail.students) {
      for (const sitting of student.tests) {
        const tiles = sitting.subskills;
        if (tiles === null || (tiles.vocab_a2 === null) === (tiles.vocab_b1 === null)) continue;
        found = { classId, studentId: student.documentId, slot: sitting.test_id, tiles };
        break;
      }
      if (found) break;
    }
    if (found) break;
  }
  expect(found, 'a completed sitting that reached exactly one vocabulary strand').not.toBeNull();

  await loginAs(page, 'schoolAdmin');
  await page.goto(`/dashboard/school/classes/${found!.classId}/students/${found!.studentId}`);
  const card = page.locator(`section[aria-labelledby="test-${found!.slot}-heading"]`);
  await expect(card).toBeVisible({ timeout: 60_000 });
  const tiles = await card.locator('[data-slot="tint-tile"]').allInnerTexts();
  expect(tiles).toHaveLength(8);
  const verdictText = (wire: string | null) =>
    wire === null ? '—' : wire === 'mastered' ? cat(en, 'Classes.studentDetail.mastered') : cat(en, 'Classes.studentDetail.notYet');
  expect(tiles[1]).toContain(EVERYDAY);
  expect(tiles[1]).toContain(verdictText(found!.tiles.vocab_a2 ?? null));
  expect(tiles[3]).toContain(CLASSROOM);
  expect(tiles[3]).toContain(verdictText(found!.tiles.vocab_b1 ?? null));
  expect(tiles.some((text) => text.split('\n')[0]?.trim() === RETIRED), 'no blended Vocabulary tile').toBe(false);
  test.info().annotations.push({ type: 'single-strand sitting', description: JSON.stringify(found) });
  await shot(page, '04-class-student-two-vocabulary-tiles', card);
});
