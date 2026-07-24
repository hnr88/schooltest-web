import { expect, test, type Page } from '@playwright/test';

import {
  DESKTOP,
  filterToSingle,
  gotoSchoolsMap,
  mapContainer,
  mapToggle,
  schoolCards,
} from './helpers/school-map';
import { cat, escapeRegExp, loadMessages } from './helpers/i18n';
import { loginAsParent } from './helpers/auth';
import { paceRateWindow } from './helpers/pace';

const en = loadMessages('en');
// Shared API origin pattern (the live Strapi) — never a hardcoded port.
const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5510';
const UPLOADS_SRC = new RegExp(`^${escapeRegExp(`${API_BASE_URL}/uploads/`)}.+\\.png$`);

const cardImages = (page: Page) =>
  page.locator('[data-slot="school-card"] [data-slot="school-card-image"] img');

// Global API limiter headroom (120 req/min): pace each test — see helpers/pace.ts.
test.beforeEach(async ({ page }) => paceRateWindow(page));

/** Every rendered school card shows a REAL Strapi cover (all 312 records carry one). */
async function expectEveryCardHasCover(page: Page): Promise<void> {
  const cards = schoolCards(page);
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);
  await expect(cardImages(page)).toHaveCount(count);
  for (let i = 0; i < count; i += 1) {
    await expect(cardImages(page).nth(i)).toHaveAttribute('src', UPLOADS_SRC);
    // The image branch replaces the no-cover identity medallion on every card.
    await expect(cards.nth(i).locator('[data-slot="school-card-identity"]')).toHaveCount(0);
  }
}

test('school search: persistent filters, real Strapi media on every card, and an expanded desktop map', async ({
  page,
}) => {
  await page.setViewportSize(DESKTOP);
  await gotoSchoolsMap(page);

  // Filters now live in the §8.6 "All filters" overlay, not a persistent rail. Open
  // it, assert the same grouped controls, then close it before measuring the split.
  await page
    .getByRole('button', { name: cat(en, 'SchoolSearch.filterPanel.trigger'), exact: true })
    .click();
  const filterDialog = page.getByRole('dialog');
  await expect(filterDialog).toBeVisible();
  await expect(
    filterDialog.getByRole('heading', { name: cat(en, 'SchoolSearch.filterPanel.location') }),
  ).toBeVisible();
  await expect(
    filterDialog.getByRole('heading', { name: cat(en, 'SchoolSearch.filterPanel.schoolProfile') }),
  ).toBeVisible();
  await expect(
    filterDialog.getByRole('heading', { name: cat(en, 'SchoolSearch.filterPanel.features') }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(filterDialog).toBeHidden();

  const firstCard = schoolCards(page).first();
  await expect(firstCard).toBeVisible();
  await expect(page.locator('[data-slot="school-card-grid"]')).not.toHaveClass(/opacity-60/);
  // Every school now carries a real coverImage → the cover <img> branch, not the medallion.
  await expectEveryCardHasCover(page);

  const resultsWorkspace = page.locator('[data-slot="school-search-results"]');
  const mapAside = page.locator('[data-slot="school-map-column"]');
  const [resultsBox, mapBox] = await Promise.all([
    resultsWorkspace.boundingBox(),
    mapAside.boundingBox(),
  ]);

  expect(resultsBox).not.toBeNull();
  expect(mapBox).not.toBeNull();
  // The open split is `340px 1fr` — the fluid map column is wider than the results rail.
  expect(mapBox!.width).toBeGreaterThanOrEqual(resultsBox!.width);
  await expect
    .poll(async () =>
      mapAside.locator('.leaflet-tile').evaluateAll((tiles) =>
        tiles.some(
          (tile) =>
            tile instanceof HTMLImageElement && tile.complete && tile.naturalWidth > 0,
        ),
      ),
    )
    .toBe(true);
  await expect
    .poll(async () =>
      mapAside.locator('.school-map-cluster, .school-map-marker').evaluateAll((points) => {
        const map = document.querySelector('.leaflet-container');
        if (!map) return false;

        const bounds = map.getBoundingClientRect();
        return points.some((point) => {
          const pointBounds = point.getBoundingClientRect();
          return (
            pointBounds.right >= bounds.left &&
            pointBounds.left <= bounds.right &&
            pointBounds.bottom >= bounds.top &&
            pointBounds.top <= bounds.bottom
          );
        });
      }),
    )
    .toBe(true);
  await page.screenshot({ path: '.qa/screenshots/school-search-workspace.png' });

  await filterToSingle(page, 'Abbotsleigh');
  const cover = schoolCards(page).first().locator('[data-slot="school-card-image"] img');
  await expect(cover).toHaveAttribute('src', UPLOADS_SRC);
  await expect(schoolCards(page).first().locator('[data-slot="school-card-identity"]')).toHaveCount(0);
});

test('compact grid: map defaults CLOSED → 3 columns at 1280px, covers on every card; the toggle collapses to the rail', async ({
  page,
}) => {
  await page.setViewportSize(DESKTOP);
  await loginAsParent(page);
  await page.goto('/dashboard/search');
  await expect(schoolCards(page)).toHaveCount(12);

  // (1) Map default-closed: no Leaflet mount, the toggle offers "Show map".
  await expect(mapContainer(page)).toHaveCount(0);

  // (2) The full-width compact grid computes to THREE columns at xl: the first three
  // cards share one row (same y) at distinct x positions.
  const boxes = await Promise.all(
    [0, 1, 2].map((i) => schoolCards(page).nth(i).boundingBox()),
  );
  for (const box of boxes) expect(box).not.toBeNull();
  const [c0, c1, c2] = boxes.map((b) => b!);
  expect(Math.abs(c1.y - c0.y), 'cards 1–2 share a row').toBeLessThan(2);
  expect(Math.abs(c2.y - c0.y), 'cards 1–3 share a row').toBeLessThan(2);
  expect(c1.x).toBeGreaterThan(c0.x);
  expect(c2.x).toBeGreaterThan(c1.x);

  // (3) Compact cards: a card is meaningfully shorter than the viewport (sanity, not
  // pixel-pinning) — and every one renders its real Strapi cover.
  expect(c0.height).toBeLessThan(DESKTOP.height / 2);
  await expectEveryCardHasCover(page);
  await page.screenshot({
    path: '.qa/screenshots/school-search-compact-grid.png',
    fullPage: true,
  });

  // (4) Opening the map collapses the results to the fixed-width 1-column rail: the
  // first cards stack (distinct y) and the results column narrows to the 340px track.
  await mapToggle(page).click();
  await expect(mapContainer(page)).toBeVisible();
  const rail0 = await schoolCards(page).nth(0).boundingBox();
  const rail1 = await schoolCards(page).nth(1).boundingBox();
  const resultsBox = await page.locator('[data-slot="school-search-results"]').boundingBox();
  expect(rail0 && rail1 && resultsBox).toBeTruthy();
  expect(rail1!.y, 'the rail stacks cards in one column').toBeGreaterThan(rail0!.y + 1);
  expect(resultsBox!.width, 'the results column is the fixed 340px rail').toBeLessThan(400);
});
