/**
 * ops/12 — the school detail page AFTER the D-29 tab split, driven through the
 * real app with a fixture school created through the real contracts.
 *
 * Three rules this spec exists to enforce:
 *  1. TABS ARE SELECTED BY ROLE and proven by CONTENT (the panel that renders,
 *     aria-selected), never by text: the metric strip renders plain "Teachers"
 *     / "Students" labels that precede the real tab in DOM order and swallow
 *     the click — a text-selected switch can pass while nothing switches,
 *     with byte-identical screenshots.
 *  2. The extraction must have kept the keeps-working contracts, each with an
 *     explicit assertion: the Make-owner 409 message, the null-owner warning
 *     banner, the teacher class-count join.
 *  3. A tab change clears the kit's URL params AND the row selection: a
 *     selection carried across tabs is a bulk action aimed at the wrong rows.
 */
import path from 'node:path';
import { mkdirSync } from 'node:fs';

import { expect, test, type Page } from '@playwright/test';
import { z } from 'zod';

import { REFERENCE_VIEWPORT } from '@/modules/ops/hooks/use-visual-reference';
import { apiEnv } from '../helpers/auth-db';
import {
  certifyApiState,
  HOOK_TIMEOUT_MS,
  namedRetry,
  TOTAL_BUDGET_MS,
} from '../helpers/api-named-retry';
import { roleCredentials } from '../helpers/credentials';
import { cat, loadMessages } from '../helpers/i18n';
import { paceRateWindow } from '../helpers/pace';
import {
  OpsFixtureLedger,
  createOpsFixtureSchool,
  createOpsFixtureStudents,
  createOpsFixtureTeacher,
  fixtureHeaders,
} from '../helpers/ops-portal';

const en = loadMessages('en');
const SHOTS = path.resolve(process.cwd(), '.qa', 'screenshots');
const API = process.env.API_BASE_URL ?? 'http://localhost:5500';
const ACTION_TIMEOUT = 30_000;
// Named-failure budget (fleet standard) lives in helpers/api-named-retry.ts;
// this spec's hook timeout is 240s, inside which the 175s budget fits.

const ledger = new OpsFixtureLedger();
let schoolId = '';
let schoolName = '';
let adminA = '';
let adminB = '';

/** One ops login for the whole worker; the JWT is reused by every API call. */
let opsJwt = '';
async function withNamedRetries<T>(what: string, attempt: () => Promise<T>): Promise<T> {
  return namedRetry('ops/12 school-detail', what, attempt);
}

async function getOpsJwt(request: import('@playwright/test').APIRequestContext): Promise<string> {
  if (opsJwt === '') {
    const res = await request.post(`${API}/api/auth/local`, {
      data: {
        identifier: roleCredentials('opsApi').email,
        password: apiEnv('SEED_APIADMIN_PASSWORD'),
      },
    });
    if (!res.ok()) throw new Error(`[ops/12] ops login failed: ${res.status()}`);
    opsJwt = ((await res.json()) as { jwt: string }).jwt;
  }
  return opsJwt;
}

/** The admin variant of the teacher fixture helper (register → role → school). */
async function createOpsFixtureAdmin(
  request: import('@playwright/test').APIRequestContext,
  schoolDocumentId: string,
  label: string,
): Promise<string> {
  const email = `${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@fixture.schooltest.local`;
  const register = await request.post(`${API}/api/auth/local/register`, {
    data: { username: email, email, password: 'Fixture!Passw0rd' },
  });
  if (!register.ok()) {
    throw new Error(`[ops/12] register ${label} -> ${register.status()}: ${await register.text()}`);
  }
  const userDocumentId = z
    .object({ user: z.object({ documentId: z.string().min(1) }) })
    .parse(await register.json()).user.documentId;
  const headers = fixtureHeaders('ops', await getOpsJwt(request));
  const role = await request.post(`${API}/api/ops/users/${userDocumentId}/role`, {
    headers,
    data: { role: 'school_admin' },
  });
  if (!role.ok()) {
    throw new Error(`[ops/12] role ${label} -> ${role.status()}: ${await role.text()}`);
  }
  const school = await request.post(`${API}/api/ops/users/${userDocumentId}/school`, {
    headers,
    data: { schoolDocumentId },
  });
  if (!school.ok()) {
    throw new Error(`[ops/12] school ${label} -> ${school.status()}: ${await school.text()}`);
  }
  ledger.track('user', userDocumentId);
  return userDocumentId;
}

