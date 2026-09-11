/**
 * E2E PROOF SPEC — Admins tab + INVITES on the ops school detail page, one
 * item at a time with screenshots into tests/proofs/admins/ and live API
 * cross-checks (GET /api/ops/users, /api/ops/invitations, /api/ops/schools/:id)
 * against the running Strapi on :5500. The dialogs under test are the newly
 * rebuilt OpsDialog* modal kit (src/modules/design-system/components/ops-modal.tsx)
 * — console errors and pageerrors are collected on every step.
 *
 * Fixtures: a throwaway school plus TWO throwaway school_admin accounts (A the
 * original owner, B the transfer/block target), all created through the real
 * ops writes and removed in afterAll. No seeded data is touched.
 */
import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type APIRequestContext, type Page, type Request } from '@playwright/test';

import { roleCredentials } from '../../helpers/credentials';
import { loginAs } from '../../helpers/roles';
import {
  OpsFixtureLedger,
  createOpsFixtureSchool,
  fixtureHeaders,
} from '../../helpers/ops-portal';
import { loginCached } from '../../helpers/http';

const API = process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:5500';
const WEB = process.env.E2E_BASE_URL ?? 'http://localhost:3002';
const SHOTS = path.resolve(process.cwd(), 'tests/proofs/admins');
const ACT = 30_000;
mkdirSync(SHOTS, { recursive: true });

const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, name), fullPage: true });

/** A throwaway school_admin: register, promote, attach to the school. */
async function createOpsFixtureAdmin(
  request: APIRequestContext,
  ledger: OpsFixtureLedger,
  schoolDocumentId: string,
  label: string,
): Promise<{ documentId: string; email: string }> {
  const email = `probe-admin-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}@fixture.schooltest.local`;
  const register = await request.post(`${API}/api/auth/local/register`, {
    data: { username: email, email, password: 'Fixture!Passw0rd' },
  });
  if (!register.ok()) {
    throw new Error(`register ${label} -> HTTP ${register.status()}: ${await register.text()}`);
  }
  const userId = ((await register.json()) as { user: { documentId: string } }).user.documentId;
  const headers = fixtureHeaders(
    'ops',
    await loginCached(request, API, roleCredentials('opsApi')),
  );
  const role = await request.post(`${API}/api/ops/users/${userId}/role`, {
    headers,
    data: { role: 'school_admin' },
  });
  if (!role.ok()) throw new Error(`role ${label} -> HTTP ${role.status()}: ${await role.text()}`);
  const school = await request.post(`${API}/api/ops/users/${userId}/school`, {
    headers,
    data: { schoolDocumentId },
  });
  if (!school.ok()) throw new Error(`school ${label} -> HTTP ${school.status()}: ${await school.text()}`);
  ledger.track('user', userId);
  return { documentId: userId, email };
}

test.describe.configure({ mode: 'serial', timeout: 300_000 });

let page: Page;
let jwt = '';
let schoolId = '';
let adminA = { documentId: '', email: '' };
let adminB = { documentId: '', email: '' };
const ledger = new OpsFixtureLedger();
const pageErrors: string[] = [];

/** Authenticated ops GET returning the parsed envelope. */
async function opsGet<T = unknown>(urlPath: string): Promise<T> {
  const res = await page.request.get(`${API}${urlPath}`, {
    headers: { Authorization: `Bearer ${jwt}`, 'X-Ops-Portal-Version': '1' },
  });
  expect(res.ok(), `GET ${urlPath} -> ${res.status()}: ${await res.text()}`).toBe(true);
  return (await res.json()) as T;
}

interface ApiUserRow {
  documentId: string;
  email?: string | null;
  display_name?: string | null;
  blocked?: boolean;
}
interface ApiInvitation {
  documentId: string;
  email?: string | null;
  status?: string | null;
  [key: string]: unknown;
}

async function apiAdmins(): Promise<ApiUserRow[]> {
  const body = await opsGet<{ data: ApiUserRow[] }>(
    `/api/ops/users?school=${schoolId}&role=school_admin`,
  );
  return body.data;
}

async function apiInvitations(): Promise<ApiInvitation[]> {
  const body = await opsGet<{ data: ApiInvitation[] }>(`/api/ops/invitations?school=${schoolId}`);
  return body.data;
}

async function apiOwner(): Promise<string | null> {
  const body = await opsGet<{ data: { owner_documentId?: string | null } }>(
    `/api/ops/schools/${schoolId}`,
  );
  return body.data.owner_documentId ?? null;
}

