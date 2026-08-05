import { expect, test, type Page } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';

// School admin dashboard redesign (tasks/aug-5-2026/school-admin-dashboard-redesign.md).
// Drives the five redesigned surfaces against the REAL API on :5500 with the
// seeded school_admin, asserting the spec's structure and copy — never a fixture.
const en = loadMessages('en');

const SCHOOL_ADMIN = {
  email: 'schooladmin-a@schooltest.local',
  password: 'pEbjxVnJ4PPYiv8D!A1',
};

const API = process.env.API_BASE_URL ?? 'http://127.0.0.1:5500';

async function signIn(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(SCHOOL_ADMIN.email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(SCHOOL_ADMIN.password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  await page.waitForURL('**/dashboard/school', { timeout: 30_000 });
}

async function apiJson(path: string): Promise<Record<string, unknown>> {
  const login = await fetch(`${API}/api/auth/local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: SCHOOL_ADMIN.email, password: SCHOOL_ADMIN.password }),
  });
  const { jwt } = (await login.json()) as { jwt: string };
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${jwt}` } });
  return (await res.json()) as Record<string, unknown>;
}

const railLink = (page: Page, key: string) =>
  page.locator(`a[data-sidebar="menu-button"][aria-label="${cat(en, `Shell.nav.${key}`)}"]`);

