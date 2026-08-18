import path from 'node:path';

import { expect, test } from '@playwright/test';

import { NAV_ITEMS } from '@/modules/shell/constants/nav.constants';
import { buildNavSections } from '@/modules/shell/lib/nav-sections';
import { filterNavByRole } from '@/modules/shell/lib/nav-visible';

import { cat } from './helpers/i18n';
import {
  ACCOUNTS,
  DESKTOP,
  OPS_NAV,
  PARENT_NAV,
  SCREENSHOTS,
  TEACHER_NAV,
  TEACHER_RAIL_NAV,
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
// A teacher's rail is Reports under "Manage" plus EXACTLY Dashboard · Test sessions ·
// Results under the "Teach" overline (the B3 regression: the trio the sidebar used to
// drop before render); an ops account gets the five ops destinations and none of the
// three; the parent portal is disabled in this release, so a parent gets the
// unavailable screen and no rail at all. Driven through the REAL /sign-in form
// against the REAL Strapi on :5500, with every role slug the expectations hang off
// read out of the REAL Postgres on :5540 with psql rather than assumed.
test.describe('teacher rail scoping (A4)', () => {
  test.use({ viewport: DESKTOP });

  // B3 REGRESSION — the cheap test that was owed. The original bug lived in the
  // LIST the sidebar fed buildNavSections (PRIMARY_NAV_ITEMS, group === 'primary'),
  // which dropped the whole 'teach' section before render. This test runs the exact
  // pipeline AppSidebar runs — the same real constants, the same real filters, in
  // the same order — with NO browser, so it fails in milliseconds if the trio ever
  // stops reaching the section builder again, whatever the component wires up. The
  // sign-in tests below remain the end-to-end drift-catcher for the component itself.
  test('the rail pipeline hands buildNavSections every teach entry (B3 regression)', () => {
    const sections = buildNavSections(filterNavByRole(NAV_ITEMS, 'teacher'));

    expect(sections.map((section) => section.group)).toEqual(['primary', 'teach']);
    // Manage carries the teacher-scoped Reports entry (D-W1), Teach the trio.
    expect(sections[0].items.map((item) => item.href)).toEqual(['/dashboard/reports']);
    expect(sections[1].items.map((item) => item.href)).toEqual([
      '/dashboard',
      '/dashboard/test-sessions',
      '/dashboard/results',
    ]);
    // The footer's account group never leaks into the scroll-area sections.
    expect(sections.some((section) => section.group === 'account')).toBe(false);
  });

  test('the seeded accounts carry the role slugs the rail filters on', () => {
    expect(roleSlug(ACCOUNTS.teacher.email)).toBe('teacher');
    expect(roleSlug(ACCOUNTS.ops.email)).toBe('ops');
    expect(roleSlug(ACCOUNTS.parent.email)).toBe('parent');
  });

  // `useLoginMutation` seeds ['auth','me'] with the /api/auth/local user, which
  // carries no `role`, and a hard load starts with no identity at all — in both
  // windows `role?.type` is momentarily unknown. The shell must withhold the rail
  // rather than guess, or a teacher flashes the parent rail on every page load.
  test('a teacher never renders a parent rail entry, not even for one frame', async ({ page }) => {
    await installNavSampler(page);

    await signIn(page, 'teacher');
    await expect(navLinks(page)).toHaveCount(TEACHER_RAIL_NAV.length, { timeout: 20_000 });
    await assertNoParentFrame(page);

    // The harder window: a HARD load carries no cached identity at all.
    await page.goto('/dashboard/results');
    await expect(navLinks(page)).toHaveCount(TEACHER_RAIL_NAV.length, { timeout: 20_000 });
    await assertNoParentFrame(page);
  });

  test('a teacher sees Reports under Manage and exactly Dashboard, Test sessions and Results under "Teach"', async ({
    page,
  }) => {
    await signIn(page, 'teacher');
    await expect(navLinks(page).first()).toBeVisible({ timeout: 20_000 });
    await expect(navLinks(page)).toHaveCount(TEACHER_RAIL_NAV.length);

    for (const [index, item] of TEACHER_RAIL_NAV.entries()) {
      const link = navLink(page, cat(en, item.key));
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', item.href);
      await expect(navLinks(page).nth(index)).toHaveAttribute('href', item.href);
    }

    // Two sections: Manage (reports) then Teach (the B3 trio), in NAV_GROUP_ORDER.
    await expect(groupLabels(page)).toHaveCount(2);
    await expect(groupLabels(page).first()).toHaveText(cat(en, 'Shell.sidebar.groups.manage'));
    await expect(groupLabels(page).last()).toHaveText(cat(en, 'Shell.sidebar.groups.teach'));

    for (const item of PARENT_NAV) {
      await expect(navLink(page, cat(en, item.key))).toHaveCount(0);
    }

    // The role chip lives in the sidebar's user-menu trigger (UserMenu), not a
    // dedicated slot anymore.
    const userMenu = sidebar(page).getByRole('button', {
      name: cat(en, 'Shell.topbar.userMenuLabel'),
    });
    await expect(userMenu).toContainText(cat(en, 'Shell.userMenu.roles.teacher'));

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
    // Task 040 replaced this page's placeholder with the real Results class list,
    // so the discriminator moved to a live class row read from GET /api/teacher/dashboard.
    await expect(page.locator('[data-slot="results-class-row"]').first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(navLink(page, cat(en, 'Shell.nav.results'))).toHaveAttribute('data-active', /.*/);

    await page.screenshot({
      path: path.join(SCREENSHOTS, 'task-031-teacher-results.png'),
      animations: 'disabled',
    });
  });

  // The parent portal is disabled in this release (Auth.parentViewsUnavailable):
  // a parent signs in fine but /dashboard renders the unavailable screen with NO
  // rail — so the B3 trio cannot leak to a parent any other way than not existing.
  test('a parent signs in, gets the unavailable screen and no rail at all', async ({ page }) => {
    await signIn(page, 'parent');

    await expect(page.getByText(cat(en, 'Auth.parentViewsUnavailable.title'))).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(cat(en, 'Auth.parentViewsUnavailable.body'))).toBeVisible();
    await expect(navLinks(page)).toHaveCount(0);

    for (const item of TEACHER_NAV) {
      await expect(navLink(page, cat(en, item.key))).toHaveCount(0);
    }
  });

  // Re-measured live: the seeded platform account (apiadmin@) carries the 'ops'
  // role on this stack, and its rail is the five ops destinations under "Manage" —
  // a RESOLVED non-teacher rail, not a fallback. Ops is simply outside
  // `hiddenForRoles: ['teacher']`, so the Manage entries stay and the three Teach
  // entries never appear. Were the identity grant to go missing the slug would
  // stay null and this rail would render EMPTY, which is the honest answer and
  // would fail here loudly rather than quietly showing someone else's nav.
  test('the ops account keeps its five ops destinations and gets none of the three', async ({
    page,
  }) => {
    await signIn(page, 'ops');
    await expect(navLinks(page).first()).toBeVisible({ timeout: 20_000 });
    await expect(navLinks(page)).toHaveCount(OPS_NAV.length);

    for (const [index, item] of OPS_NAV.entries()) {
      const link = navLink(page, cat(en, item.key));
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', item.href);
      await expect(navLinks(page).nth(index)).toHaveAttribute('href', item.href);
    }
    for (const item of TEACHER_NAV) {
      await expect(navLink(page, cat(en, item.key))).toHaveCount(0);
    }
    await expect(groupLabels(page)).toHaveCount(1);
    await expect(groupLabels(page)).toHaveText(cat(en, 'Shell.sidebar.groups.manage'));

    await page.screenshot({
      path: path.join(SCREENSHOTS, 'task-031-ops-sidebar.png'),
      animations: 'disabled',
    });
  });
});
