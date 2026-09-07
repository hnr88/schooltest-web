/**
 * OPS-019 / C-OPS-PORTAL-009 — the schools directory export action.
 *
 * Drives the REAL screen against the REAL API: the fixture school is created
 * through the ops contract, the button is clicked in the browser, and the file
 * the browser actually saved is read off disk and parsed. Every response comes
 * from the running API; no request is intercepted.
 *
 * Two traps this spec is written around:
 *  1. Playwright with no timeout waits forever on a hidden element instead of
 *     failing, so every interaction below is explicitly bounded.
 *  2. The button's LABEL comes from `Ops.export.*`, whose keys are applied by
 *     the batch integrator (schooltest-web/src/i18n/messages/en.json is a
 *     merge-only file). Locators therefore key off data-slot and roles, never
 *     off English copy, so this spec passes before and after that merge.
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { OpsFixtureLedger, createOpsFixtureSchool } from '../helpers/ops-portal';
import { loginAs } from '../helpers/roles';

const SCHOOLS_URL = '/dashboard/ops/schools';
const ACTION_TIMEOUT = 20_000;

const CAPTURES = path.resolve(
  __dirname,
  '../../../../.codephant/missions/msn-ab5a6a54-f385-42e1-826a-aeba2bbdbc66/captures/ops-019',
);

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

const exportSection = (page: Page) => page.locator('[data-slot="ops-schools-export"]');
const exportButton = (page: Page) => exportSection(page).getByRole('button');
const exportScope = (page: Page) => page.locator('[data-slot="ops-schools-export-scope"]');

async function openSchools(page: Page, query = ''): Promise<void> {
  await page.goto(`${SCHOOLS_URL}${query}`);
  await expect(exportSection(page)).toBeVisible({ timeout: ACTION_TIMEOUT });
}

/** Click Export and return the saved file's name and text, read off disk. */
async function download(page: Page): Promise<{ filename: string; csv: string }> {
  const pending = page.waitForEvent('download', { timeout: ACTION_TIMEOUT });
  await exportButton(page).click({ timeout: ACTION_TIMEOUT });
  const saved = await pending;
  const file = await saved.path();
  return { filename: saved.suggestedFilename(), csv: readFileSync(file, 'utf8') };
}

test.describe('C-OPS-PORTAL-009 schools export UI', () => {
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

  test('exports every school when nothing is selected or filtered', async ({ page }) => {
    await openSchools(page);

    await expect(exportButton(page)).toBeEnabled({ timeout: ACTION_TIMEOUT });
    await expect(exportScope(page)).toHaveAttribute('data-scope', 'all');
    const { filename, csv } = await download(page);

    expect(filename).toBe('schools.csv');
    expect(csv.split('\r\n')[0]).toBe(EXPECTED_HEADER);
    expect(csv.split('\r\n').filter((line) => line !== '').length).toBeGreaterThan(1);
    await expect(page.locator('[data-slot="ops-schools-export-done"]')).toHaveAttribute(
      'data-filename',
      'schools.csv',
      { timeout: ACTION_TIMEOUT },
    );
  });

  test('exports exactly the selected school, and says so before the click', async ({
    page,
    request,
  }) => {
    const ledger = new OpsFixtureLedger();
    try {
      const school = await createOpsFixtureSchool(request, ledger, 'OPS019 web');
      await openSchools(page, `?documentIds=${school.documentId}`);

      // The scope line is rendered from the same object the request is built
      // from — the operator cannot be shown one scope and handed another.
      await expect(exportScope(page)).toHaveAttribute('data-scope', 'selected', {
        timeout: ACTION_TIMEOUT,
      });
      await expect(exportScope(page)).toHaveAttribute('data-selected-count', '1');

      const { filename, csv } = await download(page);
      expect(filename).toBe('schools-selected.csv');
      const lines = csv.split('\r\n').filter((line) => line !== '');
      expect(lines[0]).toBe(EXPECTED_HEADER);
      expect(lines).toHaveLength(2);
      expect(lines[1]).toContain(school.documentId);
    } finally {
      await ledger.cleanup(request);
    }
  });

  test('a filtered scope downloads the filtered file, not the whole directory', async ({ page }) => {
    await openSchools(page, '?q=zzz-no-school-has-this-name-ops019');

    await expect(exportScope(page)).toHaveAttribute('data-scope', 'filtered', {
      timeout: ACTION_TIMEOUT,
    });
    const { filename, csv } = await download(page);
    expect(filename).toBe('schools-filtered.csv');
    expect(csv).toBe(`${EXPECTED_HEADER}\r\n`);
  });

  test('a rejected export shows an error and saves no file', async ({ page }) => {
    await openSchools(page, '?documentIds=doesnotexist000000000001');

    let started = false;
    page.on('download', () => {
      started = true;
    });
    await exportButton(page).click({ timeout: ACTION_TIMEOUT });

    await expect(exportSection(page).getByRole('alert')).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(page.locator('[data-slot="ops-schools-export-done"]')).toHaveCount(0);
    expect(started, 'a 404 must not save a file').toBe(false);
  });

  test('visual check: the export action at desktop and at 375px', async ({ page }) => {
    mkdirSync(CAPTURES, { recursive: true });

    await page.setViewportSize({ width: 1440, height: 1000 });
    await openSchools(page);
    await exportSection(page).scrollIntoViewIfNeeded({ timeout: ACTION_TIMEOUT });
    await page.screenshot({ path: path.join(CAPTURES, 'schools-export-1440.png') });

    await page.setViewportSize({ width: 375, height: 812 });
    await openSchools(page);
    await exportSection(page).scrollIntoViewIfNeeded({ timeout: ACTION_TIMEOUT });
    await expect(exportButton(page)).toBeVisible({ timeout: ACTION_TIMEOUT });
    await page.screenshot({ path: path.join(CAPTURES, 'schools-export-375.png') });
  });
});
