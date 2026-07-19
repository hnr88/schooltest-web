import path from 'node:path';

import { expect, test } from '@playwright/test';

import { deleteAuthEmailRows } from './helpers/auth-db';
import { cat, escapeRegExp, loadMessages } from './helpers/i18n';
import { API_BASE_URL, fetchConfirmationLink } from './helpers/mailpit';
import { fillSignUpForm, freshParent } from './helpers/sign-up-form';
import { waitForAnimationsSettled } from './helpers/ui';

// Task 017 confirmation round-trip (split out of sign-up.spec.ts for the
// 200-line file limit): register 200 returns {user} with NO jwt (D-AUTH-1/
// C-AUTH-REGISTER), the card swaps to the check-your-email state, the
// Mailpit-delivered link redeems via GET /api/auth/email-confirmation
// (C-AUTH-CONFIRM) onto /sign-in?confirmed=1, and only then does password
// login succeed. Throwaway emails only; their auth_email_requests budget rows
// are deleted in the afterAll teardown (forgot-reset.spec.ts discipline).
const en = loadMessages('en');
const SCREENSHOTS = path.resolve(process.cwd(), '.qa', 'screenshots');
const DESKTOP = { width: 1280, height: 800 };
const usedEmails: string[] = [];

test.afterAll(() => {
  for (const email of usedEmails) deleteAuthEmailRows(email);
});

// Registration writes rows through the users-permissions wrap whose parent-role
// assignment runs post-response (D20) — keep every registering test serial.
test.describe('registration with email confirmation (serial, D20)', () => {
  test.describe.configure({ mode: 'serial' });

  test('en: register → check-email state (no jwt, no redirect), Mailpit link → /sign-in?confirmed=1 banner → login lands on /dashboard', async ({
    page,
    request,
  }) => {
    const parent = freshParent();
    usedEmails.push(parent.email);
    await page.setViewportSize(DESKTOP);
    await page.goto('/sign-up');
    await fillSignUpForm(page, parent);

    // Card swaps to the §14.2 check-your-email state: no redirect, no token.
    await expect(
      page.getByRole('heading', { level: 1, name: cat(en, 'Auth.checkEmailTitle') }),
    ).toBeVisible();
    await expect(page.getByText(parent.email)).toBeVisible();
    await expect(page).toHaveURL(/\/sign-up$/);
    const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
    expect(token).toBeNull();

    // Resend button counts down 60s and stays disabled while counting
    // (server budget 2/hour/email already holds the register-time send).
    const countdownName = new RegExp(
      escapeRegExp(cat(en, 'Auth.resendEmailCountdown')).replace('\\{time\\}', '\\d+:\\d{2}'),
    );
    await expect(page.getByRole('button', { name: countdownName })).toBeDisabled();
    await waitForAnimationsSettled(page);
    await page.screenshot({ path: path.join(SCREENSHOTS, 'sign-up-check-email.png') });

    // Real confirmation round trip: Mailpit link → api 302 → /sign-in?confirmed=1.
    const link = await fetchConfirmationLink(request, parent.email);
    await page.goto(link);
    await page.waitForURL(/\/sign-in\?confirmed=1$/);
    await expect(page.getByText(cat(en, 'Auth.emailConfirmedBanner'))).toBeVisible();

    // The confirmed account can now sign in with its own credentials.
    await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(parent.email);
    await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(parent.password);
    await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
    await page.waitForURL('**/dashboard');
    const jwt = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
    expect(jwt).toMatch(/^eyJ/);
  });

  test('en: signing in before confirming renders the distinct not-confirmed state', async ({
    page,
    request,
  }) => {
    // Register through the API's real register contract (the UI path is the
    // flow under test above) — response carries NO jwt, user unconfirmed.
    const parent = freshParent();
    usedEmails.push(parent.email);
    const registerRes = await request.post(`${API_BASE_URL}/api/auth/local/register`, {
      data: { username: parent.username, email: parent.email, password: parent.password },
    });
    expect(registerRes.ok(), await registerRes.text()).toBeTruthy();
    const body = (await registerRes.json()) as { jwt?: string; user?: { confirmed?: boolean } };
    expect(body.jwt).toBeUndefined();
    expect(body.user?.confirmed).toBe(false);

    await page.goto('/sign-in');
    await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(parent.email);
    await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(parent.password);
    await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();

    // C-AUTH-LOGIN's sanctioned message-based branch → Auth.notConfirmedError,
    // distinct from the generic loginError, and never a redirect.
    const alert = page.locator('[data-slot="alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(cat(en, 'Auth.notConfirmedError'));
    await expect(page).toHaveURL(/\/sign-in$/);
    const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
    expect(token).toBeNull();
  });
});
