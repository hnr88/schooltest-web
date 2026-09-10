import path from 'node:path';

import { expect, test } from '@playwright/test';
import type { APIRequestContext, Page } from '@playwright/test';

import { SEEDED_PARENT } from './helpers/auth';
import { roleCredentials } from './helpers/credentials';
import { cat, loadMessages } from './helpers/i18n';
import { parentPortalEnabled } from './helpers/parent-portal';

/**
 * notifications/06 (D-08): settings and device push reachable by school staff.
 *
 * THE DEFECT THIS PINS SHUT. `NotificationPreferencesPanel` was mounted only
 * under `dashboard/(portal)` — ParentGuard plus the parent-views mask — while
 * the API grants `GET`/`PUT /api/notification-preferences/me` to every app role
 * and `dispatch.ts` gates the staff-recipient events on exactly those
 * preferences. Staff notifications were being filtered by settings staff could
 * not open. `/dashboard/teach/settings` is the surface that fixes it.
 *
 * THIS FILE DELIBERATELY DOES **NOT** CALL `skipWhenParentPortalMasked()`
 * (D-08a). `NEXT_PUBLIC_PARENT_VIEWS_ENABLED` ships at its schema default
 * `'false'` (src/lib/env.ts:16), which is why every parent-portal settings spec
 * opens with that skip — and why, before this row, there was no green proof
 * that ANY role could reach the preferences card. The whole point of this route
 * is a surface the parent-portal mask cannot hide, so the mask is not skipped
 * here: it is ASSERTED, in `the mask that hides /dashboard/settings does not
 * hide the staff route`, which drives one teacher at both URLs in one test.
 *
 * No mocks: real logins, the real preference endpoint, real toggles. Every
 * preference this file changes is restored in a `finally`, field by field
 * (delta restore — a full-row restore is what clobbered other specs' in-flight
 * writes on the shared rows historically).
 */
const en = loadMessages('en');
const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5500';
const SCREENSHOTS = path.resolve(process.cwd(), '.qa', 'screenshots');
const STAFF_SETTINGS_PATH = '/dashboard/teach/settings';
const PARENT_SETTINGS_PATH = '/dashboard/settings';
const PREFERENCES_PATH = '/api/notification-preferences/me';

const TEACHER = roleCredentials('teacher');
const SCHOOL_ADMIN = roleCredentials('schoolAdmin');

interface LoginResponse {
  jwt: string;
}

interface NotificationPreference {
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  children: boolean;
  testActivity: boolean;
  testResults: boolean;
  digestFrequency: 'immediate' | 'daily' | 'weekly' | 'off';
}

function key(name: string): string {
  return `Settings.notificationPreferences.${name}`;
}

// The API's auth guard allows 20 POST /api/auth/local per minute per IP, so
// each identity is logged in ONCE per worker and the jwt reused.
const tokens = new Map<string, string>();

async function login(
  request: APIRequestContext,
  credentials: { email: string; password: string },
): Promise<string> {
  const cached = tokens.get(credentials.email);
  if (cached !== undefined) return cached;
  const response = await request.post(`${API_BASE_URL}/api/auth/local`, {
    data: { identifier: credentials.email, password: credentials.password },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  const { jwt } = (await response.json()) as LoginResponse;
  tokens.set(credentials.email, jwt);
  return jwt;
}

async function readPreferences(
  request: APIRequestContext,
  token: string,
): Promise<NotificationPreference> {
  const response = await request.get(`${API_BASE_URL}${PREFERENCES_PATH}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return ((await response.json()) as { data: NotificationPreference }).data;
}

async function writePreferences(
  request: APIRequestContext,
  token: string,
  values: Partial<NotificationPreference>,
): Promise<void> {
  const response = await request.put(`${API_BASE_URL}${PREFERENCES_PATH}`, {
    headers: { Authorization: `Bearer ${token}` },
    data: values,
  });
  expect(response.ok(), await response.text()).toBeTruthy();
}

/** Signs the browser in by injecting the JWT the axios client reads. */
async function signInAs(page: Page, token: string): Promise<void> {
  await page.addInitScript((jwt) => window.localStorage.setItem('app.auth.token', jwt), token);
}

async function openStaffSettings(page: Page): Promise<void> {
  await page.goto(STAFF_SETTINGS_PATH);
  await expect(page.locator('[data-surface="staff-settings"]')).toBeVisible({ timeout: 30_000 });
}

const STAFF_ROLES = [
  { name: 'teacher', credentials: TEACHER },
  { name: 'school_admin', credentials: SCHOOL_ADMIN },
] as const;

// 120s, the budget zz-task117-teacher-notifications uses against the same live
// stack: this suite drives a DEV server whose first compile of a route (and
// every recompile another lane's edit triggers) can cost more than Playwright's
// 30s default. Measured: the same test passed in 6.6s warm and hit the 30s wall
// cold, which is a stack timing fact, not a product one.
test.describe.configure({ mode: 'serial', timeout: 120_000 });

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
});

// RESTORE NET. A per-test `finally` cannot restore anything once the test has
// TIMED OUT — its request context is already closed, so the write silently
// fails and the shared row stays flipped for every later spec (observed once,
// and repaired by hand). Every write this file makes is recorded here first and
// only cleared when its restore has actually landed; whatever is left runs in
// afterAll on a request context this file owns.
const pendingRestores: Array<{ token: string; values: Partial<NotificationPreference> }> = [];

test.afterAll(async ({ playwright }) => {
  if (pendingRestores.length === 0) return;
  const api = await playwright.request.newContext();
  try {
    for (const { token, values } of pendingRestores) {
      await api.put(`${API_BASE_URL}${PREFERENCES_PATH}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: values,
      });
    }
  } finally {
    await api.dispose();
  }
});

