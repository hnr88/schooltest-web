import { expect, test } from '@playwright/test';

import { loginAsParent } from './helpers/auth';

// Task 025 verification: the /onboarding route is reachable for an authenticated
// parent and renders the onboarding wizard.
const DESKTOP = { width: 1280, height: 800 };

test('task 025: /onboarding renders for authenticated parent', async ({ page }) => {
  await page.setViewportSize(DESKTOP);

  await loginAsParent(page);
  await page.goto('/en/onboarding');

  // Wait for the onboarding screen to hydrate and render the first step.
  const onboardingCard = page.locator('[data-slot="card"]').first();
  await expect(onboardingCard).toBeVisible();

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
