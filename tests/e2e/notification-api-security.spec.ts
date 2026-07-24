import { expect, test, type APIRequestContext, type APIResponse } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5510';
const PRIMARY_PARENT = { email: 'parent@schooltest.local', password: 'Parent1234!' };
const FOREIGN_PARENT = { email: 'parent-t06@schooltest.local', password: 'Parent1234!' };
const UNKNOWN_NOTIFICATION_ID = 'nonexistentdoc000000000';

interface LoginResponse {
  jwt: string;
}

interface NotificationListResponse {
  data: Array<{ documentId: string }>;
}

interface ErrorResponse {
  data: null;
  error: { status: number; name: string; message: string; details: Record<string, never> };
}

async function getToken(request: APIRequestContext, credentials: typeof PRIMARY_PARENT): Promise<string> {
  const response = await request.post(`${API_BASE_URL}/api/auth/local`, {
    data: { identifier: credentials.email, password: credentials.password },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return (await response.json() as LoginResponse).jwt;
}

async function expectError(response: APIResponse, status: number, name: string): Promise<ErrorResponse> {
  expect(response.status()).toBe(status);
  const body = await response.json() as ErrorResponse;
  expect(body.data).toBeNull();
  expect(body.error.status).toBe(status);
  expect(body.error.name).toBe(name);
  return body;
}

test('notification API enforces validation, authentication, and notification ownership', async ({ request }) => {
  await expectError(
    await request.get(`${API_BASE_URL}/api/notifications?page=1&pageSize=5`),
    403,
    'ForbiddenError',
  );
  await expectError(await request.post(`${API_BASE_URL}/api/notifications/read-all`), 403, 'ForbiddenError');

  const primaryToken = await getToken(request, PRIMARY_PARENT);
  const primaryHeaders = { Authorization: `Bearer ${primaryToken}` };
  await expectError(
    await request.get(`${API_BASE_URL}/api/notifications?read=maybe`, { headers: primaryHeaders }),
    400,
    'ValidationError',
  );
  await expectError(
    await request.get(`${API_BASE_URL}/api/notifications?category=bogus`, { headers: primaryHeaders }),
    400,
    'ValidationError',
  );
  await expectError(
    await request.put(`${API_BASE_URL}/api/notifications/${UNKNOWN_NOTIFICATION_ID}/read`, {
      headers: primaryHeaders,
    }),
    404,
    'NotFoundError',
  );

  const foreignToken = await getToken(request, FOREIGN_PARENT);
  const foreignList = await request.get(`${API_BASE_URL}/api/notifications?page=1&pageSize=1`, {
    headers: { Authorization: `Bearer ${foreignToken}` },
  });
  expect(foreignList.ok(), await foreignList.text()).toBeTruthy();
  const foreignNotification = (await foreignList.json() as NotificationListResponse).data.at(0);
  expect(foreignNotification).toBeDefined();
  const forbidden = await expectError(
    await request.put(`${API_BASE_URL}/api/notifications/${foreignNotification!.documentId}/read`, {
      headers: primaryHeaders,
    }),
    403,
    'ForbiddenError',
  );
  expect(forbidden.error.message).toBe('This notification does not belong to you');
});