for (const { name, credentials } of STAFF_ROLES) {
  test(`${name} opens /dashboard/teach/settings and sees the shared preferences card and the device-push control`, async ({
    page,
    request,
  }) => {
    const token = await login(request, credentials);
    await signInAs(page, token);
    await openStaffSettings(page);

    // The page's own heading, then the SAME card the parent settings tab
    // mounts — the panel's title, its channel switches and its save button.
    await expect(
      page.getByRole('heading', { name: cat(en, 'Settings.staff.title'), level: 1 }),
    ).toBeVisible();
    await expect(page.getByText(cat(en, 'Settings.staff.subtitle'), { exact: true })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: cat(en, key('title')), exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('switch', { name: cat(en, key('channels.email.title')), exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: cat(en, key('save')), exact: true }),
    ).toBeVisible();

    // P-05: PushSubscriptionControl renders from INSIDE the panel, so mounting
    // the panel is what gives staff the device control — there is no second
    // mount of it on this page.
    const push = page.locator('[data-surface="push-subscription-control"]');
    await expect(push).toHaveCount(1);
    await expect(
      push.getByRole('heading', { name: cat(en, key('push.title')), exact: true }),
    ).toBeVisible();
    // The control always renders its REAL status with an action button; in a
    // headless browser with no granted Notification permission that button is
    // the disabled "enable" arm, never a missing control.
    await expect(
      push.getByRole('button', {
        name: new RegExp(
          `${cat(en, key('push.enable'))}|${cat(en, key('push.disable'))}`,
        ),
      }),
    ).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOTS, `staff-notification-settings-${name}.png`),
      fullPage: true,
    });
  });
}

test('the mask that hides /dashboard/settings does not hide the staff route', async ({
  page,
  request,
}) => {
  // D-08a, asserted rather than skipped. The flag is off in the suite's own
  // environment; the two navigations below prove it is off in the RUNNING app
  // too — the parent-portal settings route bounces this teacher, the staff
  // route serves them.
  expect(
    parentPortalEnabled(),
    'this spec proves reachability with NEXT_PUBLIC_PARENT_VIEWS_ENABLED at its default',
  ).toBe(false);

  const token = await login(request, TEACHER);
  await signInAs(page, token);

  // The parent portal route: ParentGuard's mask redirects a staff role away.
  await page.goto(PARENT_SETTINGS_PATH);
  await page.waitForURL((url) => !url.pathname.endsWith('/dashboard/settings'), {
    timeout: 30_000,
  });
  await expect(
    page.getByRole('heading', { name: cat(en, key('title')), exact: true }),
    'the parent settings tab is masked for staff — this is the defect, still true',
  ).toHaveCount(0);

  // The staff route, same browser, same session, same flag state.
  await openStaffSettings(page);
  await expect(
    page.getByRole('heading', { name: cat(en, key('title')), exact: true }),
  ).toBeVisible();
});

