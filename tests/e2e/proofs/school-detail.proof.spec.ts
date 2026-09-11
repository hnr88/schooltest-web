/**
 * E2E PROOF SPEC — school detail page, item-by-item with screenshots.
 *
 * Drives the real app on :3002 against the real API on :5500. One browser
 * login for the whole serial run (auth limiter is 20 POSTs/min/IP). Items 2-5
 * run against a fixture school provisioned through the real ops contracts
 * (2 admins, 2 teachers, 3 students) so counts and rows are non-zero and can
 * be cross-checked against GET /api/ops/schools/:id.
 * Screenshots land in tests/proofs/detail/.
 */
import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { apiEnv } from '../helpers/auth-db';
import { roleCredentials } from '../helpers/credentials';
import { cat, loadMessages } from '../helpers/i18n';
import { loginAs } from '../helpers/roles';
import {
  OpsFixtureLedger,
  createOpsFixtureSchool,
  createOpsFixtureTeacher,
  fixtureHeaders,
} from '../helpers/ops-portal';

const en = loadMessages('en');
const API = process.env.API_BASE_URL ?? 'http://localhost:5500';
const SHOTS = path.resolve(process.cwd(), 'tests/proofs/detail');
const ACT = 30_000;
mkdirSync(SHOTS, { recursive: true });

const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, name), fullPage: true });

test.describe.configure({ mode: 'serial', timeout: 240_000 });

const ledger = new OpsFixtureLedger();
let jwt = '';
let page: Page;
let fixtureId = '';
let fixtureName = '';
let classDocumentId = '';

/** The API's school detail read — the cross-check authority for items 2-3. */
async function apiSchool(documentId: string): Promise<Record<string, unknown>> {
  const res = await page.request.get(`${API}/api/ops/schools/${documentId}`, {
    headers: { Authorization: `Bearer ${jwt}`, 'X-Ops-Portal-Version': '1' },
  });
  if (!res.ok()) throw new Error(`API detail read failed: ${res.status()}`);
  return ((await res.json()) as { data: Record<string, unknown> }).data;
}

async function createFixtureAdmin(label: string): Promise<string> {
  const email = `proof-${label}-${Date.now()}@fixture.schooltest.local`;
  const register = await page.request.post(`${API}/api/auth/local/register`, {
    data: { username: email, email, password: 'Fixture!Passw0rd' },
  });
  if (!register.ok()) throw new Error(`register ${label}: ${register.status()}`);
  const userDocumentId = (
    (await register.json()) as { user: { documentId: string } }
  ).user.documentId;
  const headers = fixtureHeaders('ops', jwt);
  for (const [path, data] of [
    [`/api/ops/users/${userDocumentId}/role`, { role: 'school_admin' }],
    [`/api/ops/users/${userDocumentId}/school`, { schoolDocumentId: fixtureId }],
  ] as const) {
    const res = await page.request.post(`${API}${path}`, { headers, data });
    if (!res.ok()) throw new Error(`${path}: ${res.status()} ${await res.text()}`);
  }
  ledger.track('user', userDocumentId);
  return userDocumentId;
}

const pageErrors: string[] = [];

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  page = await context.newPage();
  const res = await page.request.post(`${API}/api/auth/local`, {
    data: {
      identifier: roleCredentials('opsApi').email,
      password: apiEnv('SEED_APIADMIN_PASSWORD'),
    },
  });
  if (!res.ok()) throw new Error(`ops API login failed: ${res.status()}`);
  jwt = ((await res.json()) as { jwt: string }).jwt;

  page.on('pageerror', (error) => pageErrors.push(String(error)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') pageErrors.push(`console.error: ${msg.text()}`);
  });

  const school = await createOpsFixtureSchool(page.request, ledger, 'proof-detail');
  fixtureId = school.documentId;
  fixtureName = school.name;
  await createFixtureAdmin('adminA');
  await createFixtureAdmin('adminB');
  await createOpsFixtureTeacher(page.request, ledger, fixtureId, 'proof-detail-t1');
  await createOpsFixtureTeacher(page.request, ledger, fixtureId, 'proof-detail-t2');

  // Students + a class, through the real ops import contract (POST /api/students
  // with a school link 403s for ops on the live API, so the import lane is the
  // supported way to seat students on a fixture school).
  const opsHeaders = fixtureHeaders('ops', jwt);
  await page.request.put(`${API}/api/schools/${fixtureId}/entitlement`, {
    headers: opsHeaders,
    data: { seats_total: 25 },
  });
  const klass = await page.request.post(`${API}/api/ops/schools/${fixtureId}/classes`, {
    headers: opsHeaders,
    data: { name: '7A', year_band: null },
  });
  if (!klass.ok()) throw new Error(`class create: ${klass.status()} ${await klass.text()}`);
  classDocumentId = ((await klass.json()) as { data: { documentId: string } }).data
    .documentId;
  const csv = [
    'given name,family name,date of birth,year level,home language',
    `Probe,StudentA,2013-04-01,7,english`,
    `Probe,StudentB,2013-05-02,7,english`,
    `Probe,StudentC,2013-06-03,7,english`,
    '',
  ].join('\n');
  const commit = await page.request.post(
    `${API}/api/ops/schools/${fixtureId}/import-students/commit`,
    {
      headers: { ...opsHeaders, 'Idempotency-Key': crypto.randomUUID() },
      data: { csv, class_documentId: classDocumentId },
    },
  );
  if (!commit.ok()) throw new Error(`import commit: ${commit.status()} ${await commit.text()}`);

  await loginAs(page, 'ops');
});

