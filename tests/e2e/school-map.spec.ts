import { readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { watchErrors } from './helpers/ui';
import {
  activePins,
  clusterBadges,
  declusterViaZoom,
  DESKTOP,
  expectAxeClean,
  filterToSingle,
  gotoSchoolsMap,
  gotoSchoolsMobile,
  mapContainer,
  mapMsg,
  markerPins,
  MOBILE,
  schoolCards,
} from './helpers/school-map';

// Task 094 — the C-UI-SEARCH-MAP e2e anchor. Drives the live Schools-pane Leaflet map
// against the real api on :5500 and real OSM tiles (no route interception). The seeded
// 312-school corpus is deterministic: page 1 (name-asc) is 12 cards, 3 of which are
// null-coord "umbrella" rows (ACT Education Directorate, Acknowledge Education,
// Adelaide Institute) → exactly 9 geo pins. Two page-1 pairs (Gold Coast, Melbourne)
// sit pixels apart at zoom 5, so grouping always produces ≥1 cluster badge. Assertions
// count DOM (markers/badges), never tile imagery (external-host dependency, M2 §8).

test('renders clusters at zoom 5, de-clusters into every geo pin on zoom-in; umbrella rows get no pin', async ({
  page,
}) => {
  const errors = watchErrors(page);
  await page.setViewportSize(DESKTOP);
  await gotoSchoolsMap(page);

  // (1) .leaflet-container renders; grouping is on → ≥1 cluster badge at the AU zoom-5 view.
  await expect(mapContainer(page)).toBeVisible();
  await expect(schoolCards(page)).toHaveCount(12);
  const clustersAtZoom5 = await clusterBadges(page).count();
  expect(clustersAtZoom5, 'a cluster badge is visible at zoom 5').toBeGreaterThan(0);
  const markersClustered = await markerPins(page).count();

  // (2) Zoom in via the custom `+` control → clustering disables (zoom ≥ 15), pins spread out.
  await declusterViaZoom(page);
  const pins = await markerPins(page).count();
  expect(pins, 'zoom-in exposes more individual markers').toBeGreaterThan(markersClustered);

  // (5) 3 of page 1's 12 rows are umbrella (null-coord) → 9 pins < 12 cards: card, no pin.
  await expect(schoolCards(page)).toHaveCount(12);
  expect(pins).toBe(9);
  expect(pins).toBeLessThan(12);

  expect(errors, errors.join('\n')).toEqual([]);
});

test('(3) card ↔ pin hover-sync flips the active class in both directions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); // snap the focus fly so the pin is stable
  await page.setViewportSize(DESKTOP);
  await gotoSchoolsMap(page);
  await filterToSingle(page, 'Paterson'); // A B Paterson College — one hit, one pin

  const card = schoolCards(page).first();

  // card → pin: hovering the result card raises its pin to the active icon.
  await expect(activePins(page)).toHaveCount(0);
  await card.hover();
  await expect(card).toHaveAttribute('data-active', 'true');
  await expect(activePins(page)).toHaveCount(1);

  // clearing the hover clears both.
  await page.mouse.move(0, 0);
  await expect(activePins(page)).toHaveCount(0);
  await expect(card).toHaveAttribute('data-active', 'false');

  // pin → card: hovering the pin marks its card active (the reverse guard).
  await markerPins(page).first().hover();
  await expect(card).toHaveAttribute('data-active', 'true');
  await expect(activePins(page)).toHaveCount(1);
});

test('(4) Map/List toggle hides the map and widens the results grid', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await gotoSchoolsMap(page);
  await expect(mapContainer(page)).toBeVisible();

  const withMap = await schoolCards(page).first().boundingBox();
  // With the map open the toggle offers "Show list"; clicking it collapses the split.
  await page.getByRole('button', { name: mapMsg('showList'), exact: true }).click();
  await expect(mapContainer(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: mapMsg('showMap'), exact: true })).toBeVisible();

  const noMap = await schoolCards(page).first().boundingBox();
  expect(withMap && noMap).toBeTruthy();
  expect(noMap!.width, 'the grid widens once the map column drops out').toBeGreaterThan(
    withMap!.width,
  );
});

test('(6) mobile (375px): the desktop map column is hidden and the toggle opens the map sheet', async ({
  page,
}) => {
  await page.setViewportSize(MOBILE);
  await gotoSchoolsMobile(page);

  // The sticky split column is `hidden lg:block` → its map is not shown on mobile.
  await expect(page.locator('aside .leaflet-container')).toBeHidden();

  // The mobile "Show map" trigger opens a bottom sheet that mounts the map.
  const trigger = page.getByRole('button', { name: mapMsg('showMap'), exact: true });
  await expect(trigger).toBeVisible();
  await trigger.click();
  const sheet = page.getByRole('dialog');
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('.leaflet-container')).toBeVisible();
});

test('(7a) axe: the schools map split has zero serious/critical violations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize(DESKTOP);
  await gotoSchoolsMap(page);
  await expect(page).toHaveTitle(/\S/);
  await expectAxeClean(page, '/dashboard/search map split @ 1280px');
});

test('(7b) prefers-reduced-motion snaps the focus fly instead of animating', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize(DESKTOP);
  await gotoSchoolsMap(page);

  const reduceActive = await page.evaluate(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  expect(reduceActive).toBe(true);

  // Paterson (153°E) sits off-screen at the AU-wide zoom-5 view; selecting it fires
  // useMapResultFocus.flyTo. Under reduced motion the app passes animate:false, so the
  // camera JUMPS and the pin is centred in-viewport within a frame — far faster than a
  // ~20° flyTo tween (>1s) could deliver.
  await filterToSingle(page, 'Paterson');
  await expect(markerPins(page).first()).toBeInViewport({ timeout: 700 });
});

test('SSR: the search page server-renders without a Leaflet window crash; the panel is not barrelled', async ({
  page,
}) => {
  // Pure server HTML (no client JS executed): the ssr:false dynamic boundary keeps
  // Leaflet off the server, so the response is 200 with NO Leaflet markup or crash.
  const res = await page.request.get('/dashboard/search');
  expect(res.status()).toBe(200);
  const html = await res.text();
  expect(html).not.toContain('leaflet-container');
  expect(html.toLowerCase()).not.toContain('window is not defined');
  expect(html).not.toContain('Application error');

  // Static guard: the module barrel must NOT re-export the map panel/leaf — a barrel
  // re-export defeats next/dynamic(ssr:false) and SSR-crashes on `window`.
  const barrel = readFileSync(
    path.resolve(process.cwd(), 'src/modules/school-search/index.ts'),
    'utf8',
  );
  expect(barrel).not.toContain('SchoolResultsMapPanel');
  expect(barrel).not.toContain('SchoolResultsMap');

  // The .leaflet-container exists only after client hydration.
  await gotoSchoolsMap(page);
  await expect(mapContainer(page)).toBeVisible();
});
