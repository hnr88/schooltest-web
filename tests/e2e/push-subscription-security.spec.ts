import { randomBytes, randomUUID } from 'node:crypto';

import { expect, test, type APIRequestContext } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';

const API_BASE_URL = 'http://localhost:5500';
const APP_ORIGIN = 'http://localhost:3100';
const OWNER = { email: 'parent@schooltest.local', password: 'Parent1234!' };
const FOREIGN_PARENT = { email: 'parent-t06@schooltest.local', password: 'Parent1234!' };
const en = loadMessages('en');

interface LoginResponse {
  jwt: string;
}

interface PushDeleteResponse {
  data: { deleted: number };
}

interface ErrorResponse {
  data: null;
  error: { status: number; name: string; message: string; details: Record<string, never> };
}

async function getParentToken(
  request: APIRequestContext,
  credentials: typeof OWNER,
): Promise<string> {
  const response = await request.post(`${API_BASE_URL}/api/auth/local`, {
    data: { identifier: credentials.email, password: credentials.password },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return ((await response.json()) as LoginResponse).jwt;
}

function createSubscription() {
  return {
    endpoint: `https://fcm.googleapis.com/fcm/send/${randomUUID()}`,
    keys: {
      p256dh: randomBytes(65).toString('base64url'),
      auth: randomBytes(16).toString('base64url'),
    },
    expirationTime: null,
  };
}

test("a parent cannot claim another parent's existing browser endpoint", async ({ request }) => {
  const [ownerToken, foreignToken] = await Promise.all([
    getParentToken(request, OWNER),
    getParentToken(request, FOREIGN_PARENT),
  ]);
  const subscription = createSubscription();
  const ownerHeaders = { Authorization: `Bearer ${ownerToken}` };

  try {
    const created = await request.post(`${API_BASE_URL}/api/push-subscriptions`, {
      headers: ownerHeaders,
      data: subscription,
    });
    expect(created.status(), await created.text()).toBe(200);

    const foreignClaim = await request.post(`${API_BASE_URL}/api/push-subscriptions`, {
      headers: { Authorization: `Bearer ${foreignToken}` },
      data: subscription,
    });
    expect(foreignClaim.status(), await foreignClaim.text()).toBe(403);
    expect(await foreignClaim.json()).toEqual({
      data: null,
      error: { status: 403, name: 'ForbiddenError', message: 'Forbidden', details: {} },
    } satisfies ErrorResponse);

    const ownerDelete = await request.delete(`${API_BASE_URL}/api/push-subscriptions`, {
      headers: ownerHeaders,
      data: { endpoint: subscription.endpoint },
    });
    expect(ownerDelete.status(), await ownerDelete.text()).toBe(200);
    expect((await ownerDelete.json()) as PushDeleteResponse).toEqual({ data: { deleted: 1 } });
  } finally {
    await request.delete(`${API_BASE_URL}/api/push-subscriptions`, {
      headers: ownerHeaders,
      data: { endpoint: subscription.endpoint },
    });
  }
});

test('a failed VAPID configuration request leaves no enabled no-op control', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('app.auth.token', 'invalid-token'));
  await page.goto(`${APP_ORIGIN}/dashboard/settings?tab=notifications`);

  await expect(
    page.getByText(cat(en, 'Settings.notificationPreferences.push.status.error')),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: cat(en, 'Settings.notificationPreferences.push.enable') }),
  ).toBeDisabled();
});
