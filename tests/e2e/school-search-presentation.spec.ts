import { expect, test } from '@playwright/test';

import { mapContainer, DESKTOP, gotoSchoolsMap, schoolCards } from './helpers/school-map';

test('school search: image-led cards sit beside an expanded desktop map', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await gotoSchoolsMap(page);

  const firstCard = schoolCards(page).first();
  await expect(firstCard).toBeVisible();
  await expect(firstCard.locator('img')).toHaveCount(1);

  const resultsGrid = firstCard.locator('xpath=..');
  const mapAside = page.locator('aside').filter({ has: mapContainer(page) });
  const [resultsBox, mapBox] = await Promise.all([resultsGrid.boundingBox(), mapAside.boundingBox()]);

  expect(resultsBox).not.toBeNull();
  expect(mapBox).not.toBeNull();
  expect(mapBox!.width).toBeGreaterThanOrEqual(resultsBox!.width);
});
