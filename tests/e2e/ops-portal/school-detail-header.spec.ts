/**
 * OPS-10 — the real school-detail header across every portal lifecycle state.
 *
 * Fixtures are created through the real school API, then the page is exercised
 * through the real signed-in portal. The assertions cover the derived primary
 * action and the shared status action table; screenshots are retained in the
 * ops proof directory for each state.
 */
import { mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { cat, loadMessages } from '../helpers/i18n';
import { apiEnv } from '../helpers/auth-db';
import { HOOK_TIMEOUT_MS, TOTAL_BUDGET_MS } from '../helpers/api-named-retry';
import { loginAs } from '../helpers/roles';

const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:5500';
const CAPTURES = path.resolve(__dirname, '../../../../mvp/ops/proof/shots');
const en = loadMessages('en');
const statuses = ['active', 'trial', 'pending_setup', 'suspended', 'archived'] as const;
type PortalStatus = (typeof statuses)[number];

const expectedPrimary: Record<PortalStatus, string> = {
  active: 'Suspend school',
  trial: 'Activate school',
  pending_setup: 'Activate school',
  suspended: 'Reactivate school',
  archived: 'Restore school',
};

const expectedMenu: Record<PortalStatus, readonly string[]> = {
  active: ['Edit details', 'Invite admin', 'Suspend school', 'Archive school'],
  trial: ['Edit details', 'Invite admin', 'Activate school', 'Archive school'],
  pending_setup: ['Edit details', 'Invite admin', 'Activate school', 'Archive school'],
  suspended: ['Edit details', 'Invite admin', 'Reactivate school', 'Archive school'],
  archived: ['Edit details', 'Invite admin', 'Restore school'],
};

interface FixtureSchool {
  documentId: string;
  name: string;
}

let jwt = '';
const fixtures = new Map<PortalStatus, FixtureSchool>();

async function createFixture(
  request: APIRequestContext,
  status: PortalStatus,
): Promise<FixtureSchool> {
  if (!jwt) {
    const login = await request.post(`${API}/api/auth/local`, {
      data: {
        identifier: 'apiadmin@schooltest.local',
        password: apiEnv('SEED_APIADMIN_PASSWORD'),
      },
    });
    expect(login.ok()).toBeTruthy();
    jwt = ((await login.json()) as { jwt: string }).jwt;
  }
  const name = `OPS10 ${status} ${Date.now().toString(36)}`;
  // The create contract only accepts portal.status pending_setup|trial|active
  // (a suspended/archived school must move through the lifecycle services), so
  // those two are CREATED active and then moved with the lifecycle endpoints.
  const createStatus = status === 'suspended' || status === 'archived' ? 'active' : status;
  const response = await request.post(`${API}/api/schools`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      'X-Ops-Portal-Version': '1',
      'Idempotency-Key': randomUUID(),
    },
    data: {
      name,
      contact_email: `${status}.${Date.now()}@fixture.schooltest.local`,
      contact_name: `${name} Contact`,
      suburb: 'Probeville',
      state: 'NSW',
      sector: 'government',
      portal: { plan: 'standard', status: createStatus, send_owner_invitation: false },
    },
  });
  expect([200, 201]).toContain(response.status());
  const body = (await response.json()) as { data: { documentId: string } };
  const documentId = body.data.documentId;

  if (status === 'suspended' || status === 'archived') {
    const detail = await request.get(`${API}/api/ops/schools/${documentId}`, {
      headers: { Authorization: `Bearer ${jwt}`, 'X-Ops-Portal-Version': '1' },
    });
    expect(detail.ok()).toBeTruthy();
    const { updatedAt } = ((await detail.json()) as { data: { updatedAt: string } }).data;
    const lifecyclePath = status === 'suspended' ? 'suspend' : 'archive';
    // Suspend reads the version from If-Match; archive wants it in the body as
    // `expected_updated_at` (use-school-suspend.mutation.ts archiveSchool).
    const moved = await request.post(`${API}/api/ops/schools/${documentId}/${lifecyclePath}`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
        'X-Ops-Portal-Version': '1',
        ...(status === 'suspended' ? { 'If-Match': `"${updatedAt}"` } : {}),
      },
      data: status === 'suspended' ? {} : { expected_updated_at: updatedAt },
    });
    expect(
      [200, 201],
      `${status} lifecycle move: ${moved.status()} ${await moved.text()}`,
    ).toContain(moved.status());
  }
  return { documentId, name };
}

