import { expect, test } from '@playwright/test';

import { loginAsParent } from './helpers/auth';
import { cat, loadMessages } from './helpers/i18n';

// Task 025 verification: the /onboarding route is reachable for an authenticated
// parent and renders the onboarding screen (the seeded parent has skipped, so
// it lands on the done panel).
const en = loadMessages('en');
const DESKTOP = { width: 1280, height: 800 };

test('task 025: /onboarding renders for authenticated parent', async ({ page }) => {
  await page.setViewportSize(DESKTOP);

  await loginAsParent(page);
  await page.goto('/en/onboarding');

  // Wait for the onboarding screen to hydrate and render the done panel.
  const onboardingCard = page.locator('[data-slot="card"]').first();
  await expect(onboardingCard).toBeVisible();
  await expect(
    page.getByRole('link', { name: cat(en, 'Onboarding.goToDashboard'), exact: true }),
  ).toBeVisible();

  // Visual evidence for QA.
  await page.screenshot({
    path: '/home/hnr/Code/schooltest/.qa/screenshots/025-onboarding-authenticated.png',
    fullPage: true,
  });
});

test('task 025: /onboarding redirects anonymous visitors to /sign-in', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/en/onboarding');
  await page.waitForURL('**/sign-in');
  await expect(page).toHaveURL(/\/sign-in$/);

  await page.screenshot({
    path: '/home/hnr/Code/schooltest/.qa/screenshots/025-onboarding-anon-redirect.png',
    fullPage: true,
  });
});
