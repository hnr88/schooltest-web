import { expect, test } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';
import { waitForAnimationsSettled } from './helpers/ui';

const en = loadMessages('en');
const API = process.env.API_BASE_URL ?? 'http://localhost:5510';

// Regression (user report 2026-07-25): with a JWT in localStorage, POSTing the
// public auth endpoints 403'd — the axios interceptor attached the Bearer token,
// Strapi evaluated the request against the parent role, and no app role holds
// the public auth grants. The client must not attach the stored token to the
// public /api/auth/* paths.
test('forgot-password with a stored JWT sends no Authorization header and succeeds', async ({
  page,
  request,
}) => {
  const login = await request.post(`${API}/api/auth/local`, {
    data: { identifier: 'parent@schooltest.local', password: 'Parent1234!' },
  });
  const { jwt } = (await login.json()) as { jwt: string };

  await page.goto('/forgot-password');
  const emailField = page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true });
  await expect(emailField).toBeVisible();
  await waitForAnimationsSettled(page);
  // Token lands AFTER the page hydrated, so the authed-card redirect does not
  // fire — this is exactly the poisoned-request scenario: the axios interceptor
  // reads localStorage live at request time.
  await page.evaluate((token) => window.localStorage.setItem('app.auth.token', token), jwt);

  const seen = page.waitForRequest(
    (req) => req.url().includes('/api/auth/forgot-password') && req.method() === 'POST',
  );
  await emailField.fill('parent@schooltest.local');
  await page.getByRole('button', { name: cat(en, 'Auth.sendResetLink'), exact: true }).click();

  const outgoing = await seen;
  expect(outgoing.headers()['authorization']).toBeUndefined();
  await expect(page.getByText(cat(en, 'Auth.sentTitle'), { exact: false })).toBeVisible({
    timeout: 15_000,
  });
});