/**
 * The ownership transfer, called directly with the contract's operation path
 * and body (`owner_documentId`, `expected_owner_documentId`) and the versioned
 * header — the exact request the UI's Make-owner confirm sends.
 */
async function transferOwner(
  request: import('@playwright/test').APIRequestContext,
  targetDocumentId: string,
  expectedOwnerDocumentId: string | null,
): Promise<number> {
  const res = await request.post(`${API}/api/ops/schools/${schoolId}/owner`, {
    headers: fixtureHeaders('ops', await getOpsJwt(request)),
    data: {
      owner_documentId: targetDocumentId,
      expected_owner_documentId: expectedOwnerDocumentId,
    },
  });
  return res.status();
}

/** Tabs are selected BY ROLE; the panel proof is aria-selected, not a click. */
async function openTab(page: Page, key: string): Promise<void> {
  const tab = page.getByRole('tab', { name: cat(en, `Ops.schoolTables.tab.${key}`) });
  await expect(tab).toBeVisible({ timeout: ACTION_TIMEOUT });
  await tab.click();
  await expect(tab).toHaveAttribute('aria-selected', 'true', { timeout: ACTION_TIMEOUT });
}

test.describe.configure({ timeout: 240_000, retries: 1 });
test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ request }) => {
  // The retry budget (175s) must fit INSIDE the enclosing hook timeout, or
  // every cause looks like a hang. Guard BEFORE spending anything.
  if (test.info().timeout < TOTAL_BUDGET_MS) {
    throw new Error(
      `HOOK TIMEOUT TOO SMALL — this spec's beforeAll runs the named-failure ` +
        `budget (TOTAL_BUDGET_MS=${TOTAL_BUDGET_MS}) but the hook timeout is ` +
        `${test.info().timeout}ms. Configure HOOK_TIMEOUT_MS (see ` +
        `helpers/api-named-retry.ts) before running.`,
    );
  }
  test.setTimeout(HOOK_TIMEOUT_MS);
  // API state gate (ops/12, orchestrator-directed): classify BEFORE spending
  // any attempt budget — serving proceeds; a SUPERVISOR CHURN or a BOOT STOP
  // throws named with the evidence, because neither is fixable by retrying.
  const apiState = await certifyApiState();
  if (apiState.state === 'supervisor-churn') {
    throw new Error(`SUPERVISOR CHURN — ${apiState.evidence}`);
  }
  if (apiState.state === 'boot-stop') {
    throw new Error(
      `API BOOT STOP — :5500 is failing to come up, not restarting. Retry cannot fix it; ` +
        `the fix is in another row's file. Evidence: ${apiState.evidence}`,
    );
  }
  if (apiState.state === 'restart-window') {
    // One 15s restart-window wait + re-classification; still down = escalate.
    await new Promise((resolve) => setTimeout(resolve, 15_000));
    const retry = await certifyApiState();
    if (!retry.serving) {
      throw new Error(
        `API NOT SERVING after a restart-window wait — state: ${retry.state}. Evidence: ${retry.evidence}`,
      );
    }
  }
  await withNamedRetries('create the fixture school and staff', async () => {
    const school = await createOpsFixtureSchool(request, ledger, 'ops-012');
    schoolId = school.documentId;
    schoolName = school.name;
    await createOpsFixtureStudents(request, schoolId, 2);
    adminA = await createOpsFixtureAdmin(request, schoolId, 'ops12adminA');
    adminB = await createOpsFixtureAdmin(request, schoolId, 'ops12adminB');
    await createOpsFixtureTeacher(request, ledger, schoolId, 'ops-012');
  });
});

test.afterAll(async ({ request }) => {
  await ledger.cleanup(request);
});

test.beforeEach(async ({ page }) => paceRateWindow(page));

async function loginAsOps(page: Page): Promise<void> {
  await withNamedRetries('sign in as ops through the UI', async () => {
    await page.goto('/sign-in');
    await page
      .getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true })
      .fill(roleCredentials('opsApi').email);
    await page
      .getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true })
      .fill(apiEnv('SEED_APIADMIN_PASSWORD'));
    await page.getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true }).click();
    await page.waitForURL('**/dashboard', { timeout: ACTION_TIMEOUT });
  });
}

