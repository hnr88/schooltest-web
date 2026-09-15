/**
 * NIGHT-2 W1 (AUTH) guards + change-password battery — AUTH-015..018 and
 * 034/035 from .overnight/N2/JOURNEYS-N2.md. Wrong-role JWTs are exercised
 * through REAL signed-in sessions driving the real guards; AUTH-034/035 run
 * against a THROWAWAY parent so no seeded credential is ever rotated.
 * Run with --workers=1 (sign-in pacing).
 */
import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { skipOnboardingViaUi } from './helpers/auth';
import { cat, loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';
import { registerAndConfirmParent } from './helpers/throwaway-parent';

const en = loadMessages('en');
const CAPTURES = '/Users/hunor.nagy/Code/schooltest/.overnight/N2/captures';
const ATTEMPT_INTERVAL_MS = 3100;
const NEW_PASSWORD = 'N2w1Changed!2026';
const usedEmails: string[] = [];

let lastLoginSubmittedAt = 0;
async function uiLogin(page: Page, email: string, password: string): Promise<void> {
  const sinceLast = Date.now() - lastLoginSubmittedAt;
  if (lastLoginSubmittedAt !== 0 && sinceLast < ATTEMPT_INTERVAL_MS) {
    await page.waitForTimeout(ATTEMPT_INTERVAL_MS - sinceLast);
  }
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true }).fill(email);
  await page.getByLabel(cat(en, 'Auth.portal.passwordLabel'), { exact: true }).fill(password);
  await page
    .getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true })
    .click();
  lastLoginSubmittedAt = Date.now();
}

async function shot(page: Page, name: string): Promise<string> {
  mkdirSync(CAPTURES, { recursive: true });
  const file = path.join(CAPTURES, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

// ---------------------------------------------------------------------------
// AUTH-015 — parent JWT on a teacher route → parent-views-unavailable mask
// ---------------------------------------------------------------------------
test('AUTH-015 parent JWT on a teacher route shows the parent-views mask', async ({
  page,
  request,
}) => {
  const parent = await registerAndConfirmParent(request, 'n2w1-015');
  usedEmails.push(parent.email);
  await uiLogin(page, parent.email, parent.password);
  await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 20_000 });
  await skipOnboardingViaUi(page);

  // Teacher surface with a parent session: the guard masks, never errors.
  await page.goto('/dashboard/test-sessions');
  await expect(
    page.getByText(cat(en, 'Auth.parentViewsUnavailable.title')),
  ).toBeVisible({ timeout: 20_000 });
  await expect(
    page.getByText(cat(en, 'Auth.parentViewsUnavailable.body')),
  ).toBeVisible();
  await shot(page, 'AUTH-015-parent-on-teacher-route');
});

// ---------------------------------------------------------------------------
// AUTH-016 — teacher JWT on a school-admin route → bounced off the surface
// ---------------------------------------------------------------------------
test('AUTH-016 teacher JWT on a school-admin route is bounced by the guard', async ({
  page,
}) => {
  await loginAs(page, 'teacher');
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });

  await page.goto('/dashboard/school/students');
  // The guard re-routes the teacher away from the school-admin surface (back
  // to their own dashboard root) — the school content never paints.
  await expect
    .poll(() => page.url(), { timeout: 20_000, message: 'SA guard bounces the teacher' })
    .not.toContain('/dashboard/school');
  await expect(
    page.getByText(cat(en, 'SchoolStudents.detail.notFoundTitle')),
  ).toHaveCount(0);
  await shot(page, 'AUTH-016-teacher-on-school-route');
});

// ---------------------------------------------------------------------------
// AUTH-017 — school-admin/teacher JWT on /dashboard/ops → bounced to the
// role dashboard, never the ops console
// ---------------------------------------------------------------------------
test('AUTH-017 non-ops JWTs cannot open /dashboard/ops', async ({ page }) => {
  test.setTimeout(120_000);

  // School admin
  await loginAs(page, 'schoolAdminB');
  await page.goto('/dashboard/ops/schools');
  // The ops URL itself matches /dashboard/…, so poll for the bounce explicitly.
  await expect
    .poll(() => page.url(), { timeout: 20_000, message: 'ops guard bounces the SA' })
    .not.toContain('/dashboard/ops');
  await expect(page.locator('[data-surface="ops-schools"]')).toHaveCount(0);
  await shot(page, 'AUTH-017-sa-on-ops-route');

  // Sign out, then teacher
  await page.getByRole('button', { name: cat(en, 'Shell.topbar.userMenuLabel') }).click();
  await page.getByRole('menuitem', { name: cat(en, 'Shell.userMenu.signOut') }).click();
  await page.waitForURL(/sign-in/, { timeout: 15_000 });

  await loginAs(page, 'teacher');
  await page.goto('/dashboard/ops/schools');
  await expect
    .poll(() => page.url(), { timeout: 20_000, message: 'ops guard bounces the teacher' })
    .not.toContain('/dashboard/ops');
  await expect(page.locator('[data-surface="ops-schools"]')).toHaveCount(0);
});

