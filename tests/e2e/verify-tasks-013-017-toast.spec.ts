import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { SEEDED_PARENT } from './helpers/auth';
import { deleteAuthEmailRows } from './helpers/auth-db';
import { cat, loadMessages } from './helpers/i18n';
import {
  extractToken,
  latestMessage,
  registerAndConfirmParent,
  RESET_LINK_RE,
  RESET_SUBJECT,
} from './helpers/verify-stack';

// Independent verifier spec for tasks 013-017: toast feedback on auth forms.
// Exercises every required toast path, asserts both the inline Alert and the
// sonner toast are visible, and saves evidence screenshots to .qa/screenshots/.
const en = loadMessages('en');
const SCREENSHOTS = path.resolve(process.cwd(), '.qa', 'screenshots');
const DESKTOP = { width: 1280, height: 800 };
const NEW_PASSWORD = 'NewPass1234!';
const CHANGED_PASSWORD = 'Changed1234!';
const usedEmails: string[] = [];

test.describe.configure({ mode: 'serial' });

test.afterAll(() => {
  for (const email of usedEmails) deleteAuthEmailRows(email);
});

async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
}

async function expectToast(page: Page, type: 'success' | 'error', text: string): Promise<void> {
  const toast = page.locator(`[data-sonner-toast][data-type="${type}"]`);
  await expect(toast).toBeVisible();
  await expect(toast).toContainText(text);
}

async function expectInlineAlert(page: Page, text: string): Promise<void> {
  const alert = page.locator('[data-slot="alert"]');
  await expect(alert).toBeVisible();
  await expect(alert).toContainText(text);
}

test('013: sign-in invalid credentials → inline alert + toast.error', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await signIn(page, SEEDED_PARENT.email, 'WrongPass123!');

  await expectInlineAlert(page, cat(en, 'Auth.loginError'));
  await expectToast(page, 'error', cat(en, 'Auth.loginError'));
  await page.screenshot({ path: path.join(SCREENSHOTS, '013-sign-in-error-toast.png') });
});

test('013: sign-in valid credentials → toast.success before navigation', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await signIn(page, SEEDED_PARENT.email, SEEDED_PARENT.password);

  await expectToast(page, 'success', cat(en, 'Auth.signedIn'));
  await page.screenshot({ path: path.join(SCREENSHOTS, '013-sign-in-success-toast.png') });
  await page.waitForURL('**/dashboard');
});

test('014: sign-up duplicate email → inline alert + toast.error', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/sign-up');
  await page.getByLabel(cat(en, 'Auth.usernameLabel'), { exact: true }).fill('parent');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(SEEDED_PARENT.email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(SEEDED_PARENT.password);
  await page
    .getByLabel(cat(en, 'Auth.confirmPasswordLabel'), { exact: true })
    .fill(SEEDED_PARENT.password);
  await page.getByRole('button', { name: cat(en, 'Auth.signUpButton'), exact: true }).click();

  await expectInlineAlert(page, cat(en, 'Auth.takenError'));
  await expectToast(page, 'error', cat(en, 'Auth.takenError'));
  await page.screenshot({ path: path.join(SCREENSHOTS, '014-sign-up-error-toast.png') });
});

test('015: forgot-password server error → toast.error; valid email → toast.success', async ({
  page,
  request,
}) => {
  const parent = await registerAndConfirmParent(request, 'forgot-toast');
  usedEmails.push(parent.email);

  await page.setViewportSize(DESKTOP);
  await page.goto('/forgot-password');

  // Error path: simulate a network failure so the mutation hits the offline
  // error branch (C-AUTH-FORGOT is enumeration-safe, so unknown emails return
  // success — only real server/network faults trigger toast.error).
  await page.route('**/api/auth/forgot-password', (route) => route.abort('internetdisconnected'));
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill('noone@schooltest.test');
  await page.getByRole('button', { name: cat(en, 'Auth.sendResetLink'), exact: true }).click();
  await expectInlineAlert(page, cat(en, 'Auth.offlineError'));
  await expectToast(page, 'error', cat(en, 'Auth.offlineError'));
  await page.screenshot({ path: path.join(SCREENSHOTS, '015-forgot-password-error-toast.png') });
  await page.unroute('**/api/auth/forgot-password');

  // Valid: reset link sent.
  await page.reload();
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(parent.email);
  await page.getByRole('button', { name: cat(en, 'Auth.sendResetLink'), exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: cat(en, 'Auth.sentTitle') })).toBeVisible();
  await expectToast(page, 'success', cat(en, 'Auth.resetLinkSent'));
  await page.screenshot({ path: path.join(SCREENSHOTS, '015-forgot-password-success-toast.png') });
});

