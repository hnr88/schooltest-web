import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { backdateResetIssuance, deleteAuthEmailRows, sha256 } from './helpers/auth-db';
import { cat, loadMessages } from './helpers/i18n';
import { extractToken, latestMessage, RESET_LINK_RE } from './helpers/mailpit';
import { registerAndConfirmParent } from './helpers/throwaway-parent';

const en = loadMessages('en');
const CAPTURES = path.resolve(process.cwd(), '..', '.codephant', 'captures');
const MOBILE = { width: 375, height: 812 };
const DESKTOP = { width: 1440, height: 900 };
const NEW_PASSWORD = 'NewPass1234!';
const usedEmails: string[] = [];

test.afterAll(() => {
  for (const email of usedEmails) deleteAuthEmailRows(email);
});

async function requestResetCode(
  page: Page,
  request: APIRequestContext,
  flow: string,
): Promise<string> {
  const parent = await registerAndConfirmParent(request, flow);
  usedEmails.push(parent.email);
  await page.goto('/forgot-password');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(parent.email);
  await page.getByRole('button', { name: cat(en, 'Auth.sendResetLink'), exact: true }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: cat(en, 'Auth.sentTitle') }),
  ).toBeVisible();
  const message = await latestMessage(request, parent.email, 2);
  return extractToken(message.HTML, RESET_LINK_RE, flow);
}

async function captureState(page: Page, state: string): Promise<void> {
  for (const [width, viewport] of [
    ['375', MOBILE],
    ['desktop', DESKTOP],
  ] as const) {
    await page.setViewportSize(viewport);
    await page.screenshot({ path: path.join(CAPTURES, `010-${state}-${width}.png`) });
  }
}

test('reset password renders the contracted form, expired and completion states', async ({
  page,
  request,
}) => {
  mkdirSync(CAPTURES, { recursive: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });

  const successCode = await requestResetCode(page, request, '010-success');
  await page.goto(`/reset-password?code=${successCode}`);
  await page.getByLabel(cat(en, 'Auth.newPasswordLabel'), { exact: true }).fill(NEW_PASSWORD);
  await expect(page.getByText(cat(en, 'Auth.passwordRuleByteLimit'))).toBeVisible();
  await page
    .getByLabel(cat(en, 'Auth.confirmPasswordLabel'), { exact: true })
    .fill('Different1234!');
  await page.getByRole('button', { name: cat(en, 'Auth.resetButton'), exact: true }).click();
  await expect(page.getByText(cat(en, 'Auth.passwordMismatch'))).toBeVisible();
  await captureState(page, 'new-password');

  await page
    .getByLabel(cat(en, 'Auth.confirmPasswordLabel'), { exact: true })
    .fill(NEW_PASSWORD);
  await page.getByRole('button', { name: cat(en, 'Auth.resetButton'), exact: true }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: cat(en, 'Auth.passwordUpdatedTitle') }),
  ).toBeVisible();
  await expect(page.getByText(cat(en, 'Auth.passwordUpdatedBody'))).toBeVisible();
  await expect(
    page.getByRole('link', { name: cat(en, 'Auth.continueToDashboard'), exact: true }),
  ).toHaveAttribute('href', '/dashboard');
  await captureState(page, 'password-updated');

  await page.evaluate(() => window.localStorage.removeItem('app.auth.token'));
  const expiredCode = await requestResetCode(page, request, '010-expired');
  expect(backdateResetIssuance(sha256(expiredCode))).toBe(1);
  await page.goto(`/reset-password?code=${expiredCode}`);
  await page.getByLabel(cat(en, 'Auth.newPasswordLabel'), { exact: true }).fill(NEW_PASSWORD);
  await page
    .getByLabel(cat(en, 'Auth.confirmPasswordLabel'), { exact: true })
    .fill(NEW_PASSWORD);
  await page.getByRole('button', { name: cat(en, 'Auth.resetButton'), exact: true }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: cat(en, 'Auth.expiredLinkTitle') }),
  ).toBeVisible();
  await expect(page.getByText(cat(en, 'Auth.expiredLinkBody'))).toBeVisible();
  await captureState(page, 'expired-link');
});
