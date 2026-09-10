/**
 * Multi-tenant school switcher — the rail school block, the "Your schools"
 * menu, the active-school header on every /api/schools/me/** call, and the
 * persistence of the pick across a reload.
 *
 * Fixture: the SEED. schooladmin-a administers BOTH demo schools (School A
 * primary, School B secondary — schooltest-api seed + bootstrap backfill).
 * Every assertion is content-level: names, the tick, the switched school's
 * name on screen, and the X-School-DocumentId header actually carried by the
 * refetch. Screenshots land beside the spec output at 1440×900.
 */
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';
import { roleCredentials } from './helpers/credentials';

const SCHOOL_ADMIN = roleCredentials('schoolAdmin');
const API = process.env.API_BASE_URL ?? 'http://127.0.0.1:5500';
const SCHOOL_A_NAME = 'SchoolTest Demo School A';
const SCHOOL_B_NAME = 'SchoolTest Demo School B';

const en = loadMessages('en');

async function apiMemberships(): Promise<Array<{ documentId: string; name: string | null }>> {
  const login = await fetch(`${API}/api/auth/local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: SCHOOL_ADMIN.email, password: SCHOOL_ADMIN.password }),
  });
  const { jwt } = (await login.json()) as { jwt: string };
  const res = await fetch(`${API}/api/schools/me/memberships`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.status).toBe(200);
  const body = (await res.json()) as { data: Array<{ documentId: string; name: string | null }> };
  return body.data;
}

async function signIn(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true }).fill(SCHOOL_ADMIN.email);
  await page.getByLabel(cat(en, 'Auth.portal.passwordLabel'), { exact: true }).fill(SCHOOL_ADMIN.password);
  await page.getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true }).click();
  await page.waitForURL('**/dashboard/school', { timeout: 30_000 });
}

async function openSwitcher(page: Page): Promise<void> {
  await page.getByTestId('school-switcher').click();
  await page.getByRole('menu').getByText(SCHOOL_A_NAME).waitFor({ timeout: 10_000 });
}

test.describe('multi-tenant school switcher', () => {
  test('block, menu, switch, header and persistence', async ({ page }) => {
    const memberships = await apiMemberships();
    const schoolA = memberships.find((m) => m.name === SCHOOL_A_NAME);
    const schoolB = memberships.find((m) => m.name === SCHOOL_B_NAME);
    expect(schoolA, 'seed fixture: admin A administers School A').toBeTruthy();
    expect(schoolB, 'seed fixture: admin A administers School B').toBeTruthy();

    // Watch every /api/schools/me/** request the app makes so the header can
    // be asserted on the REAL refetch, not a synthetic one.
    const schoolHeader: (string | null)[] = [];
    await page.route('**/api/schools/me/**', async (route) => {
      const headers = await route.request().allHeaders();
      schoolHeader.push(headers['x-school-documentid'] ?? null);
      await route.continue();
    });

    await signIn(page);

    // The rail shows the ACTIVE school (persisted null → legacy primary A).
    const switcher = page.getByTestId('school-switcher');
    await expect(switcher).toBeVisible({ timeout: 20_000 });
    await expect(switcher).toContainText(SCHOOL_A_NAME);
    await page.screenshot({ path: 'test-results/school-switcher-closed.png' });

    // Open: BOTH schools, tick on the active one.
    await openSwitcher(page);
    const menu = page.getByRole('menu');
    await expect(menu.getByText(SCHOOL_A_NAME)).toBeVisible();
    await expect(menu.getByText(SCHOOL_B_NAME)).toBeVisible();
    await expect(menu.locator('[aria-current="true"]')).toContainText(SCHOOL_A_NAME);
    await page.screenshot({ path: 'test-results/school-switcher-open.png' });

    // Switch to School B: the portal resets to the school home showing B —
    // asserted on the FULL name (the home heading and the trigger's
    // aria-label), because the rail block truncates both schools identically.
    await menu.getByText(SCHOOL_B_NAME).click();
    await expect(page).toHaveURL(/\/dashboard\/school$/);
    await expect(
      page.getByRole('heading', { name: SCHOOL_B_NAME, exact: true }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(switcher).toHaveAttribute('aria-label', new RegExp(`^${SCHOOL_B_NAME}`), {
      timeout: 20_000,
    });

    // The real refetch carried the header (at least one /schools/me call after
    // the pick named School B).
    await expect
      .poll(() => schoolHeader.some((value) => value === schoolB?.documentId), {
        timeout: 20_000,
        message: 'a /api/schools/me/** request carried X-School-DocumentId = School B',
      })
      .toBe(true);
    await page.screenshot({ path: 'test-results/school-switcher-switched.png' });

    // Persistence: the pick survives a reload.
    await page.reload();
    await expect(page.getByTestId('school-switcher')).toHaveAttribute(
      'aria-label',
      new RegExp(`^${SCHOOL_B_NAME}`),
      { timeout: 20_000 },
    );
  });

  test('other portals keep their rail: a teacher has no switcher', async ({ page }) => {
    const TEACHER = roleCredentials('teacher');
    await page.goto('/sign-in');
    await page.getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true }).fill(TEACHER.email);
    await page.getByLabel(cat(en, 'Auth.portal.passwordLabel'), { exact: true }).fill(TEACHER.password);
    await page.getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true }).click();
    await page.waitForURL('**/dashboard/**', { timeout: 30_000 });
    await expect(page.getByTestId('school-switcher')).toHaveCount(0);
  });
});
