import path from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';

import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type APIRequestContext, type APIResponse } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';

const en = loadMessages('en');
const API_BASE_URL = 'http://localhost:5500';
const APP_ORIGIN = 'http://localhost:3100';
const PARENT = { email: 'parent@schooltest.local', password: 'Parent1234!' };
const FOREIGN_PARENT = { email: 'parent-t06@schooltest.local', password: 'Parent1234!' };
const SCREENSHOTS = path.resolve(process.cwd(), '.qa', 'screenshots');

interface LoginResponse {
  jwt: string;
}

interface PushConfigResponse {
  data: { publicKey: string | null };
}

interface PushSubscriptionResponse {
  data: { documentId: string; endpoint: string };
}

interface PushUnsubscribeResponse {
  data: { deleted: number };
}

interface ErrorResponse {
  data: null;
  error: { status: number; name: string; message: string; details: Record<string, never> };
}

async function getParentToken(
  request: APIRequestContext,
  credentials: typeof PARENT = PARENT,
): Promise<string> {
  const response = await request.post(`${API_BASE_URL}/api/auth/local`, {
    data: { identifier: credentials.email, password: credentials.password },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return ((await response.json()) as LoginResponse).jwt;
}

async function expectForbidden(response: APIResponse): Promise<void> {
  expect(response.status()).toBe(403);
  expect(await response.json()).toEqual({
    data: null,
    error: { status: 403, name: 'ForbiddenError', message: 'Forbidden', details: {} },
  } satisfies ErrorResponse);
}

function createSubscriptionRequest() {
  return {
    endpoint: `https://fcm.googleapis.com/fcm/send/${randomUUID()}`,
    keys: {
      p256dh: randomBytes(65).toString('base64url'),
      auth: randomBytes(16).toString('base64url'),
    },
    expirationTime: null,
  };
}

function deleteSubscription(
  request: APIRequestContext,
  headers: Record<string, string>,
  endpoint: string,
): Promise<APIResponse> {
  return request.delete(`${API_BASE_URL}/api/push-subscriptions`, { headers, data: { endpoint } });
}

test.describe.configure({ mode: 'serial' });

test('push configuration is parent-only and never exposes a private VAPID key', async ({
  request,
}) => {
  await expectForbidden(
    await request.get(`${API_BASE_URL}/api/push-subscriptions/vapid-public-key`),
  );

  const token = await getParentToken(request);
  const headers = { Authorization: `Bearer ${token}` };
  const config = await request.get(`${API_BASE_URL}/api/push-subscriptions/vapid-public-key`, {
    headers,
  });
  expect(config.status(), await config.text()).toBe(200);
  const data = (await config.json()) as PushConfigResponse;
  expect(Object.keys(data.data)).toEqual(['publicKey']);
  expect(data.data.publicKey).toBeTruthy();

  const worker = await request.get(`${APP_ORIGIN}/service-worker`);
  const workerSource = await worker.text();
  expect(worker.status(), workerSource).toBe(200);
  expect(worker.headers()['content-type']).toContain('application/javascript');
  expect(worker.headers()['service-worker-allowed']).toBe('/');
  expect(workerSource).toContain("addEventListener('push'");
  expect(workerSource).not.toContain('VAPID_PRIVATE_KEY');

  const malformed = await request.post(`${API_BASE_URL}/api/push-subscriptions`, {
    headers,
    data: { endpoint: 'missing-keys' },
  });
  expect(malformed.status()).toBe(400);
  expect(((await malformed.json()) as ErrorResponse).error.name).toBe('ValidationError');
});

test('parent push subscriptions persist, stay owner-scoped, and delete idempotently', async ({
  request,
}) => {
  const token = await getParentToken(request);
  const foreignToken = await getParentToken(request, FOREIGN_PARENT);
  const subscription = createSubscriptionRequest();
  const headers = { Authorization: `Bearer ${token}` };

  try {
    const created = await request.post(`${API_BASE_URL}/api/push-subscriptions`, {
      headers,
      data: subscription,
    });
    expect(created.status(), await created.text()).toBe(200);
    expect((await created.json()) as PushSubscriptionResponse).toMatchObject({
      data: { endpoint: subscription.endpoint },
    });

    const foreignDelete = await deleteSubscription(
      request,
      { Authorization: `Bearer ${foreignToken}` },
      subscription.endpoint,
    );
    expect(foreignDelete.status(), await foreignDelete.text()).toBe(200);
    expect((await foreignDelete.json()) as PushUnsubscribeResponse).toEqual({
      data: { deleted: 0 },
    });

    const removed = await deleteSubscription(request, headers, subscription.endpoint);
    expect(removed.status(), await removed.text()).toBe(200);
    expect((await removed.json()) as PushUnsubscribeResponse).toEqual({ data: { deleted: 1 } });
    const retry = await deleteSubscription(request, headers, subscription.endpoint);
    expect(retry.status(), await retry.text()).toBe(200);
    expect((await retry.json()) as PushUnsubscribeResponse).toEqual({ data: { deleted: 0 } });
  } finally {
    await deleteSubscription(request, headers, subscription.endpoint);
  }
});

test('browser push registers a same-origin worker and honors its real permission state', async ({
  context,
  page,
  request,
}) => {
  await context.grantPermissions(['notifications'], { origin: APP_ORIGIN });
  const token = await getParentToken(request);
  await page.addInitScript((jwt) => window.localStorage.setItem('app.auth.token', jwt), token);
  await page.goto('/dashboard/settings?tab=notifications');

  const enable = page.getByRole('button', {
    name: cat(en, 'Settings.notificationPreferences.push.enable'),
  });
  await expect(enable).toBeVisible();
  expect(
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration('/');
      return registration?.scope === `${window.location.origin}/`;
    }),
  ).toBe(true);
  const permission = await page.evaluate(() => Notification.permission);
  if (permission === 'granted') {
    const subscribePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/push-subscriptions') &&
        response.request().method() === 'POST',
    );
    await enable.click();
    expect((await subscribePromise).status()).toBe(200);
    await expect(
      page.getByRole('button', { name: cat(en, 'Settings.notificationPreferences.push.disable') }),
    ).toBeVisible();
  } else {
    expect(permission).toBe('denied');
    await expect(
      page.getByText(cat(en, 'Settings.notificationPreferences.push.status.permissionDenied')),
    ).toBeVisible();
    await expect(enable).toBeDisabled();
  }

  const axe = await new AxeBuilder({ page }).analyze();
  expect(
    axe.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? '')),
  ).toEqual([]);
  await page.screenshot({ path: path.join(SCREENSHOTS, 'push-subscription-en.png') });
  await page.setViewportSize({ width: 375, height: 800 });
  expect(
    await page.locator('html').evaluate((element) => element.scrollWidth > element.clientWidth),
  ).toBe(false);
  await page.screenshot({ path: path.join(SCREENSHOTS, 'push-subscription-mobile-en.png') });
});