test.describe('school admin dashboard redesign', () => {
  test('sidebar: School / Classes / Teachers / Students, Account pinned in the footer', async ({
    page,
  }) => {
    await signIn(page);

    for (const key of ['school', 'classes', 'teachers', 'students', 'account']) {
      await expect(railLink(page, key)).toBeVisible({ timeout: 20_000 });
    }

    // Removed from the rail by spec §Sidebar Navigation.
    await expect(
      page.locator('a[data-sidebar="menu-button"][href$="/school/participation"]'),
    ).toHaveCount(0);
    await expect(
      page.locator('a[data-sidebar="menu-button"][href$="/school/analytics"]'),
    ).toHaveCount(0);

    // Account is pinned in the footer behind a divider, not in the primary list.
    const footer = page.locator('[data-slot="sidebar-footer"]');
    await expect(footer.locator(`a[aria-label="${cat(en, 'Shell.nav.account')}"]`)).toBeVisible();
    await expect(footer.locator('[data-slot="separator"]')).toHaveCount(1);
  });

  test('School: diagnostics + progress sections, readiness banner, classes list', async ({
    page,
  }) => {
    await signIn(page);
    const home = page.locator('[data-slot="school-home"]');
    await expect(home).toBeVisible({ timeout: 20_000 });

    const me = (await apiJson('/api/schools/me')).data as { name: string; plan: string };
    await expect(home.getByRole('heading', { level: 1, name: me.name })).toBeVisible();

    await expect(home.locator('[data-slot="school-diagnostics"]')).toBeVisible();
    await expect(home.locator('[data-slot="school-progress"]')).toBeVisible();
    await expect(home.locator('[data-slot="school-classes"]')).toBeVisible();

    await expect(
      home.getByText(cat(en, 'SchoolAdmin.home.diagnosticsTitle'), { exact: true }),
    ).toBeVisible();
    await expect(
      home.getByText(cat(en, 'SchoolAdmin.home.progressTitle'), { exact: true }),
    ).toBeVisible();

    // "Reading tests completed" denominator is the plan's reading allowance.
    const ent = (await apiJson('/api/schools/me/entitlement')).data as {
      allowances: { test_type: string; total: number }[];
      plan: string;
    };
    expect(ent.plan).toBe('trial');
    expect(ent.allowances.find((a) => a.test_type === 'reading')?.total).toBe(2);
    await expect(home.getByText(/\/\s*2/).first()).toBeVisible();

    // Mainstream readiness is an info banner on trial, not metric cards.
    expect(me.plan).toBe('trial');
    await expect(home.locator('[data-slot="school-readiness"]')).toBeVisible();

    // Read-only: no editable control anywhere on the page.
    await expect(home.locator('input, textarea, select')).toHaveCount(0);
  });

  test('Classes: reshaped table columns and the Add class modal with CSV import', async ({
    page,
  }) => {
    await signIn(page);
    await railLink(page, 'classes').click();
    await page.waitForURL('**/dashboard/school/classes', { timeout: 20_000 });

    await expect(page.getByRole('heading', { level: 1 })).toContainText(cat(en, 'Classes.title'));
    await expect(page.getByText(cat(en, 'Classes.description'), { exact: true })).toBeVisible();

    for (const col of ['columnClass', 'columnTeacher', 'columnStudents', 'columnTestsCompleted']) {
      await expect(
        page.getByText(cat(en, `Classes.table.${col}`), { exact: true }).first(),
      ).toBeVisible();
    }

    await page.getByRole('button', { name: cat(en, 'Classes.addButton'), exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await expect(dialog.getByText(cat(en, 'Classes.addForm.title'), { exact: true })).toBeVisible();

    // Class details + the shared import flow: template, drop zone, paste area.
    // exact:false — FieldShell appends a required "*" to the accessible name.
    await expect(dialog.getByLabel(cat(en, 'Classes.addForm.name'), { exact: false })).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: cat(en, 'StudentImport.downloadTemplate'), exact: true }),
    ).toBeVisible();
    await expect(dialog.locator('[data-slot="student-import-fields"]')).toBeVisible();
    await expect(dialog.getByText(cat(en, 'StudentImport.dropPrompt'), { exact: false })).toBeVisible();
    await expect(dialog.getByLabel(cat(en, 'StudentImport.pasteLabel'), { exact: true })).toBeVisible();
  });

  test('Classes: the CSV template downloads with the spec header row', async ({ page }) => {
    await signIn(page);
    await page.goto('/dashboard/school/classes');
    await page.getByRole('button', { name: cat(en, 'Classes.addButton'), exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page
        .getByRole('dialog')
        .getByRole('button', { name: cat(en, 'StudentImport.downloadTemplate'), exact: true })
        .click(),
    ]);
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    const header = Buffer.concat(chunks).toString('utf8').split('\n')[0].trim();
    expect(header).toBe('first name,last name,email,first language,proficiency level');
  });

  test('Teachers: roster renders live rows and the edit modal opens', async ({ page }) => {
    await signIn(page);
    await railLink(page, 'teachers').click();
    await page.waitForURL('**/dashboard/school/teachers', { timeout: 20_000 });

    await expect(page.getByRole('heading', { level: 1 })).toContainText(cat(en, 'Teachers.title'));
    await expect(
      page.getByRole('button', { name: cat(en, 'Teachers.addButton'), exact: true }),
    ).toBeVisible();

    const roster = (await apiJson('/api/schools/me/teachers')).data as { email: string }[];
    expect(roster.length).toBeGreaterThan(0);
    await expect(page.getByText(roster[0].email, { exact: true }).first()).toBeVisible();

    for (const col of ['columnName', 'columnEmail', 'columnClasses']) {
      await expect(
        page.getByText(cat(en, `Teachers.table.${col}`), { exact: true }).first(),
      ).toBeVisible();
    }
  });

  test('Students: live name search plus additive class and level filters', async ({ page }) => {
    await signIn(page);
    await railLink(page, 'students').click();
    await page.waitForURL('**/dashboard/school/students', { timeout: 20_000 });

    const screen = page.locator('[data-slot="school-students"]');
    await expect(screen).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByRole('button', { name: cat(en, 'SchoolStudents.importButton'), exact: true }),
    ).toBeVisible();

    for (const col of ['columnName', 'columnClass', 'columnFirstLanguage', 'columnLevel', 'columnDiagnostic']) {
      await expect(
        screen.getByText(cat(en, `SchoolStudents.table.${col}`), { exact: true }).first(),
      ).toBeVisible();
    }

    const search = screen.getByLabel(cat(en, 'SchoolStudents.filters.searchLabel'), { exact: true });
    await expect(search).toBeVisible();

    const rowsBefore = await screen.getByRole('row').count();
    expect(rowsBefore).toBeGreaterThan(1);
    await search.fill('zzzznomatchzzzz');
    await expect
      .poll(async () => screen.getByRole('row').count(), { timeout: 10_000 })
      .toBeLessThan(rowsBefore);
    await search.fill('');

    await expect(
      screen.getByLabel(cat(en, 'SchoolStudents.filters.classLabel'), { exact: true }),
    ).toBeVisible();
    await expect(
      screen.getByLabel(cat(en, 'SchoolStudents.filters.levelLabel'), { exact: true }),
    ).toBeVisible();
  });

  test('Account: tabs, plan and seats, and the 2x2 allowance grid from the live API', async ({
    page,
  }) => {
    await signIn(page);
    await railLink(page, 'account').click();
    await page.waitForURL('**/dashboard/school/account', { timeout: 20_000 });

    for (const key of ['account', 'settings', 'signout'] as const) {
      await expect(
        page.getByRole('tab', { name: cat(en, `SchoolAdmin.account.tabs.${key}`), exact: true }),
      ).toBeVisible();
    }

    await expect(page.locator('[data-slot="account-details-card"]')).toBeVisible();
    await expect(page.locator('[data-slot="account-plan-card"]')).toBeVisible();

    const ent = (await apiJson('/api/schools/me/entitlement')).data as {
      allowances: { test_type: string; remaining: number }[];
      seats_used: number;
      seats_total: number;
      plan: string;
    };

    // Trial: reading 2 remaining, the other three 0 — straight from the API.
    expect(ent.plan).toBe('trial');
    expect(ent.allowances.find((a) => a.test_type === 'reading')?.remaining).toBe(2);
    for (const type of ['listening', 'writing', 'speaking']) {
      expect(ent.allowances.find((a) => a.test_type === type)?.remaining).toBe(0);
    }

    const allowance = page.locator('[data-slot="account-allowance-card"]');
    await expect(allowance).toBeVisible();
    for (const type of ['reading', 'listening', 'writing', 'speaking'] as const) {
      await expect(
        allowance.getByText(cat(en, `SchoolAdmin.entitlement.testType.${type}`), { exact: true }),
      ).toBeVisible();
    }

    // The "Full license" row is text, not a button — there is no self-serve upgrade.
    await expect(
      page.getByText(cat(en, 'SchoolAdmin.account.fullLicenseContact'), { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: cat(en, 'SchoolAdmin.account.fullLicenseContact') }),
    ).toHaveCount(0);

    // Settings is an explicit placeholder for MVP.
    await page
      .getByRole('tab', { name: cat(en, 'SchoolAdmin.account.tabs.settings'), exact: true })
      .click();
    await expect(
      page.getByText(cat(en, 'SchoolAdmin.account.settingsEmptyTitle'), { exact: true }),
    ).toBeVisible();
  });

  test('legacy /school/children deep links redirect to /school/students', async ({ page }) => {
    await signIn(page);
    await page.goto('/dashboard/school/children');
    await page.waitForURL('**/dashboard/school/students', { timeout: 20_000 });
    await expect(page.locator('[data-slot="school-students"]')).toBeVisible();
  });
});