test('016: reset-password via mailpit → toast.success before navigation', async ({
  page,
  request,
}) => {
  const parent = await registerAndConfirmParent(request, 'reset-toast');
  usedEmails.push(parent.email);

  await page.setViewportSize(DESKTOP);
  await page.goto('/forgot-password');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(parent.email);
  await page.getByRole('button', { name: cat(en, 'Auth.sendResetLink'), exact: true }).click();

  const message = await latestMessage(request, parent.email, 2);
  expect(message.Subject).toBe(RESET_SUBJECT);
  const code = extractToken(message.HTML, RESET_LINK_RE, 'reset');

  await page.goto(`/reset-password?code=${code}`);
  await page.getByLabel(cat(en, 'Auth.newPasswordLabel'), { exact: true }).fill(NEW_PASSWORD);
  await page.getByLabel(cat(en, 'Auth.confirmPasswordLabel'), { exact: true }).fill(NEW_PASSWORD);
  await page.getByRole('button', { name: cat(en, 'Auth.resetButton'), exact: true }).click();

  await expectToast(page, 'success', cat(en, 'Auth.passwordReset'));
  await page.screenshot({ path: path.join(SCREENSHOTS, '016-reset-password-success-toast.png') });
  await page.waitForURL('**/dashboard');
});

test('017: change-password form → toast.success and toast.error on wrong current password', async ({
  page,
  request,
}) => {
  const parent = await registerAndConfirmParent(request, 'change-toast');
  usedEmails.push(parent.email);

  await page.setViewportSize(DESKTOP);
  await signIn(page, parent.email, parent.password);
  await page.waitForURL('**/dashboard');
  await page.goto('/dashboard/settings');
  await expect(
    page.getByText(cat(en, 'Settings.changePasswordTitle'), { exact: true }),
  ).toBeVisible();

  // Error path.
  await page.getByLabel(cat(en, 'Auth.currentPasswordLabel'), { exact: true }).fill('WrongCurrent123!');
  await page.getByLabel(cat(en, 'Auth.newPasswordLabel'), { exact: true }).fill(CHANGED_PASSWORD);
  await page.getByLabel(cat(en, 'Auth.confirmPasswordLabel'), { exact: true }).fill(CHANGED_PASSWORD);
  await page.getByRole('button', { name: cat(en, 'Auth.updatePasswordButton'), exact: true }).click();

  await expectInlineAlert(page, cat(en, 'Auth.wrongCurrentPassword'));
  await expectToast(page, 'error', cat(en, 'Auth.wrongCurrentPassword'));
  await page.screenshot({ path: path.join(SCREENSHOTS, '017-change-password-error-toast.png') });

  // Success path.
  await page.getByLabel(cat(en, 'Auth.currentPasswordLabel'), { exact: true }).fill(parent.password);
  await page.getByLabel(cat(en, 'Auth.newPasswordLabel'), { exact: true }).fill(CHANGED_PASSWORD);
  await page.getByLabel(cat(en, 'Auth.confirmPasswordLabel'), { exact: true }).fill(CHANGED_PASSWORD);
  await page.getByRole('button', { name: cat(en, 'Auth.updatePasswordButton'), exact: true }).click();

  await expectToast(page, 'success', cat(en, 'Auth.passwordUpdated'));
  await page.screenshot({ path: path.join(SCREENSHOTS, '017-change-password-success-toast.png') });
});
