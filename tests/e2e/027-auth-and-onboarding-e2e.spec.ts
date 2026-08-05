import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { loginAsParent, SEEDED_PARENT } from './helpers/auth';
import { deleteAuthEmailRows } from './helpers/auth-db';
import { cat, loadMessages } from './helpers/i18n';
import { deleteStudents } from './helpers/student-cleanup';
import {
  extractToken,
  fetchConfirmationLink,
  latestMessage,
  registerAndConfirmParent,
  RESET_LINK_RE,
  RESET_SUBJECT,
  STACK_API_BASE_URL,
  STACK_E2E_PASSWORD,
} from './helpers/verify-stack';
import { waitForAnimationsSettled } from './helpers/ui';
import {
  attachWizardPhoto,
  attachWizardVoice,
  fillEducationStep,
  fillGuardianStep,
  fillPersonalStep,
  wizardContinue,
  wizardRail,
} from './helpers/wizard-fill';

// Task 027: end-to-end auth/onboarding verifier for st-portal.
// Covers Zod validation + sonner toasts on all four auth forms, unified auth UI
// consistency, registration → Mailpit confirmation → mandatory onboarding → skip,
// forgot-password → Mailpit reset → /dashboard, and sidebar-driven wizard skip.
// Uses the stack-specific helpers (api :5500, mailpit :8125).
const en = loadMessages('en');
const SCREENSHOTS = path.resolve('/home/hnr/Code/schooltest/.qa/screenshots');
const DESKTOP = { width: 1280, height: 800 };
const NEW_PASSWORD = 'NewPass1234!';
const usedEmails: string[] = [];

test.afterAll(() => {
  for (const email of usedEmails) deleteAuthEmailRows(email);
});

async function expectInlineAlert(page: Page, text: string): Promise<void> {
  const alert = page.locator('[data-slot="alert"]');
  await expect(alert).toBeVisible();
  await expect(alert).toContainText(text);
}

async function expectToast(page: Page, type: 'success' | 'error', text: string): Promise<void> {
  const toast = page.locator(`[data-sonner-toast][data-type="${type}"]`);
  await expect(toast).toBeVisible();
  await expect(toast).toContainText(text);
}

async function expectNoToast(page: Page): Promise<void> {
  await expect(page.locator('[data-sonner-toast]')).toHaveCount(0);
}

async function authCard(page: Page): Promise<ReturnType<typeof page.locator>> {
  // The auth form column is a bare stack inside AuthSplitLayout's max-w-auth wrapper.
  return page.locator('main .max-w-auth > div').first();
}

async function expectAuthSplitLayout(page: Page): Promise<void> {
  // C-UI-AUTH-PAGES: navy brand panel + centered form column on all auth screens.
  await expect(page.getByText(cat(en, 'Auth.split.title'))).toBeVisible();
  await expect(await authCard(page)).toBeVisible();
}

function freshUsername(): string {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return `e2e${suffix}`.slice(0, 20);
}

async function fillSignUpForm(page: Page, email: string, password: string): Promise<void> {
  await page.getByLabel(cat(en, 'Auth.usernameLabel'), { exact: true }).fill(freshUsername());
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(password);
  await page.getByLabel(cat(en, 'Auth.confirmPasswordLabel'), { exact: true }).fill(password);
  await page.getByRole('button', { name: cat(en, 'Auth.signUpButton'), exact: true }).click();
}

async function submitForgotForm(page: Page, email: string): Promise<void> {
  await page.goto('/forgot-password');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(email);
  await page.getByRole('button', { name: cat(en, 'Auth.sendResetLink'), exact: true }).click();
}

async function submitResetForm(page: Page, password: string): Promise<void> {
  await page.getByLabel(cat(en, 'Auth.newPasswordLabel'), { exact: true }).fill(password);
  await page.getByLabel(cat(en, 'Auth.confirmPasswordLabel'), { exact: true }).fill(password);
  await page.getByRole('button', { name: cat(en, 'Auth.resetButton'), exact: true }).click();
}

// ------------------------------------------------------------------
// 1. Zod validation errors + toast notifications on all auth forms.
// ------------------------------------------------------------------

test('sign-in: empty submit shows Zod validation errors, no toast', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/sign-in');
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();

  await expect(page.getByText(cat(en, 'Auth.emailRequired'))).toBeVisible();
  await expect(page.getByText(cat(en, 'Auth.passwordRequired'))).toBeVisible();
  await expect(page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await expectNoToast(page);
});

