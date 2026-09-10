import path from 'node:path';

import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { SEEDED_PARENT } from './helpers/auth';
import { cat, loadMessages } from './helpers/i18n';
import { waitForAnimationsSettled, watchErrors } from './helpers/ui';

// Task 12 verification: /sign-in renders the DS card, password login works against
// the real api on :5500 (seeded parent, D9), the error model is translated+styled,
// zh renders from its catalog, and axe is clean. Assertions derive from the
// message catalogs at runtime — no copy is duplicated into this spec.
//
// The api's FRONTEND_ORIGIN is aligned to :3100 (this instance's web app) and the
// api has picked it up via its sanctioned dev-server restart, so the real browser's
// CORS enforcement passes against the real api round trip — no relaxed browser flags.
const en = loadMessages('en');
const zh = loadMessages('zh');
const SCREENSHOTS = path.resolve(process.cwd(), '.qa', 'screenshots');
const DESKTOP = { width: 1280, height: 800 };
const PARENT = SEEDED_PARENT;

test('en: renders the §14.1 split-panel sign-in with forgot link, axe clean', async ({ page }) => {
  const errors = watchErrors(page);
  await page.setViewportSize(DESKTOP);
  await page.goto('/sign-in');

  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    cat(en, 'Auth.meta.description'),
  );
  await expect(
    page.getByRole('heading', { level: 1, name: cat(en, 'Auth.portal.signInTitle') }),
  ).toBeVisible();
  await expect(page.getByText(cat(en, 'Auth.portal.signInSubtitle'))).toBeVisible();

  // The portal design is invitation-only: no Google button, no show-password
  // toggle, no sign-up prompt on the sign-in card.
  await expect(page.getByRole('link', { name: cat(en, 'Auth.googleButton'), exact: true })).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: cat(en, 'Auth.showPassword'), exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole('link', { name: cat(en, 'Auth.signUp'), exact: true })).toHaveCount(0);
  await expect(page.getByText(cat(en, 'Auth.portal.invitationNote'))).toBeVisible();

  await expect(page.getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true })).toBeVisible();
  await expect(page.getByLabel(cat(en, 'Auth.portal.passwordLabel'), { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true }),
  ).toBeVisible();

  // §14.1 restored the forgot-password link (task 017, C-UI-AUTH-PAGES); the
  // portal design moves it into the password label row.
  const forgot = page.getByRole('link', {
    name: cat(en, 'Auth.portal.forgotLink'),
    exact: true,
  });
  await expect(forgot).toBeVisible();
  await expect(forgot).toHaveAttribute('href', '/forgot-password');

  // Split-panel left navy panel is visible at 1280px (hidden <1024px).
  await expect(page.getByText(cat(en, 'Auth.split.title'))).toBeVisible();
  await expect(page.getByText(cat(en, 'Auth.split.acknowledgement'))).toBeVisible();
  await page.setViewportSize({ width: 768, height: 800 });
  await expect(page.getByText(cat(en, 'Auth.split.title'))).toBeHidden();
  await page.setViewportSize(DESKTOP);

  await waitForAnimationsSettled(page);
  await page.screenshot({ path: path.join(SCREENSHOTS, 'sign-in-split-en.png') });

  const results = await new AxeBuilder({ page }).analyze();
  const blockers = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(
    blockers.map(
      (violation) =>
        `${violation.impact}:${violation.id} → ${violation.nodes.map((node) => node.target).join(' | ')}`,
    ),
    '/sign-in en',
  ).toEqual([]);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('en: ?confirmed=1 renders the email-confirmed banner above the form', async ({ page }) => {
  // C-AUTH-CONFIRM redirects the emailed link here (C-AUTH-SETTINGS-ASSERT).
  await page.setViewportSize(DESKTOP);
  await page.goto('/sign-in?confirmed=1');
  await expect(page.getByText(cat(en, 'Auth.emailConfirmedBanner'))).toBeVisible();
  await waitForAnimationsSettled(page);
  await page.screenshot({ path: path.join(SCREENSHOTS, 'sign-in-confirmed-banner.png') });

  // Plain /sign-in never shows the strip.
  await page.goto('/sign-in');
  await expect(page.getByText(cat(en, 'Auth.emailConfirmedBanner'))).toHaveCount(0);
});

test('en: empty submit shows translated field validation, no api call', async ({ page }) => {
  await page.goto('/sign-in');
  await page.getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true }).click();
  await expect(page.getByText(cat(en, 'Auth.emailRequired'))).toBeVisible();
  await expect(page.getByText(cat(en, 'Auth.passwordRequired'))).toBeVisible();
  await expect(page.getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  expect(token).toBeNull();
});

test('en: wrong password renders the styled inline error (never a Strapi page)', async ({
  page,
}) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true }).fill(PARENT.email);
  await page.getByLabel(cat(en, 'Auth.portal.passwordLabel'), { exact: true }).fill('WrongPass123!');
  await page.getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true }).click();

  const alert = page.locator('[data-slot="alert"]');
  await expect(alert).toBeVisible();
  await expect(alert).toContainText(cat(en, 'Auth.portal.errorTitle'));
  await expect(alert).toContainText(cat(en, 'Auth.portal.errorBody'));
  await expect(alert).toContainText(/attempts? remain/i);
  await expect(page.getByText(cat(en, 'Auth.incorrectPassword'), { exact: true })).toBeVisible();
  await expect(
    page.getByLabel(cat(en, 'Auth.portal.passwordLabel'), { exact: true }),
  ).toHaveAttribute('aria-invalid', 'true');
  await expect(page).toHaveURL(/\/sign-in$/);
  const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  expect(token).toBeNull();
  await page.screenshot({ path: path.join(SCREENSHOTS, 'sign-in-error.png') });
});

test('en: seeded parent login stores the JWT and lands on a real /dashboard', async ({ page }) => {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true }).fill(PARENT.email);
  await page.getByLabel(cat(en, 'Auth.portal.passwordLabel'), { exact: true }).fill(PARENT.password);
  await page.getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true }).click();

  // /dashboard (task 15) renders a real, guarded shell — not a 404 — and shows
  // the authenticated parent's real username fetched from GET /api/users/me.
  await page.waitForURL('**/dashboard');
  await expect(page.getByRole('heading', { level: 1, name: /Welcome back, parent/ })).toBeVisible();
  const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  expect(token).toMatch(/^eyJ/);
});

test('en: an existing token redirects the card to /dashboard', async ({ context, page }) => {
  await context.addInitScript(() => window.localStorage.setItem('app.auth.token', 'stub-jwt'));
  await page.goto('/sign-in');
  // No flash: the sign-in form is never painted for a session that is about to
  // be redirected — the card renders its session-checking skeleton instead.
  await expect(page.getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true })).toHaveCount(0);
  await page.waitForURL('**/dashboard');
});

test('zh: /zh/sign-in renders the Chinese card from the zh catalog', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/zh/sign-in');
  await expect(
    page.getByRole('heading', { level: 1, name: cat(zh, 'Auth.portal.signInTitle') }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: cat(zh, 'Auth.portal.loginButton'), exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel(cat(zh, 'Auth.portal.emailLabel'), { exact: true })).toBeVisible();
  await expect(page.getByLabel(cat(zh, 'Auth.portal.passwordLabel'), { exact: true })).toBeVisible();
  await page.screenshot({ path: path.join(SCREENSHOTS, 'sign-in-zh.png') });
});
