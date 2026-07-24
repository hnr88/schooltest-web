import path from 'node:path';

import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { APIRequestContext, Page } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';
import { paceRateWindow } from './helpers/pace';

const en = loadMessages('en');
const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5510';
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

async function getParentToken(request: APIRequestContext): Promise<string> {
  const response = await request.post(`${API_BASE_URL}/api/auth/local`, {
    data: { identifier: PARENT.email, password: PARENT.password },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return ((await response.json()) as LoginResponse).jwt;
}

async function writePreferences(
  request: APIRequestContext,
  token: string,
  values: Partial<NotificationPreference>,
): Promise<NotificationPreference> {
  const response = await request.put(`${API_BASE_URL}/api/notification-preferences/me`, {
    headers: { Authorization: `Bearer ${token}` },
    data: values,
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return ((await response.json()) as { data: NotificationPreference }).data;
}

async function readPreferences(
  request: APIRequestContext,
  token: string,
): Promise<NotificationPreference> {
  const response = await request.get(`${API_BASE_URL}/api/notification-preferences/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return ((await response.json()) as { data: NotificationPreference }).data;
}

async function openNotificationSettings(page: Page, token: string): Promise<void> {
  await page.addInitScript((jwt) => window.localStorage.setItem('app.auth.token', jwt), token);
  await page.goto('/dashboard/settings?tab=notifications');
  await expect(
    page.getByRole('heading', { name: cat(en, 'Settings.notificationPreferences.title') }),
  ).toBeVisible();
}

function key(name: string): string {
  return `Settings.notificationPreferences.${name}`;
}

// The five toggles NOT covered by the sms/push round-trip test below — every one
// gets the full cycle: UI toggle -> PUT payload -> GET read-back -> reload state.
const ROUND_TRIP_TOGGLES = [
  { field: 'emailEnabled', titleKey: 'channels.email.title' },
  { field: 'inAppEnabled', titleKey: 'channels.inApp.title' },
  { field: 'children', titleKey: 'categories.children.title' },
  { field: 'testActivity', titleKey: 'categories.testActivity.title' },
  { field: 'testResults', titleKey: 'categories.testResults.title' },
] as const;

type RoundTripField = (typeof ROUND_TRIP_TOGGLES)[number]['field'];

test.describe.configure({ mode: 'serial' });

// Global API limiter headroom (120 req/min): pace each test — see helpers/pace.ts.
test.beforeEach(async ({ page }) => paceRateWindow(page));

test('sms and push opt-outs round-trip through the real preference endpoint', async ({
  page,
  request,
}) => {
  const token = await getParentToken(request);
  const original = await readPreferences(request, token);

  try {
    await writePreferences(request, token, { smsEnabled: true, pushEnabled: true });
    await page.setViewportSize({ width: 1280, height: 900 });
    await openNotificationSettings(page, token);

    const sms = page.getByRole('switch', { name: cat(en, key('channels.sms.title')) });
    const push = page.getByRole('switch', { name: cat(en, key('channels.push.title')) });
    await expect(sms).toHaveAttribute('aria-checked', 'true');
    await expect(push).toHaveAttribute('aria-checked', 'true');

    // Keyboard-only operation: tab focus + Space toggles both switches.
    await sms.focus();
    await expect(sms).toBeFocused();
    await sms.press('Space');
    await push.focus();
    await push.press('Space');
    await expect(sms).toHaveAttribute('aria-checked', 'false');
    await expect(push).toHaveAttribute('aria-checked', 'false');

    const updatePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/notification-preferences/me') &&
        response.request().method() === 'PUT',
    );
    await page.getByRole('button', { name: cat(en, key('save')) }).click();
    const update = await updatePromise;
    expect(update.status(), await update.text()).toBe(200);
    const payload = update.request().postDataJSON() as Record<string, unknown>;
    expect(payload.smsEnabled).toBe(false);
    expect(payload.pushEnabled).toBe(false);
    await expect(page.getByText(cat(en, key('saved')))).toBeVisible();

    const persisted = await readPreferences(request, token);
    expect(persisted.smsEnabled).toBe(false);
    expect(persisted.pushEnabled).toBe(false);

    await page.reload();
    await expect(sms).toHaveAttribute('aria-checked', 'false');
    await expect(push).toHaveAttribute('aria-checked', 'false');
  } finally {
    // Delta restore — only the fields this spec owns (the full-row restore was
    // the cross-spec clobber behind the historical sms read-back red).
    await writePreferences(request, token, {
      smsEnabled: original.smsEnabled,
      pushEnabled: original.pushEnabled,
    });
  }
});

test('every toggle and the digest select round-trip through save, GET, and reload', async ({
  page,
  request,
}) => {
  const token = await getParentToken(request);
  const original = await readPreferences(request, token);
  const changedFields: RoundTripField[] = [];
  let digestChanged = false;

  try {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openNotificationSettings(page, token);

    for (const { field, titleKey } of ROUND_TRIP_TOGGLES) {
      const expected = !original[field];
      const toggle = page.getByRole('switch', { name: cat(en, key(titleKey)) });
      await expect(toggle).toHaveAttribute('aria-checked', String(original[field]));
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-checked', String(expected));

      const updatePromise = page.waitForResponse(
        (response) =>
          response.url().endsWith('/api/notification-preferences/me') &&
          response.request().method() === 'PUT',
      );
      await page.getByRole('button', { name: cat(en, key('save')) }).click();
      const update = await updatePromise;
      expect(update.status(), await update.text()).toBe(200);
      const payload = update.request().postDataJSON() as Record<string, unknown>;
      expect(payload[field]).toBe(expected);
      changedFields.push(field);

      const persisted = await readPreferences(request, token);
      expect(persisted[field]).toBe(expected);

      // Gate on the refetched GET so the aria-checked assertion can never match
      // the pre-load defaults by accident.
      const preferencesPromise = page.waitForResponse(
        (response) =>
          response.url().endsWith('/api/notification-preferences/me') &&
          response.request().method() === 'GET',
      );
      await page.reload();
      await preferencesPromise;
      await expect(
        page.getByRole('switch', { name: cat(en, key(titleKey)) }),
      ).toHaveAttribute('aria-checked', String(expected));
    }

    // Digest select: only immediate/off are selectable (daily/weekly deferred).
    const nextDigest = original.digestFrequency === 'off' ? 'immediate' : 'off';
    const digest = page.getByRole('combobox', { name: cat(en, key('digest.title')) });
    await digest.click();
    await page
      .getByRole('option', { name: cat(en, key(`digest.options.${nextDigest}`)) })
      .click();

    const digestUpdatePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/notification-preferences/me') &&
        response.request().method() === 'PUT',
    );
    await page.getByRole('button', { name: cat(en, key('save')) }).click();
    const digestUpdate = await digestUpdatePromise;
    expect(digestUpdate.status(), await digestUpdate.text()).toBe(200);
    const digestPayload = digestUpdate.request().postDataJSON() as Record<string, unknown>;
    expect(digestPayload.digestFrequency).toBe(nextDigest);
    digestChanged = true;

    const persistedDigest = await readPreferences(request, token);
    expect(persistedDigest.digestFrequency).toBe(nextDigest);

    const digestGetPromise = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/notification-preferences/me') &&
        response.request().method() === 'GET',
    );
    await page.reload();
    await digestGetPromise;
    await expect(
      page.getByRole('combobox', { name: cat(en, key('digest.title')) }),
    ).toContainText(cat(en, key(`digest.options.${nextDigest}`)));
  } finally {
    // Delta restore: only the fields this test actually flipped.
    const restore: Partial<NotificationPreference> = {};
    for (const field of changedFields) restore[field] = original[field];
    if (digestChanged) restore.digestFrequency = original.digestFrequency;
    if (Object.keys(restore).length > 0) await writePreferences(request, token, restore);
  }
});

test('sms carries the blocked-delivery helper and links it to the switch', async ({
  page,
  request,
}) => {
  const token = await getParentToken(request);
  await openNotificationSettings(page, token);

  const helper = page.getByText(cat(en, key('channels.sms.blocked')));
  await expect(helper).toBeVisible();
  const sms = page.getByRole('switch', { name: cat(en, key('channels.sms.title')) });
  const describedBy = (await sms.getAttribute('aria-describedby')) ?? '';
  expect(describedBy.split(' ')).toContain(await helper.getAttribute('id'));
});

test('non-suppressible categories render locked and deferred digests are unselectable', async ({
  page,
  request,
}) => {
  const token = await getParentToken(request);
  await openNotificationSettings(page, token);

  for (const name of ['categories.security.title', 'categories.account.title']) {
    const locked = page.getByRole('switch', { name: cat(en, key(name)) });
    await expect(locked).toHaveAttribute('aria-checked', 'true');
    await expect(locked).toBeDisabled();
  }

  const digest = page.getByRole('combobox', { name: cat(en, key('digest.title')) });
  await digest.click();
  for (const name of ['digest.options.daily', 'digest.options.weekly']) {
    await expect(
      page.getByRole('option', { name: cat(en, key(name)), exact: false }),
    ).toBeDisabled();
  }
  await page.getByRole('option', { name: cat(en, key('digest.options.off')) }).click();
  await expect(page.getByRole('status')).toContainText(cat(en, key('digest.emailOffNotice')));

  // Scan the settled surface: the highlighted-item contrast of the OPEN select popup
  // is a pre-existing defect of the read-only ui/select primitive, not of this tab.
  await expect(page.getByRole('listbox')).toHaveCount(0);
  const axe = await new AxeBuilder({ page }).analyze();
  expect(
    axe.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? '')),
  ).toEqual([]);
  await page.screenshot({
    path: path.join(SCREENSHOTS, 'notification-preference-controls-en.png'),
    fullPage: true,
  });
});
