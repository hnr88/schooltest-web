import type { Page } from '@playwright/test';

import { cat, loadMessages } from './i18n';

// D9: seeded parent test user (code-only, never created via the UI in this helper —
// this drives the REAL /sign-in form against it).
export const SEEDED_PARENT = {
  email: 'parent@schooltest.local',
  password: 'Parent1234!',
} as const;

/**
 * Drives the real /sign-in UI end to end (task 19's C-AUTH-LOGIN flow): navigates,
 * fills the seeded parent's credentials, submits, and waits for the redirect to
 * /dashboard. Field/button labels are read live from the en catalog so a copy
 * change that breaks the real form also breaks this helper, never silently drifts.
 */
export async function loginAsParent(page: Page): Promise<void> {
  const en = loadMessages('en');
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(SEEDED_PARENT.email);
  await page
    .getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true })
    .fill(SEEDED_PARENT.password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  await page.waitForURL('**/dashboard');
}
