import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';
import { API_BASE_URL } from './helpers/mailpit';
import { deleteStudents } from './helpers/student-cleanup';
import { watchErrors } from './helpers/ui';

// A notification is a permanent record; its target is deletable. This spec builds
// that state for real (create child → notification → delete child through the admin
// route) and proves the two halves of the fix: a dead target degrades to a calm
// not-found, while a genuine fault (5xx, transport, response-shape drift) is still
// reported as an error and still logged.
const en = loadMessages('en');
const PARENT = { email: 'parent@schooltest.local', password: 'Parent1234!' };
const SCREENSHOTS = path.resolve(process.cwd(), '.qa', 'screenshots');
const PROGRESS_ROUTE = '**/api/my/students/*/progress';

interface StudentRow {
  documentId: string;
}

interface NotificationRow {
  documentId: string;
  body: string | null;
  linkUrl: string | null;
}

async function parentToken(request: APIRequestContext): Promise<string> {
  const response = await request.post(`${API_BASE_URL}/api/auth/local`, {
    data: { identifier: PARENT.email, password: PARENT.password },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return ((await response.json()) as { jwt: string }).jwt;
}

async function signedInPage(page: Page, token: string): Promise<void> {
  await page.addInitScript((jwt) => {
    window.localStorage.setItem('app.auth.token', jwt);
  }, token);
}

async function createChild(
  request: APIRequestContext,
  token: string,
  created: string[],
): Promise<{ documentId: string; name: string }> {
  const suffix = Date.now().toString();
  const response = await request.post(`${API_BASE_URL}/api/students`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      data: {
        given_name: 'Deadlink',
        family_name: suffix,
        nationality: 'Australian',
        current_year_level: 'Year 7',
        year_level: 7,
        target_entry_year: '2027',
        target_entry_term: 'Term 1',
        parent_guardian_name: 'Deadlink Parent',
        parent_guardian_phone: '0400000000',
        preferred_contact_channel: 'email',
      },
    },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  const { data } = (await response.json()) as { data: StudentRow };
  created.push(data.documentId);
  return { documentId: data.documentId, name: `Deadlink ${suffix}` };
}

async function findNotification(
  request: APIRequestContext,
  token: string,
  name: string,
): Promise<NotificationRow> {
  const response = await request.get(`${API_BASE_URL}/api/notifications?page=1&pageSize=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  const { data } = (await response.json()) as { data: NotificationRow[] };
  const row = data.find((notification) => notification.body?.includes(name));
  if (!row) throw new Error(`Expected a persisted notification for ${name}.`);
  return row;
}

async function firstLiveChild(request: APIRequestContext, token: string): Promise<string> {
  const response = await request.get(`${API_BASE_URL}/api/my/students`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  const { data } = (await response.json()) as { data: StudentRow[] };
  expect(data.length).toBeGreaterThan(0);
  return data[0].documentId;
}

test('en: a notification whose child was deleted lands on a calm not-found, never an error', async ({
  page,
  request,
}) => {
  const created: string[] = [];
  try {
    const token = await parentToken(request);
    const child = await createChild(request, token, created);
    const notification = await findNotification(request, token, child.name);
    expect(notification.linkUrl).toBe(`/dashboard/children/${child.documentId}`);

    await deleteStudents(request, [child.documentId]);
    const gone = await request.get(`${API_BASE_URL}/api/my/students/${child.documentId}/progress`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(gone.status(), await gone.text()).toBe(404);

    const errors = watchErrors(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await signedInPage(page, token);
    await page.goto('/dashboard/notifications');

    const item = page.locator(`[data-notification-id="${notification.documentId}"]`);
    await expect(item).toBeVisible();
    await item.getByRole('link').first().click();
    await page.waitForURL(new RegExp(`/dashboard/children/${child.documentId}$`));

    const fallback = page.locator('[data-slot="query-error-fallback"]');
    await expect(fallback).toHaveAttribute('data-query-error', 'gone');
    await expect(
      page.getByText(cat(en, 'Children.profileGoneTitle'), { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(cat(en, 'Children.profileGoneDescription'), { exact: true }),
    ).toBeVisible();
    await expect(page.locator('[data-slot="alert"]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: cat(en, 'QueryError.retry') })).toHaveCount(0);
    await page.screenshot({ path: path.join(SCREENSHOTS, 'child-dead-link-gone-en.png') });

    await page.goto(`/dashboard/children/${child.documentId}/edit`);
    await expect(fallback).toHaveAttribute('data-query-error', 'gone');
    await expect(page.getByText(cat(en, 'Children.editGoneTitle'), { exact: true })).toBeVisible();

    await page.goBack();
    await page.getByRole('link', { name: cat(en, 'Children.backToList') }).click();
    await page.waitForURL(/\/dashboard\/children$/);
    await expect(page.locator('[data-surface="children-roster"]')).toBeVisible();

    expect(
      errors.filter((entry) => entry.includes('pageerror') || entry.includes('[query-error]')),
      errors.join('\n'),
    ).toEqual([]);
  } finally {
    await deleteStudents(request, created);
  }
});

test('en: a malformed notification link degrades to the same calm not-found', async ({
  page,
  request,
}) => {
  const token = await parentToken(request);
  await signedInPage(page, token);
  await page.goto('/dashboard/children/abc123');

  await expect(page.locator('[data-slot="query-error-fallback"]')).toHaveAttribute(
    'data-query-error',
    'gone',
  );
  await expect(page.getByRole('link', { name: cat(en, 'Children.backToList') })).toBeVisible();
});

const FAULTS = [
  {
    name: 'a 500 from the API',
    cause: 'http',
    titleKey: 'httpTitle',
    log: '[query-error] http 500',
  },
  {
    name: 'a network failure',
    cause: 'network',
    titleKey: 'networkTitle',
    log: '[query-error] network',
  },
  {
    name: 'a response-shape mismatch',
    cause: 'contract',
    titleKey: 'contractTitle',
    log: '[query-error] contract',
  },
] as const;

for (const fault of FAULTS) {
  test(`en: ${fault.name} still surfaces as an error, never as a removed child`, async ({
    page,
    request,
  }) => {
    const token = await parentToken(request);
    const documentId = await firstLiveChild(request, token);
    const errors = watchErrors(page);
    await signedInPage(page, token);
    await page.route(PROGRESS_ROUTE, async (route) => {
      if (fault.cause === 'network') return route.abort('failed');
      if (fault.cause === 'contract') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { unexpected: true } }),
        });
      }
      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: { status: 500, name: 'InternalServerError' } }),
      });
    });
    await page.goto(`/dashboard/children/${documentId}`);

    const fallback = page.locator('[data-slot="query-error-fallback"]');
    await expect(fallback).toHaveAttribute('data-query-error', 'broken');
    await expect(fallback).toHaveAttribute('data-query-error-cause', fault.cause);
    await expect(fallback.locator('[data-slot="alert"]')).toBeVisible();
    await expect(
      page.getByText(cat(en, `QueryError.${fault.titleKey}`), { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: cat(en, 'QueryError.retry') })).toBeVisible();
    await expect(page.getByText(cat(en, 'Children.profileGoneTitle'))).toHaveCount(0);
    await expect(page.getByText(cat(en, 'QueryError.goneTitle'))).toHaveCount(0);
    expect(
      errors.some((entry) => entry.includes(fault.log)),
      errors.join('\n'),
    ).toBeTruthy();
    await page.screenshot({
      path: path.join(SCREENSHOTS, `child-broken-${fault.cause}-en.png`),
    });
  });
}

test('en: every notification link shape in the feed reaches a usable page', async ({
  page,
  request,
}) => {
  const token = await parentToken(request);
  const documentId = await firstLiveChild(request, token);
  await signedInPage(page, token);
  const shapes = [
    '/dashboard',
    '/dashboard/settings',
    '/dashboard/children',
    `/dashboard/children/${documentId}`,
    '/dashboard/children/abc123',
  ];

  for (const shape of shapes) {
    const errors = watchErrors(page);
    await page.goto(shape);
    await expect(page.locator('main').first(), shape).toBeVisible();
    const text = (await page.locator('main').first().innerText()).trim();
    expect(text.length, `${shape} rendered nothing`).toBeGreaterThan(0);
    expect(
      errors.filter((entry) => entry.includes('pageerror')),
      `${shape}: ${errors.join('\n')}`,
    ).toEqual([]);
  }
});
