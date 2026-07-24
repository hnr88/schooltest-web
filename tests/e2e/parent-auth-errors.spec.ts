import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { SEEDED_PARENT } from './helpers/auth';
import { cat, loadMessages } from './helpers/i18n';
import { waitForAnimationsSettled } from './helpers/ui';

const en = loadMessages('en');
const DESKTOP = { width: 1280, height: 800 };
const RAW_STRAPI_MESSAGE = 'Invalid identifier or password';

interface LoginErrorBody {
  error: { status: number; message: string };
}

test('en: wrong password stays on /sign-in with the styled translated error, no Strapi leak, axe clean', async ({
  page,
}) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/sign-in');

  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' && response.url().endsWith('/api/auth/local'),
  );

  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(SEEDED_PARENT.email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill('WrongPass123!');
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();

  const loginResponse = await loginResponsePromise;
  expect(loginResponse.status()).toBe(400);
  const loginBody = (await loginResponse.json()) as LoginErrorBody;
  expect(loginBody.error.message).toBe(RAW_STRAPI_MESSAGE);

  const alert = page.locator('[data-slot="alert"]');
  await expect(alert).toBeVisible();
  await expect(alert).toContainText(cat(en, 'Auth.loginError'));
  await expect(page.getByText(RAW_STRAPI_MESSAGE)).toHaveCount(0);
  await expect(page).toHaveURL(/\/sign-in$/);
  const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  expect(token).toBeNull();
  await page.waitForLoadState('networkidle');
  await waitForAnimationsSettled(page);

  const results = await new AxeBuilder({ page }).analyze();
  const blockers = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(
    blockers.map(
      (violation) =>
        `${violation.impact}:${violation.id} → ${violation.nodes.map((node) => node.target).join(' | ')}`,
    ),
    '/sign-in wrong-password error',
  ).toEqual([]);
});

test('en: unknown email gets the same styled translated error (enumeration-safe)', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/sign-in');

  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' && response.url().endsWith('/api/auth/local'),
  );

  await page
    .getByLabel(cat(en, 'Auth.emailLabel'), { exact: true })
    .fill('no-such-parent-e2e@schooltest.local');
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill('WhateverPass123!');
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();

  const loginResponse = await loginResponsePromise;
  expect(loginResponse.status()).toBe(400);
  const loginBody = (await loginResponse.json()) as LoginErrorBody;
  expect(loginBody.error.message).toBe(RAW_STRAPI_MESSAGE);

  const alert = page.locator('[data-slot="alert"]');
  await expect(alert).toBeVisible();
  await expect(alert).toContainText(cat(en, 'Auth.loginError'));
  await expect(page.getByText(RAW_STRAPI_MESSAGE)).toHaveCount(0);
  await expect(page).toHaveURL(/\/sign-in$/);
  const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  expect(token).toBeNull();
});
