/**
 * OPS-025 / C-OPS-PORTAL-015 — the Admins and Teachers tables on the ops school
 * detail page, driven against the REAL portal and the REAL Strapi. Nothing is
 * intercepted: the spec signs in with the seeded ops account, opens the seeded
 * demo school and asserts what the browser actually received. Every interaction
 * is bounded — an unbounded Playwright wait on a hidden element hangs forever
 * instead of failing. Assertions key off `data-*` attributes rather than copy:
 * the new column labels are integrator-merged keys (see the task report).
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { expect, test, type Page, type Request } from '@playwright/test';

import { apiEnv } from '../helpers/auth-db';
import { HOOK_TIMEOUT_MS, namedRetry, TOTAL_BUDGET_MS } from '../helpers/api-named-retry';
import { cat, loadMessages } from '../helpers/i18n';
import {
  OpsFixtureLedger,
  createOpsFixtureSchool,
  createOpsFixtureTeacher,
} from '../helpers/ops-portal';

const en = loadMessages('en');
// Fixture school with one teacher, created in beforeAll through the real
// contracts (the seeded demo school this spec once pointed at is absent at HEAD).
let schoolId = '';
const ledger = new OpsFixtureLedger();
const OPS_EMAIL = 'apiadmin@schooltest.local';
const ACTION_TIMEOUT = 30_000;
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3002';
// One sign-in for the whole file, replayed from storage. The stack shares one
// per-IP login budget with every other suite on this machine; five separate
// sign-ins reliably trip it and fail on contention rather than on behaviour.
const STORAGE = path.join(os.tmpdir(), 'ops-025-staff-users.storage.json');
if (!existsSync(STORAGE)) writeFileSync(STORAGE, JSON.stringify({ cookies: [], origins: [] }));
const CAPTURES = path.resolve(
  __dirname,
  '../../../../.codephant/missions/msn-ab5a6a54-f385-42e1-826a-aeba2bbdbc66/captures',
);

async function signInAsOps(page: Page): Promise<void> {
  let lastError: unknown;
  let lastAuthStatus: number | undefined;
  page.on('response', (response) => {
    if (response.url().includes('/api/auth/local')) lastAuthStatus = response.status();
  });
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      // In the try: neighbouring suites restart the dev server, so even the
      // navigation can be refused — contention, not a defect.
      await page.goto('/sign-in', { timeout: ACTION_TIMEOUT });
      await page
        .getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true })
        .fill(OPS_EMAIL, { timeout: ACTION_TIMEOUT });
      await page
        .getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true })
        .fill(apiEnv('SEED_APIADMIN_PASSWORD'), { timeout: ACTION_TIMEOUT });
      await page
        .getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true })
        .click({ timeout: ACTION_TIMEOUT });
      await page.waitForURL('**/dashboard', { timeout: 20_000 });
      return;
    } catch (error) {
      lastError = error;
      // Logged per attempt: the hook's own timeout can fire mid-loop, before
      // the final throw below ever runs.
      console.warn(
        `[e2e] ops sign-in attempt ${attempt} failed — last auth status ${lastAuthStatus ?? 'none'}, ` +
          `URL ${page.url()}: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Ride out the shared 60s per-IP login window and try again.
      await page.waitForTimeout(15_000);
    }
  }
  const reason = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(
    `[e2e] ops sign-in never reached the dashboard after 6 attempts — ` +
      `last auth status ${lastAuthStatus ?? 'none'}, last URL ${page.url()}, last error: ${reason}`,
    { cause: lastError },
  );
}

/** Every /api/ops/users request the page made, in order. */
function recordStaffRequests(page: Page): Request[] {
  const seen: Request[] = [];
  page.on('request', (request) => {
    // GET only: a CORS preflight shares the URL but carries no version header.
    if (request.method() === 'GET' && request.url().includes('/api/ops/users')) seen.push(request);
  });
  return seen;
}

async function openSchool(page: Page): Promise<void> {
  await page.goto(`/dashboard/ops/schools/${schoolId}`);
  const admins = page.getByRole('tab', { name: cat(en, 'Ops.schoolTables.tab.admins') });
  await expect(admins).toBeVisible({ timeout: ACTION_TIMEOUT });
}

/** Open the school, switch to Teachers. */
async function openTeachers(page: Page): Promise<void> {
  await openSchool(page);
  const tab = page.getByRole('tab', { name: cat(en, 'Ops.schoolTables.tab.teachers') });
  await tab.click({ timeout: ACTION_TIMEOUT });
  await expect(page.getByTestId('ops-staff-table-teacher')).toBeVisible({ timeout: ACTION_TIMEOUT });
}

// retries: the API and web dev servers are shared with every other suite on
// this machine and get restarted underneath this one; a dropped connection is
// infrastructure, not a portal defect.
test.describe.configure({ timeout: 180_000, retries: 1 });
test.use({ storageState: STORAGE });

test.describe('ops staff directory (C-OPS-PORTAL-015)', () => {
  test.beforeAll(async ({ browser, request }) => {
    // Hooks do not inherit describe.configure's timeout.
    test.setTimeout(240_000);
    // ops/12: the retry budget (175s) must fit INSIDE this hook's timeout, or
    // every environment fault reads as an opaque hang. Fail fast if the
    // headroom is ever removed.
    if (test.info().timeout < TOTAL_BUDGET_MS) {
      throw new Error(
        `HOOK TIMEOUT TOO SMALL — the beforeAll fixture chain runs the ` +
          `named-failure budget (TOTAL_BUDGET_MS=${TOTAL_BUDGET_MS}) but this ` +
          `hook's timeout is ${test.info().timeout}ms.`,
      );
    }
    mkdirSync(CAPTURES, { recursive: true });
    const context = await browser.newContext({ baseURL: BASE_URL });
    const page = await context.newPage();
    try {
      await signInAsOps(page);
      await context.storageState({ path: STORAGE });
    } finally {
      await context.close();
    }
    // ops/12: the fixture chain runs under the fleet-standard named-failure
    // wrapper — a 429 or an API restart window inside beforeAll used to
    // condemn code it never exercised and read as a surface defect.
    await namedRetry(
      'ops-025',
      'create the fixture school and teacher',
      async () => {
        const school = await createOpsFixtureSchool(request, ledger, 'ops-025');
        schoolId = school.documentId;
        await createOpsFixtureTeacher(request, ledger, schoolId, 'ops-025');
      },
    );
  });

  test.afterAll(async ({ request }) => {
    await ledger.cleanup(request);
  });

  test('admins and teachers read the versioned, school-and-role scoped endpoint', async ({
    page,
  }) => {
    const requests = recordStaffRequests(page);
    await openSchool(page);

    const admins = page.getByTestId('ops-staff-table-school_admin');
    const adminsEmpty = page.getByTestId('ops-staff-empty-school_admin');
    await expect(admins.or(adminsEmpty).first()).toBeVisible({ timeout: ACTION_TIMEOUT });
    await openTeachers(page);

    // The two tabs hit the same endpoint with DIFFERENT role scoping, and both
    // carry the portal version header.
    const urls = requests.map((request) => request.url());
    expect(urls.some((url) => url.includes('role=school_admin'))).toBe(true);
    expect(urls.some((url) => url.includes('role=teacher'))).toBe(true);
    for (const request of requests) {
      expect(request.url()).toContain(`school=${schoolId}`);
      expect(await request.headerValue('x-ops-portal-version')).toBe('1');
    }
  });

  test('rows carry a discriminated identity, real activity and the server totals', async ({
    page,
  }) => {
    await openTeachers(page);

    const rows = page.getByTestId('ops-staff-table-teacher').locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: ACTION_TIMEOUT });
    const ids = await rows.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('data-row-id') ?? ''),
    );
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) expect(id).toMatch(/^user:[A-Za-z0-9_-]+$/);
    // Two staff sharing a display name must still be two distinct rows.
    expect(new Set(ids).size).toBe(ids.length);

    // Last activity: a real timestamp or the unavailable fallback — never a
    // date manufactured from createdAt.
    const observed = await page.getByTestId('ops-staff-last-active').evaluateAll((nodes) =>
      nodes.map((node) => ({
        value: node.getAttribute('data-value') ?? '',
        text: (node.textContent ?? '').trim(),
      })),
    );
    expect(observed).toHaveLength(ids.length);
    for (const cell of observed) {
      if (cell.value === '') expect(cell.text).not.toMatch(/\d{4}/);
      else expect(Number.isNaN(Date.parse(cell.value))).toBe(false);
    }

    // Pagination comes from meta.pagination, and page 1 cannot go back.
    const summary = page.getByTestId('ops-staff-page-summary');
    await expect(summary).toBeVisible({ timeout: ACTION_TIMEOUT });
    expect(await summary.getAttribute('data-page')).toBe('1');
    const total = Number(await summary.getAttribute('data-total'));
    const pageCount = Number(await summary.getAttribute('data-page-count'));
    expect(Number.isInteger(total)).toBe(true);
    expect(pageCount).toBe(total === 0 ? 0 : Math.ceil(total / 25));
    expect(ids.length).toBeLessThanOrEqual(25);

    const buttons = page.getByTestId('ops-staff-pager-teacher').getByRole('button');
    await expect(buttons.first()).toBeDisabled({ timeout: ACTION_TIMEOUT });
    if (pageCount <= 1) await expect(buttons.last()).toBeDisabled({ timeout: ACTION_TIMEOUT });
  });

  test('captures the directory at the desktop viewport, at 375px and at 200%', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await openTeachers(page);
    await page.screenshot({ path: path.join(CAPTURES, '025-staff-users-desktop.png') });

    await page.setViewportSize({ width: 375, height: 812 });
    await expect(page.getByTestId('ops-staff-table-teacher')).toBeVisible({ timeout: ACTION_TIMEOUT });
    // The wide table must scroll inside its own container, never the page body.
    const bodyOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    );
    expect(bodyOverflow).toBe(true);
    await page.screenshot({ path: path.join(CAPTURES, '025-staff-users-375.png') });

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => {
      document.body.style.zoom = '200%';
    });
    await expect(page.getByTestId('ops-staff-table-teacher')).toBeVisible({ timeout: ACTION_TIMEOUT });
    await page.screenshot({ path: path.join(CAPTURES, '025-staff-users-zoom200.png') });
  });
});
