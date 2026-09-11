/**
 * E2E proof — the ops Schools LIST surface (BUG-004 pill design + select
 * display fix). Signs in as ops through the real /sign-in form (roles.ts
 * loginAs — same helper the auth-fixture drives) and proves, with
 * screenshots into tests/proofs/schools/:
 *
 *  1. the list loads: caption + 32px title, 44px pill search, Create pill,
 *     status pill tabs whose counts equal GET /api/ops/schools
 *     meta.status_counts (curl-equivalent, same session role);
 *  2. every pill select AND the sort select show the selected OPTION LABEL
 *     ('NSW', 'Government', 'Name (A-Z)'...), never the raw key
 *     ('name:asc', 'government', '__all') — captured open AND closed;
 *  3. the pill filters actually filter (URL param + row/total change), the
 *     sort pill changes order, Clear filters resets;
 *  4. a whole-row click navigates to the school detail;
 *  5. search narrows the list and round-trips q in the URL;
 *  6. bulk selection raises the in-card bulk bar and Export downloads a CSV
 *     whose data-row count roughly matches the filtered list;
 *  7. pagination pills change rows + URL.
 */
import { mkdir } from 'node:fs/promises';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { loginAs } from '../helpers/roles';
import { fixtureAuthContext, fixtureHeaders } from '../helpers/ops-portal';

const OUT = path.resolve(__dirname, '../../proofs/schools');
const SCREEN_PATH = '/dashboard/ops/schools';
const ACTION_TIMEOUT = 30_000;

interface SchoolsMeta {
  pagination: { page: number; pageSize: number; pageCount: number; total: number };
  status_counts: Record<string, number>;
}

async function schoolsMeta(request: APIRequestContext): Promise<SchoolsMeta> {
  const { jwt } = await fixtureAuthContext(request, 'ops');
  if (jwt === null) throw new Error('ops fixture returned no JWT');
  const res = await request.get('http://localhost:5500/api/ops/schools', {
    headers: fixtureHeaders('ops', jwt),
  });
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { meta: SchoolsMeta }).meta;
}

async function shot(page: Page, name: string): Promise<void> {
  await mkdir(OUT, { recursive: true });
  await page.screenshot({ path: path.join(OUT, name), fullPage: true });
}

async function openSchools(page: Page): Promise<void> {
  await page.goto(SCREEN_PATH, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-slot="ops-schools"]')).toBeVisible({ timeout: ACTION_TIMEOUT });
  await expect(page.locator('[data-directory-row]').first()).toBeVisible({ timeout: ACTION_TIMEOUT });
}

/** The toolbar pill selects, in DOM order: state, sector, plan, onboarding. */
const FILTER_SELECTS = [
  { name: 'State', option: 'NSW', rawKey: 'NSW' },
  { name: 'Sector', option: 'Government', rawKey: 'government' },
  { name: 'Plan', option: 'Pilot', rawKey: 'pilot' },
  { name: 'Onboarding', option: 'Not started', rawKey: 'not_started' },
] as const;

test.describe.configure({ mode: 'default' });

test.beforeEach(async ({ page }) => {
  await loginAs(page, 'ops');
});

test('1 — list loads: caption, 32px title, pill search, Create pill, pill tabs with server counts', async ({
  page,
  request,
}) => {
  const meta = await schoolsMeta(request);
  await openSchools(page);

  // Caption + title (32px per the ops design).
  await expect(page.getByText('Every school on SchoolTest, with live counts.')).toBeVisible();
  const title = page.getByRole('heading', { name: 'Schools', exact: true });
  await expect(title).toBeVisible();
  const fontSize = await title.evaluate((el) => getComputedStyle(el).fontSize);
  expect(fontSize).toBe('32px');

  // 44px pill search + Create pill in the header row.
  const search = page.getByTestId('ops-schools-search');
  await expect(search).toBeVisible();
  const searchClass = (await search.getAttribute('class')) ?? '';
  expect(searchClass).toContain('rounded-full');
  expect(await search.evaluate((el) => getComputedStyle(el).height)).toBe('44px');
  const create = page.getByTestId('ops-create-school');
  await expect(create).toBeVisible();
  expect(((await create.textContent()) ?? '').trim()).toBe('Create school');
  // rounded-full: Tailwind v4 emits calc(infinity * 1px), so parse, not equal.
  expect(parseFloat(await create.evaluate((el) => getComputedStyle(el).borderRadius))).toBeGreaterThan(20);

  await shot(page, '01-list-header.png');

  // Status pill tabs carry meta.status_counts verbatim (the 'all' pill count
  // equals the server total; the pending_setup pill equals its server count).
  const pills = page.locator('[data-slot="ops-schools-pills"]');
  await expect(pills).toBeVisible();
  for (const [key, slot] of [
    ['all', 'ops-schools-pill-all'],
    ['pending_setup', 'ops-schools-pill-pending_setup'],
    ['archived', 'ops-schools-pill-archived'],
  ] as const) {
    const pill = page.locator(`[data-slot="${slot}"]`);
    await expect(pill).toBeVisible();
    await expect(pill).toContainText(String(meta.status_counts[key]));
  }
  await shot(page, '02-status-pills-counts.png');
});