const rowOf = (documentId: string) => page.locator(`[data-row-id="user:${documentId}"]`);

test.beforeAll(async ({ browser, request }) => {
  test.setTimeout(240_000);
  const ops = roleCredentials('ops');
  const res = await request.post(`${API}/api/auth/local`, {
    data: { identifier: ops.email, password: ops.password },
  });
  if (!res.ok()) {
    throw new Error(`ops API login -> ${res.status()}: ${(await res.text()).slice(0, 300)}`);
  }
  jwt = ((await res.json()) as { jwt: string }).jwt;

  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  page = await context.newPage();
  page.on('pageerror', (error) => pageErrors.push(`pageerror: ${String(error)}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') pageErrors.push(`console.error: ${msg.text()}`);
  });
  await loginAs(page, 'ops');

  const school = await createOpsFixtureSchool(request, ledger, 'proof-admins');
  schoolId = school.documentId;
  adminA = await createOpsFixtureAdmin(request, ledger, schoolId, 'proof-admin-a');
  adminB = await createOpsFixtureAdmin(request, ledger, schoolId, 'proof-admin-b');
});

test.afterAll(async ({ request }) => {
  await ledger.cleanup(request);
  if (pageErrors.length > 0) {
    writeFileSync(path.join(SHOTS, 'console-errors.txt'), pageErrors.join('\n'));
  }
});

async function openAdminsTab(): Promise<void> {
  await page.goto(`${WEB}/dashboard/ops/schools/${schoolId}?tab=admins`);
  await expect(page.getByRole('tab', { name: 'Admins', exact: true })).toBeVisible({ timeout: ACT });
  await expect(rowOf(adminA.documentId).first()).toBeVisible({ timeout: ACT });
}

/** Open the row's ⋯ menu and click one item. */
async function rowAction(documentId: string, item: string): Promise<void> {
  await rowOf(documentId).first().getByRole('button', { name: 'Row actions' }).click({ timeout: ACT });
  await page.getByRole('menuitem', { name: item, exact: true }).click({ timeout: ACT });
}

/** Chip arm of the Admins directory's Status filter. */
async function chooseStatusChip(label: string): Promise<void> {
  await page
    .getByRole('group', { name: 'Status' })
    .getByRole('button', { name: label, exact: true })
    .click({ timeout: ACT });
}

/** Item 1 — the admins list loads from the scoped endpoint and matches the API. */
test('item 1: admins list loads from GET /api/ops/users?school=&role=school_admin', async () => {
  const requests: Request[] = [];
  const record = (request: Request) => {
    if (request.method() === 'GET' && request.url().includes('/api/ops/users')) requests.push(request);
  };
  page.on('request', record);
  await openAdminsTab();
  page.off('request', record);

  const urls = requests.map((r) => r.url());
  const scoped = urls.filter((url) => url.includes(`school=${schoolId}`) && url.includes('role=school_admin'));
  console.log('[proof item1] scoped requests:', JSON.stringify(scoped, null, 1));
  expect(scoped.length, 'the tab read GET /api/ops/users?school=&role=school_admin').toBeGreaterThan(0);
  for (const request of requests) {
    expect(await request.headerValue('x-ops-portal-version')).toBe('1');
  }

  // Cross-check every visible row against the live API read.
  const api = await apiAdmins();
  console.log('[proof item1] API GET /api/ops/users ->', JSON.stringify(api.map((r) => ({ documentId: r.documentId, email: r.email, blocked: r.blocked ?? false })), null, 1));
  expect(api.some((row) => row.documentId === adminA.documentId)).toBe(true);
  expect(api.some((row) => row.documentId === adminB.documentId)).toBe(true);
  for (const row of api) {
    await expect(rowOf(row.documentId).first()).toContainText(row.email ?? '', { timeout: 5_000 });
  }
  await shot(page, '01-admins-list.png');
});

/** Item 2 — the invite modal (OpsDialog kit) and the throwaway probe invitation. */
test('item 2: INVITE via the ops modal, proven in the tab and over the API', async () => {
  const probeEmail = `probe+${Date.now()}@schooltest.local`;
  await openAdminsTab();
  await page.getByTestId('ops-admins-invite').click({ timeout: ACT });

  const modal = page.locator('[data-slot="ops-staff-invitations-dialog"]');
  await expect(modal).toBeVisible({ timeout: ACT });
  await shot(page, '02-invite-modal.png');

  await page.locator('#ops-invite-name').fill('Probe Admin');
  await page.locator('#ops-invite-email').fill(probeEmail);
  await page.locator('#ops-invite-role').click({ timeout: ACT });
  await page.getByRole('option', { name: 'School administrator' }).click({ timeout: ACT });
  await page.locator('#ops-invite-message').fill('Proof invite — please ignore.');
  await page.getByRole('button', { name: 'Send invitation' }).click({ timeout: ACT });
  // Either outcome alert ("Invitation sent" / "Invitation created, but not
  // sent" when the dev mail provider refuses) proves the POST round-tripped;
  // the API read below is the authoritative proof.
  await expect(modal.getByRole('alert').filter({ hasText: /Invitation/ }).first()).toBeVisible({
    timeout: ACT,
  });
  await shot(page, '03-invite-modal-sent.png');
  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden({ timeout: ACT });

  // (a) the pending invitation row inside the Admins tab (Invited chip arm).
  await chooseStatusChip('Invited');
  const inviteRow = page.locator(`[data-row-id^="invitation:"]`, { hasText: probeEmail }).first();
  await expect(inviteRow).toBeVisible({ timeout: ACT });
  await expect(inviteRow.getByText('Invited', { exact: true })).toBeVisible();
  await shot(page, '04-pending-invitation-row-in-tab.png');

  // (b) the API read.
  const invitations = await apiInvitations();
  const probe = invitations.find((row) => row.email === probeEmail);
  console.log('[proof item2] API GET /api/ops/invitations ->', JSON.stringify(invitations, null, 1));
  test.info().annotations.push({ type: 'proof', description: `invitation JSON: ${JSON.stringify(probe)}` });
  expect(probe?.status).toBe('invited');
  await chooseStatusChip('All statuses');
});

/** Item 3 — RESEND (timestamp moves) and REVOKE (row leaves pending, API confirms). */
test('item 3: RESEND then REVOKE the probe invitation', async ({ request }) => {
  const probe = (await apiInvitations()).find((row) => (row.email ?? '').startsWith('probe+'));
  expect(probe).toBeDefined();
  const documentId = probe!.documentId;
  const before = JSON.stringify(probe);
  console.log('[proof item3] invitation before resend:', before);

  await openAdminsTab();
  await page.getByTestId('ops-admins-invite').click({ timeout: ACT });
  const modal = page.locator('[data-slot="ops-staff-invitations-dialog"]');
  await expect(modal).toBeVisible({ timeout: ACT });
  const modalRow = modal.locator(`[data-row-id="invitation:${documentId}"]`);
  await expect(modalRow).toBeVisible({ timeout: ACT });

  await modalRow.getByRole('button', { name: 'Resend' }).click({ timeout: ACT });
  await expect(modalRow.getByRole('button', { name: 'Resend' })).toBeEnabled({ timeout: ACT });
  await shot(page, '05-resend.png');

  const afterResend = (await apiInvitations()).find((row) => row.documentId === documentId)!;
  console.log('[proof item3] invitation after resend:', JSON.stringify(afterResend, null, 1));
  const changedKeys = Object.keys(afterResend).filter(
    (key) => JSON.stringify(afterResend[key]) !== JSON.stringify((probe as Record<string, unknown>)[key]),
  );
  expect(
    changedKeys.some((key) => /at$|sent|count/i.test(key)),
    `resend changed a timestamp-ish field (changed: ${changedKeys.join(', ')})`,
  ).toBe(true);

  await modalRow.getByRole('button', { name: 'Revoke' }).click({ timeout: ACT });
  // The modal's list keeps revoked rows as history; the status flips in place.
  await expect(modalRow).toHaveAttribute('data-status', 'revoked', { timeout: ACT });
  await shot(page, '06-revoke.png');
  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden({ timeout: ACT });

  const afterRevoke = (await apiInvitations()).find((row) => row.documentId === documentId)!;
  console.log('[proof item3] invitation after revoke:', JSON.stringify(afterRevoke, null, 1));
  expect(afterRevoke.status).toBe('revoked');

  // The pending arm no longer lists the probe.
  await openAdminsTab();
  await chooseStatusChip('Invited');
  await expect(page.locator(`[data-row-id="invitation:${documentId}"]`)).toHaveCount(0, {
    timeout: ACT,
  });
  await shot(page, '07-revoked-gone-from-pending.png');
  await chooseStatusChip('All statuses');
  void request;
});

/** Item 4 — MAKE OWNER: badge and API owner_documentId move, then move back. */
test('item 4: MAKE OWNER moves the badge and the API owner_documentId, then restores', async () => {
  await openAdminsTab();
  expect(await apiOwner()).toBeNull();

  const makeOwner = async (target: { documentId: string }) => {
    await rowAction(target.documentId, 'Make owner');
    const dialog = page.locator('[data-slot="ops-make-owner-dialog"]');
    await expect(dialog).toBeVisible({ timeout: ACT });
    await shot(page, `08-make-owner-dialog-${target.documentId.slice(0, 6)}.png`);
    await dialog.getByRole('button', { name: 'Make owner', exact: true }).click({ timeout: ACT });
    await expect(dialog).toBeHidden({ timeout: ACT });
    await expect.poll(() => apiOwner(), { timeout: ACT }).toBe(target.documentId);
  };

  // Establish adminA as the original owner.
  await makeOwner(adminA);
  await expect(rowOf(adminA.documentId).first().getByText('Owner', { exact: true })).toBeVisible({ timeout: ACT });
  await shot(page, '09-owner-badge-on-admin-a.png');

  // Transfer to adminB: the badge MOVES.
  await makeOwner(adminB);
  await expect(rowOf(adminB.documentId).first().getByText('Owner', { exact: true })).toBeVisible({ timeout: ACT });
  await expect(rowOf(adminA.documentId).first().getByText('Owner', { exact: true })).toBeHidden();
  await shot(page, '10-owner-badge-moved-to-admin-b.png');

  // Restore the original owner.
  await makeOwner(adminA);
  await expect(rowOf(adminA.documentId).first().getByText('Owner', { exact: true })).toBeVisible({ timeout: ACT });
  await shot(page, '11-owner-restored-to-admin-a.png');
});

/** Item 5 — block/unblock a NON-owner admin round-trips. */
test('item 5: block/unblock the non-owner admin round-trips', async () => {
  await openAdminsTab();
  expect(await apiOwner()).toBe(adminA.documentId);

  await rowAction(adminB.documentId, 'Suspend admin');
  const confirm = page.getByRole('alertdialog');
  await expect(confirm).toBeVisible({ timeout: ACT });
  await confirm.getByRole('button', { name: 'Suspend', exact: true }).click({ timeout: ACT });
  await expect(confirm).toBeHidden({ timeout: ACT });

  await expect
    .poll(async () => (await apiAdmins()).find((row) => row.documentId === adminB.documentId)?.blocked, { timeout: ACT })
    .toBe(true);
  await expect(rowOf(adminB.documentId).first().getByText('Suspended', { exact: true })).toBeVisible({ timeout: ACT });
  await shot(page, '12-admin-b-blocked.png');

  await rowAction(adminB.documentId, 'Reactivate admin');
  await expect(confirm).toBeVisible({ timeout: ACT });
  await confirm.getByRole('button', { name: 'Reactivate', exact: true }).click({ timeout: ACT });
  await expect(confirm).toBeHidden({ timeout: ACT });
  await expect
    .poll(async () => (await apiAdmins()).find((row) => row.documentId === adminB.documentId)?.blocked, { timeout: ACT })
    .toBe(false);
  await expect(rowOf(adminB.documentId).first().getByText('Suspended', { exact: true })).toBeHidden();
  await shot(page, '13-admin-b-unblocked.png');
});

/** Item 6 — CSV export produces a non-empty download. */
test('item 6: CSV export from the Admins tab downloads a non-empty file', async () => {
  await openAdminsTab();
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: ACT }),
    page.getByRole('button', { name: 'Export CSV' }).click({ timeout: ACT }),
  ]);
  const target = path.join(SHOTS, '14-admins-export.csv');
  await download.saveAs(target);
  const bytes = statSync(target).size;
  console.log('[proof item6] download:', download.suggestedFilename(), bytes, 'bytes');
  expect(bytes).toBeGreaterThan(0);
  await shot(page, '14-csv-export.png');
});

/** Item 7 — the new modals never threw. */
test('item 7: no console or page errors across all steps', async () => {
  console.log('[proof item7] pageErrors:', JSON.stringify(pageErrors, null, 1));
  expect(pageErrors).toEqual([]);
});
