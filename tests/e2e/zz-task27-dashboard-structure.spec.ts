import { expect, test, type Page } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';
import { roleCredentials } from './helpers/credentials';

// Task 27 (st-mvp-pivot) targeted live checks — NOT part of the suite.
// Seeded credentials from .qa/DECISIONS.md D-04. Verifies:
//  - /dashboard redirects a resolved school_admin to /dashboard/school and a
//    teacher to /dashboard/teach (spec §15 dedicated dashboards)
//  - the school index renders the real C-SCH-01 payload (name + status chips)
//  - SchoolAdminGuard / TeacherGuard bounce wrong roles; no token -> /sign-in
//  - the parent portal still renders unchanged for a parent account
const en = loadMessages('en');

const SCHOOL_ADMIN = roleCredentials('schoolAdmin');
const TEACHER = roleCredentials('teacher');
const PARENT = roleCredentials('parent');

// Seeded school behind schooladmin-a (cross-checked: GET /api/schools/me).
const SCHOOL_NAME = 'SchoolTest Demo School A';

async function signIn(
  page: Page,
  email: string,
  password: string,
  finalUrl: string,
): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  await page.waitForURL(`**${finalUrl}`, { timeout: 30_000 });
}

test.describe('task 27: dashboard route structure + role redirect', () => {
  test('school_admin: /dashboard redirects to /dashboard/school with real C-SCH-01 data', async ({
    page,
  }) => {
    await signIn(page, SCHOOL_ADMIN.email, SCHOOL_ADMIN.password, '/dashboard/school');
    const home = page.locator('[data-surface="school-admin-home"]');
    await expect(home).toBeVisible({ timeout: 20_000 });
    await expect(home.getByRole('heading', { name: SCHOOL_NAME })).toBeVisible();

    // The two lifecycle badges moved off the analytics home into
    // Account > My account > School details (redesign spec section 5).
    await page.goto('/dashboard/school/account');
    const details = page.locator('[data-slot="account-details-card"]');
    await expect(details).toBeVisible({ timeout: 20_000 });
    await expect(
      details.getByText(cat(en, 'SchoolAdmin.accountStatus.active'), { exact: true }),
    ).toBeVisible();
    await expect(
      details.getByText(cat(en, 'SchoolAdmin.onboardingStatus.not_started'), { exact: true }),
    ).toBeVisible();

    // The thin section pages behind the task-25 nav items render, not 404.
    for (const [path, surface] of [
      ['/dashboard/school/classes', 'school-admin-classes'],
      ['/dashboard/school/students', 'school-admin-students'],
      ['/dashboard/school/teachers', 'school-admin-teachers'],
    ] as const) {
      await page.goto(path);
      await expect(page.locator(`[data-surface="${surface}"]`)).toBeVisible({ timeout: 20_000 });
    }

    // TeacherGuard keeps a school_admin out of the teacher section.
    await page.goto('/dashboard/teach');
    await page.waitForURL('**/dashboard/school', { timeout: 20_000 });
    await expect(page.locator('[data-surface="teacher-home"]')).toHaveCount(0);
  });

  test('teacher: /dashboard renders the teacher dashboard; school section bounces', async ({
    page,
  }) => {
    await signIn(page, TEACHER.email, TEACHER.password, '/dashboard');
    await expect(page.locator('[data-surface="teacher-dashboard"]')).toBeVisible({
      timeout: 20_000,
    });

    // SchoolAdminGuard bounces a teacher to the role-filtered dashboard.
    await page.goto('/dashboard/school');
    await page.waitForURL('**/dashboard', { timeout: 20_000 });
    await expect(page.locator('[data-surface="teacher-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-surface="school-admin-home"]')).toHaveCount(0);
  });

  test('parent: portal masked flag-OFF; school + teach sections bounce to /dashboard', async ({
    page,
  }) => {
    await signIn(page, PARENT.email, PARENT.password, '/dashboard');
    // Flag OFF (NEXT_PUBLIC_PARENT_VIEWS_ENABLED=false): the parent portal is
    // masked behind the not-available state (W11). The (portal) routes still
    // resolve; they render the mask, not the old parent surfaces.
    await expect(page.locator('[data-slot="parent-views-unavailable"]')).toBeVisible({
      timeout: 20_000,
    });
    expect(page.url()).not.toContain('/dashboard/school');
    expect(page.url()).not.toContain('/dashboard/teach');

    await page.goto('/dashboard/school');
    await page.waitForURL('**/dashboard', { timeout: 20_000 });
    await expect(page.locator('[data-slot="parent-views-unavailable"]')).toBeVisible({
      timeout: 20_000,
    });

    await page.goto('/dashboard/teach');
    await page.waitForURL('**/dashboard', { timeout: 20_000 });
    await expect(page.locator('[data-slot="parent-views-unavailable"]')).toBeVisible({
      timeout: 20_000,
    });

    // Existing parent routes still load under the (portal) route group, masked.
    await page.goto('/dashboard/children');
    await expect(page).toHaveURL(/\/dashboard\/children/, { timeout: 20_000 });
    await expect(page.locator('[data-slot="parent-views-unavailable"]')).toBeVisible({
      timeout: 20_000,
    });
    await page.goto('/dashboard/settings');
    await expect(page).toHaveURL(/\/dashboard\/settings/, { timeout: 20_000 });
  });

  test('signed out: /dashboard/school and /dashboard/teach bounce to /sign-in', async ({
    page,
  }) => {
    await page.goto('/dashboard/school');
    await page.waitForURL('**/sign-in', { timeout: 20_000 });

    await page.goto('/dashboard/teach');
    await page.waitForURL('**/sign-in', { timeout: 20_000 });
  });
});
