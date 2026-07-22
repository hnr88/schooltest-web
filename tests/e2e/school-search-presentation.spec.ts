import { expect, test } from '@playwright/test';

import {
  DESKTOP,
  filterToSingle,
  gotoSchoolsMap,
  mapContainer,
  schoolCards,
} from './helpers/school-map';
import { cat, loadMessages } from './helpers/i18n';

const en = loadMessages('en');

test('school search: persistent filters, real Strapi media, and an expanded desktop map', async ({ page }) => {
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
  await expect(firstCard.locator('[data-slot="school-card-identity"]')).toBeVisible();
  await expect(firstCard.locator('img')).toHaveCount(0);

  const resultsWorkspace = page.locator('[data-slot="school-search-results"]');
  const mapAside = page.locator('aside').filter({ has: mapContainer(page) });
  const [resultsBox, mapBox] = await Promise.all([
    resultsWorkspace.boundingBox(),
    mapAside.boundingBox(),
  ]);

  expect(resultsBox).not.toBeNull();
  expect(mapBox).not.toBeNull();
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
  const cover = schoolCards(page).first().locator('img');
  await expect(cover).toHaveAttribute('src', /localhost:5500\/uploads\//);
  await expect(schoolCards(page).first().locator('[data-slot="school-card-identity"]')).toHaveCount(0);
});
