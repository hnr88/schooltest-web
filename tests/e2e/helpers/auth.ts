import type { Page } from '@playwright/test';

import { cat, loadMessages } from './i18n';

// D9: seeded parent test user (code-only, never created via the UI in this helper —
// this drives the REAL /sign-in form against it).
export const SEEDED_PARENT = {
  email: 'parent@schooltest.local',
  password: 'Parent1234!',
} as const;

// The API's brute-force guard allows 20 POST /api/auth/local per minute per IP
// (AUTH_RATELIMIT_MAX=20, AUTH_RATELIMIT_INTERVAL_MS=60000). A warmed e2e suite logs
// in far faster than that (429 → the sign-in never redirects and the test times out),
// so submissions are paced to stay under the limit. Module state is per worker
// process; run rate-sensitive suites with --workers=1.
const MIN_LOGIN_INTERVAL_MS = 3100; // 60s / 20 logins + slack
let lastLoginSubmittedAt = 0;

/**
 * Drives the real /sign-in UI end to end (task 19's C-AUTH-LOGIN flow): navigates,
 * fills the seeded parent's credentials, submits, and waits for the redirect to
 * /dashboard. Field/button labels are read live from the en catalog so a copy
 * change that breaks the real form also breaks this helper, never silently drifts.
 */
export async function loginAsParent(page: Page): Promise<void> {
  const en = loadMessages('en');
  const sinceLast = Date.now() - lastLoginSubmittedAt;
  if (lastLoginSubmittedAt !== 0 && sinceLast < MIN_LOGIN_INTERVAL_MS) {
    await page.waitForTimeout(MIN_LOGIN_INTERVAL_MS - sinceLast);
  }
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(SEEDED_PARENT.email);
  await page
    .getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true })
    .fill(SEEDED_PARENT.password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  lastLoginSubmittedAt = Date.now();
  await page.waitForURL('**/dashboard');
}

/**
 * Freshly registered parents sit behind the mandatory-onboarding gate: once
 * users/me resolves with the parent role, DashboardOnboardingGuard replaces any
 * /dashboard route with /onboarding — ASYNCHRONOUSLY, mid-test, detaching
 * whatever element is being clicked (observed as a 30s "element is not
 * stable / detached" click timeout on the settings Update-password button).
 * Walk the real skip path (Skip → Go to dashboard) so the guard stands down
 * before the test touches dashboard screens.
 */
export async function skipOnboardingViaUi(page: Page): Promise<void> {
  const en = loadMessages('en');
  await page.goto('/onboarding');
  const skip = page.getByRole('button', { name: cat(en, 'Onboarding.skip'), exact: true });
  // A parent who already skipped/completed has nothing to skip — tolerate that
  // so the helper is safe to call on every run, not just the first.
  const canSkip = await skip
    .waitFor({ state: 'visible', timeout: 5000 })
    .then(() => true, () => false);
  if (canSkip) {
    await skip.click();
    await page
      .getByRole('link', { name: cat(en, 'Onboarding.goToDashboard'), exact: true })
      .click();
  }
  await page.goto('/dashboard');
  await page.waitForURL('**/dashboard');
}
