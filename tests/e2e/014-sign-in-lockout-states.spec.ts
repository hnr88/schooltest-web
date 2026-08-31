import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { deleteAuthEmailRows, runSql } from './helpers/auth-db';
import { cat, loadMessages } from './helpers/i18n';
import { registerAndConfirmParent } from './helpers/throwaway-parent';

const en = loadMessages('en');
const CAPTURES = path.resolve(process.cwd(), '..', '.codephant', 'captures');
const MOBILE = { width: 375, height: 812 };
const DESKTOP = { width: 1440, height: 900 };
const WRONG_PASSWORD = 'WrongPassword123!';
const ATTEMPT_INTERVAL_MS = 3100;
const usedEmails: string[] = [];

test.afterAll(() => {
  for (const email of usedEmails) {
    const escapedEmail = email.replaceAll("'", "''");
    runSql(
      `delete from auth_lockout_counters where user_id = (select id from up_users where email = '${escapedEmail}')`,
    );
    deleteAuthEmailRows(email);
  }
});

async function captureState(page: Page, state: string): Promise<void> {
  for (const [width, viewport] of [
    ['375', MOBILE],
    ['desktop', DESKTOP],
  ] as const) {
    await page.setViewportSize(viewport);
    await page.screenshot({ path: path.join(CAPTURES, `014-${state}-${width}.png`) });
  }
}

async function submitLogin(page: Page): Promise<void> {
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
}

test('sign-in renders live attempts remaining and account lockout states', async ({
  page,
  request,
}) => {
  mkdirSync(CAPTURES, { recursive: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const parent = await registerAndConfirmParent(request, '014-lockout');
  usedEmails.push(parent.email);

  await page.setViewportSize(DESKTOP);
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill('unknown-014@schooltest.test');
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(WRONG_PASSWORD);
  await submitLogin(page);
  await expect(
    page.locator('[data-slot="alert"]').getByText(cat(en, 'Auth.loginError'), { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/attempts? remain/i)).toHaveCount(0);

  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(parent.email);
  await submitLogin(page);
  await expect(page.getByText(/4 attempts remain/i)).toBeVisible();
  await expect(page.getByText(cat(en, 'Auth.incorrectPassword'), { exact: true })).toBeVisible();
  await captureState(page, 'wrong-password');

  for (const remaining of [3, 2, 1]) {
    await page.waitForTimeout(ATTEMPT_INTERVAL_MS);
    await submitLogin(page);
    await expect(page.getByText(new RegExp(`${remaining} attempts? remain`, 'i'))).toBeVisible();
  }

  await page.waitForTimeout(ATTEMPT_INTERVAL_MS);
  await submitLogin(page);
  await expect(
    page.getByRole('heading', { level: 1, name: cat(en, 'Auth.accountLockedTitle') }),
  ).toBeVisible();
  await expect(page.getByText(cat(en, 'Auth.accountLockedAuditNotice'))).toBeVisible();
  await expect(page.getByRole('link', { name: cat(en, 'Auth.resetYourPassword') })).toHaveAttribute(
    'href',
    '/forgot-password',
  );
  await expect(page.getByRole('button', { name: /Sign in — available in \d+:\d{2}/ })).toBeDisabled();
  await captureState(page, 'account-locked');
});
