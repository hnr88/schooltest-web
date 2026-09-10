/**
 * OPS-019 / C-OPS-PORTAL-009 — the schools directory export action.
 *
 * ops/09 (R-07 first half, D-16): the page-body export panel is retired — the
 * design's list screen (`Ops Portal.dc.html:69-200`) draws no export panel at
 * all, only the bulk action `:1480`. This spec is re-pointed at the bulk bar:
 * select rows, open the bar, run Export. The real coverage survives verbatim
 * — `EXPECTED_HEADER` below and the download-to-disk assertion that reads the
 * saved CSV off disk — only the route to the button moved.
 *
 * Drives the REAL screen against the REAL API: every fixture school is
 * created through the ops contract, the button is clicked in the browser, and
 * the file the browser actually saved is read off disk and parsed. Every
 * response comes from the running API; no request is intercepted (except the
 * one `ops_support` capabilities test, which mocks only the capabilities
 * envelope — the underlying session, and therefore the export request, is
 * still real).
 *
 * Export is scope-based, never selection-based (D-16): "Selecting rows then
 * changing a filter does not change what Export produces." One consequence of
 * moving the trigger into the bulk bar is that Export can only be REACHED
 * once at least one row is selected — a filtered scope with ZERO visible rows
 * (the old spec's `?q=zzz-no-school-has-this-name-ops019` case) therefore has
 * no way to open the bar at all through this screen and is not exercised
 * here; the endpoint's empty-scope behaviour is unchanged and is covered by
 * the API's own `schooltest-api/tests/e2e/ops-portal/schools-export.spec.ts`.
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { OpsFixtureLedger, createOpsFixtureSchool } from '../helpers/ops-portal';
import { loginAs } from '../helpers/roles';

const SCHOOLS_URL = '/dashboard/ops/schools';
const ACTION_TIMEOUT = 20_000;

const CAPTURES = '/home/hnr/Code/schooltest/mvp/ops/proof/shots';

const EXPECTED_HEADER =
  'documentId,name,suburb,state,postcode,sector,account_status,onboarding_status,createdAt';

/**
 * ONE real sign-in for the whole file, replayed as storage state.
 *
 * The API allows 20 POST /api/auth/local per minute per IP and the ops stack is
 * shared with other suites; a spec that signs in per test spends five of that
 * budget and then reports a rate limit as "the export screen is broken".
 */
const STORAGE_STATE = path.join(tmpdir(), 'ops-019-schools-export-state.json');

test.describe.configure({ mode: 'serial' });

/** The bulk bar only renders once a row is selected (`OpsBulkBar`'s own gate). */
const bulkBar = (page: Page) => page.getByRole('region', { name: /selected/i });
const exportButton = (page: Page) => bulkBar(page).getByRole('button', { name: 'Export', exact: true });

/** Ticks the first visible row's checkbox and waits for the bar to appear. */
async function selectFirstRow(page: Page): Promise<void> {
  const checkbox = page.locator('tbody tr').first().getByRole('checkbox');
  await expect(checkbox).toBeVisible({ timeout: ACTION_TIMEOUT });
  await checkbox.click();
  await expect(bulkBar(page)).toBeVisible({ timeout: ACTION_TIMEOUT });
}

/** Click Export and return the saved file's name and text, read off disk. */
async function download(page: Page): Promise<{ filename: string; csv: string }> {
  const pending = page.waitForEvent('download', { timeout: ACTION_TIMEOUT });
  await exportButton(page).click({ timeout: ACTION_TIMEOUT });
  const saved = await pending;
  const file = await saved.path();
  return { filename: saved.suggestedFilename(), csv: readFileSync(file, 'utf8') };
}

