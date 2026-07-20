import path from 'node:path';

import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';
import { freshParent } from './helpers/sign-up-form';
import { watchErrors } from './helpers/ui';

// Task 017: /sign-up structure, validation, and error legs against the real
// api on :5500. With email confirmation ON (D-AUTH-1/C-AUTH-REGISTER) the
// registration → Mailpit → /sign-in?confirmed=1 round-trip lives in
// sign-up-confirm.spec.ts (200-line file limit); shared fixtures sit in
// helpers/sign-up-form.ts. Assertions derive from the message catalogs at
// runtime — no copy is duplicated here.
const en = loadMessages('en');
const zh = loadMessages('zh');
const SCREENSHOTS = path.resolve(process.cwd(), '.qa', 'screenshots');
const DESKTOP = { width: 1280, height: 800 };
const PARENT = { email: 'parent@schooltest.local', password: 'Parent1234!' };

test('en: renders the DS sign-up card structure, axe clean', async ({ page }) => {
  const errors = watchErrors(page);
  await page.setViewportSize(DESKTOP);
  await page.goto('/sign-up');

  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    cat(en, 'Auth.signUpMeta.description'),
  );
  await expect(
    page.getByRole('heading', { level: 1, name: cat(en, 'Auth.signUpTitle') }),
  ).toBeVisible();
  await expect(page.getByText(cat(en, 'Auth.signUpSubtitle'))).toBeVisible();

  await expect(page.getByLabel(cat(en, 'Auth.usernameLabel'), { exact: true })).toBeVisible();
  await expect(page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true })).toBeVisible();
  await expect(page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true })).toBeVisible();
  await expect(
    page.getByLabel(cat(en, 'Auth.confirmPasswordLabel'), { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: cat(en, 'Auth.showPassword'), exact: true }),
  ).toHaveAttribute('aria-pressed', 'false');
  await expect(
    page.getByRole('button', { name: cat(en, 'Auth.showConfirmPassword'), exact: true }),
  ).toHaveAttribute('aria-pressed', 'false');
  await expect(
    page.getByRole('button', { name: cat(en, 'Auth.signUpButton'), exact: true }),
  ).toBeVisible();
  const signIn = page.getByRole('link', { name: cat(en, 'Auth.signInLink'), exact: true });
  await expect(signIn).toHaveAttribute('href', '/sign-in');

  await page.screenshot({ path: path.join(SCREENSHOTS, 'sign-up-en.png') });

  const results = await new AxeBuilder({ page }).analyze();
  const blockers = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(
    blockers.map(
      (violation) =>
        `${violation.impact}:${violation.id} → ${violation.nodes.map((node) => node.target).join(' | ')}`,
    ),
    '/sign-up en',
  ).toEqual([]);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('en: empty submit shows translated field validation, no api call', async ({ page }) => {
  await page.goto('/sign-up');
  await page.getByRole('button', { name: cat(en, 'Auth.signUpButton'), exact: true }).click();
  await expect(page.getByText(cat(en, 'Auth.usernameTooShort'))).toBeVisible();
  await expect(page.getByText(cat(en, 'Auth.emailRequired'))).toBeVisible();
  await expect(page.getByText(cat(en, 'Auth.passwordTooShort'))).toBeVisible();
  await expect(page.getByText(cat(en, 'Auth.confirmPasswordRequired'))).toBeVisible();
  const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  expect(token).toBeNull();
});

test('en: mismatched passwords render a client-side error, no api call', async ({ page }) => {
  const parent = freshParent();
  await page.goto('/sign-up');
  await page.getByLabel(cat(en, 'Auth.usernameLabel'), { exact: true }).fill(parent.username);
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(parent.email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(parent.password);
  await page
    .getByLabel(cat(en, 'Auth.confirmPasswordLabel'), { exact: true })
    .fill('SomethingElse1!');
  await page.getByRole('button', { name: cat(en, 'Auth.signUpButton'), exact: true }).click();
  await expect(page.getByText(cat(en, 'Auth.passwordMismatch'))).toBeVisible();
  await expect(page).toHaveURL(/\/sign-up$/);
  const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  expect(token).toBeNull();
});

test('en: taken email/username renders the styled inline error (never a Strapi page)', async ({
  page,
}) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/sign-up');
  await page.getByLabel(cat(en, 'Auth.usernameLabel'), { exact: true }).fill('parent');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(PARENT.email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(PARENT.password);
  await page
    .getByLabel(cat(en, 'Auth.confirmPasswordLabel'), { exact: true })
    .fill(PARENT.password);
  await page.getByRole('button', { name: cat(en, 'Auth.signUpButton'), exact: true }).click();

  const alert = page.locator('[data-slot="alert"]');
  await expect(alert).toBeVisible();
  await expect(alert).toContainText(cat(en, 'Auth.takenError'));
  await expect(page).toHaveURL(/\/sign-up$/);
  const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  expect(token).toBeNull();
  await page.screenshot({ path: path.join(SCREENSHOTS, 'sign-up-error.png') });
});

test('en: an existing token redirects the card to /dashboard', async ({ context, page }) => {
  await context.addInitScript(() => window.localStorage.setItem('app.auth.token', 'stub-jwt'));
  await page.goto('/sign-up');
  await page.waitForURL('**/dashboard');
});

test('zh: /zh/sign-up renders the Chinese card from the zh catalog', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/zh/sign-up');
  await expect(
    page.getByRole('heading', { level: 1, name: cat(zh, 'Auth.signUpTitle') }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: cat(zh, 'Auth.signUpButton'), exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel(cat(zh, 'Auth.usernameLabel'), { exact: true })).toBeVisible();
  await expect(page.getByLabel(cat(zh, 'Auth.emailLabel'), { exact: true })).toBeVisible();
  await page.screenshot({ path: path.join(SCREENSHOTS, 'sign-up-zh.png') });
});
