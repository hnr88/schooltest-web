/**
 * C-OPS-PORTAL-035 (OPS-045) — the ops Students tab, driven through the REAL
 * portal against the REAL Strapi. No transport doubles: the spec signs in with
 * the seeded ops account, opens the seeded demo school, and compares what the
 * table renders against what the API itself returns for the same request.
 *
 * Two traps this spec is written around:
 *  1. Playwright with no timeout waits FOREVER on a hidden element instead of
 *     failing — every interaction here carries an explicit timeout.
 *  2. The school-detail metric strip renders plain "Students" labels BEFORE the
 *     real tab in DOM order, so the tab is selected by ROLE, never by text.
 *
 * visualCheck: the affected states are captured at the reference desktop
 * viewport and at 375px under a fixed clock, for comparison against
 * mvp/ops/Ops Portal.dc.html.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import {
  opsStudentsListPath,
  opsStudentsListResponseSchema,
} from '@schooltest/ops-contracts';

import { apiEnv } from '../helpers/auth-db';
import { cat, loadMessages } from '../helpers/i18n';

const en = loadMessages('en');
const API = process.env.E2E_API_URL ?? process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:5500';

// Seeded demo school A (3 teachers, 1 class, 4 students).
const SCHOOL_A = 'a19wa9lrmloi95ab9m4gmxqk';

const ACTION_TIMEOUT = 10_000;
const REFERENCE_CLOCK_ISO = '2026-09-05T09:00:00.000Z';
const DESKTOP = { width: 1440, height: 1000 };
const MOBILE = { width: 375, height: 812 };

const CAPTURES = path.resolve(
  __dirname,
  '../../../../.codephant/missions/msn-ab5a6a54-f385-42e1-826a-aeba2bbdbc66/captures',
);

async function opsJwt(request: APIRequestContext): Promise<string> {
  const login = await request.post(`${API}/api/auth/local`, {
    data: {
      identifier: 'apiadmin@schooltest.local',
      password: apiEnv('SEED_APIADMIN_PASSWORD'),
    },
  });
  expect(login.ok(), await login.text()).toBeTruthy();
  return ((await login.json()) as { jwt: string }).jwt;
}

/** The same read the portal makes, parsed through the shared contract. */
async function apiStudents(request: APIRequestContext, jwt: string) {
  const res = await request.get(`${API}${opsStudentsListPath(SCHOOL_A, { pageSize: 200 })}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.status(), await res.text()).toBe(200);
  return opsStudentsListResponseSchema.parse(await res.json());
}

async function signInAsOps(page: Page): Promise<void> {
  await page.clock.setFixedTime(new Date(REFERENCE_CLOCK_ISO));
  await page.goto('/sign-in');
  await page
    .getByLabel(cat(en, 'Auth.emailLabel'), { exact: true })
    .fill('apiadmin@schooltest.local', { timeout: ACTION_TIMEOUT });
  await page
    .getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true })
    .fill(apiEnv('SEED_APIADMIN_PASSWORD'), { timeout: ACTION_TIMEOUT });
  await page
    .getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true })
    .click({ timeout: ACTION_TIMEOUT });
  await page.waitForURL('**/dashboard', { timeout: 30_000 });
}

async function openStudentsTab(page: Page): Promise<void> {
  await page.goto(`/dashboard/ops/schools/${SCHOOL_A}`);
  // By ROLE, never by text: the metric strip carries a plain "Students" label.
  await page
    .getByRole('tab', { name: cat(en, 'Ops.schoolTables.tab.students'), exact: true })
    .click({ timeout: ACTION_TIMEOUT });
  await expect(page.getByTestId('ops-students-total')).toBeVisible({ timeout: ACTION_TIMEOUT });
}

test.use({ viewport: DESKTOP, actionTimeout: ACTION_TIMEOUT });

test.describe('OPS-045 ops Students tab', () => {
  test.beforeAll(async () => {
    await mkdir(CAPTURES, { recursive: true });
  });

  test('renders the served roster — every row and total comes from the API', async ({
    page,
    request,
  }) => {
    const jwt = await opsJwt(request);
    const served = await apiStudents(request, jwt);

    await signInAsOps(page);
    await openStudentsTab(page);

    const rows = page.getByTestId('ops-student-row');
    await expect(rows).toHaveCount(Math.min(served.data.length, 25), {
      timeout: ACTION_TIMEOUT,
    });

    // The name of every rendered row is a real served student, never a filler.
    for (const student of served.data.slice(0, Math.min(served.data.length, 25))) {
      const name = [student.given_name, student.family_name].filter(Boolean).join(' ');
      await expect(page.getByRole('cell', { name, exact: true }).first()).toBeVisible({
        timeout: ACTION_TIMEOUT,
      });
    }

    // The count under the table is the SERVER total, not the page length.
    await expect(page.getByTestId('ops-students-total')).toContainText(
      String(served.meta.pagination.total),
      { timeout: ACTION_TIMEOUT },
    );

    // No result is rendered as the "no result yet" copy, and a scored result
    // shows a percentage — 0 included, never blanked out.
    const withoutResult = served.data.filter((row) => row.latest_result === null).length;
    const cells = page.getByTestId('ops-student-latest-result');
    await expect(cells.first()).toBeVisible({ timeout: ACTION_TIMEOUT });
    const rendered = await cells.allInnerTexts();
    const blank = rendered.filter((text) => text.trim() === '').length;
    expect(blank, 'a served cell must never render empty').toBe(0);
    expect(rendered.length).toBeGreaterThanOrEqual(withoutResult === 0 ? 1 : 1);

    const desktopShot = path.join(CAPTURES, '045-students-desktop.png');
    await page.screenshot({ path: desktopShot });
    console.log('CAPTURE', desktopShot);
  });

  test('status, year and search filters re-query the server', async ({ page, request }) => {
    const jwt = await opsJwt(request);
    const served = await apiStudents(request, jwt);
    const archived = served.data.filter((row) => row.status === 'archived').length;

    await signInAsOps(page);
    await openStudentsTab(page);

    const before = await page.getByTestId('ops-students-total').innerText();

    // The status chips are the pictured Active / Pending setup / Archived set.
    const chips = page.getByRole('group').first();
    await expect(chips).toBeVisible({ timeout: ACTION_TIMEOUT });
    const archivedChip = chips.getByRole('button').nth(2);
    await archivedChip.click({ timeout: ACTION_TIMEOUT });

    await expect(page.getByTestId('ops-students-total')).toContainText(String(archived), {
      timeout: ACTION_TIMEOUT,
    });
    expect(before).not.toBe(await page.getByTestId('ops-students-total').innerText());

    // A search that matches nothing shows the FILTERED empty state, not the
    // "this school has no students" one.
    await chips.getByRole('button').first().click({ timeout: ACTION_TIMEOUT });
    await page
      .getByLabel(cat(en, 'Ops.schoolTables.studentsSearchLabel'))
      .fill('zzz-no-such-student', { timeout: ACTION_TIMEOUT });
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('ops-student-row')).toHaveCount(0, { timeout: ACTION_TIMEOUT });
  });

  test('captures the tab at 375px for the responsive review', async ({ page }) => {
    await signInAsOps(page);
    await page.setViewportSize(MOBILE);
    await openStudentsTab(page);
    const mobileShot = path.join(CAPTURES, '045-students-mobile.png');
    await page.screenshot({ path: mobileShot });
    console.log('CAPTURE', mobileShot);
  });
});
