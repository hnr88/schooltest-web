/**
 * FLEET2 scratch — ops schools LIST + CSV EXPORT, live browser proof.
 *
 * Slice F2: the school-centric ops surfaces. This file owns the schools table:
 * load, search (existing / partial / garbage), status pills + filter selects,
 * sort, pagination, empty states, and the bulk-bar CSV export (filtered scope
 * + empty-filter behaviour). Every step screenshots into
 * tests/e2e/captures/fleet2/NN-*.png (happy AND unhappy).
 *
 * Never touches src/** or the API; never restarts servers. One UI login per
 * run (the shared API allows 20 logins/min/IP across the whole fleet); the one
 * API JWT this file needs is minted once and cached.
 */
import fs from 'node:fs';
import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { apiEnv } from './helpers/auth-db';
import { cat, loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';

const en = loadMessages('en');
const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:5500';
const CAPTURE_DIR = path.resolve(process.cwd(), 'tests/e2e/captures/fleet2');
const EPOCH = Date.now();
const GARBAGE = `zz-f2-no-match-${EPOCH}`;

let shotIndex = 0;
async function shot(page: Page, slug: string): Promise<void> {
  shotIndex += 1;
  const name = `${String(shotIndex).padStart(2, '0')}-${slug}.png`;
  fs.mkdirSync(CAPTURE_DIR, { recursive: true });
  await page.screenshot({ path: path.join(CAPTURE_DIR, name), fullPage: false });
  console.log(`[fleet2] captured ${name}`);
}

async function gotoRetry(page: Page, url: string, assert: () => Promise<void>): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const aborted = await page
      .goto(url, { waitUntil: 'domcontentloaded' })
      .then(() => false)
      .catch(() => true);
    try {
      await assert();
      return;
    } catch {
      await page.waitForTimeout(3_000 * (attempt + 1));
      if (aborted) continue;
      await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
    }
  }
  await page.goto(url);
  await assert();
}

async function gotoSchools(page: Page): Promise<void> {
  await gotoRetry(page, '/dashboard/ops/schools', () =>
    expect(page.locator('[data-surface="ops-schools"]')).toBeVisible({ timeout: 60_000 }),
  );
}

async function searchSchool(page: Page, text: string): Promise<void> {
  const search = page.getByTestId('ops-schools-search');
  await search.fill('');
  await search.fill(text);
  await page.waitForTimeout(600); // the kit debounces the live search
}

function schoolRow(page: Page, name: string) {
  return page.locator('[data-directory-row]', { hasText: name }).first();
}

let cachedJwt = '';
async function opsJwt(request: APIRequestContext): Promise<string> {
  if (cachedJwt) return cachedJwt;
  const login = await request.post(`${API}/api/auth/local`, {
    data: { identifier: 'admin@schooltest.local', password: process.env.E2E_OPS_PASSWORD ?? apiEnv('SEED_ADMIN_PASSWORD') },
  });
  expect(login.status(), 'ops api login for export cross-check').toBe(200);
  cachedJwt = ((await login.json()) as { jwt: string }).jwt;
  return cachedJwt;
}

