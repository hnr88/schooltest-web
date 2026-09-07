/**
 * OPS-077 / C-OPS-PORTAL-067 — the browser half of the settings read.
 *
 * Three things are proven here that an API test cannot:
 *  1. The web's response schema and the SHARED contract module agree. They are
 *     mirrors today (the shared package's own node_modules carries a different
 *     zod build, so app code cannot import the module source yet), and this
 *     guard fails the moment one of them drifts from the other.
 *  2. A failed read looks different from a slow one and from an empty one, and
 *     the failure surface offers a retry that really refetches.
 *  3. Returning to the screen re-reads the row instead of presenting a cached
 *     configuration as the current one.
 *
 * Sign-in happens ONCE through the real form and is reused as storage state:
 * four form logins for one read is what turns a green contract into a red 429.
 */
import { expect, test } from '@playwright/test';

import {
  MOBILE_VIEWPORT,
  REFERENCE_CLOCK_ISO,
  REFERENCE_DEVICE_SCALE_FACTOR,
  REFERENCE_VIEWPORT,
} from '@/modules/ops/hooks/use-visual-reference';
import { platformSettingsSchema as webSettingsSchema } from '@/modules/ops/schemas/platform-settings.schema';

import {
  PLATFORM_SETTINGS_KEYS,
  platformSettingsSchema as sharedSettingsSchema,
} from '../../../../mvp/contracts/ops/src/settings-read';
import { loginAs } from '../helpers/roles';

import {
  ACTION_TIMEOUT,
  READY,
  RETRY,
  SETTINGS_ROUTE,
  STORAGE_STATE,
  capture,
  liveSettings,
  settingsReads,
  waitForApi,
} from './settings-read.helpers';

// The unmodified HTML stays the visual authority; this spec drives the real app
// at the reference viewport, scale and clock so captures compare against it.
test.use({
  viewport: REFERENCE_VIEWPORT,
  deviceScaleFactor: REFERENCE_DEVICE_SCALE_FACTOR,
  actionTimeout: ACTION_TIMEOUT,
  storageState: STORAGE_STATE,
});

test.beforeAll(async ({ browser }) => {
  test.setTimeout(300_000);
  // Explicitly EMPTY: `browser.newContext()` inherits the file's contextOptions,
  // and the state file this hook is about to write does not exist yet.
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  await waitForApi(120_000);
  // The dev API is reloaded by whoever is editing it, and a sign-in during a
  // restart surfaces as the form's offline banner. Bounded retries ride that
  // out; a genuinely wrong credential still fails on the last attempt.
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      await loginAs(page, 'ops');
      break;
    } catch (error) {
      if (attempt === 4) throw error;
      await new Promise((resolve) => setTimeout(resolve, 10_000));
    }
  }
  await context.storageState({ path: STORAGE_STATE });
  await context.close();
});

test.beforeEach(async () => {
  test.setTimeout(150_000);
  await waitForApi(90_000);
});

test.describe('C-OPS-PORTAL-067 settings read', () => {
  test('the web schema and the shared contract module do not drift', async () => {
    const live = await liveSettings();

    expect(Object.keys(webSettingsSchema.shape).sort()).toEqual([...PLATFORM_SETTINGS_KEYS].sort());
    expect(sharedSettingsSchema.safeParse(live).success, 'shared rejects the live row').toBe(true);
    expect(webSettingsSchema.safeParse(live).success, 'web rejects the live row').toBe(true);

    // Both refuse an undeclared key: the projection is an allow-list on BOTH
    // sides, not a filter applied on one of them.
    const smuggled = { ...live, smtp_password: 'leaked' };
    expect(sharedSettingsSchema.safeParse(smuggled).success).toBe(false);
    expect(webSettingsSchema.safeParse(smuggled).success).toBe(false);

    // null and "" are both valid and both different; a missing key is neither.
    for (const value of [null, '']) {
      expect(sharedSettingsSchema.safeParse({ ...live, site_tagline: value }).success).toBe(true);
      expect(webSettingsSchema.safeParse({ ...live, site_tagline: value }).success).toBe(true);
    }
    const withoutTagline: Record<string, unknown> = { ...live };
    delete withoutTagline.site_tagline;
    expect(sharedSettingsSchema.safeParse(withoutTagline).success).toBe(false);
    expect(webSettingsSchema.safeParse(withoutTagline).success).toBe(false);
  });

  test('ops sees the real stored values, versioned, at desktop and 375px', async ({ page }) => {
    const live = await liveSettings();
    const versions = settingsReads(page);
    await page.clock.setFixedTime(new Date(REFERENCE_CLOCK_ISO));
    await page.goto(SETTINGS_ROUTE);

    const form = page.locator(READY);
    await expect(form).toBeVisible({ timeout: ACTION_TIMEOUT });
    // The system settings are their own ops-only surface, separate from the
    // internal operations account card on the same route.
    await expect(form).toHaveAttribute('data-ops-scope', 'ops-only');

    await expect(page.locator('#setting-site_name')).toHaveValue(String(live.site_name));
    await expect(page.locator('#setting-session_timeout_minutes')).toHaveValue(
      String(live.session_timeout_minutes),
    );
    await expect(page.locator('#setting-email_from_address')).toHaveValue(
      String(live.email_from_address ?? ''),
    );
    expect(versions.length).toBeGreaterThan(0);
    expect(versions.every((value) => value === '1')).toBe(true);
    console.log('CAPTURE', await capture(page, 'settings-desktop'));

    await page.setViewportSize(MOBILE_VIEWPORT);
    await expect(form).toBeVisible({ timeout: ACTION_TIMEOUT });
    console.log('CAPTURE', await capture(page, 'settings-mobile'));
  });

  test('a failed read is named and retryable, never an empty-looking form', async ({ page }) => {
    await page.route('**/api/platform-settings', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          data: null,
          error: { status: 500, name: 'ApplicationError', message: 'probe', details: {} },
        }),
      });
    });

    await page.goto(SETTINGS_ROUTE);
    const retry = page.locator(RETRY);
    await expect(retry).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(page.getByRole('alert').first()).toBeVisible({ timeout: ACTION_TIMEOUT });
    // A failure must NOT render the editor: an empty form reads as "nothing is
    // configured", which is a different and untrue statement.
    await expect(page.locator('[data-surface="ops-platform-settings"]')).toHaveCount(0);
    console.log('CAPTURE', await capture(page, 'settings-load-failure'));

    await page.unroute('**/api/platform-settings');
    await retry.click({ timeout: ACTION_TIMEOUT });
    await expect(page.locator(READY)).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('returning to the screen re-reads the row instead of showing a cached one', async ({
    page,
  }) => {
    const reads = settingsReads(page);
    await page.goto(SETTINGS_ROUTE);
    await expect(page.locator(READY)).toBeVisible({ timeout: ACTION_TIMEOUT });
    const afterFirst = reads.length;
    expect(afterFirst).toBeGreaterThan(0);

    await page.goto('/dashboard/ops/schools');
    await page.goto(SETTINGS_ROUTE);
    await expect(page.locator(READY)).toBeVisible({ timeout: ACTION_TIMEOUT });
    expect(reads.length, 'the second visit must issue its own read').toBeGreaterThan(afterFirst);
  });
});
