import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';
import { DESKTOP, gotoSchoolsMap, schoolCards } from './helpers/school-map';

const en = loadMessages('en');

test('school search: grouped filter panel changes the real result request', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await gotoSchoolsMap(page);

  const panel = page.locator('[data-slot="school-filter-panel"]');
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('heading', { name: cat(en, 'SchoolSearch.filterPanel.location') })).toBeVisible();
  await expect(
    panel.getByRole('heading', { name: cat(en, 'SchoolSearch.filterPanel.schoolProfile') }),
  ).toBeVisible();
  await expect(panel.getByRole('heading', { name: cat(en, 'SchoolSearch.filterPanel.features') })).toBeVisible();

  const qld = panel.getByRole('button', { name: cat(en, 'SchoolSearch.states.QLD'), exact: true });
  const response = page.waitForResponse((candidate) => {
    if (candidate.request().method() !== 'POST') return false;
    if (new URL(candidate.url()).pathname !== '/api/search/schools') return false;
    return (candidate.request().postDataJSON() as { states?: string[] }).states?.includes('QLD') ?? false;
  });
  await qld.click();
  expect((await response).ok()).toBeTruthy();
  await expect(qld).toHaveAttribute('aria-pressed', 'true');
  await expect(schoolCards(page)).toHaveCount(12);

  await panel.getByRole('button', { name: cat(en, 'SchoolSearch.filterPanel.clear'), exact: true }).click();
  await expect(qld).toHaveAttribute('aria-pressed', 'false');

  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(
    violations
      .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
      .map((violation) => `${violation.impact}:${violation.id}`),
  ).toEqual([]);
});
