/**
 * OPS-075 — the portal's capabilities banner, driven through the REAL app.
 *
 * Three traps this spec is written around:
 *  1. Playwright with no timeout waits FOREVER on a hidden element instead of
 *     failing, so every wait here is explicitly bounded.
 *  2. A read-only banner that renders for everybody would look identical in a
 *     screenshot, so the ops session is asserted to render NO banner.
 *  3. `ops_support` has no seeded persona in `helpers/roles.ts`; its
 *     credentials come from E2E_OPS_SUPPORT_* (schooltest-api/.env), and a
 *     missing one fails HERE naming the variable rather than as a 400.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import {
  MOBILE_VIEWPORT,
  REFERENCE_CLOCK_ISO,
  REFERENCE_VIEWPORT,
} from '@/modules/ops/hooks/use-visual-reference';
import { CAPABILITIES_COPY } from '@/modules/ops/constants/capabilities.constants';

import { cat, loadMessages } from '../helpers/i18n';
import { loginAs } from '../helpers/roles';

const en = loadMessages('en');
const OUT = path.resolve(
  __dirname,
  '../../../../.codephant/missions/msn-ab5a6a54-f385-42e1-826a-aeba2bbdbc66/captures/ops-075',
);
const PROOF_OUT = path.resolve(__dirname, '../../../../mvp/ops/proof/shots');
const WAIT = 20_000;
const SCHOOLS_URL = '**/dashboard/ops/schools';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`[e2e] missing required env var ${name} (schooltest-api/.env)`);
  return value;
}

/**
 * Sign in as the ops_support persona through the real form.
 *
 * Every suite on this host shares one per-IP auth rate-limit window; a 429
 * strands the form on /sign-in with PERFECT credentials, so the submission is
 * ridden out against the window instead of reported as a defect.
 */
async function loginAsSupport(page: Page, attempts = 6): Promise<void> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await page.goto('/sign-in');
    await page
      .getByLabel(cat(en, 'Auth.emailLabel'), { exact: true })
      .fill(requireEnv('E2E_OPS_SUPPORT_EMAIL'));
    await page
      .getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true })
      .fill(requireEnv('E2E_OPS_SUPPORT_PASSWORD'));
    await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
    const landed = await page
      .waitForURL(/\/dashboard(\/|$)/, { timeout: WAIT })
      .then(() => true)
      .catch(() => false);
    if (landed) return;
    await page.waitForTimeout(15_000);
  }
  throw new Error(`[e2e] ops_support sign-in never reached the dashboard — last URL ${page.url()}`);
}

/** The seeded ops persona, with the same rate-limit tolerance. */
async function loginAsOps(page: Page, attempts = 6): Promise<void> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      await loginAs(page, 'opsApi');
      return;
    } catch (error) {
      if (attempt === attempts - 1) throw error;
      await page.waitForTimeout(15_000);
    }
  }
}

const banner = (page: Page) => page.locator('[data-slot="ops-capabilities-read-only"]');
const statusPage = (page: Page) => page.locator('[data-slot="ops-status-page"]');

async function selectFirstSchool(page: Page): Promise<void> {
  const checkbox = page
    .locator('[data-slot="directory"] tbody')
    .getByRole('checkbox')
    .first();
  await expect(checkbox).toBeVisible({ timeout: WAIT });
  await checkbox.click();
  await expect(page.getByRole('region', { name: /selected/ })).toBeVisible({ timeout: WAIT });
}

function countLifecycleRequests(page: Page): { urls: string[] } {
  const requests = { urls: [] as string[] };
  page.on('request', (request) => {
    const pathname = new URL(request.url()).pathname;
    if (/^\/api\/(?:ops\/)?schools\/[^/]+(?:\/(?:suspend|archive))?$/.test(pathname)) {
      requests.urls.push(`${request.method()} ${pathname}`);
    }
  });
  return requests;
}

test.describe.configure({ timeout: 240_000 });

