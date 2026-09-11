/**
 * ops-tabs-populated proof — visual acceptance pass on the OPS school-detail
 * tabs against `mvp/claude-design/Ops Portal.dc.html` lines 292-418, using the
 * POPULATED demo fixtures (the earlier ops-tabs-audit ran against an EMPTY
 * school, where every tab legitimately renders nothing).
 *
 * Two schools, five tabs each (Overview, Admins, Teachers, Classes, Students),
 * 1440px, screenshot per tab — and EVERY tab reached BOTH ways: a `?tab=X`
 * deep link (URL navigation) and a click on the tab itself (click navigation),
 * because the two paths exercise different code (direct mount vs Radix panel
 * switch).
 *
 * Alongside the PNGs the spec writes `dom-measurements.json` — computed
 * styles + boxes for the design's named elements (tab row geometry, badges,
 * card headers/buttons, row anatomy, pills, menus) so the compare is
 * element-by-element, not eyeball-only.
 *
 * Plus the roster sanity check: Demo School A carries 172 students, so the
 * Students tab must paginate cleanly — page 1 renders exactly 25 kit rows
 * (the directory's default page size) with no horizontal layout explosion.
 *
 * Output (env-overridable):
 *   OPS_TABS_POPULATED_DIR=tests/proofs/ops-tabs-populated
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../../helpers/roles';

const OUTPUT_DIR = path.resolve(
  process.cwd(),
  process.env.OPS_TABS_POPULATED_DIR ?? 'tests/proofs/ops-tabs-populated',
);

/** The populated demo fixtures (schooltest-api seed). */
const SCHOOLS = [
  { key: 'a', label: 'Demo School A', documentId: 'y71h16mmldmxfecnao4diqd0' },
  { key: 'b', label: 'Demo School B', documentId: 'f7td6tkqh3qtw5rsa4oa4n0v' },
] as const;

const TABS = ['overview', 'admins', 'teachers', 'classes', 'students'] as const;

// kebab-case: CSSStyleDeclaration.getPropertyValue resolves kebab-case
// custom/longhand names; camelCase returns empty strings.
const COMPUTED = [
  'font-size',
  'font-weight',
  'color',
  'background-color',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'border-bottom-width',
  'border-bottom-color',
  'border-radius',
  'margin-bottom',
  'gap',
  'height',
  'width',
] as const;

type ComputedKey = (typeof COMPUTED)[number];
type Probe = Record<string, (Record<ComputedKey, string> & { box: { w: number; h: number } }) | null>;

/** Shape of the per-element payload handed INTO the browser context. */
const PROPS: readonly ComputedKey[] = COMPUTED;

/** Computed styles + box for a map of named CSS selectors; a missing element probes as null. */
async function probeStyles(page: Page, selectors: Record<string, string>): Promise<Probe> {
  return page.evaluate(({ selectors: map, props }) => {
    const out: Probe = {};
    for (const [name, selector] of Object.entries(map)) {
      const el = document.querySelector(selector);
      if (!el) {
        out[name] = null;
        continue;
      }
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const entry = {} as Record<ComputedKey, string> & { box: { w: number; h: number } };
      for (const prop of props) entry[prop] = cs.getPropertyValue(prop);
      entry.box = { w: Math.round(rect.width * 10) / 10, h: Math.round(rect.height * 10) / 10 };
      out[name] = entry;
    }
    return out;
  }, { selectors, props: PROPS });
}

async function save(page: Page, name: string): Promise<void> {
  await page.waitForTimeout(400); // settle fonts/hover layers
  const shot = await page.screenshot({ fullPage: true });
  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(path.join(OUTPUT_DIR, `${name}.png`), shot);
}

/** Wait for a table tab's data to have landed (rows or the kit's empty state). */
async function waitTableSettled(page: Page): Promise<void> {
  await expect
    .poll(
      async () =>
        (await page.locator('[data-directory-row]').count()) > 0 ||
        (await page.locator('[data-slot="empty-state"]').count()) > 0 ||
        (await page.locator('[data-slot="directory-error"]').count()) > 0,
      { timeout: 30_000 },
    )
    .toBe(true);
  await expect(page.locator('[data-slot="directory-loading"]')).toHaveCount(0, { timeout: 15_000 });
}

async function gotoTab(page: Page, documentId: string, tab: string): Promise<void> {
  await page.goto(`/dashboard/ops/schools/${documentId}?tab=${tab}`);
  await expect(page.locator('[data-surface="ops-school-detail"]')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole('tab', { name: new RegExp(`^${tab}`, 'i') })).toBeVisible({ timeout: 30_000 });
  // The aria-selected state follows the URL; poll it because two back-to-back
  // router.replace calls race in the App Router.
  await expect
    .poll(
      async () =>
        page.getByRole('tab', { name: new RegExp(`^${tab}`, 'i') }).getAttribute('aria-selected'),
      { timeout: 15_000 },
    )
    .toBe('true');
  if (tab !== 'overview') await waitTableSettled(page);
}