// ---------------------------------------------------------------------------
// AUTH-018 — anonymous deep link → sign-in preserving the return path
// ---------------------------------------------------------------------------
test('AUTH-018 anonymous deep link bounces to sign-in and returns after login', async ({
  page,
}) => {
  const attempted = '/dashboard/school/students';
  // The guard's client redirect during initial hydration can abort the
  // document navigation itself (net::ERR_ABORTED) — the bounce is the outcome.
  // A cold dev-compile of the attempted route delays hydration, hence the
  // generous window; force a reload once if the first bounce is still pending.
  await page.goto(attempted).catch(() => {});
  await page
    .waitForURL(/\/sign-in\?from=%2Fdashboard%2Fschool%2Fstudents/, { timeout: 45_000 })
    .catch(async () => {
      await page.goto(attempted).catch(() => {});
      await page.waitForURL(/\/sign-in\?from=%2Fdashboard%2Fschool%2Fstudents/, {
        timeout: 45_000,
      });
    });
  await shot(page, 'AUTH-018-signin-with-return-path');

  // Signing in returns the visitor to the page they were heading for.
  await loginAs(page, 'schoolAdmin');
  await page.waitForURL(/\/dashboard\/school\/students\/?$/, { timeout: 20_000 });
  await expect(page).not.toHaveURL(/sign-in/);
  await shot(page, 'AUTH-018-returned-to-attempted-path');
});

// ---------------------------------------------------------------------------
// AUTH-034/035 — change password on a THROWAWAY parent (never a seeded login)
// ---------------------------------------------------------------------------
test('AUTH-034/035 change password: wrong current refused inline; correct one works', async ({
  page,
  request,
}) => {
  test.setTimeout(180_000);
  const parent = await registerAndConfirmParent(request, 'n2w1-034');
  usedEmails.push(parent.email);
  await uiLogin(page, parent.email, parent.password);
  await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 20_000 });
  await skipOnboardingViaUi(page);

  // The parent settings screen mounts the change-password card (auth tab).
  await page.goto('/dashboard/settings?tab=auth');
  const currentField = page.getByLabel(cat(en, 'Auth.currentPasswordLabel'), { exact: true });
  await expect(currentField).toBeVisible({ timeout: 30_000 });

  // AUTH-035: wrong current password → inline refusal, session intact.
  await currentField.fill('WrongCurrent123!');
  await page
    .getByLabel(cat(en, 'Auth.newPasswordLabel'), { exact: true })
    .fill(NEW_PASSWORD);
  await page
    .getByLabel(cat(en, 'Auth.confirmPasswordLabel'), { exact: true })
    .fill(NEW_PASSWORD);
  await page
    .getByRole('button', { name: cat(en, 'Auth.updatePasswordButton'), exact: true })
    .click();
  // AUTH-035: wrong current password → inline refusal, session intact. The
  // copy renders in BOTH the inline alert and the sonner toast — assert one.
  await expect(page.getByText(cat(en, 'Auth.wrongCurrentPassword')).first()).toBeVisible({
    timeout: 30_000,
  });
  // The session survived: the shell still paints the signed-in user menu.
  await expect(
    page.getByRole('button', { name: cat(en, 'Shell.topbar.userMenuLabel') }),
  ).toBeVisible();
  await shot(page, 'AUTH-035-wrong-current-password');

  // AUTH-034: correct current password → success toast.
  await currentField.fill(parent.password);
  await page
    .getByLabel(cat(en, 'Auth.newPasswordLabel'), { exact: true })
    .fill(NEW_PASSWORD);
  await page
    .getByLabel(cat(en, 'Auth.confirmPasswordLabel'), { exact: true })
    .fill(NEW_PASSWORD);
  await page
    .getByRole('button', { name: cat(en, 'Auth.updatePasswordButton'), exact: true })
    .click();
  await expect(page.getByText(cat(en, 'Auth.passwordUpdated')).first()).toBeVisible({
    timeout: 20_000,
  });
  await shot(page, 'AUTH-034-password-changed');

  // Next login needs the new one: the OLD password is refused, the NEW works.
  await page
    .getByRole('button', { name: cat(en, 'Shell.topbar.userMenuLabel') })
    .click();
  await page
    .getByRole('menuitem', { name: cat(en, 'Shell.userMenu.signOut') })
    .click();
  await page.waitForURL(/sign-in/, { timeout: 15_000 });

  await uiLogin(page, parent.email, parent.password);
  await expect(page.getByText(/attempts remain/i).or(page.locator('[data-slot="alert"]'))).toBeVisible();
  await page.waitForTimeout(ATTEMPT_INTERVAL_MS);

  await uiLogin(page, parent.email, NEW_PASSWORD);
  await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 20_000 });
  await skipOnboardingViaUi(page);
  await expect(page).not.toHaveURL(/sign-in/);
  await shot(page, 'AUTH-034-login-with-new-password');
});