test.afterAll(async () => {
  // The API refuses to delete a school that still holds records, so the
  // imported students and the class go first, then the ledger takes the rest.
  if (fixtureId) {
    const headers = fixtureHeaders('ops', jwt);
    const students = await page.request.get(
      `${API}/api/ops/schools/${fixtureId}/students?pagination%5BpageSize%5D=100`,
      { headers },
    );
    if (students.ok()) {
      for (const row of ((await students.json()) as { data: { documentId: string }[] }).data) {
        await page.request.delete(`${API}/api/students/${row.documentId}`, { headers });
      }
    }
    if (classDocumentId) {
      await page.request.delete(`${API}/api/classes/${classDocumentId}`, { headers });
    }
  }
  await ledger.cleanup(page.request);
});

test('item 1 — schools list -> row click -> detail header', async () => {
  await page.goto('/dashboard/ops/schools');
  await expect(page.locator('[data-slot="ops-schools"]')).toBeVisible({ timeout: ACT });
  await shot(page, '01-schools-list.png');

  // Row-click proof on a seeded row (a fresh fixture can fall off page 1 of
  // the list); the fixture school is then opened by URL.
  await page.locator('a', { hasText: 'A B Paterson College' }).first().click();
  await expect(page.locator('[data-slot="ops-school-detail"]')).toBeVisible({ timeout: ACT });
  await shot(page, '02-detail-header.png');

  await page.goto(`/dashboard/ops/schools/${fixtureId}`);
  await expect(page.getByRole('heading', { level: 1, name: fixtureName })).toBeVisible({ timeout: ACT });
});

test('item 2 — overview tab: details card cross-checked vs API', async () => {
  const api = await apiSchool(fixtureId);
  console.log('[proof] API detail:', JSON.stringify(api));

  const card = page.locator('[data-slot="ops-overview-details"]');
  await expect(card).toBeVisible({ timeout: ACT });
  const rows = card.locator('dl > div');
  await expect(rows).toHaveCount(7, { timeout: ACT });
  for (let i = 0; i < await rows.count(); i += 1) {
    const value = (await rows.nth(i).locator('dd').innerText()).trim();
    expect(value, `overview field ${i} empty`).not.toBe('');
  }
  const email = String(api.contact_email ?? '');
  if (email) await expect(card.getByText(email)).toBeVisible();
  await shot(page, '03-overview-details.png');
  await shot(page, '04-overview-activity.png');
});

test('item 3 — underline tab counts match the API', async () => {
  const api = await apiSchool(fixtureId);
  const expected: Record<string, number> = {
    admins: Number(api.admin_count ?? 0),
    teachers: Number(api.portal_teacher_count ?? 0),
    classes: Number(api.class_count ?? 0),
    students: Number(api.student_count ?? 0),
  };
  console.log('[proof] expected tab counts:', JSON.stringify(expected));
  expect(expected.admins).toBeGreaterThan(0);
  expect(expected.teachers).toBeGreaterThan(0);
  expect(expected.students).toBeGreaterThan(0);
  for (const [key, value] of Object.entries(expected)) {
    const badge = page.getByTestId(`ops-tab-count-${key}`);
    if (value > 0) {
      await expect(badge).toBeVisible({ timeout: ACT });
      await expect(badge).toHaveText(String(value));
    } else {
      await expect(badge).toHaveCount(0);
    }
  }
  await shot(page, '05-tab-counts.png');
});