test.describe('ops school-detail tabs — populated fixtures', () => {
  test('captures every tab of both demo schools at 1440px (URL + click nav)', async ({ page }) => {
    test.setTimeout(300_000);
    // 1440 wide per the design pass. The shell scrolls in an INNER container,
    // so `fullPage` alone stays viewport-height — the height instead comes
    // from the viewport, sized to fit the tallest tab (Students: header +
    // 25 roster rows) in one frame.
    await page.setViewportSize({ width: 1440, height: 2800 });
    await loginAs(page, 'opsApi');

    const measurements: Record<string, unknown> = {};

    for (const school of SCHOOLS) {
      // Pass 1 — ?tab=X URL navigation.
      for (const tab of TABS) {
        await gotoTab(page, school.documentId, tab);
        await save(page, `${school.key}-${tab}-urlnav`);

        // Element-by-element probes for the design's named anatomy. The table
        // tabs render on the OpsTabTableCard wrapper (`data-slot=
        // "ops-tab-table-card"`); the overview card keeps its own slots.
        measurements[`${school.key}-${tab}-urlnav`] = await probeStyles(page, {
          tablist: '[role="tablist"]',
          activeTab: '[role="tab"][aria-selected="true"]',
          inactiveTab: '[role="tab"][aria-selected="false"]',
          activeTabBadge: '[role="tab"][aria-selected="true"] [data-testid^="ops-tab-count"]',
          tableCard: '[role="tabpanel"] [data-slot="ops-tab-table-card"]',
          headerTitle: '[role="tabpanel"] [data-slot="ops-tab-table-card"] h2',
          headerSummary: '[role="tabpanel"] [data-slot="ops-tab-table-card"] > div p',
          headerSecondaryButton:
            '[role="tabpanel"] [data-slot="ops-tab-table-card"] > div button:first-of-type',
          headerPrimaryButton:
            '[role="tabpanel"] [data-slot="ops-tab-table-card"] > div button:last-of-type',
          firstRow: '[data-directory-row]',
          firstRowTitle: '[data-directory-row] .text-\\[14\\.5px\\]',
          identityAvatar: '[data-directory-row] .size-10',
          firstRowPill: '[data-directory-row] [data-slot="status-pill"]',
          rowMenuButton: '[data-directory-row-menu] button',
          overviewDetailsCard: '[data-slot="ops-overview-details"]',
          overviewCardHeading: '[data-slot="ops-overview-details"] h2',
          overviewEditLink: '[data-testid="ops-overview-edit"]',
          activityCard: '[data-slot="ops-activity-card"]',
          activityRow: '[data-slot="ops-activity-row"]',
        });
      }

      // Pass 2 — click navigation: land on overview, then click through.
      await gotoTab(page, school.documentId, 'overview');
      for (const tab of TABS) {
        if (tab !== 'overview') {
          await page.getByRole('tab', { name: new RegExp(`^${tab}`, 'i') }).click();
          await expect
            .poll(
              async () =>
                page
                  .getByRole('tab', { name: new RegExp(`^${tab}`, 'i') })
                  .getAttribute('aria-selected'),
              { timeout: 15_000 },
            )
            .toBe('true');
          await waitTableSettled(page);
        }
        await expect(page.getByRole('tabpanel')).toBeVisible({ timeout: 30_000 });
        await save(page, `${school.key}-${tab}-clicknav`);
      }

      // The row menu (design `:406-417` — 224px dropdown, radius 16): open it
      // on the Teachers tab and capture, then measure the open panel.
      await page.getByRole('tab', { name: /^teachers/i }).click();
      // Assert the switch actually committed — the previous pass ends on the
      // Students tab, whose rows satisfy waitTableSettled on their own.
      await expect
        .poll(
          async () =>
            page.getByRole('tab', { name: /^teachers/i }).getAttribute('aria-selected'),
          { timeout: 15_000 },
        )
        .toBe('true');
      await waitTableSettled(page);
      const menuButton = page.locator('[data-directory-row-menu] button').first();
      await expect
        .poll(async () => menuButton.isVisible().catch(() => false), { timeout: 20_000 })
        .toBe(true);
      await menuButton.click();
      await page.waitForTimeout(300);
      measurements[`${school.key}-row-menu`] = await probeStyles(page, {
        menuContent: '[data-slot="dropdown-menu-content"]',
        menuItem: '[data-slot="dropdown-menu-item"]',
      });
      await save(page, `${school.key}-teachers-row-menu`);
      await page.keyboard.press('Escape');
    }

    await mkdir(OUTPUT_DIR, { recursive: true });
    await writeFile(
      path.join(OUTPUT_DIR, 'dom-measurements.json'),
      JSON.stringify(measurements, null, 2),
    );
  });

  test('roster sanity — 172 students paginate cleanly, 25 rows on page 1', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 2800 });
    await loginAs(page, 'opsApi');
    const schoolA = SCHOOLS[0];

    await gotoTab(page, schoolA.documentId, 'students');

    // Page 1 renders exactly the directory's default page size.
    const rows = page.locator('[data-directory-row]');
    await expect(rows).toHaveCount(25, { timeout: 30_000 });

    // The pager describes the whole school: 172 students over 7 pages.
    const summary = page.locator('[data-slot="directory"] p', { hasText: /172/ }).first();
    await expect(summary).toBeVisible({ timeout: 15_000 });

    // No layout explosion: no horizontal document overflow and every row keeps
    // a single-line height band (a wrapped UUID/email pushes rows past ~120px).
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth, 'no horizontal page overflow').toBeLessThanOrEqual(
      overflow.clientWidth,
    );
    const heights = await page.evaluate(() =>
      [...document.querySelectorAll('[data-directory-row]')].map(
        (row) => row.getBoundingClientRect().height,
      ),
    );
    expect(heights.length).toBe(25);
    for (const height of heights) {
      expect(height, `row stays single-line (${Math.round(height)}px)`).toBeLessThan(120);
    }

    // Page 2 loads a full page too (172 = 6x25 + 22), so the pager is real.
    // exact: the page also carries the Next.js dev-tools button ("Open Next.js
    // Dev Tools"), which a substring match would trip strict mode on.
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect
      .poll(async () => page.locator('[data-directory-row]').count(), { timeout: 30_000 })
      .toBe(25);
    await save(page, `${schoolA.key}-students-page2`);
  });
});
