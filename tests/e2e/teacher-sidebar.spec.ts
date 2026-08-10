import path from 'node:path';

import { expect, test } from '@playwright/test';

import { cat } from './helpers/i18n';
import {
  ACCOUNTS,
  DESKTOP,
  PARENT_NAV,
  SCREENSHOTS,
  TEACHER_NAV,
  assertNoParentFrame,
  en,
  groupLabels,
  installNavSampler,
  navLink,
  navLinks,
  roleSlug,
  sidebar,
  signIn,
} from './helpers/teacher-rail';

// Task 031 / .qa/DECISIONS.md A4 — ONE role-filtered shell, never a second sidebar.
// A teacher's rail is EXACTLY Dashboard · Test sessions · Results under the "Teach"
// overline; a parent and the school admin keep the rail they already had and see
// none of the three. Driven through the REAL /sign-in form against the REAL Strapi
// on :5500, with every role slug the expectations hang off read out of the REAL
// Postgres on :5540 with psql rather than assumed.
test.describe('teacher rail scoping (A4)', () => {
  test.use({ viewport: DESKTOP });

  test('the seeded accounts carry the role slugs the rail filters on', () => {
    expect(roleSlug(ACCOUNTS.teacher.email)).toBe('teacher');
    expect(roleSlug(ACCOUNTS.admin.email)).toBe('admin');
    expect(roleSlug(ACCOUNTS.parent.email)).toBe('parent');
  });

  // `useLoginMutation` seeds ['auth','me'] with the /api/auth/local user, which
  // carries no `role`, and a hard load starts with no identity at all — in both
  // windows `role?.type` is momentarily unknown. The shell must withhold the rail
  // rather than guess, or a teacher flashes the parent rail on every page load.
  test('a teacher never renders a parent rail entry, not even for one frame', async ({ page }) => {
    await installNavSampler(page);

    await signIn(page, 'teacher');
    await expect(navLinks(page)).toHaveCount(TEACHER_NAV.length, { timeout: 20_000 });
    await assertNoParentFrame(page);

    // The harder window: a HARD load carries no cached identity at all.
    await page.goto('/dashboard/results');
    await expect(navLinks(page)).toHaveCount(TEACHER_NAV.length, { timeout: 20_000 });
    await assertNoParentFrame(page);
  });

  test('a teacher sees exactly Dashboard, Test sessions and Results under "Teach"', async ({
    page,
  }) => {
    await signIn(page, 'teacher');
    await expect(navLinks(page).first()).toBeVisible({ timeout: 20_000 });
    await expect(navLinks(page)).toHaveCount(TEACHER_NAV.length);

    for (const [index, item] of TEACHER_NAV.entries()) {
      const link = navLink(page, cat(en, item.key));
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', item.href);
      await expect(navLinks(page).nth(index)).toHaveAttribute('href', item.href);
    }

    await expect(groupLabels(page)).toHaveCount(1);
    await expect(groupLabels(page)).toHaveText(cat(en, 'Shell.sidebar.groups.teach'));

    for (const item of PARENT_NAV) {
      await expect(navLink(page, cat(en, item.key))).toHaveCount(0);
    }
    await expect(navLink(page, cat(en, 'Shell.nav.reports'))).toHaveCount(0);

    await expect(sidebar(page).locator('[data-slot="user-role"]')).toHaveText(
      cat(en, 'Shell.userMenu.roles.teacher'),
    );

    await sidebar(page).screenshot({
      path: path.join(SCREENSHOTS, 'task-031-teacher-sidebar.png'),
      animations: 'disabled',
    });
    await page.screenshot({
      path: path.join(SCREENSHOTS, 'task-031-teacher-dashboard.png'),
      animations: 'disabled',
    });
  });

  test('neither teacher rail entry is a dead link — both routes render their own page', async ({
    page,
  }) => {
    await signIn(page, 'teacher');

    await navLink(page, cat(en, 'Shell.nav.testSessions')).click();
    await page.waitForURL('**/dashboard/test-sessions');
    await expect(page.locator('[data-surface="teacher-test-sessions"]')).toBeVisible({
      timeout: 20_000,
    });
    await expect(
      page.getByRole('heading', { level: 1, name: cat(en, 'Teacher.testSessions.title') }),
    ).toBeVisible();
    // Task 034 replaced this page's placeholder with the real "Start a test
    // session" panel, so the discriminator moved to the panel's own heading.
    await expect(
      page.getByRole('heading', {
        level: 2,
        name: cat(en, 'Teacher.testSessions.setup.panelTitle'),
      }),
    ).toBeVisible();
    await expect(navLink(page, cat(en, 'Shell.nav.testSessions'))).toHaveAttribute(
      'data-active',
      /.*/,
    );

    await navLink(page, cat(en, 'Shell.nav.results')).click();
    await page.waitForURL('**/dashboard/results');
    await expect(page.locator('[data-surface="teacher-results"]')).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByRole('heading', { level: 1, name: cat(en, 'Teacher.results.title') }),
    ).toBeVisible();
    await expect(page.getByText(cat(en, 'Teacher.results.placeholderTitle'))).toBeVisible();
    await expect(navLink(page, cat(en, 'Shell.nav.results'))).toHaveAttribute('data-active', /.*/);

    await page.screenshot({
      path: path.join(SCREENSHOTS, 'task-031-teacher-results.png'),
      animations: 'disabled',
    });
  });

  test('a parent keeps the rail it already had and gets none of the three', async ({ page }) => {
    await signIn(page, 'parent');
    await expect(navLinks(page).first()).toBeVisible({ timeout: 20_000 });
    await expect(navLinks(page)).toHaveCount(PARENT_NAV.length);

    for (const item of PARENT_NAV) {
      await expect(navLink(page, cat(en, item.key))).toHaveAttribute('href', item.href);
    }
    for (const item of TEACHER_NAV) {
      await expect(navLink(page, cat(en, item.key))).toHaveCount(0);
    }

    await expect(groupLabels(page)).toHaveCount(1);
    await expect(groupLabels(page)).toHaveText(cat(en, 'Shell.sidebar.groups.manage'));
  });

  // The seeded Admin cannot read GET /api/users/me today (the users-permissions
  // grant is missing — it answers 403), so the portal never learns the slug and the
  // rail falls back to the unscoped parent set. That is the correct fallback and it
  // still satisfies the requirement; the RESOLVED non-teacher proof is the parent
  // leg above. Recorded rather than papered over.
  test('the school admin keeps the same rail and gets none of the three', async ({ page }) => {
    await signIn(page, 'admin');
    await expect(navLinks(page).first()).toBeVisible({ timeout: 20_000 });
    await expect(navLinks(page)).toHaveCount(PARENT_NAV.length);

    for (const item of TEACHER_NAV) {
      await expect(navLink(page, cat(en, item.key))).toHaveCount(0);
    }
    await expect(groupLabels(page)).toHaveText(cat(en, 'Shell.sidebar.groups.manage'));

    await page.screenshot({
      path: path.join(SCREENSHOTS, 'task-031-admin-sidebar.png'),
      animations: 'disabled',
    });
  });
});
