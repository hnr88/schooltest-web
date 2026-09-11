/**
 * E2E PROOF SPEC — the SCHOOL-ADMIN portal lists after the school switcher is
 * used (operator bug report: "the schools list isn't loading", "the school
 * filter still doesn't work"; CSV export was reported working).
 *
 * Reproduction path, one signed-in session as the seeded schooladmin-a:
 *  1. /dashboard/school/students loads and shows roster rows (before any
 *     school is picked this passes — the failure needs the switcher first).
 *  2. Open the rail school switcher ("Your schools") and pick School B. The
 *     switcher writes the active-school pick, and every subsequent
 *     /api/schools/me/** request carries X-School-DocumentId. Against an API
 *     whose CORS allow-list omits that header, EVERY list dies at preflight —
 *     captured via page.on('response')/console/pageerror, with screenshots.
 *  3. After the fix: the switch lands on /dashboard/school, the home renders
 *     School B, the students roster loads, the class filter round-trips
 *     (URL param + row-count change + trigger shows the OPTION LABEL), and
 *     the C-RPT-05 results export still downloads a CSV file.
 *
 * Screenshots into tests/proofs/admin-side/. The spec is idempotent: the
 * persisted active-school pick is cleared at the end so the next run starts
 * from the legacy primary school.
 */
import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../../helpers/roles';

const SHOTS = path.resolve(process.cwd(), 'tests/proofs/admin-side');
const STUDENTS = '/dashboard/school/students';
const ACTION_TIMEOUT = 30_000;

mkdirSync(SHOTS, { recursive: true });

interface Captured {
  consoleErrors: string[];
  pageErrors: string[];
  badResponses: string[];
  failedRequests: string[];
}

function attachCapture(page: Page): Captured {
  const captured: Captured = {
    consoleErrors: [],
    pageErrors: [],
    badResponses: [],
    failedRequests: [],
  };
  page.on('console', (message) => {
    if (message.type() === 'error') {
      captured.consoleErrors.push(message.text().slice(0, 400));
    }
  });
  page.on('pageerror', (error) => {
    captured.pageErrors.push(error.message.slice(0, 400));
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      captured.badResponses.push(
        `${response.status()} ${response.request().method()} ${response.url()}`,
      );
    }
  });
  page.on('requestfailed', (request) => {
    // Dev-server chunk hiccups are noise; only the API surface matters here.
    if (request.url().includes('/api/')) {
      captured.failedRequests.push(`${request.failure()?.errorText} ${request.url()}`);
    }
  });
  return captured;
}

test.describe.configure({ mode: 'serial', timeout: 240_000 });

let page: Page;
let captured: Captured;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  captured = attachCapture(page);
  await loginAs(page, 'schoolAdmin');
});

test.afterAll(async () => {
  // Leave no persisted school pick behind — the next run must start from the
  // legacy primary school so the reproduction is deterministic.
  await page.evaluate(() => window.localStorage.removeItem('school.activeSchoolDocumentId'));
  await page.close();
});

test('students roster loads before any school pick', async () => {
  await page.goto(STUDENTS);
  await expect(page.locator('[data-slot="school-students-row"]').first()).toBeVisible({
    timeout: ACTION_TIMEOUT,
  });
  await page.screenshot({
    path: path.join(SHOTS, '01-students-before-switch.png'),
    fullPage: true,
  });
});

test('switching schools keeps every school-admin list loading', async () => {
  // The switcher menu lists every administered school ("Your schools").
  await page.getByTestId('school-switcher').click();
  const menu = page.getByRole('menuitem').filter({ hasText: 'School B' });
  await expect(menu).toBeVisible({ timeout: ACTION_TIMEOUT });
  await page.screenshot({ path: path.join(SHOTS, '02-switcher-open.png'), fullPage: true });
  await menu.click();

  // The pick resets the portal to the school home — and from now on every
  // /api/schools/me/** call carries X-School-DocumentId. Against the broken
  // CORS allow-list this is where every list dies at preflight.
  await page.waitForURL(/\/dashboard\/school$/, { timeout: ACTION_TIMEOUT });
  await page.waitForTimeout(2_500);
  await page.screenshot({ path: path.join(SHOTS, '03-school-b-home.png'), fullPage: true });

  const roster = page.locator('[data-slot="school-students-row"]');
  await page.goto(STUDENTS);
  await page.waitForTimeout(2_500);
  await page.screenshot({ path: path.join(SHOTS, '04-school-b-students.png'), fullPage: true });

  // THE regression: the roster must render rows for the switched-to school.
  // (Before the fix this fails: every /schools/me/** request is blocked by the
  // CORS preflight rejection of X-School-DocumentId and the kit shows its
  // error arm.)
  expect(
    await roster.count(),
    `schools list should load after a switch — captured: ${JSON.stringify({
      consoleErrors: captured.consoleErrors.slice(0, 4),
      failedRequests: captured.failedRequests.slice(0, 4),
      badResponses: captured.badResponses.slice(0, 4),
    })}`,
  ).toBeGreaterThan(0);
  expect(captured.failedRequests, 'no /api request may fail at preflight').toEqual([]);
});

test('the class filter round-trips (URL, rows, label not key)', async () => {
  await page.goto(STUDENTS);
  await expect(page.locator('[data-slot="school-students-row"]').first()).toBeVisible({
    timeout: ACTION_TIMEOUT,
  });
  const before = await page.locator('[data-slot="school-students-row"]').count();

  const classSelect = page.getByRole('combobox').first();
  await expect(classSelect).toContainText(/all classes/i);
  await classSelect.click();
  const option = page.getByRole('option').filter({ hasText: 'EAL/D 8A' }).first();
  await expect(option).toBeVisible({ timeout: ACTION_TIMEOUT });
  await page.screenshot({ path: path.join(SHOTS, '05-class-filter-open.png'), fullPage: true });
  await option.click();

  await page.waitForTimeout(2_000);
  await expect(page).toHaveURL(/students\?class=/);
  // The trigger must show the option LABEL, never the raw documentId key.
  await expect(classSelect).not.toContainText(/^[a-z0-9]{20,}$/);
  const after = await page.locator('[data-slot="school-students-row"]').count();
  expect(after).toBeGreaterThan(0);
  expect(after).not.toBe(before);
  await page.screenshot({ path: path.join(SHOTS, '06-class-filter-applied.png'), fullPage: true });

  // Resetting to All classes removes the param and restores the roster page.
  await classSelect.click();
  await page.getByRole('option', { name: /all classes/i }).first().click();
  await page.waitForTimeout(2_000);
  await expect(page).not.toHaveURL(/class=/);
  await page.screenshot({ path: path.join(SHOTS, '07-class-filter-cleared.png'), fullPage: true });
});

test('the results export still downloads a CSV file', async () => {
  await page.goto('/dashboard/school/analytics');
  const download = page.waitForEvent('download', { timeout: ACTION_TIMEOUT });
  await page
    .getByRole('button', { name: /export/i })
    .first()
    .click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/\.csv$/i);
  await page.screenshot({ path: path.join(SHOTS, '08-export.png'), fullPage: true });
});
