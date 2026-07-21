import path from 'node:path';

import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';
import { watchErrors } from './helpers/ui';

const en = loadMessages('en');
const API_BASE_URL = 'http://localhost:5500';
const PARENT = { email: 'parent@schooltest.local', password: 'Parent1234!' };
const SCREENSHOTS = path.resolve(process.cwd(), '.qa', 'screenshots');
const DESKTOP = { width: 1280, height: 800 };

interface ParentLoginResponse {
  jwt: string;
}

interface CreatedStudentResponse {
  data: { documentId: string };
}

interface NotificationRow {
  documentId: string;
  body: string | null;
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
  const body = (await response.json()) as ParentLoginResponse;
  expect(body.jwt).toMatch(/^eyJ/);
  return body.jwt;
}

async function createStudentNotification(
  request: APIRequestContext,
  token: string,
): Promise<{ documentId: string; name: string }> {
  const suffix = Date.now().toString();
  const name = `Notification ${suffix}`;
  const response = await request.post(`${API_BASE_URL}/api/students`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      data: {
        given_name: 'Notification',
        family_name: suffix,
        nationality: 'Australian',
        current_year_level: 'Year 7',
        year_level: 7,
        target_entry_year: '2027',
        target_entry_term: 'Term 1',
        parent_guardian_name: 'Notification Parent',
        parent_guardian_phone: '0400000000',
        preferred_contact_channel: 'email',
      },
    },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  const body = (await response.json()) as CreatedStudentResponse;
  return { documentId: body.data.documentId, name };
}

async function findStudentNotification(
  request: APIRequestContext,
  token: string,
  name: string,
): Promise<NotificationRow> {
  const response = await request.get(`${API_BASE_URL}/api/notifications?page=1&pageSize=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  const body = (await response.json()) as NotificationListResponse;
  const notification = body.data.find((row) => row.body?.includes(name));
  if (!notification) throw new Error(`Expected a persisted notification for ${name}.`);
  return notification;
}

async function loadParentDashboard(page: Page, token: string): Promise<void> {
  await page.addInitScript((jwt) => {
    window.localStorage.setItem('app.auth.token', jwt);
  }, token);
  await page.goto('/dashboard');
}

test('parent sees a real activity notification, marks it read, and persists the feed state', async ({
  page,
  request,
}) => {
  const errors = watchErrors(page);
  const token = await getParentToken(request);
  const createdStudent = await createStudentNotification(request, token);
  const notification = await findStudentNotification(request, token, createdStudent.name);

  await page.setViewportSize(DESKTOP);
  await loadParentDashboard(page, token);
  const bell = page.getByRole('button', { name: cat(en, 'Notifications.bellLabel') });
  await bell.click();

  const bellFeed = page.locator('[data-slot="notification-popover"]');
  const item = bellFeed.locator(`[data-notification-id="${notification.documentId}"]`);
  await expect(item).toHaveAttribute('data-read', 'false');
  await expect(item).toContainText(createdStudent.name);
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(SCREENSHOTS, 'notification-bell-en.png') });
  await item.getByRole('button', { name: cat(en, 'Notifications.markRead') }).click();
  await expect(item).toHaveAttribute('data-read', 'true');

  const notificationFeedNavigation = page.waitForURL(/\/dashboard\/notifications$/);
  await bellFeed.getByRole('link', { name: cat(en, 'Notifications.viewAll') }).click();
  await notificationFeedNavigation;
  await expect(page.getByRole('heading', { level: 1, name: cat(en, 'Notifications.title') })).toBeVisible();
  const feedItem = page.locator(`[data-notification-id="${notification.documentId}"]`);
  await expect(feedItem).toHaveAttribute('data-read', 'true');
  await page.reload();
  await expect(page.locator(`[data-notification-id="${notification.documentId}"]`)).toHaveAttribute(
    'data-read',
    'true',
  );

  const secondStudent = await createStudentNotification(request, token);
  const secondNotification = await findStudentNotification(request, token, secondStudent.name);
  await page.reload();
  await expect(
    page.locator(`[data-notification-id="${secondNotification.documentId}"]`),
  ).toHaveAttribute('data-read', 'false');

  const markAllResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url().endsWith('/api/notifications/read-all'),
  );
  await page.getByRole('button', { name: cat(en, 'Notifications.markAllRead') }).click();
  const markAllResponse = await markAllResponsePromise;
  expect(markAllResponse.ok(), await markAllResponse.text()).toBeTruthy();
  const markAllBody = (await markAllResponse.json()) as { data: { updated: number } };
  expect(markAllBody.data.updated).toBeGreaterThan(0);
  await page.reload();
  await expect(
    page.locator(`[data-notification-id="${secondNotification.documentId}"]`),
  ).toHaveAttribute('data-read', 'true');
  await page.screenshot({ path: path.join(SCREENSHOTS, 'notification-feed-en.png') });

  const results = await new AxeBuilder({ page }).analyze();
  const blockers = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(
    blockers.map(
      (violation) =>
        `${violation.impact}:${violation.id} → ${violation.nodes.map((node) => node.target).join(' | ')}`,
    ),
    '/dashboard/notifications en',
  ).toEqual([]);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('notification feed stays usable at a mobile viewport', async ({ page, request }) => {
  const errors = watchErrors(page);
  const token = await getParentToken(request);

  await page.addInitScript((jwt) => {
    window.localStorage.setItem('app.auth.token', jwt);
  }, token);
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/dashboard/notifications');

  await expect(page.locator('[data-surface="notification-feed"]')).toBeVisible();
  await expect(page.getByRole('button', { name: cat(en, 'Notifications.bellLabel') })).toBeVisible();
  expect(
    await page.locator('html').evaluate((element) => element.scrollWidth > element.clientWidth),
  ).toBe(false);
  await page.screenshot({ path: path.join(SCREENSHOTS, 'notification-feed-mobile-en.png') });
  expect(errors, errors.join('\n')).toEqual([]);
});
