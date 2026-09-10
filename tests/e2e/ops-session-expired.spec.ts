import path from 'node:path';

import { expect, test } from '@playwright/test';

import { apiEnv } from './helpers/auth-db';
import { cat, loadMessages } from './helpers/i18n';

// GAP-6 visual proof — the design-drawn SESSION EXPIRED wall. Sign in as ops
// (the ONE login), open an ops page, then simulate expiry the honest way:
// overwrite the stored JWT with an invalid one and reload, so the app itself
// runs a real request, gets a real 401, classifies it auth-invalid and raises
// the expired signal. The assertion is the drawn card — title, explanatory
// copy and a working Sign-in-again action — rendering over the kept-alive
// page instead of the old silent redirect. No mutations, no expiry waiting.
//
// Screenshots attach to the result AND save under the mission captures dir
// as gap6-*.png (desktop + 375px).

const en = loadMessages('en');
const CAPTURES =
  process.env.GAP6_CAPTURES_DIR
  ?? path.resolve(__dirname, '..', '..', '..', '.codephant', 'missions', 'msn-0da39441-f845-426b-88a1-037c9eb98442', 'captures');

test.describe('ops session expired wall (GAP-6 visual proof)', () => {
  test('an invalidated session renders the expired card instead of a silent redirect', async ({
    page,
  }, testInfo) => {
    // --- the one login ---
    await page.goto('/sign-in');
    await page.getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true }).fill('apiadmin@schooltest.local');
    await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(apiEnv('SEED_APIADMIN_PASSWORD'));
    await page.getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true }).click();
    await page.waitForURL('**/dashboard');

    // --- an authenticated ops page renders normally first ---
    await page.goto('/dashboard/ops/schools');
    await page.getByTestId('ops-admins-invite').waitFor({ state: 'hidden', timeout: 60_000 }).catch(() => {});
    await expect(page.getByRole('heading', { name: cat(en, 'Ops.schools.title') })).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.locator('[data-slot="ops-session-expired"]')).toHaveCount(0);

    // --- simulate expiry: corrupt the stored JWT, then let the app see it ---
    await page.evaluate(() => {
      window.localStorage.setItem('app.auth.token', 'expired-simulation-not-a-jwt');
    });
    await page.reload();

    // The reload runs GET /api/users/me with the junk token: 401 → auth-invalid
    // → the expired signal → the card, NOT a redirect to /sign-in.
    const card = page.locator('[data-slot="ops-session-expired"]');
    await card.waitFor({ state: 'visible', timeout: 60_000 });
    await expect(card).toContainText(cat(en, 'Auth.sessionExpired'));
    // D-14 (mvp/ops task 04): a HARD RELOAD is the no-cache case — the settings
    // read is born disabled here (the guard enables it only for a live session)
    // and the QueryClient cache died with the reload, so the wall renders the
    // no-timeout sentence rather than inventing a number. The old
    // Auth.sessionExpiredBody "30 minutes" assertion contradicted that shipped
    // behaviour.
    await expect(card).toContainText(cat(en, 'Ops.capabilities.sessionExpiredBodyNoTimeout'));
    await expect(card).not.toContainText(/after \d+ minutes/);
    const action = card.getByRole('link', { name: cat(en, 'Auth.sessionExpiredAction') });
    await expect(action).toBeVisible();
    await expect(action).toHaveAttribute('href', /\/sign-in$/);
    // the wall keeps the page underneath — the URL is untouched, no yank
    expect(page.url()).toContain('/dashboard/ops');

    await page.waitForTimeout(400);
    const desktop = await page.screenshot({ path: `${CAPTURES}/gap6-expired-desktop.png` });
    await testInfo.attach('gap6-expired-desktop.png', { body: desktop, contentType: 'image/png' });

    // --- 375px ---
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    const mobile = await page.screenshot({ path: `${CAPTURES}/gap6-expired-mobile.png`, fullPage: true });
    await testInfo.attach('gap6-expired-mobile.png', { body: mobile, contentType: 'image/png' });
  });
});