test.describe.serial('OPS-075 portal capabilities', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date(REFERENCE_CLOCK_ISO));
  });

  test('a support session is announced read-only, with the pictured status page action', async ({
    page,
  }) => {
    await page.setViewportSize(REFERENCE_VIEWPORT);
    await loginAsSupport(page);
    await page.goto('/dashboard/ops/schools');
    await page.waitForURL(SCHOOLS_URL, { timeout: WAIT });

    const strip = banner(page);
    await expect(strip).toBeVisible({ timeout: WAIT });
    await expect(strip).toHaveAttribute('data-ops-role', 'ops_support');
    await expect(strip).toContainText(CAPABILITIES_COPY.readOnlyTitle, { timeout: WAIT });
    await expect(strip).toContainText(CAPABILITIES_COPY.readOnlyBody, { timeout: WAIT });

    // The pictured control is present and backed by real deployment config —
    // never dropped, and never a link to nowhere.
    const action = statusPage(page);
    await expect(action).toBeVisible({ timeout: WAIT });
    await expect(action).toHaveText(CAPABILITIES_COPY.statusPage);
    const configured = await action.getAttribute('data-status-page');
    if (configured === 'configured') {
      await expect(action).toHaveAttribute('href', /^https?:\/\//);
    } else {
      await expect(action).toHaveAttribute('title', CAPABILITIES_COPY.statusPageUnset);
    }

    await mkdir(OUT, { recursive: true });
    await page.screenshot({ path: path.join(OUT, 'capabilities-desktop-1440x1000.png') });
  });

  test('the support session still reaches the schools directory it may read', async ({ page }) => {
    await page.setViewportSize(REFERENCE_VIEWPORT);
    await loginAsSupport(page);
    await page.goto('/dashboard/ops/schools');
    await page.waitForURL(SCHOOLS_URL, { timeout: WAIT });

    // The guard must NOT bounce support back to /dashboard: it is entitled to
    // this surface, and the API refuses the writes it cannot do.
    await expect(page).toHaveURL(/\/dashboard\/ops\/schools$/, { timeout: WAIT });
    await expect(page.locator('[data-surface="ops-schools"]')).toBeVisible({ timeout: WAIT });
    await expect(banner(page)).toBeVisible({ timeout: WAIT });
  });

  test('a support bulk write is natively disabled, and zero lifecycle requests leave', async ({
    page,
  }) => {
    // ops/28 follow-up (D-53) — read-only now greys the bulk button itself
    // (OpsBulkBar's own `disabled`, threaded from `writeGate.readOnly`)
    // rather than only refusing a click that reaches it: a genuinely inert
    // control proves "zero lifecycle requests" more strongly than a refused
    // click did, so this asserts `disabled` directly instead of clicking and
    // waiting on a toast that a disabled button can no longer raise. The
    // OFFLINE case below is deliberately different — `readOnly` alone drives
    // `disabled`, never `blockedReason()` (which also trips offline), so
    // that path stays clickable and keeps its toast-with-Retry.
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginAsSupport(page);
    await page.goto('/dashboard/ops/schools');
    await page.waitForURL(SCHOOLS_URL, { timeout: WAIT });
    await expect(banner(page)).toBeVisible({ timeout: WAIT });
    await selectFirstSchool(page);
    const requests = countLifecycleRequests(page);

    const bulkSuspend = page.getByRole('button', { name: cat(en, 'Ops.schools.bulkSuspend'), exact: true });
    await expect(bulkSuspend).toBeVisible({ timeout: WAIT });
    await expect(bulkSuspend).toBeDisabled({ timeout: WAIT });

    expect(requests.urls).toEqual([]);
    await mkdir(PROOF_OUT, { recursive: true });
    await page.screenshot({ path: path.join(PROOF_OUT, '03-blocked-readonly.png') });
  });

  test('an offline bulk write is not started and offers Retry', async ({ page, context }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginAsOps(page);
    await page.goto('/dashboard/ops/schools');
    await page.waitForURL(SCHOOLS_URL, { timeout: WAIT });
    await selectFirstSchool(page);
    const requests = countLifecycleRequests(page);

    await context.setOffline(true);
    try {
      await page.getByRole('button', { name: cat(en, 'Ops.schools.bulkSuspend'), exact: true }).click();

      const message = cat(en, 'Ops.capabilities.offlineWriteBlocked');
      const refusal = page.locator('[data-sonner-toast]').filter({ hasText: message });
      await expect(refusal).toBeVisible({ timeout: WAIT });
      await expect(refusal).toBeInViewport({ ratio: 1, timeout: WAIT });
      await expect(
        refusal.getByRole('button', { name: cat(en, 'Ops.toast.retry'), exact: true }),
      ).toBeVisible({ timeout: WAIT });
      expect(requests.urls).toEqual([]);
      await mkdir(PROOF_OUT, { recursive: true });
      await page.screenshot({ path: path.join(PROOF_OUT, '03-blocked-offline.png') });
    } finally {
      await context.setOffline(false);
    }
  });

  test('a full ops session renders no read-only banner at all', async ({ page }) => {
    await page.setViewportSize(REFERENCE_VIEWPORT);
    await loginAsOps(page);
    await page.goto('/dashboard/ops/schools');
    await page.waitForURL(SCHOOLS_URL, { timeout: WAIT });

    await expect(page.locator('[data-surface="ops-schools"]')).toBeVisible({ timeout: WAIT });
    await expect(banner(page)).toHaveCount(0, { timeout: WAIT });
  });

  test('the banner survives 375px and 200% zoom without clipping', async ({ page }) => {
    await loginAsSupport(page);

    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/dashboard/ops/schools');
    await page.waitForURL(SCHOOLS_URL, { timeout: WAIT });
    const mobile = banner(page);
    await expect(mobile).toBeVisible({ timeout: WAIT });
    const mobileBox = await mobile.boundingBox();
    if (!mobileBox) throw new Error('[e2e] the read-only banner has no bounding box at 375px');
    expect(mobileBox.width).toBeLessThanOrEqual(MOBILE_VIEWPORT.width);
    await mkdir(OUT, { recursive: true });
    await page.screenshot({ path: path.join(OUT, 'capabilities-mobile-375.png') });

    // 200% browser zoom: the same layout at half the CSS viewport width.
    await page.setViewportSize(REFERENCE_VIEWPORT);
    await page.evaluate(() => {
      document.documentElement.style.setProperty('zoom', '2');
    });
    const zoomed = banner(page);
    await expect(zoomed).toBeVisible({ timeout: WAIT });
    await expect(zoomed).toContainText(CAPABILITIES_COPY.readOnlyTitle, { timeout: WAIT });
    await page.screenshot({ path: path.join(OUT, 'capabilities-zoom-200.png') });
  });
});
