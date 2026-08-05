import { expect, test } from '@playwright/test';
import type { APIRequestContext, Page } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';
import { paceRateWindow } from './helpers/pace';
import {
  CATEGORY_EVENTS,
  cleanupSeededNotifications,
  dispatchNotifications,
} from './helpers/notification-dispatch';
import type { DispatchedNotification } from './helpers/notification-dispatch';

const en = loadMessages('en');
const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5500';
const PARENT = { email: 'parent@schooltest.local', password: 'Parent1234!' };

// Two console boots per phase (seed, suppression dispatch, cleanup) — each boot
// is a full Strapi startup, so this file needs a much larger budget than a
// browser-only spec.
test.setTimeout(300_000);

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

interface NotificationRow {
  documentId: string;
  title: string;
  category: string;
  readAt: string | null;
}

interface NotificationListResponse {
  data: NotificationRow[];
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
  return ((await response.json()) as { data: NotificationPreference }).data;
}

async function writePreferences(
  request: APIRequestContext,
  token: string,
  values: Partial<NotificationPreference>,
): Promise<void> {
  const response = await request.put(`${API_BASE_URL}/api/notification-preferences/me`, {
    headers: { Authorization: `Bearer ${token}` },
    data: values,
  });
  expect(response.ok(), await response.text()).toBeTruthy();
}