async function loginAsSupport(page: Page): Promise<void> {
  const email = process.env.E2E_OPS_SUPPORT_EMAIL;
  const password = process.env.E2E_OPS_SUPPORT_PASSWORD;
  if (!email || !password)
    throw new Error('ops/10 support proof needs E2E_OPS_SUPPORT_EMAIL/PASSWORD');
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true }).fill(email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(password);
  await page.getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true }).click();
  await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 20_000 });
}

test.describe.configure({ mode: 'serial', timeout: HOOK_TIMEOUT_MS });

test.beforeAll(async ({ request }, testInfo) => {
  testInfo.setTimeout(HOOK_TIMEOUT_MS);
  if (testInfo.timeout < TOTAL_BUDGET_MS) {
    throw new Error(`HOOK TIMEOUT TOO SMALL: ${testInfo.timeout}ms`);
  }
  await mkdir(CAPTURES, { recursive: true });
  for (const status of statuses) fixtures.set(status, await createFixture(request, status));
});

test.afterAll(async ({ request }) => {
  for (const fixture of [...fixtures.values()].reverse()) {
    await request.delete(`${API}/api/ops/schools/${fixture.documentId}`, {
      headers: { Authorization: `Bearer ${jwt}`, 'X-Ops-Portal-Version': '1' },
    });
  }
});

for (const status of statuses) {
  test(`renders the ${status} header contract`, async ({ page }, testInfo) => {
    const fixture = fixtures.get(status);
    if (!fixture) throw new Error(`missing ${status} fixture`);
    await loginAs(page, 'opsApi');
    await page.goto(`/en/dashboard/ops/schools/${fixture.documentId}`);

    const header = page.locator('[data-slot="ops-school-detail"]');
    await expect(header.getByRole('heading', { level: 1 })).toHaveText(fixture.name);
    await expect(header.locator('[data-slot="media-cover"]')).toHaveAttribute('data-empty', '');
    await expect(header.locator('[data-portal-status="' + status + '"]')).toBeVisible();
    await expect(
      header.locator(
        `[data-action="primary-${status === 'active' ? 'suspend' : status === 'suspended' ? 'reactivate' : status === 'archived' ? 'restore' : 'activate'}"]`,
      ),
    ).toHaveText(expectedPrimary[status]);

    await header.getByRole('button', { name: /more actions/i }).click();
    const menu = page.locator('[data-slot="dropdown-menu-content"]');
    for (const label of expectedMenu[status])
      await expect(menu.getByText(label, { exact: true })).toBeVisible();
    await expect(menu.getByText('Open school', { exact: true })).toHaveCount(0);

    const shot = await page.screenshot({
      path: path.join(CAPTURES, `10-header-${status}.png`),
      fullPage: false,
    });
    await testInfo.attach(`10-header-${status}.png`, { body: shot, contentType: 'image/png' });
  });
}

test('support sees the lifecycle entry greyed and gets a refusal before any request', async ({
  page,
}, testInfo) => {
  const fixture = fixtures.get('active');
  if (!fixture) throw new Error('missing active fixture');
  const lifecycleRequests: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/api/ops/schools/'))
      lifecycleRequests.push(request.url());
  });
  await loginAsSupport(page);
  await page.goto(`/en/dashboard/ops/schools/${fixture.documentId}`);
  const primary = page.locator('[data-action="primary-suspend"]');
  await expect(primary).toBeDisabled();
  await primary.locator('..').click();
  await expect(page.getByText(/support accounts are read-only/i)).toBeVisible();
  expect(lifecycleRequests).toEqual([]);
  const shot = await page.screenshot({
    path: path.join(CAPTURES, '10-header-readonly.png'),
    fullPage: false,
  });
  await testInfo.attach('10-header-readonly.png', { body: shot, contentType: 'image/png' });
});