async function openSchool(page: Page): Promise<void> {
  await page.goto(`/dashboard/ops/schools/${schoolId}`);
  await expect(page.getByRole('heading', { level: 1, name: schoolName })).toBeVisible({
    timeout: ACTION_TIMEOUT,
  });
}

test('the stat strip shows exactly the design’s four cards', async ({ page }) => {
  await loginAsOps(page);
  await openSchool(page);

  // The design’s four labels and NOTHING else: the classes and admins counts
  // moved onto their tab badges.
  const strip = page.locator('[data-slot="ops-count-cards"]');
  await expect(strip).toBeVisible({ timeout: ACTION_TIMEOUT });
  const labels = await strip
    .locator('[data-count-label]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-count-label')));
  expect(labels).toEqual([
    cat(en, 'Ops.detail.studentsLabel'),
    cat(en, 'Ops.detail.teachersLabel'),
    cat(en, 'Ops.detail.testsTermLabel'),
    cat(en, 'Ops.detail.lastActivityLabel'),
  ]);

  // The fixture school was created seconds ago: last_active_at is NULL, and
  // the design’s "Never" is the honest rendering — not a manufactured date.
  await expect(strip.getByText(cat(en, 'Ops.detail.neverValue'))).toBeVisible();

  // R-23: the Teachers card is a plain figure now, like the other three —
  // teachers live in the drawn Teachers tab, never behind a stat-card click.
  await expect(strip.locator('[data-slot="ops-count-card"]')).toHaveCount(4);
});

test('tab badges follow the design’s countDisplay: zero renders no badge', async ({ page }) => {
  await loginAsOps(page);
  await openSchool(page);

  // Two admins, one teacher, zero classes, zero students — so exactly two
  // badges exist, and neither zero-count tab carries one.
  await expect(page.getByTestId('ops-tab-count-admins')).toHaveText('2');
  await expect(page.getByTestId('ops-tab-count-teachers')).toHaveText('1');
  await expect(page.getByTestId('ops-tab-count-classes')).toHaveCount(0);
  await expect(page.getByTestId('ops-tab-count-students')).toHaveCount(0);
  await expect(page.getByTestId('ops-tab-count-overview')).toHaveCount(0);
});

test('tab switching is role-selected and clears the URL params and the selection', async ({
  page,
}) => {
  await loginAsOps(page);
  await openSchool(page);

  await openTab(page, 'students');
  // The active Radix panel is the ONLY tabpanel in the DOM at a time.
  const panel = page.getByRole('tabpanel');
  await expect(panel.locator('tbody input[type="checkbox"]').first()).toBeVisible({
    timeout: ACTION_TIMEOUT,
  });

  // The kit search writes `q` into the URL…
  await page
    .locator('[data-slot="directory-toolbar"] input[type="search"]')
    .fill('zz-no-such-student');
  await expect
    .poll(() => page.url(), { timeout: ACTION_TIMEOUT })
    .toContain('q=zz-no-such-student');

  // …and a row selection…
  const firstCheckbox = panel.locator('tbody input[type="checkbox"]').first();
  await firstCheckbox.click();
  await expect(firstCheckbox).toBeChecked({ timeout: ACTION_TIMEOUT });

  // …both die on a tab switch, alongside the panel swap this test already
  // proved via aria-selected.
  await openTab(page, 'classes');
  await expect(page.getByRole('tabpanel')).toBeVisible({ timeout: ACTION_TIMEOUT });
  expect(page.url()).not.toContain('q=');

  await openTab(page, 'students');
  await expect(page.getByRole('tabpanel').locator('tbody input[type="checkbox"]:checked')).toHaveCount(0);
});