test('2 — select display fix: pill selects and sort select show the OPTION LABEL, never the raw key', async ({
  page,
}) => {
  await openSchools(page);

  for (const def of FILTER_SELECTS) {
    const select = page.getByRole('combobox', { name: def.name, exact: true });
    await expect(select).toBeVisible({ timeout: ACTION_TIMEOUT });
    // Unfiltered: the sentinel renders as its "All …" LABEL, never '__all__'.
    const idle = ((await select.textContent()) ?? '').trim();
    expect(idle.toLowerCase()).toContain('all');
    expect(idle).not.toContain('__all');

    await select.click();
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();
    await shot(page, `03-select-${def.name.toLowerCase()}-open.png`);
    await page.getByRole('option', { name: def.option, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${def.name.toLowerCase()}=`));
    // CLOSED WITH SELECTION: the trigger shows the option LABEL.
    await expect(select).toContainText(def.option);
    const closed = ((await select.textContent()) ?? '').trim();
    expect(closed).not.toContain('__all');
    // The raw API key must not leak when it differs from the label.
    if (def.rawKey !== def.option) {
      expect(closed).not.toContain(def.rawKey);
    }
    await shot(page, `04-select-${def.name.toLowerCase()}-closed.png`);
  }

  // The sort select (right-aligned pill) — label 'Name (A-Z)', never 'name:asc'.
  const sort = page.getByRole('combobox', { name: 'Sort', exact: true });
  await expect(sort).toBeVisible({ timeout: ACTION_TIMEOUT });
  await sort.click();
  await expect(page.getByRole('listbox')).toBeVisible();
  await shot(page, '03-select-sort-open.png');
  await page.getByRole('option', { name: 'Newest first', exact: true }).click();
  await expect(page).toHaveURL(/sort=createdAt%3Adesc|sort=createdAt:desc/);
  await expect(sort).toContainText('Newest first');
  expect((((await sort.textContent()) ?? '').trim())).not.toContain('createdAt:desc');
  await shot(page, '04-select-sort-closed.png');
});

test('3 — pill filters actually filter; sort changes order; Clear filters resets', async ({
  page,
  request,
}) => {
  await openSchools(page);
  const totalAll = (await schoolsMeta(request)).pagination.total;
  const showing = page.locator('[data-slot="directory"] [role="status"]').filter({
    hasText: /schools/,
  });
  await expect(showing.first()).toContainText(String(totalAll));

  // State=NSW: URL carries the param, the server total for the scope changes,
  // and every rendered row's meta line mentions NSW.
  const state = page.getByRole('combobox', { name: 'State', exact: true });
  await state.click();
  await page.getByRole('option', { name: 'NSW', exact: true }).click();
  await expect(page).toHaveURL(/state=NSW/);
  await expect(showing.first()).not.toContainText(`of ${totalAll} schools`);
  const rowCount = await page.locator('[data-directory-row]').count();
  expect(rowCount).toBeGreaterThan(0);
  for (let i = 0; i < Math.min(rowCount, 5); i += 1) {
    await expect(page.locator('[data-directory-row]').nth(i)).toContainText(/NSW/, {
      timeout: 10_000,
    });
  }
  await shot(page, '05-filter-state-nsw.png');

  // Sort pill changes the visible order (Newest first ≠ Name A-Z first row).
  const firstNameAsc = await page
    .locator('[data-directory-row]')
    .first()
    .locator('span.text-\\[15\\.5px\\]')
    .first()
    .textContent();
  const sort = page.getByRole('combobox', { name: 'Sort', exact: true });
  await sort.click();
  await page.getByRole('option', { name: 'Newest first', exact: true }).click();
  await expect(page).toHaveURL(/sort=createdAt%3Adesc|sort=createdAt:desc/);
  await page.waitForTimeout(800);
  const firstCreatedDesc = await page
    .locator('[data-directory-row]')
    .first()
    .locator('span.text-\\[15\\.5px\\]')
    .first()
    .textContent();
  expect((firstCreatedDesc ?? '').trim()).not.toBe((firstNameAsc ?? '').trim());
  await shot(page, '06-sort-newest-first.png');

  // Clear filters resets URL and scope.
  await page.getByRole('button', { name: 'Clear all', exact: true }).click();
  await expect(page).not.toHaveURL(/state=/);
  await expect(page).not.toHaveURL(/sort=/);
  await expect(showing.first()).toContainText(String(totalAll));
  await shot(page, '07-clear-filters-reset.png');
});

test('4 — whole-row click navigates to the school detail', async ({ page }) => {
  await openSchools(page);
  const row = page.locator('[data-directory-row]').first();
  // Click a NON-interactive part of the row (the students count cell), not
  // the name link — the whole row is the primary action (BUG-005).
  await row.click({ position: { x: 500, y: 20 } });
  await expect(page).toHaveURL(/\/dashboard\/ops\/schools\/(?!$)[a-z0-9]+/i, { timeout: ACTION_TIMEOUT });
  await expect(page.locator('[data-slot="ops-school-detail"]')).toBeVisible({ timeout: ACTION_TIMEOUT });
  await shot(page, '08-row-click-detail.png');
});

test('5 — search narrows the list and round-trips q in the URL', async ({ page }) => {
  await openSchools(page);
  const search = page.getByTestId('ops-schools-search');
  await search.fill('Abbotsleigh');
  await expect(page).toHaveURL(/q=Abbotsleigh/, { timeout: ACTION_TIMEOUT });
  await expect(page.locator('[data-directory-row]')).toHaveCount(1, { timeout: ACTION_TIMEOUT });
  await expect(page.locator('[data-directory-row]').first()).toContainText('Abbotsleigh');
  await shot(page, '09-search-narrowed.png');
});

test('6 — bulk bar appears on selection and Export CSV downloads the scoped file', async ({
  page,
}) => {
  await openSchools(page);
  // Narrow the scope first so the CSV row count is checkable: state=NSW.
  const state = page.getByRole('combobox', { name: 'State', exact: true });
  await state.click();
  await page.getByRole('option', { name: 'NSW', exact: true }).click();
  await expect(page).toHaveURL(/state=NSW/);
  await expect(page.locator('[data-directory-row]').first()).toBeVisible({ timeout: ACTION_TIMEOUT });
  const visibleRows = await page.locator('[data-directory-row]').count();

  // Tick two row checkboxes.
  const rows = page.locator('[data-directory-row]');
  await rows.nth(0).getByRole('checkbox').click();
  await rows.nth(1).getByRole('checkbox').click();

  const bulkBar = page.locator('[data-slot="directory-bulk-bar"]');
  await expect(bulkBar).toBeVisible();
  await expect(bulkBar).toContainText(/2/);
  await shot(page, '10-bulk-bar.png');

  // Export CSV (scope = the CURRENT FILTERS, not the 2 ticked rows).
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: ACTION_TIMEOUT }),
    bulkBar.getByRole('button', { name: 'Export', exact: true }).click(),
  ]);
  const filename = download.suggestedFilename();
  expect(filename).toMatch(/\.csv$/i);
  const csv = await download
    .path()
    .then((filePath) => (filePath ? fs.readFile(filePath, 'utf8') : Promise.reject(new Error('no download path'))));
  const dataRows = csv.trimEnd().split('\n').length - 1;
  // Roughly the scoped list: never 2 (the selection), never 0.
  expect(dataRows).toBeGreaterThan(Math.max(2, visibleRows - 5));
  await shot(page, '11-export-toast.png');
});

test('7 — pagination pills change rows and URL', async ({ page }) => {
  await openSchools(page);
  const nav = page.locator('nav[data-slot="directory-pagination"]');
  await expect(nav).toBeVisible({ timeout: ACTION_TIMEOUT });
  const firstRowPage1 = await page
    .locator('[data-directory-row]')
    .first()
    .locator('span.text-\\[15\\.5px\\]')
    .first()
    .textContent();
  await nav.getByRole('button', { name: /next/i }).click();
  await expect(page).toHaveURL(/page=2/, { timeout: ACTION_TIMEOUT });
  await expect(page.locator('[data-directory-row]').first()).toBeVisible({ timeout: ACTION_TIMEOUT });
  await page.waitForTimeout(600);
  const firstRowPage2 = await page
    .locator('[data-directory-row]')
    .first()
    .locator('span.text-\\[15\\.5px\\]')
    .first()
    .textContent();
  expect((firstRowPage2 ?? '').trim()).not.toBe((firstRowPage1 ?? '').trim());
  await shot(page, '12-pagination-page-2.png');
});