for (const { name, credentials } of STAFF_ROLES) {
  test(`${name} saves a preference from the staff route and reloads it, and no other user's row moves`, async ({
    page,
    request,
  }) => {
    const token = await login(request, credentials);
    const otherRole = STAFF_ROLES.find((entry) => entry.name !== name)!;
    const otherToken = await login(request, otherRole.credentials);
    const original = await readPreferences(request, token);
    const otherBefore = await readPreferences(request, otherToken);
    const expected = !original.emailEnabled;
    const restore = { token, values: { emailEnabled: original.emailEnabled } };
    pendingRestores.push(restore);

    try {
      await signInAs(page, token);
      await openStaffSettings(page);

      const email = page.getByRole('switch', {
        name: cat(en, key('channels.email.title')),
        exact: true,
      });
      await expect(email).toHaveAttribute('aria-checked', String(original.emailEnabled));
      await email.click();
      await expect(email).toHaveAttribute('aria-checked', String(expected));

      const updatePromise = page.waitForResponse(
        (response) =>
          response.url().endsWith(PREFERENCES_PATH) && response.request().method() === 'PUT',
      );
      await page.getByRole('button', { name: cat(en, key('save')), exact: true }).click();
      const update = await updatePromise;
      expect(update.status(), await update.text()).toBe(200);
      expect((update.request().postDataJSON() as Record<string, unknown>).emailEnabled).toBe(
        expected,
      );
      await expect(page.getByText(cat(en, key('saved')))).toBeVisible();

      // GET after PUT, on the wire.
      const persisted = await readPreferences(request, token);
      expect(persisted.emailEnabled).toBe(expected);

      // And after a reload of the staff route itself — gated on the refetched
      // GET so the assertion can never match the pre-load defaults by accident.
      const preferencesPromise = page.waitForResponse(
        (response) =>
          response.url().endsWith(PREFERENCES_PATH) && response.request().method() === 'GET',
      );
      await page.reload();
      await preferencesPromise;
      await expect(
        page.getByRole('switch', { name: cat(en, key('channels.email.title')), exact: true }),
      ).toHaveAttribute('aria-checked', String(expected));

      // Per-user isolation (D-10): the other staff role's row is untouched.
      const otherAfter = await readPreferences(request, otherToken);
      expect(otherAfter, `${otherRole.name}'s preference row did not move`).toEqual(otherBefore);
    } finally {
      // Delta restore: only the field this spec changed. On the happy path it
      // lands here and the afterAll net has nothing left to do.
      await writePreferences(request, token, { emailEnabled: original.emailEnabled });
      pendingRestores.splice(pendingRestores.indexOf(restore), 1);
    }
  });
}

test('a parent hitting the staff route is replaced to /dashboard', async ({ page, request }) => {
  const token = await login(request, SEEDED_PARENT);
  await signInAs(page, token);
  await page.goto(STAFF_SETTINGS_PATH);
  await page.waitForURL('**/dashboard', { timeout: 30_000 });
  await expect(page.locator('[data-surface="staff-settings"]')).toHaveCount(0);
  await page.screenshot({
    path: path.join(SCREENSHOTS, 'staff-notification-settings-parent-redirect.png'),
  });
});

test('the user menu sends school staff to the staff route and a parent to /dashboard/settings', async ({
  page,
  request,
}) => {
  const teacherToken = await login(request, TEACHER);
  await signInAs(page, teacherToken);
  await page.goto('/dashboard');
  await page.getByRole('button', { name: cat(en, 'Shell.topbar.userMenuLabel') }).click();
  await page.getByRole('menuitem', { name: cat(en, 'Shell.userMenu.settings') }).click();
  await page.waitForURL(`**${STAFF_SETTINGS_PATH}`, { timeout: 30_000 });
  await expect(page.locator('[data-surface="staff-settings"]')).toBeVisible({ timeout: 30_000 });

  // A NEW context for the parent: the init script that injects the teacher jwt
  // is bound to the page above.
  const parentContext = await page.context().browser()!.newContext();
  try {
    const parentPage = await parentContext.newPage();
    await parentPage.setViewportSize({ width: 1440, height: 900 });
    const parentToken = await login(request, SEEDED_PARENT);
    await signInAs(parentPage, parentToken);
    await parentPage.goto('/dashboard');
    await parentPage
      .getByRole('button', { name: cat(en, 'Shell.topbar.userMenuLabel') })
      .click();
    await parentPage
      .getByRole('menuitem', { name: cat(en, 'Shell.userMenu.settings') })
      .click();
    await parentPage.waitForURL(`**${PARENT_SETTINGS_PATH}`, { timeout: 30_000 });
    await expect(parentPage.locator('[data-surface="staff-settings"]')).toHaveCount(0);
  } finally {
    await parentContext.close();
  }
});
