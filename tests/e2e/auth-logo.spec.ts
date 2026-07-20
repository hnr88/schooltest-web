import { expect, test, type Page } from '@playwright/test';

const AUTH_ROUTES = [
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
] as const;

const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 375, height: 800 };

async function expectOneVisibleLogo(page: Page, route: string) {
  await page.goto(route);
  await expect(page.locator('[data-slot="logo"]:visible')).toHaveCount(1);
}

for (const [name, viewport] of [
  ['desktop', DESKTOP],
  ['mobile', MOBILE],
] as const) {
  test(`${name}: each auth page renders one visible logo`, async ({ page }) => {
    await page.setViewportSize(viewport);

    for (const route of AUTH_ROUTES) {
      await expectOneVisibleLogo(page, route);
    }
  });
}
