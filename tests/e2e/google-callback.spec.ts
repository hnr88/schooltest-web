import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';
import { watchErrors } from './helpers/ui';

// Task 14 verification: the Google button on both auth cards is a real link to
// the api's connect route (C-AUTH-GOOGLE), and /auth/google/callback forwards
// its incoming query to the REAL api on :5500. Real Google OAuth stays BLOCKED
// (D5 — no GOOGLE_CLIENT_ID/SECRET exist anywhere), so both exercisable paths
// here hit the api's genuine env-gated "This provider is disabled" 400 (task 9)
// — never a synthetic/mocked jwt. Assertions derive from the message catalogs.
const en = loadMessages('en');

test('en: sign-in card Google button links to the real connect route', async ({ page }) => {
  await page.goto('/sign-in');
  const google = page.getByRole('link', { name: cat(en, 'Auth.googleButton'), exact: true });
  await expect(google).toHaveAttribute('href', /\/api\/connect\/google$/);
  await expect(google).toHaveAttribute('title', cat(en, 'Auth.googleTitle'));
});

test('en: sign-up card also has the Google button, wired the same way', async ({ page }) => {
  await page.goto('/sign-up');
  const google = page.getByRole('link', { name: cat(en, 'Auth.googleButton'), exact: true });
  await expect(google).toHaveAttribute('href', /\/api\/connect\/google$/);
  await expect(google).toHaveAttribute('title', cat(en, 'Auth.googleTitle'));
});

test('en: callback with no query redirects to /sign-in?error=google and the alert renders', async ({
  page,
}) => {
  const errors = watchErrors(page);
  // The sign-in card's D-UI-2 entrance animation honors motion-reduce:*;
  // reduced motion keeps this axe color-contrast pass deterministic right
  // after the client-side redirect (contrast is otherwise sampled mid-fade).
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/auth/google/callback');

  await page.waitForURL(/\/sign-in\?error=google$/);
  const alert = page.locator('[data-slot="alert"]');
  await expect(alert).toBeVisible();
  await expect(alert).toContainText(cat(en, 'Auth.googleError'));
  const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  expect(token).toBeNull();
  expect(errors, errors.join('\n')).toEqual([]);

  const results = await new AxeBuilder({ page }).analyze();
  const blockers = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(
    blockers.map(
      (violation) =>
        `${violation.impact}:${violation.id} → ${violation.nodes.map((node) => node.target).join(' | ')}`,
    ),
    '/sign-in?error=google',
  ).toEqual([]);
});

test('en: callback with a query forwards it to the real api, which rejects it (no credentials), same error state', async ({
  page,
}) => {
  // The query itself is bogus (never a real Google grant) — the point is that the
  // page forwards WHATEVER it receives to GET /api/auth/google/callback rather than
  // trying to interpret it client-side, and routes on the api's real response.
  await page.goto('/auth/google/callback?access_token=bogus-e2e-token&id_token=bogus-oidc');

  await page.waitForURL(/\/sign-in\?error=google$/);
  const alert = page.locator('[data-slot="alert"]');
  await expect(alert).toBeVisible();
  await expect(alert).toContainText(cat(en, 'Auth.googleError'));
  const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  expect(token).toBeNull();
});

test('en: an existing token still redirects the sign-in card even with ?error=google present', async ({
  context,
  page,
}) => {
  await context.addInitScript(() => window.localStorage.setItem('app.auth.token', 'stub-jwt'));
  await page.goto('/sign-in?error=google');
  await page.waitForURL('**/dashboard');
});
