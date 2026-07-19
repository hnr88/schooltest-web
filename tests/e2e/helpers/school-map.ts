import { AxeBuilder } from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

import { loginAsParent } from './auth';
import { cat, loadMessages } from './i18n';

const en = loadMessages('en');

export const DESKTOP = { width: 1280, height: 800 } as const;
export const MOBILE = { width: 375, height: 812 } as const;

export const mapMsg = (key: string): string => cat(en, `SchoolSearch.map.${key}`);
export const SEARCH_LABEL = cat(en, 'UnifiedSearch.searchPlaceholderSchools');

// The Leaflet DivIcon class hooks (school-map-utils): a coord-bearing hit renders a
// `.school-map-marker` pin (`--active` while hovered), overlapping pins collapse into
// a `.school-map-cluster` badge. `.leaflet-container` is react-leaflet's map root.
export const mapContainer = (page: Page) => page.locator('.leaflet-container');
export const clusterBadges = (page: Page) => page.locator('.school-map-cluster');
export const markerPins = (page: Page) => page.locator('.school-map-marker');
export const activePins = (page: Page) => page.locator('.school-map-marker--active');
export const schoolCards = (page: Page) => page.locator('[data-slot="school-card"]');
export const searchBar = (page: Page) => page.getByLabel(SEARCH_LABEL);

/** Seeded-parent login → the Schools split with the sticky desktop map mounted + grouping on. */
export async function gotoSchoolsMap(page: Page): Promise<void> {
  await loginAsParent(page);
  await page.goto('/dashboard/search');
  await expect(schoolCards(page).first()).toBeVisible();
  await expect(mapContainer(page)).toBeVisible();
  // The ssr:false map chunk + query hits mount the cluster layer asynchronously.
  await expect.poll(() => clusterBadges(page).count()).toBeGreaterThan(0);
}

/** Seeded-parent login → the Schools pane at a mobile viewport (the desktop map stays hidden). */
export async function gotoSchoolsMobile(page: Page): Promise<void> {
  await loginAsParent(page);
  await page.goto('/dashboard/search');
  await expect(schoolCards(page).first()).toBeVisible();
}

/**
 * Zoom in via the custom `+` control until react-leaflet-cluster hits
 * disableClusteringAtZoom (15) and every geo hit renders as an individual pin.
 * Leaflet's own zoom tween can drop an overlapping click, so we over-iterate and
 * break as soon as the last cluster badge is gone.
 */
export async function declusterViaZoom(page: Page): Promise<void> {
  const zoomIn = page.getByRole('button', { name: mapMsg('zoomIn'), exact: true });
  for (let i = 0; i < 18; i += 1) {
    if ((await clusterBadges(page).count()) === 0) break;
    await zoomIn.click();
    await page.waitForTimeout(300);
  }
  await expect(clusterBadges(page)).toHaveCount(0);
}

/** Narrows the unified bar to a single-hit term → exactly one card and one geo pin. */
export async function filterToSingle(page: Page, term: string): Promise<void> {
  await searchBar(page).fill(term);
  await expect(schoolCards(page)).toHaveCount(1);
  await expect(markerPins(page)).toHaveCount(1);
}

/** Fails on any serious/critical axe violation (moderate/minor logged, not asserted). */
export async function expectAxeClean(page: Page, label: string): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).analyze();
  const blockers = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  const advisories = violations.filter((v) => v.impact === 'moderate' || v.impact === 'minor');
  if (advisories.length > 0) {
    console.log(`[axe ${label}]`, advisories.map((v) => `${v.impact}:${v.id}`).join(', '));
  }
  expect(blockers.map((v) => `${v.impact}:${v.id}`), label).toEqual([]);
}
