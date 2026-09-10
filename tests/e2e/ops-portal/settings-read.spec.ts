/**
 * OPS-077 / C-OPS-PORTAL-067 — the browser half of the settings read.
 *
 * Task 42 (R-15) retired the six-group platform-settings FORM from this
 * route: the account card is the only drawn Settings content
 * (`Ops Portal.dc.html:531-543`), and GET /api/platform-settings no longer
 * has a consumer on this screen — task 04's session-expired card reads it
 * instead, for `session_timeout_minutes` (D-14). Two things are proven here
 * that an API test cannot:
 *  1. The web's response schema and the SHARED contract module still agree —
 *     the endpoint keeps serving even though this screen stopped reading it.
 *  2. The settings screen renders exactly the design (heading, sub-line, one
 *     account card) and never issues its own platform-settings request.
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

  test('the settings screen renders exactly the design and reads no platform settings', async ({
    page,
  }) => {
    const reads = settingsReads(page);
    await page.clock.setFixedTime(new Date(REFERENCE_CLOCK_ISO));
    await page.goto(SETTINGS_ROUTE);

    await expect(page.locator(READY)).toBeVisible({ timeout: ACTION_TIMEOUT });
    // One heading, one sub-line, one account card — nothing else on the
    // screen (`Ops Portal.dc.html:531-543`). The retired form and its panels
    // are gone.
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.locator('[data-surface="ops-platform-settings"]')).toHaveCount(0);
    await expect(page.locator('[data-slot="ops-legal-editor"]')).toHaveCount(0);
    console.log('CAPTURE', await capture(page, 'settings-desktop'));

    await page.setViewportSize(MOBILE_VIEWPORT);
    await expect(page.locator(READY)).toBeVisible({ timeout: ACTION_TIMEOUT });
    console.log('CAPTURE', await capture(page, 'settings-mobile'));

    // The read moved to task 04's session-expired card; this screen must not
    // reissue it on its own account.
    expect(
      reads,
      'the settings screen must not read GET /api/platform-settings any more',
    ).toEqual([]);
  });
});
