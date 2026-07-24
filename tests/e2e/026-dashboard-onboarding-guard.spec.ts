import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { SEEDED_PARENT } from './helpers/auth';
import { cat, loadMessages } from './helpers/i18n';

// Task 026 verification: the dashboard onboarding guard redirects a parent with
// pending onboarding to /onboarding, and lets parents with completed/skipped
// onboarding into /dashboard.
//
// The seeded parent is normally kept in the skipped state so existing dashboard
// specs land directly on /dashboard. This spec resets that row to pending at the
// start so it can exercise the guard, then lets the UI mark it skipped again.
const en = loadMessages('en');
const DESKTOP = { width: 1280, height: 800 };

function getApiDatabasePassword(): string {
  const apiEnvPath = path.resolve(process.cwd(), '../schooltest-api/.env');
  const raw = readFileSync(apiEnvPath, 'utf8');
  const match = raw.match(/^DATABASE_PASSWORD=(.+)$/m);
  if (!match) throw new Error('DATABASE_PASSWORD not found in schooltest-api/.env');
  return match[1].trim();
}

function resetParentOnboarding(status: 'pending' | 'skipped' | 'completed'): void {
  const password = getApiDatabasePassword();
  const skippedAt = status === 'skipped' ? 'NOW()' : 'NULL';
  const completedAt = status === 'completed' ? 'NOW()' : 'NULL';
  const sql = `
    UPDATE parent_onboardings
    SET status = '${status}',
        skipped_at = ${skippedAt},
        completed_at = ${completedAt}
    WHERE id IN (
      SELECT po.id
      FROM parent_onboardings po
      JOIN parent_onboardings_user_lnk lnk ON po.id = lnk.parent_onboarding_id
      JOIN up_users u ON lnk.user_id = u.id
      WHERE u.email = '${SEEDED_PARENT.email}'
    );
  `;
  execSync(
    `PGPASSWORD='${password}' psql -h 127.0.0.1 -p 5550 -U schooltest -d schooltest -c "${sql}"`,
    { stdio: 'ignore' },
  );
}

async function submitSignInForm(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(SEEDED_PARENT.email);
  await page
    .getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true })
    .fill(SEEDED_PARENT.password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  resetParentOnboarding('pending');
});

test.afterAll(() => {
  resetParentOnboarding('skipped');
});

test('task 026: pending parent is redirected to /onboarding after login', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  page.on('console', (msg) => console.log(`[browser:${msg.type()}]`, msg.text()));

  await submitSignInForm(page);
  await page.waitForURL('**/onboarding');
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByText(cat(en, 'Onboarding.skip'))).toBeVisible();

  await page.screenshot({
    path: '/home/hnr/Code/schooltest/.qa/screenshots/026-onboarding-redirect.png',
    fullPage: true,
  });
});

test('task 026: skipping onboarding lands on /dashboard', async ({ page }) => {
  await page.setViewportSize(DESKTOP);

  await submitSignInForm(page);
  await page.waitForURL('**/onboarding');
  await expect(page).toHaveURL(/\/onboarding$/);

  await page.getByRole('button', { name: cat(en, 'Onboarding.skip'), exact: true }).click();

  // The onboarding screen switches to the success state after the mutation.
  await expect(
    page.getByRole('link', { name: cat(en, 'Onboarding.goToDashboard'), exact: true }),
  ).toBeVisible();
  await page
    .getByRole('link', { name: cat(en, 'Onboarding.goToDashboard'), exact: true })
    .click();

  await page.waitForURL('**/dashboard');
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.screenshot({
    path: '/home/hnr/Code/schooltest/.qa/screenshots/026-dashboard-after-skip.png',
    fullPage: true,
  });
});

test('task 026: skipped parent lands directly on /dashboard after login', async ({ page }) => {
  await page.setViewportSize(DESKTOP);

  await submitSignInForm(page);
  await page.waitForURL('**/dashboard');
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.screenshot({
    path: '/home/hnr/Code/schooltest/.qa/screenshots/026-dashboard-direct.png',
    fullPage: true,
  });
});
