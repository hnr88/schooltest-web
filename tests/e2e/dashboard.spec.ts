import path from 'node:path';

import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { cat, escapeRegExp, loadMessages } from './helpers/i18n';
import { watchErrors } from './helpers/ui';

// Task 15 verification (guard hoisted to the dashboard LAYOUT in task 012):
// every /dashboard/* route is gated client-side by ParentGuard/useRequireParent
// — no JWT in localStorage means an immediate redirect to /sign-in, a real JWT
// means the real DashboardScreen renders (welcome message pulled live from
// GET /api/users/me, no mock/stub data).
// The real JWT below comes from a genuine POST /api/auth/local against the
// live api on :5500 (D9 seeded parent) — never a synthetic token.
const en = loadMessages('en');
const SCREENSHOTS = path.resolve(process.cwd(), '.qa', 'screenshots');
const DESKTOP = { width: 1280, height: 800 };
const PARENT = { email: 'parent@schooltest.local', password: 'Parent1234!' };
const API_BASE_URL = 'http://localhost:5500';

test('en: incognito visit to /dashboard redirects to /sign-in (no JWT, real client guard)', async ({
  page,
}) => {
  const errors = watchErrors(page);
  await page.setViewportSize(DESKTOP);
  await page.goto('/dashboard');

  await page.waitForURL('**/sign-in');
  const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  expect(token).toBeNull();
  expect(errors, errors.join('\n')).toEqual([]);
});

test('en: seeded parent session renders the real guarded dashboard shell, axe clean', async ({
  page,
  request,
}) => {
  const errors = watchErrors(page);
  await page.setViewportSize(DESKTOP);

  // Real login against the live api — no UI round trip needed to prove the
  // guard's pass-through behavior in isolation from the sign-in form itself.
  const loginRes = await request.post(`${API_BASE_URL}/api/auth/local`, {
    data: { identifier: PARENT.email, password: PARENT.password },
  });
  expect(loginRes.ok(), await loginRes.text()).toBeTruthy();
  const { jwt } = (await loginRes.json()) as { jwt: string };
  expect(jwt).toMatch(/^eyJ/);

  await page.addInitScript((token) => {
    window.localStorage.setItem('app.auth.token', token);
  }, jwt);
  await page.goto('/dashboard');

  await expect(page).toHaveURL(/\/dashboard$/);
  // Root layout wraps page titles in a "%s · Schooltest" template (D-independent).
  await expect(page).toHaveTitle(new RegExp(`^${escapeRegExp(cat(en, 'Dashboard.meta.title'))}`));
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    cat(en, 'Dashboard.meta.description'),
  );

  // Real username fetched live from GET /api/users/me — never hardcoded.
  await expect(
    page.getByRole('heading', { level: 1, name: /Welcome back, parent!/ }),
  ).toBeVisible();
  await expect(page.getByText(cat(en, 'Dashboard.welcomeSubtitle'))).toBeVisible();
  // Task 012: the Overview header's right-aligned primary is a real link to the
  // upcoming add-student flow (route ships W9; the href contract holds today).
  const addStudentLink = page.getByRole('link', {
    name: cat(en, 'Dashboard.addStudent'),
    exact: true,
  });
  await expect(addStudentLink).toBeVisible();
  await expect(addStudentLink).toHaveAttribute('href', '/dashboard/children/new');
  const overview = page.locator('[data-slot="dashboard-overview"]');
  await expect(overview).toBeVisible();
  await expect(overview.locator('[data-slot="stat-card"]')).toHaveCount(4);
  await expect(overview.locator('[data-slot="dashboard-recent-profile"]').first()).toBeVisible();
  const exploreOptions = overview.locator('[data-slot="dashboard-explore-options"]');
  await expect(exploreOptions.locator('a[href="/dashboard/search?mode=schools"]')).toBeVisible();
  await expect(exploreOptions.locator('a[href="/dashboard/search?mode=agents"]')).toBeVisible();
  // Sign-out relocated to the topbar user chip (task 011) — the inline dashboard
  // button is gone; the chip trigger is the visible entry point now.
  const userMenuTrigger = page.getByRole('button', {
    name: cat(en, 'Shell.topbar.userMenuLabel'),
    exact: true,
  });
  await expect(userMenuTrigger).toBeVisible();

  await page.screenshot({ path: path.join(SCREENSHOTS, 'dashboard-en.png') });
  await page.screenshot({ path: path.join(SCREENSHOTS, '012-overview-restyled.png') });

  const results = await new AxeBuilder({ page }).analyze();
  const blockers = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(
    blockers.map(
      (violation) =>
        `${violation.impact}:${violation.id} → ${violation.nodes.map((node) => node.target).join(' | ')}`,
    ),
    '/dashboard en',
  ).toEqual([]);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('en: signing out from the dashboard clears the JWT and returns to a guarded route', async ({
  page,
  request,
}) => {
  const loginRes = await request.post(`${API_BASE_URL}/api/auth/local`, {
    data: { identifier: PARENT.email, password: PARENT.password },
  });
  const { jwt } = (await loginRes.json()) as { jwt: string };

  await page.addInitScript((token) => {
    window.localStorage.setItem('app.auth.token', token);
  }, jwt);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/dashboard$/);

  // Task 011: sign-out lives in the topbar user chip menu (C-UI-SHELL §12.3).
  await page
    .getByRole('button', { name: cat(en, 'Shell.topbar.userMenuLabel'), exact: true })
    .click();
  const signOutItem = page.getByRole('menuitem', {
    name: cat(en, 'Shell.userMenu.signOut'),
    exact: true,
  });
  await expect(signOutItem).toBeVisible();
  await expect(
    page.getByRole('menuitem', { name: cat(en, 'Shell.userMenu.settings'), exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: path.join(SCREENSHOTS, '011-user-menu-open.png') });
  await signOutItem.click();

  // The guard reacts live to the store losing its token — no full reload needed.
  await page.waitForURL('**/sign-in');
  const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  expect(token).toBeNull();
});
