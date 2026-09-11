import path from 'node:path';

import { expect, test, type Locator, type Page } from '@playwright/test';

import { cat, loadMessages } from '../helpers/i18n';
import { signIn } from '../helpers/teacher-rail';

// Teacher Portal v2 · S1 — the Classes screen (/dashboard/results) against the
// RUNNING web app and the REAL API as the seeded teacher. No route is stubbed:
// every expectation is read from the page's own GET /api/teacher/dashboard and
// GET /api/schools/me responses. Proof captures at 1440×900.

const en = loadMessages('en');
const C = 'TeacherPortal.classes';
const KIT = 'TeacherPortal.kit';
const PROOFS = path.resolve(process.cwd(), 'tests', 'e2e', 'proofs', 'teacher-v2');

interface WireClass {
  class_document_id: string;
  name: string;
  status: 'sitting_now' | 'scheduled' | 'no_tests_yet' | 'complete';
  open_session_count: number;
  student_count: number;
  test_a: { completed: number };
  test_b: { completed: number };
  top_gap: { name: string } | null;
  reading?: { average: number | null; delta: number | null; scored: number };
}
interface WireDashboard {
  classes: WireClass[];
  live_sessions: Array<{ sitting_document_id: string; code: string | null; class_name: string }>;
}

const STATUS_KEY = { sitting_now: 'sittingNow', scheduled: 'scheduled', no_tests_yet: 'noTests', complete: 'complete' } as const;

test.describe.configure({ mode: 'serial' });

let page: Page;
let wire: WireDashboard;
let schoolName: string | null = null;

const surface = () => page.locator('[data-surface="teacher-results"]');
const table = () => page.locator('[data-slot="teacher-classes-list"] table');
const count = () => page.locator('[data-slot="classes-count"]');
const isScored = (klass: WireClass) =>
  klass.reading ? klass.reading.scored > 0 : klass.test_a.completed + klass.test_b.completed > 0;

async function openClasses(target: Page): Promise<void> {
  const [dashboard, school] = await Promise.all([
    target.waitForResponse((res) => new URL(res.url()).pathname === '/api/teacher/dashboard' && res.status() === 200),
    target.waitForResponse((res) => new URL(res.url()).pathname === '/api/schools/me'),
    target.goto('/dashboard/results'),
  ]);
  wire = (await dashboard.json()) as WireDashboard;
  schoolName = school.ok() ? ((await school.json()) as { data: { name: string } }).data.name : null;
  await expect(surface()).toHaveAttribute('data-status', 'ready', { timeout: 60_000 });
}

