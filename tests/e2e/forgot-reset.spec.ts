import { expect, test, type Page } from '@playwright/test';

import { SEEDED_PARENT } from './helpers/auth';
import {
  backdateResetIssuance,
  deleteAuthEmailRows,
  sha256,
  userResetToken,
} from './helpers/auth-db';
import { cat, escapeRegExp, loadMessages } from './helpers/i18n';
import {
  API_BASE_URL,
  expectStyledEmail,
  extractToken,
  latestMessage,
  RESET_EXPIRY_SENTENCE,
  RESET_LINK_RE,
  RESET_SUBJECT,
  stockStrapiMessagesSince,
} from './helpers/mailpit';
import { freshEmail, registerAndConfirmParent } from './helpers/throwaway-parent';

// Task 020 flows 2+3 (C-UI-AUTH-PAGES / C-AUTH-FORGOT / C-AUTH-RESET): wrong
// creds → forgot path → enumeration-safe sent state; the full reset round-trip
// against live Strapi + Mailpit incl. auto-login; the invalid-code state; and
// the D-AUTH-2 30-min expiry branch via a psql created_at backdate. All copy
// derives from the live en catalog; throwaway emails only — the seeded
// parent's 2/hour budget is never spent, and every budget row is deleted in
// the afterAll teardown.
const en = loadMessages('en');
const DESKTOP = { width: 1280, height: 800 };
const SUITE_START = new Date();
const NEW_PASSWORD = 'NewPass1234!';
const usedEmails: string[] = [];

const countdownName = new RegExp(
  escapeRegExp(cat(en, 'Auth.resendEmailCountdown')).replace('\\{time\\}', '\\d+:\\d{2}'),
);

test.afterAll(() => {
  for (const email of usedEmails) deleteAuthEmailRows(email);
});

async function submitForgotForm(page: Page, email: string): Promise<void> {
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(email);
  await page.getByRole('button', { name: cat(en, 'Auth.sendResetLink'), exact: true }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: cat(en, 'Auth.sentTitle') }),
  ).toBeVisible();
}

async function submitResetForm(page: Page, password: string): Promise<void> {
  await page.getByLabel(cat(en, 'Auth.newPasswordLabel'), { exact: true }).fill(password);
  await page.getByLabel(cat(en, 'Auth.confirmPasswordLabel'), { exact: true }).fill(password);
  await page.getByRole('button', { name: cat(en, 'Auth.resetButton'), exact: true }).click();
}

async function expectInvalidLinkState(page: Page): Promise<void> {
  await expect(
    page.getByRole('heading', { level: 1, name: cat(en, 'Auth.invalidLinkTitle') }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: cat(en, 'Auth.requestNewLink'), exact: true }),
  ).toHaveAttribute('href', '/forgot-password');
}

test('en: flow 2 — wrong password → inline error → forgot link → sent state, countdown disabled', async ({
  page,
}) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(SEEDED_PARENT.email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill('WrongPass123!');
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();

  const alert = page.locator('[data-slot="alert"]');
  await expect(alert).toBeVisible();
  await expect(alert).toContainText(cat(en, 'Auth.loginError'));

  await page
    .getByRole('link', { name: cat(en, 'Auth.forgotPasswordLink'), exact: true })
    .click();
  await page.waitForURL('**/forgot-password');

  // Throwaway address (enumeration-safe 200 either way) — never the seeded
  // parent's 2/hour budget. Its budget row is deleted in the teardown.
  const email = freshEmail('flow2');
  usedEmails.push(email);
  await submitForgotForm(page, email);
  await expect(page.getByText(cat(en, 'Auth.sentSuccess'))).toBeVisible();
  await expect(page.getByRole('button', { name: countdownName })).toBeDisabled();
});

test('en: /reset-password without a code renders the invalid-link state immediately', async ({
  page,
}) => {
  await page.goto('/reset-password');
  await expectInvalidLinkState(page);
});

test('en: a garbage ?code= submit swaps the card to the invalid-link error state', async ({
  page,
}) => {
  await page.goto('/reset-password?code=deadbeef');
  await expect(
    page.getByRole('heading', { level: 1, name: cat(en, 'Auth.resetTitle') }),
  ).toBeVisible();
  await submitResetForm(page, NEW_PASSWORD);
  await expectInvalidLinkState(page);
  const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  expect(token).toBeNull();
});

// Registration writes rows through the users-permissions wrap whose parent-role
// assignment runs post-response (D20) — keep every registering test serial.
test.describe('reset round-trips against registered parents (serial, D20)', () => {
  test.describe.configure({ mode: 'serial' });

  test('en: flow 3 — forgot → styled reset email → reset form → /dashboard auto-login → sign out → NEW password signs in, old dead', async ({
    page,
    request,
  }) => {
    const parent = await registerAndConfirmParent(request, 'reset');
    usedEmails.push(parent.email);
    await page.setViewportSize(DESKTOP);
    await page.goto('/forgot-password');
    await submitForgotForm(page, parent.email);

    // Mailbox: 1 confirmation mail from registration + the reset mail = 2.
    const message = await latestMessage(request, parent.email, 2);
    expectStyledEmail(message, RESET_SUBJECT);
    expect(message.HTML).toContain(RESET_EXPIRY_SENTENCE);
    const code = extractToken(message.HTML, RESET_LINK_RE, 'reset');

    await page.goto(`/reset-password?code=${code}`);
    await submitResetForm(page, NEW_PASSWORD);

    // C-AUTH-RESET success → auto-login: fresh jwt stored, straight to /dashboard.
    await page.waitForURL('**/dashboard');
    const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
    expect(token).toMatch(/^eyJ/);

    // Network truth: the OLD password is dead against the live login endpoint.
    const oldLogin = await request.post(`${API_BASE_URL}/api/auth/local`, {
      data: { identifier: parent.email, password: parent.password },
    });
    expect(oldLogin.status()).toBe(400);

    // Real user-menu sign out, then the NEW password signs in through the UI.
    await page
      .getByRole('button', { name: cat(en, 'Shell.topbar.userMenuLabel'), exact: true })
      .click();
    await page
      .getByRole('menuitem', { name: cat(en, 'Shell.userMenu.signOut'), exact: true })
      .click();
    await page.waitForURL('**/sign-in');
    await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(parent.email);
    await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(NEW_PASSWORD);
    await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
    await page.waitForURL('**/dashboard');
  });

  test('en: flow 3 expiry — a 31-min-old code renders the expired state and dies on presentation', async ({
    page,
    request,
  }) => {
    const parent = await registerAndConfirmParent(request, 'expiry');
    usedEmails.push(parent.email);
    await page.setViewportSize(DESKTOP);
    await page.goto('/forgot-password');
    await submitForgotForm(page, parent.email);

    const message = await latestMessage(request, parent.email, 2);
    const code = extractToken(message.HTML, RESET_LINK_RE, 'reset');

    // Age the issuance row past the 30-min TTL (psql backdate, rowcount 1).
    expect(backdateResetIssuance(sha256(code)), 'one issuance row backdated').toBe(1);

    await page.goto(`/reset-password?code=${code}`);
    await submitResetForm(page, 'Expired1234!');
    await expectInvalidLinkState(page);

    // No auto-login on the expired path, and the token died on presentation.
    const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
    expect(token).toBeNull();
    expect(userResetToken(parent.email)).toBeNull();
  });

  test('zero stock strapi.io emails were delivered during this suite (C-EMAIL-TEMPLATES)', async ({
    request,
  }) => {
    expect(await stockStrapiMessagesSince(request, SUITE_START)).toEqual([]);
  });
});
