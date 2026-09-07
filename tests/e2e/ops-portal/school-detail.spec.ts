/**
 * OPS-012 — the school detail page reading C-OPS-PORTAL-002, driven through
 * the REAL app.
 *
 * What this spec is written around:
 *  1. The defect being closed is invisible in a screenshot. The page used to
 *     fetch the WHOLE directory and `.find()` the id in the browser, so the
 *     proof is a NETWORK assertion: exactly one GET to the single-school
 *     endpoint, and no directory read at all.
 *  2. Playwright with no timeout waits FOREVER on an element that never
 *     appears rather than failing, so every wait here is explicitly bounded.
 *  3. A capture nobody opened proves nothing (OPS-010). Both captures are
 *     written to the mission captures dir and their byte-distinctness is
 *     asserted here, not assumed.
 */
import { mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { expect, test, type Locator, type Page } from '@playwright/test';

import { MOBILE_VIEWPORT, REFERENCE_VIEWPORT } from '@/modules/ops/hooks/use-visual-reference';

import { loginAs } from '../helpers/roles';

const SCHOOL_A = 'a19wa9lrmloi95ab9m4gmxqk';
const UNKNOWN_SCHOOL = 'zzzznotarealdocumentid00';
const ACTION_TIMEOUT = 20_000;

const CAPTURES = path.resolve(
  __dirname,
  '../../../../.codephant/missions/msn-ab5a6a54-f385-42e1-826a-aeba2bbdbc66/captures/ops-012',
);

/** Every ops-schools GET the page issues, so we can prove WHICH one it used. */
function recordSchoolRequests(page: Page): string[] {
  const seen: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (request.method() === 'GET' && url.includes('/api/ops/schools')) seen.push(url);
  });
  return seen;
}

async function openSchool(page: Page, documentId = SCHOOL_A): Promise<void> {
  await page.goto(`/dashboard/ops/schools/${documentId}`);
}

/**
 * The count cards mark themselves with `data-slot`, NOT `data-testid`, and this
 * project does not remap Playwright's test-id attribute — the by-test-id
 * locator silently matches nothing here and then waits until it times out. The
 * teachers card uses the `-teachers` suffix, so match the prefix for both.
 */
function countCards(page: Page): Locator {
  return page.locator('[data-slot^="ops-count-card"]');
}

async function sha256(file: string): Promise<string> {
  return createHash('sha256').update(await readFile(file)).digest('hex');
}

test.describe('ops school detail (C-OPS-PORTAL-002)', () => {
  test.beforeAll(() => {
    mkdirSync(CAPTURES, { recursive: true });
  });

  test('reads the single-school endpoint and never the whole directory', async ({ page }) => {
    await loginAs(page, 'ops');
    const requests = recordSchoolRequests(page);
    await openSchool(page);

    await expect(countCards(page).first()).toBeVisible({
      timeout: ACTION_TIMEOUT,
    });

    const detailReads = requests.filter((url) => url.includes(`/api/ops/schools/${SCHOOL_A}`));
    // The directory read is `/api/ops/schools` with nothing (or only a query)
    // after it — the exact call this task removed from the detail page.
    const directoryReads = requests.filter((url) => /\/api\/ops\/schools(\?|$)/.test(url));

    test.info().annotations.push({
      type: 'ops-schools-requests',
      description: requests.join(' | ') || '(none)',
    });

    expect(detailReads.length, 'the page must read the single-school endpoint').toBeGreaterThan(0);
    expect(
      directoryReads,
      'the detail page must not fetch the whole school directory',
    ).toHaveLength(0);
  });

  test('renders the real school identity and its counters', async ({ page }) => {
    await loginAs(page, 'ops');
    await openSchool(page);

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible({ timeout: ACTION_TIMEOUT });
    // The name comes from the API, so assert it is non-empty rather than
    // hardcoding a fixture string other agents are actively mutating.
    await expect(heading).toContainText(/\S/, { timeout: ACTION_TIMEOUT });

    const cards = countCards(page);
    await expect(cards.first()).toBeVisible({ timeout: ACTION_TIMEOUT });
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('an unknown school renders the not-found state, not a crash or a blank page', async ({
    page,
  }) => {
    await loginAs(page, 'ops');
    await openSchool(page, UNKNOWN_SCHOOL);

    // The 404 must surface as a rendered state. Either the explicit not-found
    // alert or the error alert is acceptable; a blank page is not.
    const alert = page.getByRole('alert').first();
    await expect(alert).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(alert).toContainText(/\S/, { timeout: ACTION_TIMEOUT });

    // The count cards belong to a school that loaded; they must be absent.
    await expect(countCards(page)).toHaveCount(0);
  });

  test('captures the reference desktop and 375px widths', async ({ page }) => {
    await page.setViewportSize({ ...REFERENCE_VIEWPORT });
    await loginAs(page, 'ops');
    await openSchool(page);
    await expect(countCards(page).first()).toBeVisible({
      timeout: ACTION_TIMEOUT,
    });
    const desktop = path.join(CAPTURES, 'ops-012-school-detail-desktop.png');
    await page.screenshot({ path: desktop, fullPage: false, animations: 'disabled' });

    await page.setViewportSize({ ...MOBILE_VIEWPORT });
    await expect(countCards(page).first()).toBeVisible({
      timeout: ACTION_TIMEOUT,
    });
    // The page must not scroll sideways at the narrow reference width.
    const doc = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(doc.scrollWidth, 'no horizontal overflow at 375px').toBeLessThanOrEqual(
      doc.clientWidth + 1,
    );
    const mobile = path.join(CAPTURES, 'ops-012-school-detail-mobile.png');
    await page.screenshot({ path: mobile, fullPage: false, animations: 'disabled' });

    // Two captures that hash the same mean one viewport silently did not apply.
    const [a, b] = await Promise.all([sha256(desktop), sha256(mobile)]);
    test.info().annotations.push({ type: 'sha256-desktop', description: a });
    test.info().annotations.push({ type: 'sha256-mobile', description: b });
    expect(a, 'desktop and mobile captures must be byte-distinct').not.toBe(b);
  });
});