test('sign-in: invalid credentials shows inline alert + toast.error', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(SEEDED_PARENT.email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill('WrongPass123!');
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();

  await expectInlineAlert(page, cat(en, 'Auth.loginError'));
  await expectToast(page, 'error', cat(en, 'Auth.loginError'));
  await page.screenshot({ path: path.join(SCREENSHOTS, '027-sign-in-error-toast.png') });
});

test('sign-up: empty submit shows Zod validation errors, no toast', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/sign-up');
  await page.getByRole('button', { name: cat(en, 'Auth.signUpButton'), exact: true }).click();

  await expect(page.getByText(cat(en, 'Auth.usernameTooShort'))).toBeVisible();
  await expect(page.getByText(cat(en, 'Auth.emailRequired'))).toBeVisible();
  await expect(page.getByText(cat(en, 'Auth.passwordTooShort'))).toBeVisible();
  await expect(page.getByText(cat(en, 'Auth.confirmPasswordRequired'))).toBeVisible();
  await expectNoToast(page);
});

test('sign-up: duplicate email shows inline alert + toast.error', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/sign-up');
  await fillSignUpForm(page, SEEDED_PARENT.email, 'SomePass123!');

  await expectInlineAlert(page, cat(en, 'Auth.takenError'));
  await expectToast(page, 'error', cat(en, 'Auth.takenError'));
  await page.screenshot({ path: path.join(SCREENSHOTS, '027-sign-up-error-toast.png') });
});

test('forgot-password: invalid email shows Zod validation error, no toast', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/forgot-password');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill('not-an-email');
  await page.getByRole('button', { name: cat(en, 'Auth.sendResetLink'), exact: true }).click();

  await expect(page.getByText(cat(en, 'Auth.emailInvalid'))).toBeVisible();
  await expectNoToast(page);
});

test('forgot-password: network failure shows inline alert + toast.error; valid email shows toast.success', async ({
  page,
}) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/forgot-password');

  // Error path: abort the request so the offline branch fires.
  await page.route('**/api/auth/forgot-password', (route) => route.abort('internetdisconnected'));
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill('noone@schooltest.test');
  await page.getByRole('button', { name: cat(en, 'Auth.sendResetLink'), exact: true }).click();
  await expectInlineAlert(page, cat(en, 'Auth.offlineError'));
  await expectToast(page, 'error', cat(en, 'Auth.offlineError'));
  await page.screenshot({ path: path.join(SCREENSHOTS, '027-forgot-error-toast.png') });
  await page.unroute('**/api/auth/forgot-password');

  // Success path: enumeration-safe 200 for a fresh throwaway address.
  const freshEmail = `e2e-forgot-${Date.now().toString(36)}@schooltest.test`;
  await page.reload();
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(freshEmail);

  const forgotResponse = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' && response.url().endsWith('/api/auth/forgot-password'),
  );
  await page.getByRole('button', { name: cat(en, 'Auth.sendResetLink'), exact: true }).click();
  const response = await forgotResponse;
  expect(response.status(), await response.text()).toBe(200);

  await expect(
    page.getByRole('heading', { level: 1, name: cat(en, 'Auth.sentTitle') }),
  ).toBeVisible();
  await expectToast(page, 'success', cat(en, 'Auth.resetLinkSent'));
  await page.screenshot({ path: path.join(SCREENSHOTS, '027-forgot-success-toast.png') });
});

test('reset-password: mismatched passwords show Zod validation error, no toast', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/reset-password?code=deadbeef');
  await page.getByLabel(cat(en, 'Auth.newPasswordLabel'), { exact: true }).fill('NewPass1234!');
  await page.getByLabel(cat(en, 'Auth.confirmPasswordLabel'), { exact: true }).fill('Different1234!');
  await page.getByRole('button', { name: cat(en, 'Auth.resetButton'), exact: true }).click();

  await expect(page.getByText(cat(en, 'Auth.passwordMismatch'))).toBeVisible();
  await expectNoToast(page);
});

// ------------------------------------------------------------------
// 2. Unified auth UI is visually consistent across all auth screens.
// ------------------------------------------------------------------

test('auth pages share the split-panel layout and brand panel', async ({ page }) => {
  await page.setViewportSize(DESKTOP);

  for (const route of ['/sign-in', '/sign-up', '/forgot-password', '/reset-password']) {
    await page.goto(route);
    await expectAuthSplitLayout(page);
  }

  await page.goto('/sign-in');
  await waitForAnimationsSettled(page);
  await page.screenshot({ path: path.join(SCREENSHOTS, '027-auth-ui-unified-sign-in.png') });

  await page.goto('/sign-up');
  await waitForAnimationsSettled(page);
  await page.screenshot({ path: path.join(SCREENSHOTS, '027-auth-ui-unified-sign-up.png') });
});

