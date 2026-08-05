import { expect, test, type Page } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';
import { skipWhenParentPortalMasked } from './helpers/parent-portal';

// Task 25 (st-mvp-pivot) targeted live checks — NOT part of the suite.
// Seeded credentials from .qa/DECISIONS.md D-04. Verifies:
//  - school_admin nav items resolve per role (teacher absent / school_admin present)
//  - TeacherGuard now redirects a signed-in non-teacher off /dashboard/reports
//  - the parent dashboard surface still renders unchanged
const en = loadMessages('en');

const TEACHER = { email: 'teacher@schooltest.local', password: 'www9Livfmzyk4RM1!A1' };
const SCHOOL_ADMIN = { email: 'schooladmin-a@schooltest.local', password: 'pEbjxVnJ4PPYiv8D!A1' };
const PARENT = { email: 'parent@schooltest.local', password: 'yvmnVObAiaOJw2C1!A1' };

async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  await page.waitForURL('**/dashboard');
}

// Scope to the rail's menu buttons: the topbar breadcrumb duplicates the active
// page's label as role="link", which trips strict mode on an unscoped lookup.
const navLink = (page: Page, key: string) =>
  page.locator(`a[data-sidebar="menu-button"][aria-label="${cat(en, `Shell.nav.${key}`)}"]`);

test.describe('task 25: role nav wiring + guard fixes', () => {
  test('teacher: school_admin items absent, reports present', async ({ page }) => {
    await signIn(page, TEACHER.email, TEACHER.password);
    await expect(navLink(page, 'reports')).toBeVisible({ timeout: 20_000 });
    await expect(navLink(page, 'school')).toHaveCount(0);
    await expect(navLink(page, 'classes')).toHaveCount(0);
    await expect(navLink(page, 'students')).toHaveCount(0);
    await expect(navLink(page, 'teachers')).toHaveCount(0);
  });

  test('school_admin: school items appear; TeacherGuard route bounces to /dashboard', async ({
    page,
  }) => {
    await signIn(page, SCHOOL_ADMIN.email, SCHOOL_ADMIN.password);
    await expect(navLink(page, 'school')).toBeVisible({ timeout: 20_000 });
    await expect(navLink(page, 'classes')).toBeVisible();
    await expect(navLink(page, 'teachers')).toBeVisible();
    await expect(navLink(page, 'students')).toBeVisible();
    // Pinned to the rail footer behind a divider (spec §Sidebar Navigation).
    await expect(navLink(page, 'account')).toBeVisible();
    // Dropped from the rail by the same spec section. Located by href because
    // their Shell.nav.* labels were removed along with the nav entries.
    await expect(page.locator('a[data-sidebar="menu-button"][href$="/school/participation"]')).toHaveCount(0);
    await expect(page.locator('a[data-sidebar="menu-button"][href$="/school/analytics"]')).toHaveCount(0);
    await expect(navLink(page, 'reports')).toHaveCount(0);

    await page.goto('/dashboard/reports');
    await page.waitForURL('**/dashboard', { timeout: 20_000 });
    await expect(page.locator('[data-surface="teacher-report-list"]')).toHaveCount(0);
  });

  test('parent: masked state renders; reports + school items absent; reports route bounces', async ({
    page,
  }) => {
    await signIn(page, PARENT.email, PARENT.password);
    // Flag OFF (NEXT_PUBLIC_PARENT_VIEWS_ENABLED=false): the parent portal is
    // masked, so a parent sees the not-available state, not the overview (W11).
    await expect(page.locator('[data-slot="parent-views-unavailable"]')).toBeVisible({
      timeout: 20_000,
    });
    await expect(navLink(page, 'overview')).toHaveCount(0);
    await expect(navLink(page, 'reports')).toHaveCount(0);
    await expect(navLink(page, 'school')).toHaveCount(0);

    await page.goto('/dashboard/reports');
    await page.waitForURL('**/dashboard', { timeout: 20_000 });
    await expect(page.locator('[data-slot="parent-views-unavailable"]')).toBeVisible();
  });
});

// The four parent-portal destinations are scoped by ROLE, not by the release
// flag. With NEXT_PUBLIC_PARENT_VIEWS_ENABLED off the whole portal is masked
// from everyone, so the school admin rail happens to look right; the leak is
// only observable with the flag ON, which is the state these legs pin. Run them
// with the flag exported:
//   NEXT_PUBLIC_PARENT_VIEWS_ENABLED=true pnpm exec playwright test \
//     tests/e2e/zz-task25-role-nav.spec.ts --workers=1 --grep "flag ON"
const PARENT_PORTAL_NAV_KEYS = ['overview', 'myChildren', 'search', 'settings'] as const;

// The rail the redesign spec §Sidebar Navigation defines for a school admin:
// School / Classes / Teachers / Students, with Account pinned in the footer.
const SCHOOL_ADMIN_PRIMARY_KEYS = ['school', 'classes', 'teachers', 'students'] as const;

test.describe('parent portal is role-scoped, not flag-scoped (flag ON)', () => {
  skipWhenParentPortalMasked();

  test('school_admin: no parent-portal entry reaches the rail', async ({ page }) => {
    await signIn(page, SCHOOL_ADMIN.email, SCHOOL_ADMIN.password);
    await expect(navLink(page, 'school')).toBeVisible({ timeout: 20_000 });
    for (const key of PARENT_PORTAL_NAV_KEYS) {
      await expect(navLink(page, key)).toHaveCount(0);
    }
    // Exactly the spec's four primary destinations — nothing appended above them.
    await expect(page.locator('[data-slot="sidebar-content"] nav a')).toHaveCount(
      SCHOOL_ADMIN_PRIMARY_KEYS.length,
    );
    await expect(navLink(page, 'account')).toBeVisible();
  });

  test('parent: the same entries are the rail', async ({ page }) => {
    await signIn(page, PARENT.email, PARENT.password);
    for (const key of PARENT_PORTAL_NAV_KEYS) {
      await expect(navLink(page, key)).toBeVisible({ timeout: 20_000 });
    }
    for (const key of SCHOOL_ADMIN_PRIMARY_KEYS) {
      await expect(navLink(page, key)).toHaveCount(0);
    }
    await expect(navLink(page, 'account')).toHaveCount(0);
  });
});
