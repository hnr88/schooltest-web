import { expect, test, type Page } from '@playwright/test';

import { deleteAuthEmailRows } from './helpers/auth-db';
import { cat, loadMessages } from './helpers/i18n';
import { registerAndConfirmParent } from './helpers/throwaway-parent';

// Task 020 flow 4 (C-UI-AUTH-PAGES / C-AUTH-CHANGE): a throwaway parent (the
// shared seeded parent's password is never touched) logs in through the real
// UI, changes their password on /dashboard/settings — wrong-current-password
// 400 first, then the real change with its success toast — signs out via the
// user menu, and proves through the UI that the old password is dead while the
// new one lands on /dashboard. Serial: registration is D20-racy.
const en = loadMessages('en');
const DESKTOP = { width: 1280, height: 800 };
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

async function fillChangeForm(
  page: Page,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await page
    .getByLabel(cat(en, 'Auth.currentPasswordLabel'), { exact: true })
    .fill(currentPassword);
  await page.getByLabel(cat(en, 'Auth.newPasswordLabel'), { exact: true }).fill(newPassword);
  await page.getByLabel(cat(en, 'Auth.confirmPasswordLabel'), { exact: true }).fill(newPassword);
  await page
    .getByRole('button', { name: cat(en, 'Auth.updatePasswordButton'), exact: true })
    .click();
}

test('en: flow 4 — change password in settings → toast → sign out → old password dead, new one signs in', async ({
  page,
  request,
}) => {
  const parent = await registerAndConfirmParent(request, 'change-ui');
  usedEmails.push(parent.email);
  await page.setViewportSize(DESKTOP);

  await signIn(page, parent.email, parent.password);
  await page.waitForURL('**/dashboard');

  await page.goto('/dashboard/settings');
  // CardTitle renders a div (DS card primitive), so match by exact text.
  await expect(
    page.getByText(cat(en, 'Settings.changePasswordTitle'), { exact: true }),
  ).toBeVisible();

  // Error path first: wrong current password → real 400 → translated alert.
  await fillChangeForm(page, 'WrongCurrent123!', CHANGED_PASSWORD);
  const alert = page.locator('[data-slot="alert"]');
  await expect(alert).toBeVisible();
  await expect(alert).toContainText(cat(en, 'Auth.wrongCurrentPassword'));

  // Real change: success toast, fields reset, fresh jwt kept in localStorage.
  await fillChangeForm(page, parent.password, CHANGED_PASSWORD);
  await expect(page.getByText(cat(en, 'Auth.passwordUpdated'), { exact: true })).toBeVisible();
  await expect(
    page.getByLabel(cat(en, 'Auth.currentPasswordLabel'), { exact: true }),
  ).toHaveValue('');
  const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  expect(token).toMatch(/^eyJ/);

  // Sign out through the real user menu.
  await page
    .getByRole('button', { name: cat(en, 'Shell.topbar.userMenuLabel'), exact: true })
    .click();
  await page
    .getByRole('menuitem', { name: cat(en, 'Shell.userMenu.signOut'), exact: true })
    .click();
  await page.waitForURL('**/sign-in');
  expect(await page.evaluate(() => window.localStorage.getItem('app.auth.token'))).toBeNull();

  // Old password → the styled inline login error, never a redirect.
  await signIn(page, parent.email, parent.password);
  await expect(alert).toBeVisible();
  await expect(alert).toContainText(cat(en, 'Auth.loginError'));
  await expect(page).toHaveURL(/\/sign-in$/);

  // New password → /dashboard, UI only.
  await signIn(page, parent.email, CHANGED_PASSWORD);
  await page.waitForURL('**/dashboard');
});