async function clickCentre(target: Locator): Promise<void> {
  const box = await target.boundingBox();
  if (box === null) throw new Error('target has no box');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

test.beforeAll(async ({ browser }) => {
  test.setTimeout(180_000);
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  // Other agents open and close this teacher's sittings on the shared API, and
  // the list refetches; every assertion reads the LATEST response the page got.
  page.on('response', async (res) => {
    if (new URL(res.url()).pathname !== '/api/teacher/dashboard' || res.status() !== 200) return;
    try {
      wire = (await res.json()) as WireDashboard;
    } catch {
      // A response body the page navigated away from is not the rendered one.
    }
  });
  await signIn(page, 'teacher');
  await openClasses(page);
});

test.afterAll(async () => {
  await page?.close();
});

test('the list is the default body and renders the real classes, statuses and exports', async () => {
  expect(wire.classes.length, 'the seeded teacher owns classes').toBeGreaterThan(0);
  await expect(page.getByRole('heading', { level: 1, name: cat(en, `${C}.title`) })).toBeVisible();
  await expect(page.getByText(cat(en, `${C}.subtitle`))).toBeVisible();
  if (schoolName !== null) await expect(page.locator('[data-slot="teacher-page-meta"]')).toHaveText(schoolName);
  await expect(table()).toBeVisible();
  await expect(table().locator('tbody [data-slot="results-class-row"]')).toHaveCount(wire.classes.length);
  await expect(count()).toHaveText(new RegExp(`^${wire.classes.length} class`));

  for (const klass of wire.classes) {
    const row = table().locator(`[data-class-id="${klass.class_document_id}"]`);
    await expect(row).toContainText(klass.name);
    if (klass.open_session_count > 0) {
      await expect(row.locator('[data-slot="results-live-badge"]')).toHaveText(cat(en, `${KIT}.status.live`));
      await expect(row.locator('[data-slot="results-status"]')).toHaveCount(0);
    } else {
      await expect(row.locator('[data-slot="results-status"]')).toHaveText(cat(en, `${KIT}.status.${STATUS_KEY[klass.status]}`));
    }
    const average = klass.reading?.average ?? null;
    if (average !== null) await expect(row).toContainText(`${Math.round(average)}%`);
    await expect(row.locator('[data-export="pdf"]')).toHaveCount(isScored(klass) ? 1 : 0);
    await expect(row.locator('[data-export="llm"]')).toHaveCount(isScored(klass) ? 1 : 0);
  }

  const strip = page.locator('[data-slot="live-strip"]');
  await expect
    .poll(async () => (await strip.locator('[data-slot="live-strip-card"]').count()) === wire.live_sessions.length)
    .toBe(true);
  if (wire.live_sessions.length > 0) {
    for (const session of wire.live_sessions) {
      const card = strip.locator(`[data-slot="live-strip-card"][data-sitting-id="${session.sitting_document_id}"]`);
      await expect(card).toContainText(session.class_name);
      if (session.code !== null) await expect(card).toContainText(session.code);
    }
  } else {
    await expect(strip).toHaveCount(0);
  }
  await page.screenshot({ path: path.join(PROOFS, 'classes-list.png') });
});

test('search and the status filter narrow the count; the status filter survives in the URL', async () => {
  const search = page.getByRole('searchbox', { name: cat(en, `${C}.searchLabel`) });
  const first = wire.classes[0];
  const token = (first?.name.split(/\s+/).find((word) => word.length >= 4) ?? first?.name ?? '').toLowerCase();
  const matches = wire.classes.filter(
    (klass) => klass.name.toLowerCase().includes(token) || (klass.top_gap?.name ?? '').toLowerCase().includes(token),
  ).length;
  await search.fill(token);
  await expect(count()).toHaveText(new RegExp(`^${matches} class`));
  await search.fill('zz no class matches this');
  await expect(count()).toHaveText(/^0 classes/);
  await expect(page.getByText(cat(en, `${C}.noMatch`))).toBeVisible();
  await page.screenshot({ path: path.join(PROOFS, 'classes-search-empty.png') });
  await search.fill('');
  await expect(count()).toHaveText(new RegExp(`^${wire.classes.length} class`));
  await expect(table().locator('tbody [data-slot="results-class-row"]')).toHaveCount(wire.classes.length);

  // The status filter from a fresh load: the search box's own URL write is the
  // directory kit's debounced contract, not this screen's.
  await openClasses(page);
  const status = page.getByRole('combobox', { name: cat(en, `${C}.statusLabel`) });
  const pick =
    (['scheduled', 'complete', 'no_tests_yet', 'sitting_now'] as const).find(
      (value) => wire.classes.filter((klass) => klass.status === value).length !== wire.classes.length,
    ) ?? 'scheduled';
  const picked = wire.classes.filter((klass) => klass.status === pick).length;
  await status.selectOption(pick);
  await expect(page).toHaveURL(new RegExp(`status=${pick}`));
  await expect(count()).toHaveText(new RegExp(`^${picked} class`));
  await expect(table().locator('tbody [data-slot="results-class-row"]')).toHaveCount(picked);
  await page.screenshot({ path: path.join(PROOFS, 'classes-filtered-status.png') });
  await status.selectOption('all');
  await expect(count()).toHaveText(new RegExp(`^${wire.classes.length} class`));
});

test('the tiles toggle swaps the body, keeps every class, and returns to the list', async () => {
  const toggle = page.locator('[data-slot="directory-layout-toggle"]');
  await toggle.getByRole('button', { name: cat(en, `${KIT}.tiles`) }).click();
  await expect(page).toHaveURL(/layout=tiles/);
  const tiles = page.locator('[data-layout="tiles"] [data-slot="results-class-row"]');
  await expect(tiles).toHaveCount(wire.classes.length);
  await expect(table()).toHaveCount(0);
  await expect(tiles.first()).toContainText(cat(en, `${C}.tile.soon`));
  await page.screenshot({ path: path.join(PROOFS, 'classes-tiles.png') });
  await toggle.getByRole('button', { name: cat(en, `${KIT}.list`) }).click();
  await expect(table()).toBeVisible();
  await expect(page).not.toHaveURL(/layout=/);
});

test('PDF prints the class report and LLM downloads the class markdown, both from the API', async () => {
  const scored = wire.classes.find(isScored);
  test.skip(scored === undefined, 'no class of this teacher has results to export');
  if (scored === undefined) return;
  const row = table().locator(`[data-class-id="${scored.class_document_id}"]`);

  const [download] = await Promise.all([page.waitForEvent('download'), row.locator('[data-export="llm"]').click()]);
  expect(download.suggestedFilename()).toMatch(/\.md$/);

  const [popup] = await Promise.all([page.waitForEvent('popup'), row.locator('[data-export="pdf"]').click()]);
  await expect(popup.locator('h1')).toHaveText(scored.name, { timeout: 30_000 });
  await expect(popup.locator('.kpis')).toContainText(' / ');
  await popup.close();
});

test('clicking anywhere on a row opens that class', async () => {
  const first = wire.classes[0];
  if (first === undefined) return;
  const statusCell = table().locator(`[data-class-id="${first.class_document_id}"] td`).nth(5);
  await clickCentre(statusCell);
  await expect(page).toHaveURL(new RegExp(`/dashboard/results/${first.class_document_id}$`), { timeout: 30_000 });
});