test.describe('F2 ops schools list + CSV export', () => {
  test.describe.configure({ mode: 'serial' });
  let page: Page;

  test.setTimeout(90_000);

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    page.setDefaultTimeout(30_000);
    page.setDefaultNavigationTimeout(60_000);
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await loginAs(page, 'ops');
        return;
      } catch (err) {
        if (attempt === 2) throw err;
        await page.waitForTimeout(15_000);
      }
    }
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('F2-L1 list loads with pills, search, showing count', async () => {
    await gotoSchools(page);
    await expect(page.getByTestId('ops-schools-search')).toBeVisible();
    await expect(page.locator('[data-slot="ops-schools-pills"]')).toBeVisible();
    await expect(page.getByText(/Showing \d+ of \d+ schools/)).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-directory-row]').first()).toBeVisible({ timeout: 20_000 });
    await shot(page, 'schools-list-load');
  });

  test('F2-L2 search hits an existing school exactly and round-trips into the URL', async () => {
    await gotoSchools(page);
    await searchSchool(page, 'SchoolTest Demo School A');
    await expect(schoolRow(page, 'SchoolTest Demo School A')).toBeVisible({ timeout: 20_000 });
    // the search must ALSO write itself into the URL (the kit's URL round-trip)
    await expect(page).toHaveURL(/q=/, { timeout: 20_000 });
    const rows = await page.locator('[data-directory-row]').count();
    console.log(`[fleet2] exact search rows: ${rows}`);
    expect(rows).toBeLessThanOrEqual(3);
    await shot(page, 'schools-search-exact');
  });

  test('F2-L3 partial search narrows to the matching family', async () => {
    await gotoSchools(page);
    await searchSchool(page, 'Demo School');
    await expect(page.getByText(/Showing \d+ of \d+ schools/)).toBeVisible({ timeout: 20_000 });
    // Both seeded demo schools share the family — partial text must find them.
    await expect(page.locator('[data-directory-row]', { hasText: 'SchoolTest Demo School A' }).first())
      .toBeVisible({ timeout: 20_000 });
    await shot(page, 'schools-search-partial');
    // self-reporting: every row must actually match the term
    const texts = await page.locator('[data-directory-row]').allTextContents();
    const misses = texts.filter((text) => !text.toLowerCase().includes('demo school'));
    expect(misses, `non-matching rows: ${JSON.stringify(texts)}`).toHaveLength(0);
  });

  test('F2-L4 garbage search shows the empty-search state (unhappy)', async () => {
    await gotoSchools(page);
    await searchSchool(page, GARBAGE);
    await expect(page.getByText(cat(en, 'Ops.schools.emptySearchTitle'))).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-directory-row]')).toHaveCount(0);
    await shot(page, 'schools-search-garbage-empty');
    // clearing restores the table
    await searchSchool(page, '');
    await expect(page.locator('[data-directory-row]').first()).toBeVisible({ timeout: 20_000 });
    await shot(page, 'schools-search-cleared-restored');
  });

  test('F2-L5 status pill filter narrows to the portal-active set', async () => {
    await gotoSchools(page);
    const allPill = page.locator('[data-slot^="ops-schools-pill-"]', { hasText: cat(en, 'Ops.schools.pillAllSchools') });
    await expect(allPill).toBeVisible({ timeout: 20_000 });
    await shot(page, 'schools-pills-all');

    const activePill = page.locator('[data-slot^="ops-schools-pill-"]').filter({ hasText: cat(en, 'Ops.schools.portalStatus.active') }).first();
    await activePill.click();
    await expect(page).toHaveURL(/status=active/, { timeout: 20_000 });
    // self-consistent cross-check (the shared fleet keeps creating schools, so
    // a total captured in a separate request would race): the number the list
    // SHOWS must equal the number the Active pill itself carries.
    await expect(async () => {
      const pillText = await activePill.innerText();
      const pillCount = Number((pillText.match(/\d+/) ?? ['NaN'])[0]);
      const showingText = await page.getByText(/Showing \d+ of \d+ schools/).innerText();
      const shown = Number((showingText.match(/Showing (\d+)/) ?? [])[1]);
      expect(
        shown,
        `[LOGIC?] Active pill says ${pillCount}, list shows ${shown} ("${showingText.trim()}")`,
      ).toBe(pillCount);
    }).toPass({ timeout: 20_000 });
    await shot(page, 'schools-pill-active-filtered');
  });

  test('F2-L6 sector filter select composes with status (URL params drive the kit)', async () => {
    await gotoRetry(page, '/dashboard/ops/schools?status=active&sector=government', () =>
      expect(page.locator('[data-surface="ops-schools"]')).toBeVisible({ timeout: 60_000 }),
    );
    await expect(page.getByText(/Showing \d+ of \d+ schools/)).toBeVisible({ timeout: 20_000 });
    const showing = await page.getByText(/Showing \d+ of \d+ schools/).innerText();
    console.log(`[fleet2] composed filter status=active+sector=government -> ${showing}`);
    await shot(page, 'schools-filter-composed');
    // composed count must not exceed the single status filter's count
    const jwt = await opsJwt(page.request);
    const countsRes = await page.request.get(`${API}/api/ops/schools?pageSize=1`, {
      headers: { Authorization: `Bearer ${jwt}`, 'X-Ops-Portal-Version': '1' },
    });
    const counts = (await countsRes.json()) as { meta: { status_counts: Record<string, number> } };
    const activeTotal = counts.meta?.status_counts?.active ?? 0;
    const n = Number(showing.replace(/\D+(\d+) of.*/i, '$1'));
    expect(n).toBeLessThanOrEqual(activeTotal);
  });

  test('F2-L7 sort by most students puts Demo School A first', async () => {
    await gotoRetry(page, '/dashboard/ops/schools?sort=student_count%3Adesc', () =>
      expect(page.locator('[data-surface="ops-schools"]')).toBeVisible({ timeout: 60_000 }),
    );
    const firstRow = page.locator('[data-directory-row]').first();
    await expect(firstRow).toBeVisible({ timeout: 20_000 });
    const firstText = await firstRow.innerText();
    console.log(`[fleet2] sort=student_count:desc first row: ${firstText.replace(/\n/g, ' | ').slice(0, 140)}`);
    expect(firstText).toContain('SchoolTest Demo School A');
    await shot(page, 'schools-sort-students-desc');
  });

  test('F2-L8 pagination serves page 2 with a fresh set of rows', async () => {
    await gotoSchools(page);
    const showing = page.getByText(/Showing \d+ of \d+ schools/);
    await expect(showing).toBeVisible({ timeout: 20_000 });
    const pageOne = await page.locator('[data-directory-row]').allTextContents();
    await shot(page, 'schools-page-1');
    // the kit's default pagination labels ('Previous'/'Next') are not overridden here
    await page.getByRole('button', { name: 'Next', exact: true }).click().catch(async () => {
      await page.locator('[aria-label="Pagination"]').getByRole('button').last().click();
    });
    await expect(page).toHaveURL(/page=2/, { timeout: 20_000 });
    await expect(page.locator('[data-directory-row]').first()).toBeVisible({ timeout: 20_000 });
    const pageTwo = await page.locator('[data-directory-row]').allTextContents();
    await shot(page, 'schools-page-2');
    const overlap = pageOne.filter((row) => pageTwo.includes(row));
    expect(overlap, `rows repeated across pages: ${JSON.stringify(overlap)}`).toHaveLength(0);
  });

  test('F2-L9 CSV export downloads the FILTERED scope (not the selection)', async () => {
    // Filter to exactly the two active schools, select ONE — D-16 says the
    // export streams the directory's CURRENT FILTER, never the selection.
    await gotoRetry(page, '/dashboard/ops/schools?status=active', () =>
      expect(page.locator('[data-surface="ops-schools"]')).toBeVisible({ timeout: 60_000 }),
    );
    const showing = await page.getByText(/Showing \d+ of \d+ schools/).innerText();
    const filteredCount = Number(showing.replace(/\D+(\d+) of.*/i, '$1'));
    await shot(page, 'schools-export-filtered-before');
    const row = page.locator('[data-directory-row]').first();
    await row.getByRole('checkbox').click();
    const bar = page.locator('[data-slot="directory-bulk-bar"]');
    await expect(bar).toBeVisible({ timeout: 20_000 });
    await shot(page, 'schools-export-bulkbar');
    const exportButton = bar.getByRole('button', { name: cat(en, 'Ops.schools.bulkExport') });
    const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
    await exportButton.click();
    const download = await downloadPromise;
    const target = path.join('/tmp', `f2-export-filtered-${EPOCH}.csv`);
    await download.saveAs(target);
    const csv = fs.readFileSync(target, 'utf8');
    // the toast counts what the FILE actually carried ("N schools exported")
    const toast = await page.locator('[role="status"], [data-sonner-toast]').filter({ hasText: /exported/ }).first().innerText().catch(() => '(toast gone)');
    console.log(`[fleet2] export toast: ${toast.replace(/\n/g, ' | ')}`);
    await shot(page, 'schools-export-filtered-after');
    console.log(`[fleet2] filtered export bytes=${csv.length} first 400: ${csv.slice(0, 400).replace(/\n/g, ' ⏎ ')}`);
    expect(csv).toContain('name');
    // every data row must carry the active status the filter chose
    const lines = csv.trim().split(/\r?\n/);
    const header = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const statusCol = header.findIndex((h) => /status/i.test(h) && !/onboarding/i.test(h));
    expect(statusCol, `header: ${lines[0]}`).toBeGreaterThanOrEqual(0);
    let dataRows = 0;
    let foreign = 0;
    const foreignStatuses = new Set<string>();
    for (const line of lines.slice(1)) {
      if (!line.trim()) continue;
      dataRows += 1;
      const cells = line.split(',');
      const status = (cells[statusCol] ?? '').trim().replace(/^"|"$/g, '');
      if (status !== 'active') {
        foreign += 1;
        foreignStatuses.add(status);
      }
    }
    console.log(
      `[fleet2] EXPORT SCOPE CHECK: filter said ${filteredCount} active; file carried ${dataRows} rows ` +
        `(${foreign} outside the filter: ${[...foreignStatuses].join(',') || 'none'})`,
    );
    // Cross-endpoint inconsistency probe: the SAME versioned scope on the list
    // endpoint vs the export endpoint. Observed 2026-09-16: the list serves
    // the portal-active rows, the export stream returns ZERO of them (its
    // active bucket seems to demand onboarding 'complete' while the list
    // accepts the terminal states) — so Export can never match the list.
    const jwt2 = await opsJwt(page.request);
    const listSame = await page.request.get(`${API}/api/ops/schools?status=active&pageSize=10`, {
      headers: { Authorization: `Bearer ${jwt2}`, 'X-Ops-Portal-Version': '1' },
    });
    const listRows = ((await listSame.json()) as { data?: unknown[] }).data ?? [];
    console.log(
      `[fleet2] LIST vs EXPORT for status=active: list=${listRows.length} rows, export=${dataRows} rows`,
    );
    expect(
      dataRows,
      `[BUG] export.csv does not match the UI's filtered scope: UI list shows ${filteredCount} ` +
        `(API list ${listRows.length}), the export stream carries ${dataRows}`,
    ).toBe(filteredCount);
  });

  test('F2-L10 export of an EMPTY filter: UI offers no bulk path; API yields a header-only CSV', async () => {
    await gotoSchools(page);
    await searchSchool(page, GARBAGE);
    await expect(page.getByText(cat(en, 'Ops.schools.emptySearchTitle'))).toBeVisible({ timeout: 20_000 });
    // no rows -> no bulk bar -> no Export CTA (the honest UI surface)
    await expect(page.locator('[data-slot="directory-bulk-bar"]')).toHaveCount(0);
    await shot(page, 'schools-export-empty-filter-ui');

    // the API contract: the same scope yields a header-only CSV, never an error
    // (the probe rides the SAME version header the web client sends — the
    // legacy unversioned path ignores every filter)
    const jwt = await opsJwt(page.request);
    const res = await page.request.get(`${API}/api/ops/schools/export.csv?q=${encodeURIComponent(GARBAGE)}`, {
      headers: { Authorization: `Bearer ${jwt}`, 'X-Ops-Portal-Version': '1' },
    });
    expect(res.status(), await res.text()).toBe(200);
    const csv = await res.text();
    console.log(`[fleet2] empty-filter export bytes=${csv.length}: ${JSON.stringify(csv.slice(0, 200))}`);
    expect(csv.trim().split(/\r?\n/)).toHaveLength(1); // header only
  });
});