async function unreadCount(request: APIRequestContext, token: string): Promise<number> {
  const response = await request.get(`${API_BASE_URL}/api/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return ((await response.json()) as { data: { count: number } }).data.count;
}

/** Finds a seeded row by its exact tag-prefixed title (list is createdAt:desc, seeds are newest). */
async function findSeededRow(
  request: APIRequestContext,
  token: string,
  title: string,
): Promise<NotificationRow> {
  const response = await request.get(`${API_BASE_URL}/api/notifications?page=1&pageSize=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  const body = (await response.json()) as NotificationListResponse;
  const row = body.data.find((candidate) => candidate.title === title);
  if (!row) throw new Error(`Seeded notification not found in feed: ${title}`);
  return row;
}

async function openAs(page: Page, token: string, url: string): Promise<void> {
  await page.addInitScript((jwt) => window.localStorage.setItem('app.auth.token', jwt), token);
  await page.goto(url);
}

function prefKey(name: string): string {
  return `Settings.notificationPreferences.${name}`;
}

test.describe.configure({ mode: 'serial' });

// Global API limiter headroom (120 req/min): pace each test — see helpers/pace.ts.
test.beforeEach(async ({ page }) => paceRateWindow(page));

let token: string;
let tag: string;
let preferenceSnapshot: NotificationPreference;
let seeded: DispatchedNotification[];

test.beforeAll(async ({ request }) => {
  token = await getParentToken(request);
  preferenceSnapshot = await readPreferences(request, token);
  // Every preference ON so the seeded rows are never dispatch-muted.
  await writePreferences(request, token, {
    emailEnabled: true,
    smsEnabled: true,
    inAppEnabled: true,
    pushEnabled: true,
    children: true,
    testActivity: true,
    testResults: true,
  });
  // Zero the bell so the seeded five are the only unread rows. read-all is a
  // bounded batch (≤100 rows/call) and the seed history is large — loop it.
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const markAll = await request.post(`${API_BASE_URL}/api/notifications/read-all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(markAll.ok(), await markAll.text()).toBeTruthy();
    if ((await unreadCount(request, token)) === 0) break;
  }
  expect(await unreadCount(request, token)).toBe(0);

  tag = `E2E-D13-${Date.now()}`;
  seeded = await dispatchNotifications(tag, CATEGORY_EVENTS);
  expect(seeded).toHaveLength(5);
});

test.afterAll(async ({ request }) => {
  await cleanupSeededNotifications(tag);
  // Delta restore: only the fields beforeAll forced on.
  await writePreferences(request, token, {
    emailEnabled: preferenceSnapshot.emailEnabled,
    smsEnabled: preferenceSnapshot.smsEnabled,
    inAppEnabled: preferenceSnapshot.inAppEnabled,
    pushEnabled: preferenceSnapshot.pushEnabled,
    children: preferenceSnapshot.children,
    testActivity: preferenceSnapshot.testActivity,
    testResults: preferenceSnapshot.testResults,
  });
});

test('feed lists every seeded category, filter pills isolate, link navigates, mark-all zeroes the bell', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openAs(page, token, '/dashboard/notifications');
  await expect(
    page.getByRole('heading', { level: 1, name: cat(en, 'Notifications.title') }),
  ).toBeVisible();

  // Every category's seeded row renders as a normal unread row.
  for (const notification of seeded) {
    const row = page.locator(`[data-notification-id="${notification.documentId}"]`);
    await expect(row).toHaveAttribute('data-read', 'false');
    await expect(row).toContainText(notification.title);
  }

  // The bell badge shows exactly the five seeded unread rows (beforeAll zeroed it).
  const badge = page.locator('[data-slot="notification-bell"] [data-slot="count-badge"]');
  await expect(badge).toHaveText('5');

  // Each category pill shows ONLY its own category's rows.
  const filterGroup = page.locator('[data-slot="notification-category-filter"]');
  for (const notification of seeded) {
    await filterGroup
      .getByRole('button', { name: cat(en, `Notifications.categories.${notification.category}`) })
      .click();
    await expect(page.locator(`[data-notification-id="${notification.documentId}"]`)).toBeVisible();
    for (const other of seeded) {
      if (other.documentId === notification.documentId) continue;
      await expect(page.locator(`[data-notification-id="${other.documentId}"]`)).toHaveCount(0);
    }
  }
  await filterGroup.getByRole('button', { name: cat(en, 'Notifications.filters.all') }).click();

  // A notification title link navigates to its linkUrl.
  const linked = seeded[0];
  await page
    .locator(`[data-notification-id="${linked.documentId}"]`)
    .getByRole('link', { name: linked.title })
    .click();
  await page.waitForURL(/\/dashboard$/);

  // Mark-all-read zeroes the unread bell (badge before: 5, after: gone).
  await page.goto('/dashboard/notifications');
  const markAllPromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' && response.url().endsWith('/api/notifications/read-all'),
  );
  await page.getByRole('button', { name: cat(en, 'Notifications.markAllRead') }).click();
  const markAll = await markAllPromise;
  expect(markAll.ok(), await markAll.text()).toBeTruthy();
  await expect(badge).toHaveCount(0);
});

test('preference toggles suppress per the real dispatch semantics', async ({ page, request }) => {
  const original = await readPreferences(request, token);
  const suppressionTag = `${tag}-suppression`;
  try {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openAs(page, token, '/dashboard/settings?tab=notifications');
    await expect(
      page.getByRole('heading', { name: cat(en, prefKey('title')) }),
    ).toBeVisible();

    // Turn the children CATEGORY toggle OFF through the real settings UI.
    const children = page.getByRole('switch', {
      name: cat(en, prefKey('categories.children.title')),
    });
    await expect(children).toHaveAttribute('aria-checked', 'true');
    await children.click();
    const childrenSave = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/notification-preferences/me') &&
        response.request().method() === 'PUT',
    );
    await page.getByRole('button', { name: cat(en, prefKey('save')) }).click();
    const childrenUpdate = await childrenSave;
    expect(childrenUpdate.status(), await childrenUpdate.text()).toBe(200);
    expect(
      (childrenUpdate.request().postDataJSON() as Record<string, unknown>).children,
    ).toBe(false);

    // REAL semantics (dispatch.ts:127): a category toggle gates the email/push/sms
    // CHANNELS only — the in-app row is still written as a normal unread row.
    const [childrenRow] = await dispatchNotifications(suppressionTag, [
      { eventType: 'student_created', category: 'children' },
    ]);
    const childrenPersisted = await findSeededRow(request, token, childrenRow.title);
    expect(childrenPersisted.readAt).toBeNull();
    await page.goto('/dashboard/notifications');
    await expect(
      page.locator(`[data-notification-id="${childrenRow.documentId}"]`),
    ).toHaveAttribute('data-read', 'false');

    // Turn the in-app CHANNEL toggle OFF through the real settings UI.
    await openAs(page, token, '/dashboard/settings?tab=notifications');
    const inApp = page.getByRole('switch', {
      name: cat(en, prefKey('channels.inApp.title')),
    });
    await inApp.click();
    const inAppSave = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/notification-preferences/me') &&
        response.request().method() === 'PUT',
    );
    await page.getByRole('button', { name: cat(en, prefKey('save')) }).click();
    const inAppUpdate = await inAppSave;
    expect(inAppUpdate.status(), await inAppUpdate.text()).toBe(200);
    expect(
      (inAppUpdate.request().postDataJSON() as Record<string, unknown>).inAppEnabled,
    ).toBe(false);

    // REAL semantics: with in-app off, a suppressible category's row is written
    // MUTED (readAt=createdAt — the audit record survives, never counts as
    // unread), while non-suppressible security/account bypass the mute.
    const [mutedRow, securityRow] = await dispatchNotifications(suppressionTag, [
      { eventType: 'test_results_ready', category: 'testResults' },
      { eventType: 'security_password_changed', category: 'security' },
    ]);
    const mutedPersisted = await findSeededRow(request, token, mutedRow.title);
    expect(mutedPersisted.readAt).not.toBeNull();
    const securityPersisted = await findSeededRow(request, token, securityRow.title);
    expect(securityPersisted.readAt).toBeNull();

    // The feed reflects both: muted row read, security row still unread; the
    // unread count is exactly the two genuinely-unread rows (children + security).
    await page.goto('/dashboard/notifications');
    await expect(
      page.locator(`[data-notification-id="${mutedRow.documentId}"]`),
    ).toHaveAttribute('data-read', 'true');
    await expect(
      page.locator(`[data-notification-id="${securityRow.documentId}"]`),
    ).toHaveAttribute('data-read', 'false');
    expect(await unreadCount(request, token)).toBe(2);
  } finally {
    // Delta restore of the two toggles this test flipped.
    await writePreferences(request, token, {
      children: original.children,
      inAppEnabled: original.inAppEnabled,
    });
  }
});
