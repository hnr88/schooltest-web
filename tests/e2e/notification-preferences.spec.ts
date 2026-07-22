import path from 'node:path';

import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { APIRequestContext, APIResponse, Page } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';

const en = loadMessages('en');
const API_BASE_URL = 'http://localhost:5500';
const PARENT = { email: 'parent@schooltest.local', password: 'Parent1234!' };
const SCREENSHOTS = path.resolve(process.cwd(), '.qa', 'screenshots');

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

interface NotificationPreferenceResponse {
  data: NotificationPreference;
}

async function getParentToken(request: APIRequestContext): Promise<string> {
  const response = await request.post(`${API_BASE_URL}/api/auth/local`, {
    data: { identifier: PARENT.email, password: PARENT.password },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return ((await response.json()) as LoginResponse).jwt;
}

async function readPreferences(
  request: APIRequestContext,
  token: string,
): Promise<NotificationPreference> {
  const response = await request.get(`${API_BASE_URL}/api/notification-preferences/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return ((await response.json()) as NotificationPreferenceResponse).data;
}

async function restorePreferences(
  request: APIRequestContext,
  token: string,
  preferences: NotificationPreference,
): Promise<void> {
  const response = await request.put(`${API_BASE_URL}/api/notification-preferences/me`, {
    headers: { Authorization: `Bearer ${token}` },
    data: preferences,
  });
  expect(response.ok(), await response.text()).toBeTruthy();
}

async function loadNotificationSettings(page: Page, token: string): Promise<void> {
  await page.addInitScript((jwt) => window.localStorage.setItem('app.auth.token', jwt), token);
  await page.goto('/dashboard/settings?tab=notifications');
}

async function expectForbidden(response: APIResponse): Promise<void> {
  expect(response.status()).toBe(403);
  expect(await response.json()).toEqual({
    data: null,
    error: { status: 403, name: 'ForbiddenError', message: 'Forbidden', details: {} },
  });
}

test.describe.configure({ mode: 'serial' });

test('notification preference endpoints refuse anonymous requests', async ({ request }) => {
  const getResponse = await request.get(`${API_BASE_URL}/api/notification-preferences/me`);
  await expectForbidden(getResponse);
  const updateResponse = await request.put(`${API_BASE_URL}/api/notification-preferences/me`, {
    data: { emailEnabled: false },
  });
  await expectForbidden(updateResponse);
});

test('notification settings save a real parent preference and persist after reload', async ({
  page,
  request,
}) => {
  const token = await getParentToken(request);
  const original = await readPreferences(request, token);

  try {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loadNotificationSettings(page, token);
    await expect(
      page.getByRole('tab', { name: cat(en, 'Settings.tabs.notifications') }),
    ).toHaveAttribute('aria-selected', 'true');
    await expect(
      page.getByRole('heading', { name: cat(en, 'Settings.notificationPreferences.title') }),
    ).toBeVisible();

    const email = page.getByRole('switch', {
      name: cat(en, 'Settings.notificationPreferences.channels.email.title'),
    });
    const childUpdates = page.getByRole('switch', {
      name: cat(en, 'Settings.notificationPreferences.categories.children.title'),
    });
    const emailEnabled = !((await email.getAttribute('aria-checked')) === 'true');
    const childrenEnabled = !((await childUpdates.getAttribute('aria-checked')) === 'true');
    await page
      .getByText(cat(en, 'Settings.notificationPreferences.channels.email.title'), { exact: true })
      .click();
    await childUpdates.focus();
    await childUpdates.press('Space');

    const digest = page.getByRole('combobox', {
      name: cat(en, 'Settings.notificationPreferences.digest.title'),
    });
    await digest.click();
    await page
      .getByRole('option', {
        name: cat(en, 'Settings.notificationPreferences.digest.options.off'),
      })
      .click();
    const updatePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/notification-preferences/me') &&
        response.request().method() === 'PUT',
    );
    await page
      .getByRole('button', { name: cat(en, 'Settings.notificationPreferences.save') })
      .click();
    const update = await updatePromise;
    expect(update.status(), await update.text()).toBe(200);
    const sentKeys = Object.keys(update.request().postDataJSON() as Record<string, unknown>);
    // Exactly the C-PREF-UPDATE whitelist — no field the server would silently drop.
    expect(sentKeys.sort().join()).toBe(
      'children,digestFrequency,emailEnabled,inAppEnabled,pushEnabled,smsEnabled,testActivity,testResults',
    );
    await expect(page.getByText(cat(en, 'Settings.notificationPreferences.saved'))).toBeVisible();

    const persisted = await readPreferences(request, token);
    expect(persisted.emailEnabled).toBe(emailEnabled);
    expect(persisted.children).toBe(childrenEnabled);
    expect(persisted.digestFrequency).toBe('off');
    await page.reload();
    await expect(email).toHaveAttribute('aria-checked', String(emailEnabled));
    await expect(childUpdates).toHaveAttribute('aria-checked', String(childrenEnabled));
    await expect(digest).toContainText(
      cat(en, 'Settings.notificationPreferences.digest.options.off'),
    );

    const axe = await new AxeBuilder({ page }).analyze();
    expect(
      axe.violations.filter((violation) =>
        ['serious', 'critical'].includes(violation.impact ?? ''),
      ),
    ).toEqual([]);
    await page.screenshot({ path: path.join(SCREENSHOTS, 'notification-preferences-en.png') });
    await page.setViewportSize({ width: 375, height: 800 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.getByRole('tab', { name: cat(en, 'Settings.tabs.children') })).toBeVisible();
    expect(
      await page.locator('html').evaluate((element) => element.scrollWidth > element.clientWidth),
    ).toBe(false);
    await page.screenshot({
      path: path.join(SCREENSHOTS, 'notification-preferences-mobile-en.png'),
    });
  } finally {
    await restorePreferences(request, token, original);
  }
});

test('notification settings show a localized save error for a real refused mutation', async ({
  page,
  request,
}) => {
  const token = await getParentToken(request);
  await loadNotificationSettings(page, token);
  const save = page.getByRole('button', { name: cat(en, 'Settings.notificationPreferences.save') });
  await expect(save).toBeVisible();
  await page.evaluate(() =>
    window.localStorage.setItem('app.auth.token', 'invalid-preference-token'),
  );
  const failure = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/notification-preferences/me') &&
      response.request().method() === 'PUT' &&
      !response.ok(),
  );
  await save.click();
  expect((await failure).status()).toBeGreaterThanOrEqual(400);
  await expect(page.getByText(cat(en, 'Settings.notificationPreferences.saveError'))).toBeVisible();
});