test('sign-up UI matches sign-in styling', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/sign-in');
  // The card paints a skeleton until the auth store hydrates — wait for the
  // real form before sampling classes (the skeleton has no animate-in).
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).waitFor();
  const signInClasses = await (await authCard(page)).getAttribute('class');

  await page.goto('/sign-up');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).waitFor();
  const signUpClasses = await (await authCard(page)).getAttribute('class');

  // Both form columns use the same animate-in entrance and flex column rhythm.
  expect(signInClasses).toContain('flex-col');
  expect(signUpClasses).toContain('flex-col');
  expect(signInClasses).toContain('animate-in');
  expect(signUpClasses).toContain('animate-in');
  await page.screenshot({ path: path.join(SCREENSHOTS, '027-sign-up-styling-match.png') });
});

// ------------------------------------------------------------------
// 3. Registration → email confirmation → onboarding → skip.
// ------------------------------------------------------------------

test.describe('registration + email confirmation + onboarding (serial, UI flow)', () => {
  test.describe.configure({ mode: 'serial' });

  const timestamp = Date.now();
  const email = `e2e-onboarding-${timestamp}@schooltest.test`;
  const password = STACK_E2E_PASSWORD;

  test('register via UI: check-email state, no jwt, no redirect', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/sign-up');

    const registerResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().endsWith('/api/auth/local/register'),
    );
    await fillSignUpForm(page, email, password);
    const response = await registerResponse;
    expect(response.status(), await response.text()).toBe(200);

    await expect(
      page.getByRole('heading', { level: 1, name: cat(en, 'Auth.checkEmailTitle') }),
    ).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
    await expect(page).toHaveURL(/\/sign-up$/);
    const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
    expect(token).toBeNull();
  });

  test('confirm via Mailpit and land on /sign-in?confirmed=1', async ({ page, request }) => {
    const link = await fetchConfirmationLink(request, email);
    await page.goto(link);
    await page.waitForURL(/\/sign-in\?confirmed=1$/);
    await expect(page.getByText(cat(en, 'Auth.emailConfirmedBanner'))).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOTS, '027-registration-confirmed-banner.png') });
  });

  test('first login redirects to mandatory onboarding with skip option', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/sign-in');
    await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(email);
    await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(password);
    await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();

    await page.waitForURL('**/onboarding');
    await expect(page).toHaveURL(/\/onboarding$/);
    await expect(page.getByText(cat(en, 'Onboarding.stepWelcomeTitle'))).toBeVisible();
    await expect(page.getByRole('button', { name: cat(en, 'Onboarding.skip'), exact: true })).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOTS, '027-onboarding-mandatory-screen.png'), fullPage: true });
  });

  test('skip onboarding lands on /dashboard', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/sign-in');
    await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(email);
    await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(password);
    await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
    await page.waitForURL('**/onboarding');

    await page.getByRole('button', { name: cat(en, 'Onboarding.skip'), exact: true }).click();
    await expect(
      page.getByRole('link', { name: cat(en, 'Onboarding.goToDashboard'), exact: true }),
    ).toBeVisible();
    await page.getByRole('link', { name: cat(en, 'Onboarding.goToDashboard'), exact: true }).click();
    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.screenshot({ path: path.join(SCREENSHOTS, '027-dashboard-after-onboarding-skip.png'), fullPage: true });
  });
});

// ------------------------------------------------------------------
// 4. Password reset round-trip via Mailpit with unified UI.
// ------------------------------------------------------------------

test.describe('password reset round-trip (serial, API-seeded parent)', () => {
  test.describe.configure({ mode: 'serial' });

  let parent: { email: string; username: string; password: string };

  test('seed a confirmed parent via API', async ({ request }) => {
    parent = await registerAndConfirmParent(request, 'reset');
    usedEmails.push(parent.email);
  });

  test('request reset and complete via UI → toast.success → /dashboard', async ({ page, request }) => {
    await page.setViewportSize(DESKTOP);
    await submitForgotForm(page, parent.email);

    const message = await latestMessage(request, parent.email, 2);
    expect(message.Subject).toBe(RESET_SUBJECT);
    const code = extractToken(message.HTML, RESET_LINK_RE, 'reset');

    await page.goto(`/reset-password?code=${code}`);
    await expect(
      page.getByRole('heading', { level: 1, name: cat(en, 'Auth.resetTitle') }),
    ).toBeVisible();
    await expectAuthSplitLayout(page);

    await submitResetForm(page, NEW_PASSWORD);
    await expectToast(page, 'success', cat(en, 'Auth.passwordReset'));
    await page.screenshot({ path: path.join(SCREENSHOTS, '027-reset-success-toast.png') });
    await page.waitForURL('**/dashboard');

    // Old password is dead.
    const oldLogin = await request.post(`${STACK_API_BASE_URL}/api/auth/local`, {
      data: { identifier: parent.email, password: parent.password },
    });
    expect(oldLogin.status()).toBe(400);
  });

  test('new password signs in via UI', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/sign-in');
    await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(parent.email);
    await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(NEW_PASSWORD);
    await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
    await page.waitForURL('**/dashboard');
  });
});

