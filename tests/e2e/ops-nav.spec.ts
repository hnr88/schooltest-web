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

// Each surface names its OWN root selector. mvp/ops task 41 (R-09…R-14) retired
// the five console rows; the two drawn surfaces remain, trimmed never deleted.
const OPS_SURFACES = [
  { key: 'opsSchools', href: '/dashboard/ops/schools', selector: '[data-surface="ops-schools"]' },
  { key: 'opsSettings', href: '/dashboard/ops/settings', selector: '[data-surface="ops-settings"]' },
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

    for (const { key, href, selector } of OPS_SURFACES) {
      await railLink(page, key).click();
      await page.waitForURL(`**${href}`, { timeout: 20_000 });
      await expect(page.locator(selector), selector).toBeVisible({
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

    const table = page.locator('[data-surface="ops-schools"]');
    await expect(table).toBeVisible({ timeout: 20_000 });

    // THE TRANSPORT IS A DIRECT VISIT, AND THAT IS DELIBERATE — read this before
    // "fixing" it back to a click.
    //
    // The original locator `[data-surface="ops-schools"] tbody a` matches nothing:
    // the rows render PLAIN cells, and `OpsSchoolRow` — the only component with an
    // anchor — is dead code, referenced solely by its own props type. The page's
    // real interaction is the row's 'Row actions' menu → 'Open school', which calls
    // `router.push` in `OpsSchoolsTable.tsx:206`.
    //
    // THAT MENU ACTION IS CURRENTLY BROKEN. Driven for real (menu opens, item is
    // role=menuitem "Open school", click lands, menu closes) the URL never leaves
    // /dashboard/ops/schools — measured over a 3s settle, with no page error. The
    // table takes `useRouter` from plain `next/navigation` while this app is
    // next-intl with localePrefix 'as-needed'. Reported as its own defect; fixing
    // it is a console behaviour change this slice was told not to make.
    //
    // So this test reaches the detail route directly, which is faithful to what it
    // asserts: the RAIL's behaviour on a child route, not the table's navigation.
    // The spec's no-goto rule exists so a missing rail ENTRY cannot be routed
    // around — a school detail is not a rail entry, and every rail entry is still
    // click-proven by the tests above. The id comes from the app's own
    // authenticated list response, so nothing is hardcoded or seeded.
    const listResponse = await page.waitForResponse(
      (res) => /\/api\/ops\/schools(\?|$)/.test(res.url()) && res.request().method() === 'GET',
      { timeout: 20_000 },
    ).catch(() => null);
    const firstId = await (async () => {
      if (listResponse === null) return null;
      const body = (await listResponse.json().catch(() => null)) as
        | { data?: Array<{ documentId?: string }> }
        | null;
      return body?.data?.[0]?.documentId ?? null;
    })();
    expect(firstId, 'the schools list response carries at least one school').toBeTruthy();

    await page.goto(`/dashboard/ops/schools/${firstId}`);

    // The assertion this test exists for, unchanged: a school DETAIL route keeps
    // the Schools rail entry highlighted rather than clearing the rail.
    await expect(page).toHaveURL(/\/dashboard\/ops\/schools\/[^/]+$/, { timeout: 20_000 });
    await expect(railLink(page, 'opsSchools')).toHaveAttribute('data-active', /.*/);
  });

  test('pipeline and tools are not in the ops rail', async ({ page }) => {
    await loginAs(page, 'ops');
    await expect(railLink(page, 'opsSchools')).toBeVisible({ timeout: 20_000 });
    await expect(
      page.locator('a[data-sidebar="menu-button"][href$="/dashboard/ops/pipeline"]'),
    ).toHaveCount(0);
    await expect(
      page.locator('a[data-sidebar="menu-button"][href$="/dashboard/ops/tools"]'),
    ).toHaveCount(0);
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
