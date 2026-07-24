import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';
import { deleteStudents } from './helpers/student-cleanup';

const en = loadMessages('en');
const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5510';
const PARENT = { email: 'parent@schooltest.local', password: 'Parent1234!' };

interface LoginResponse {
  jwt: string;
}

async function getParentToken(request: APIRequestContext): Promise<string> {
  const response = await request.post(`${API_BASE_URL}/api/auth/local`, {
    data: { identifier: PARENT.email, password: PARENT.password },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return (await response.json() as LoginResponse).jwt;
}

// Returns the created documentId so the test can delete it again in a `finally`
// — this child hangs off the SEEDED parent, whose roster other specs assert on.
async function createUnreadNotification(
  request: APIRequestContext,
  token: string,
): Promise<string> {
  const suffix = Date.now().toString();
  const response = await request.post(`${API_BASE_URL}/api/students`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      data: {
        given_name: 'Notification failure',
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
  const body = (await response.json()) as { data: { documentId: string } };
  return body.data.documentId;
}

async function loadFeed(page: Page, token: string): Promise<void> {
  await page.addInitScript((jwt) => window.localStorage.setItem('app.auth.token', jwt), token);
  await page.goto('/dashboard/notifications');
}

test('notification mutations show a localized error when the real API refuses the request', async ({
  page,
  request,
}) => {
  const token = await getParentToken(request);
  const studentDocumentId = await createUnreadNotification(request, token);
  try {
    await loadFeed(page, token);

    const markAll = page.getByRole('button', { name: cat(en, 'Notifications.markAllRead') });
    await expect(markAll).toBeEnabled();
    await page.evaluate(() =>
      window.localStorage.setItem('app.auth.token', 'invalid-notification-token'),
    );
    const failedRequest = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().endsWith('/api/notifications/read-all') &&
        !response.ok(),
    );
    await markAll.click();
    expect((await failedRequest).status()).toBeGreaterThanOrEqual(400);
    await expect(page.getByText(cat(en, 'Notifications.actionError'))).toBeVisible();
  } finally {
    await deleteStudents(request, [studentDocumentId]);
  }
});