test('the Overview card shows the design’s six rows and its Edit opens the school form', async ({
  page,
}) => {
  await loginAsOps(page);
  await openSchool(page);

  const details = page.locator('[data-slot="ops-overview-details"]');
  await expect(details).toBeVisible({ timeout: ACTION_TIMEOUT });
  for (const label of [
    cat(en, 'Ops.schoolTables.fieldSector'),
    cat(en, 'Ops.schoolTables.fieldLocation'),
    cat(en, 'Ops.schoolTables.fieldPlan'),
    cat(en, 'Ops.schoolTables.fieldContact'),
    cat(en, 'Ops.schoolTables.fieldEmail'),
    cat(en, 'Ops.schoolTables.fieldPhone'),
  ]) {
    await expect(details.getByText(label, { exact: true })).toBeVisible();
  }
  // The old Last-activity row is gone from the list: it is a stat card now.
  await expect(details.getByText(cat(en, 'Ops.schoolTables.fieldLastActivity'))).toHaveCount(0);

  // The inline Edit activates the page-header Edit control, which owns the
  // write gate; the school form dialog is the proof it opened.
  await details.getByTestId('ops-overview-edit').click();
  await expect(page.locator('[data-slot="ops-edit-school-dialog"]')).toBeVisible({
    timeout: ACTION_TIMEOUT,
  });
});

test('a school whose owner is null shows the null-owner warning banner', async ({ page }) => {
  await loginAsOps(page);
  await openSchool(page);

  // The fixture school was created with send_owner_invitation: false and no
  // owner transfer has run yet, so owner_documentId is null — the D-OWN
  // ambiguous case the banner exists for.
  await openTab(page, 'admins');
  await expect(
    page.getByRole('alert').filter({ hasText: cat(en, 'Ops.schoolTables.ownerNone') }),
  ).toBeVisible({ timeout: ACTION_TIMEOUT });
});

test('a Make owner confirmed on a stale page 409s with the refresh message', async ({ page }) => {
  await loginAsOps(page);
  await openSchool(page);
  await openTab(page, 'admins');

  // Make the page stale BEHIND the loaded UI: the API transfer to admin A
  // succeeds (the page still believes the owner is null), so the UI's next
  // confirm carries a stale expected owner and MUST 409.
  expect(await transferOwner(page.request, adminA, null)).toBe(200);

  const row = page
    .getByTestId('ops-staff-table-school_admin')
    .locator(`tbody tr[data-row-id="user:${adminB}"]`);
  await expect(row).toBeVisible({ timeout: ACTION_TIMEOUT });
  await row.getByRole('button', { name: cat(en, 'Ops.schoolTables.makeOwner') }).click();
  await expect(page.locator('[data-slot="ops-make-owner-dialog"]')).toBeVisible({
    timeout: ACTION_TIMEOUT,
  });
  await page
    .locator('[data-slot="ops-make-owner-dialog"]')
    .getByRole('button', { name: cat(en, 'Ops.schoolTables.makeOwnerConfirmAction') })
    .click();

  await expect(
    page.getByRole('alert').filter({ hasText: cat(en, 'Ops.schoolTables.ownerConflict') }),
  ).toBeVisible({ timeout: ACTION_TIMEOUT });
});

test('the teacher class-count join renders the served counts', async ({ page }) => {
  await loginAsOps(page);
  await openSchool(page);

  // The wire is the truth: whatever the teachers read serves in
  // `classes`, the row must render — including zero.
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/ops/users') &&
      response.url().includes('role=teacher') &&
      response.request().method() === 'GET',
  );
  await openTab(page, 'teachers');
  const response = await responsePromise;
  const served = z
    .object({
      data: z.array(
        z.object({
          documentId: z.string(),
          classes: z.array(z.unknown()),
        }),
      ),
    })
    .parse(await response.json());

  const table = page.getByTestId('ops-staff-table-teacher');
  await expect(table).toBeVisible({ timeout: ACTION_TIMEOUT });
  for (const row of served.data) {
    const rowLocator = table.locator(`tbody tr[data-row-id="user:${row.documentId}"]`);
    await expect(rowLocator).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(rowLocator).toContainText(String(row.classes.length));
  }
});

test('captures the stats strip and the overview at the reference width', async ({ page }) => {
  await page.setViewportSize({ ...REFERENCE_VIEWPORT });
  await loginAsOps(page);
  await openSchool(page);

  await expect(page.locator('[data-slot="ops-count-cards"]')).toBeVisible({
    timeout: ACTION_TIMEOUT,
  });
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, '12-stats-tabs.png'), animations: 'disabled' });

  await openTab(page, 'overview');
  await expect(page.locator('[data-slot="ops-overview-details"]')).toBeVisible({
    timeout: ACTION_TIMEOUT,
  });
  await page.screenshot({ path: path.join(SHOTS, '12-overview.png'), animations: 'disabled' });
});