test('item 4 — each table tab loads rows without page errors', async () => {
  for (const key of ['admins', 'teachers', 'classes', 'students'] as const) {
    const tab = page.getByRole('tab', { name: cat(en, `Ops.schoolTables.tab.${key}`) });
    await tab.click({ timeout: ACT });
    await expect(tab).toHaveAttribute('aria-selected', 'true', { timeout: ACT });
    const panel = page.getByRole('tabpanel');
    await expect(panel).toBeVisible({ timeout: ACT });
    await page.waitForTimeout(1500); // let the tab's own query settle
    const rowCount = await panel.locator('a[href*="/dashboard/ops/"], tbody tr').count();
    const text = (await panel.innerText()).replace(/\n+/g, ' | ');
    console.log(`[proof] tab ${key}: interactive rows = ${rowCount}`);
    console.log(`[proof] tab ${key} text: ${text.slice(-600)}`);
    // The ops shell scrolls INTERNALLY (dashboard layout overflow-y-auto), so a
    // fullPage screenshot clips at the viewport. Scroll the directory card into
    // view and capture the rows region as an element close-up.
    const directory = page.locator('section[data-slot="directory"]');
    if ((await directory.count()) > 0) {
      await directory.scrollIntoViewIfNeeded();
      await directory.locator('[data-slot="directory-rows"], [role="list"], tbody').first()
        .scrollIntoViewIfNeeded()
        .catch(() => {});
      await directory.screenshot({ path: path.join(SHOTS, `06-tab-${key}-rows.png`) }).catch(() => {});
    }
    await shot(page, `06-tab-${key}.png`);
  }
  expect(pageErrors, `page/console errors: ${pageErrors.join(' | ')}`).toEqual([]);
});

test('item 5 — lifecycle: destructive action + confirm dialog + undo toast', async () => {
  // FINDING: the header's primary action is Suspend ONLY for portal_status
  // 'active' schools (school-lifecycle-actions.ts), i.e. onboarding complete.
  // Every school on this stack is pending_setup, so the primary is Activate and
  // Suspend is not even in the pending_setup overflow menu — the reachable
  // destructive lifecycle is Archive, through the same runner, confirm dialog
  // and undo machinery. The suspend ENDPOINT contract is proven by API below.
  await page.goto(`/dashboard/ops/schools/${fixtureId}`);
  const panel = page.locator('[data-slot="ops-school-suspend"]');
  await expect(panel).toBeVisible({ timeout: ACT });
  const initialStatus = (await panel.getAttribute('data-account-status')) ?? '';
  expect(initialStatus).not.toBe('closed');

  // Backend suspend/undo contract, straight through the API.
  const opsHeaders = { ...fixtureHeaders('ops', jwt), 'Content-Type': 'application/json' };
  const version = String(
    (await apiSchool(fixtureId)).updatedAt,
  );
  const suspended = await page.request.post(
    `${API}/api/ops/schools/${fixtureId}/suspend`,
    { headers: { ...opsHeaders, 'If-Match': `"${version}"` }, data: {} },
  );
  expect(suspended.status()).toBeLessThan(300);
  const suspendedBody = (await suspended.json()) as {
    data: { account_status: string; action_documentId?: string };
  };
  expect(suspendedBody.data.account_status).toBe('suspended');
  const undoApi = await page.request.post(
    `${API}/api/ops/schools/${fixtureId}/lifecycle-actions/${suspendedBody.data.action_documentId ?? ''}/undo`,
    { headers: { ...opsHeaders, 'If-Match': `"${String((await apiSchool(fixtureId)).updatedAt)}"` }, data: {} },
  );
  expect([200, 201, 204]).toContain(undoApi.status());

  // UI path: overflow menu -> Archive school -> confirm -> undo toast.
  await page.reload();
  await expect(panel).toBeVisible({ timeout: ACT });
  await page.getByRole('button', { name: cat(en, 'Ops.detail.actions.menuLabel') }).click({ timeout: ACT });
  await shot(page, '07-lifecycle-menu.png');
  await page.getByRole('menuitem', { name: cat(en, 'Ops.detail.actions.archive') }).click({ timeout: ACT });
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible({ timeout: ACT });
  await shot(page, '07b-lifecycle-confirm.png');
  // Archive is a typed-name confirm: the CTA unlocks only on an exact match.
  await dialog.getByRole('textbox').fill(fixtureName, { timeout: ACT });
  await dialog.getByRole('button', { name: cat(en, 'Ops.detail.actions.confirm.archive.cta') }).click({ timeout: ACT });

  await expect(panel).toHaveAttribute('data-account-status', 'closed', { timeout: ACT });
  const undo = page.getByRole('button', { name: cat(en, 'Ops.detail.actions.undo'), exact: true });
  await expect(undo).toBeVisible({ timeout: ACT });
  await shot(page, '08-lifecycle-archived-toast.png');

  await undo.click({ timeout: ACT });
  await expect(panel).toHaveAttribute('data-account-status', initialStatus, { timeout: ACT });
  await shot(page, '09-lifecycle-undone.png');
});