// ------------------------------------------------------------------
// 5. Add child from sidebar: the rail gates on completed steps.
// ------------------------------------------------------------------

test('wizard from sidebar: rail review locked until steps 1-4 valid, real submit persists', async ({
  page,
  request,
}) => {
  test.slow();
  const unique = `WZ-${Date.now().toString(36)}`;
  const created: string[] = [];
  await page.setViewportSize(DESKTOP);

  try {
    await loginAsParent(page);
    await page.getByRole('link', { name: cat(en, 'Shell.nav.myChildren') }).click();
    await page.waitForURL('**/dashboard/children');
    await page.getByRole('link', { name: cat(en, 'Children.addChild') }).click();
    await page.waitForURL('**/dashboard/children/new');
    await expect(
      page.getByRole('heading', { name: cat(en, 'StudentWizard.steps.personal.title') }),
    ).toBeVisible();

    // Free navigation is gone: the review step (rail index 4) stays disabled
    // until steps 1–4 are each validly completed.
    const rail = wizardRail(page, en);
    await expect(rail.getByRole('button').nth(4)).toBeDisabled();
    await page.screenshot({ path: path.join(SCREENSHOTS, '027-wizard-start.png'), fullPage: true });

    await fillPersonalStep(page, en, { givenName: unique });
    await wizardContinue(page, en);
    await expect(
      page.getByRole('heading', { name: cat(en, 'StudentWizard.steps.education.title') }),
    ).toBeVisible();
    await expect(rail.getByRole('button').nth(4)).toBeDisabled();

    await fillEducationStep(page, en);
    await wizardContinue(page, en);
    await expect(
      page.getByRole('heading', { name: cat(en, 'StudentWizard.steps.guardian.title') }),
    ).toBeVisible();

    await fillGuardianStep(page, en);
    await wizardContinue(page, en);

    // Media is mandatory too: an empty step 4 fails validation and keeps the
    // review step locked on the rail.
    await expect(
      page.getByRole('heading', { name: cat(en, 'StudentWizard.steps.media.title') }),
    ).toBeVisible();
    await wizardContinue(page, en);
    await expect(page.locator('#wizard-photo-error')).toHaveText(
      cat(en, 'StudentWizardSchema.photoRequired'),
    );
    await expect(rail.getByRole('button').nth(4)).toBeDisabled();

    await attachWizardPhoto(page, en);
    await attachWizardVoice(page, en);
    await wizardContinue(page, en);

    // All four steps valid → review reached, rail step 5 unlocked.
    await expect(
      page.getByRole('heading', { name: cat(en, 'StudentWizard.steps.review.title') }),
    ).toBeVisible();
    await expect(rail.getByRole('button').nth(4)).toBeEnabled();
    await expect(page.getByText(unique)).toBeVisible();
    await page.screenshot({
      path: path.join(SCREENSHOTS, '027-wizard-review-filled.png'),
      fullPage: true,
    });

    // Real submit persists (documentId captured for the admin-route cleanup).
    const createResponse = page.waitForResponse(
      (res) => res.url().includes('/api/students') && res.request().method() === 'POST',
    );
    await page
      .getByRole('button', { name: cat(en, 'StudentWizard.createStudent'), exact: true })
      .click();
    const createdResponse = await createResponse;
    expect(createdResponse.status(), await createdResponse.text()).toBe(200);
    created.push(
      ((await createdResponse.json()) as { data: { documentId: string } }).data.documentId,
    );

    await page.waitForURL('**/dashboard/children');
    await expect(page.getByRole('heading', { name: cat(en, 'Children.heading') })).toBeVisible();
    await expect(page.getByText(unique)).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: cat(en, 'Children.heading') })).toBeVisible();
    await expect(page.getByText(unique)).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOTS, '027-wizard-persisted.png'), fullPage: true });
  } finally {
    await deleteStudents(request, created);
  }
});
