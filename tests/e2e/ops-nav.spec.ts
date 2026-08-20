import { expect, test, type Page } from '@playwright/test';

import { cat, escapeRegExp, loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';

/**
 * Ops rail coverage. The console shipped with a single "Ops" nav entry, so
 * The rail exposes only the product-facing ops surfaces. Internal pipeline and
 * diagnostic tools stay out of primary navigation.
 *
 * This spec never calls page.goto for a console surface: it queries the rail and
 * clicks through, so a missing nav entry fails instead of being routed around.
 */
const en = loadMessages('en');

// Scope to the rail's menu buttons: the topbar breadcrumb repeats the active
// page's label as role="link", which trips strict mode on an unscoped lookup.
const railLink = (page: Page, key: string) =>
  page.locator(`a[data-sidebar="menu-button"][aria-label="${cat(en, `Shell.nav.${key}`)}"]`);

const OPS_SURFACES = [
  { key: 'opsSchools', href: '/dashboard/ops/schools', surface: 'ops-schools' },
  { key: 'opsTimers', href: '/dashboard/ops/timers', surface: 'ops-section-timers' },
  { key: 'opsSettings', href: '/dashboard/ops/settings', surface: 'ops-settings' },
] as const;

test.describe('ops sidebar navigation', () => {
  test('the rail carries one link per ops surface', async ({ page }) => {
    await loginAs(page, 'ops');
    await expect(railLink(page, 'opsSchools')).toBeVisible({ timeout: 20_000 });

    for (const { key, href } of OPS_SURFACES) {
      const link = railLink(page, key);
      await expect(link, key).toBeVisible();
      // localePrefix is 'as-needed', so the en href may or may not be prefixed.
      await expect(link, key).toHaveAttribute('href', new RegExp(`${escapeRegExp(href)}$`));
    }
  });

  test('every ops surface is reachable by clicking the rail', async ({ page }) => {
    await loginAs(page, 'ops');
    await expect(railLink(page, 'opsSchools')).toBeVisible({ timeout: 20_000 });

    for (const { key, href, surface } of OPS_SURFACES) {
      await railLink(page, key).click();
      await page.waitForURL(`**${href}`, { timeout: 20_000 });
      await expect(page.locator(`[data-surface="${surface}"]`), surface).toBeVisible({
        timeout: 20_000,
      });
      // The primitive sets a valueless data-active (base-ui boolean state).
      await expect(railLink(page, key), `${key} active`).toHaveAttribute('data-active', /.*/);
    }
  });

  test('the schools detail keeps its rail parent highlighted', async ({ page }) => {
    await loginAs(page, 'ops');
    await railLink(page, 'opsSchools').click();
    await page.waitForURL('**/dashboard/ops/schools', { timeout: 20_000 });

    const firstSchool = page.locator('[data-surface="ops-schools"] tbody a').first();
    await expect(firstSchool).toBeVisible({ timeout: 20_000 });
    await firstSchool.click();

    await page.waitForURL(/\/dashboard\/ops\/schools\/[^/]+$/, { timeout: 20_000 });
    await expect(railLink(page, 'opsSchools')).toHaveAttribute('data-active', /.*/);
  });

  test('pipeline and tools are not in the ops rail', async ({ page }) => {
    await loginAs(page, 'ops');
    await expect(railLink(page, 'opsSchools')).toBeVisible({ timeout: 20_000 });
    await expect(railLink(page, 'opsPipeline')).toHaveCount(0);
    await expect(railLink(page, 'opsTools')).toHaveCount(0);
  });

  test('the ad-hoc links the rail replaced are gone from the schools header', async ({ page }) => {
    await loginAs(page, 'ops');
    await railLink(page, 'opsSchools').click();
    await page.waitForURL('**/dashboard/ops/schools', { timeout: 20_000 });
    await expect(page.locator('[data-surface="ops-schools"]')).toBeVisible({ timeout: 20_000 });

    const header = page.locator('[data-surface="ops-schools"] > div').first();
    await expect(header.locator('a[href$="/dashboard/ops/timers"]')).toHaveCount(0);
    await expect(header.locator('a[href$="/dashboard/ops/pipeline"]')).toHaveCount(0);
  });
});
