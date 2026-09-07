import path from 'node:path';

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

// Each surface names its OWN root selector. The three original consoles carry
// `data-surface`; System and Comms carry both, and the Audit console page has no
// `data-surface` at all — its root is the component's `data-slot`. Selecting what
// each page actually renders beats adding an attribute to three consoles this
// slice was told not to touch.
const OPS_SURFACES = [
  { key: 'opsSchools', href: '/dashboard/ops/schools', selector: '[data-surface="ops-schools"]' },
  { key: 'opsTimers', href: '/dashboard/ops/timers', selector: '[data-surface="ops-section-timers"]' },
  { key: 'opsSettings', href: '/dashboard/ops/settings', selector: '[data-surface="ops-settings"]' },
  // The three consoles that shipped without a rail entry and were reachable only
  // by typing the URL (System 2ee7ccb, Audit e542728, Comms 3c94805).
  { key: 'opsSystem', href: '/dashboard/ops/system', selector: '[data-surface="ops-system"]' },
  { key: 'opsAudit', href: '/dashboard/ops/audit', selector: '[data-slot="ops-audit-console"]' },
  { key: 'opsComms', href: '/dashboard/ops/comms', selector: '[data-surface="ops-comms"]' },
] as const;

// The mission captures directory sits at the PROJECT ROOT; this spec lives two
// levels down inside schooltest-web.
const CAPTURES =
  process.env.CAPTURES_DIR
  ?? path.resolve(__dirname, '..', '..', '..', '.codephant', 'missions', 'msn-0da39441-f845-426b-88a1-037c9eb98442', 'captures');

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

  test('the three new console entries render in the rail at desktop and 375', async ({ page }) => {
    await loginAs(page, 'ops');
    await expect(railLink(page, 'opsSchools')).toBeVisible({ timeout: 20_000 });

    const NEW_ENTRIES = ['opsSystem', 'opsAudit', 'opsComms'] as const;

    // Desktop: the rail is open, so the three entries are visible with their labels.
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const key of NEW_ENTRIES) {
      await expect(railLink(page, key), `${key} desktop`).toBeVisible();
    }
    await page.screenshot({ path: path.join(CAPTURES, 'nav-consoles-desktop.png'), fullPage: true });
    await test.info().attach('nav-consoles-desktop', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });

    // 375: the rail collapses into a sheet and UNMOUNTS its items — asserting them
    // while it is shut would be asserting nothing. So open it through the topbar
    // trigger the way a person would, then require the three entries to be really
    // visible at that width.
    await page.setViewportSize({ width: 375, height: 780 });
    await page.getByRole('button', { name: cat(en, 'Shell.topbar.toggleNav') }).click();
    for (const key of NEW_ENTRIES) {
      await expect(railLink(page, key), `${key} 375`).toBeVisible({ timeout: 10_000 });
    }
    // Capture the OPEN sheet with animations frozen. A fullPage shot here caught
    // the rail mid-fade behind the page underneath — technically passing, useless
    // as evidence.
    const sheet = page.locator('[data-slot="sidebar"], [data-sidebar="sidebar"]').first();
    const shot = { animations: 'disabled' as const };
    await sheet.screenshot({ path: path.join(CAPTURES, 'nav-consoles-375.png'), ...shot });
    await test.info().attach('nav-consoles-375', {
      body: await sheet.screenshot(shot),
      contentType: 'image/png',
    });
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