test.describe('C-OPS-PORTAL-009 schools export UI (bulk bar)', () => {
  test.beforeAll(async ({ browser }) => {
    test.setTimeout(180_000);
    // `storageState: undefined` is required: the describe's `test.use` applies
    // to contexts created here too, and the file does not exist until the line
    // below writes it.
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    // The stack's auth limiter (20 POST /api/auth/local per minute per IP) is
    // shared with every other suite. A rejected sign-in there says the stack is
    // busy, not that the screen is broken, so the form is re-driven after the
    // window rather than failing the export contract.
    for (let attempt = 0; ; attempt += 1) {
      try {
        await loginAs(page, 'ops');
        break;
      } catch (error) {
        if (attempt === 3) throw error;
        await page.waitForTimeout(20_000);
      }
    }
    await context.storageState({ path: STORAGE_STATE });
    await context.close();
  });

  test.use({ storageState: STORAGE_STATE });

  test('exports every school in the current scope when nothing is filtered', async ({ page }) => {
    await page.goto(SCHOOLS_URL);
    await selectFirstRow(page);
    await expect(exportButton(page)).toBeEnabled({ timeout: ACTION_TIMEOUT });

    const { filename, csv } = await download(page);

    expect(filename).toBe('schools.csv');
    expect(csv.split('\r\n')[0]).toBe(EXPECTED_HEADER);
    expect(csv.split('\r\n').filter((line) => line !== '').length).toBeGreaterThan(1);
    // The toast names the row count the SERVER returned, never `selected.length`
    // (D-16) — exactly one row was ticked, but the whole directory downloaded.
    await expect(
      page.locator('[data-sonner-toast]', { hasText: /^\d+ schools? exported$/ }),
    ).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('selecting a subset does not narrow the export — it is scope-based (D-16)', async ({
    page,
    request,
  }) => {
    const ledger = new OpsFixtureLedger();
    try {
      const first = await createOpsFixtureSchool(request, ledger, 'OPS019 subset A');
      const second = await createOpsFixtureSchool(request, ledger, 'OPS019 subset B');
      await page.goto(`${SCHOOLS_URL}?q=${encodeURIComponent('OPS019 subset')}`);

      const rowA = page.locator('tbody tr', { hasText: first.name });
      const rowB = page.locator('tbody tr', { hasText: second.name });
      await expect(rowA).toBeVisible({ timeout: ACTION_TIMEOUT });
      await expect(rowB).toBeVisible({ timeout: ACTION_TIMEOUT });

      // Only ONE of the two matching rows is ticked. If Export read the
      // selection, the file would hold one row; it must hold both.
      await rowA.getByRole('checkbox').click();
      await expect(bulkBar(page)).toContainText('1 school selected', { timeout: ACTION_TIMEOUT });

      const { filename, csv } = await download(page);
      expect(filename).toBe('schools-filtered.csv');
      const lines = csv.split('\r\n').filter((line) => line !== '');
      expect(lines[0]).toBe(EXPECTED_HEADER);
      expect(lines).toHaveLength(3);
      expect(csv).toContain(first.documentId);
      expect(csv).toContain(second.documentId);
      await expect(
        page.locator('[data-sonner-toast]', { hasText: '2 schools exported' }),
      ).toBeVisible({ timeout: ACTION_TIMEOUT });
    } finally {
      await ledger.cleanup(request);
    }
  });

  test('a rejected export shows an error toast and saves no file', async ({ page }) => {
    // A scope naming an unknown school 404s server-side; the schools LIST
    // itself does not recognise `documentIds` as a filter (it is read only by
    // the export scope), so the table still renders and a row is selectable.
    await page.goto(`${SCHOOLS_URL}?documentIds=doesnotexist000000000001`);
    await selectFirstRow(page);

    let started = false;
    page.on('download', () => {
      started = true;
    });
    await exportButton(page).click({ timeout: ACTION_TIMEOUT });

    await expect(
      page.locator('[data-sonner-toast]', {
        hasText: 'Check your connection and try again — nothing was downloaded.',
      }),
    ).toBeVisible({ timeout: ACTION_TIMEOUT });
    expect(started, 'a 404 must not save a file').toBe(false);
  });

  test('a read-only (ops_support) session can Export but cannot Suspend or Archive', async ({
    page,
  }) => {
    // The same contract-valid ops_support capabilities body schools-list.spec.ts
    // uses for its row-menu read-only test: write: false, served from the real
    // endpoint URL. The underlying session is still the real signed-in `ops`
    // account, so Export — a GET, never gated — still reaches the live server.
    const updatedAt = new Date().toISOString();
    await page.route('**/api/ops/capabilities*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            actor: {
              documentId: 'zz09readonlysessionactor01',
              first_name: 'Support',
              last_name: 'Session',
              email: 'support@schooltest.local',
              role: 'ops_support',
              updatedAt,
            },
            capabilities: { read: true, write: false, export: true, view_as_teacher: false, edit_self: true },
            status_page_url: null,
          },
          meta: {},
        }),
      }),
    );
    const writes: string[] = [];
    page.on('request', (request) => {
      if (/\/api\/ops\/schools\/[^/]+\/(suspend|archive)/.test(request.url())) writes.push(request.url());
    });

    await page.goto(SCHOOLS_URL);
    await selectFirstRow(page);
    for (const label of ['Export', 'Suspend selected', 'Archive selected']) {
      await expect(bulkBar(page).getByRole('button', { name: label, exact: true })).toBeVisible();
    }

    // Export: a real request, a real file, no refusal.
    const { filename } = await download(page);
    expect(filename).toBe('schools.csv');

    // Suspend/Archive: the design's read-only refusal, and NO request.
    await bulkBar(page).getByRole('button', { name: 'Suspend selected', exact: true }).click();
    await expect(
      page.locator('[data-sonner-toast]', {
        hasText: 'Support accounts are read-only — ask an ops admin to make this change',
      }),
    ).toBeVisible({ timeout: ACTION_TIMEOUT });
    expect(writes).toEqual([]);
  });

  test('visual check: the bulk bar with Export at desktop and at 375px', async ({ page }) => {
    mkdirSync(CAPTURES, { recursive: true });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(SCHOOLS_URL);
    await selectFirstRow(page);
    await bulkBar(page).scrollIntoViewIfNeeded({ timeout: ACTION_TIMEOUT });
    await page.screenshot({ path: path.join(CAPTURES, '09-bulk-bar.png') });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(SCHOOLS_URL);
    await selectFirstRow(page);
    await bulkBar(page).scrollIntoViewIfNeeded({ timeout: ACTION_TIMEOUT });
    await expect(exportButton(page)).toBeVisible({ timeout: ACTION_TIMEOUT });
    await page.screenshot({ path: path.join(CAPTURES, '09-bulk-bar-375.png') });
  });
});
