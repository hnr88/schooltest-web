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

// Proof captures for mvp/teacher/proof/03.md — the retirement screenshots are
// taken at the proof's 1440×900, then the shared DESKTOP viewport is restored.
const PROOF_VIEWPORT = { width: 1440, height: 900 } as const;
const PROOF_SHOTS = path.resolve(process.cwd(), '..', 'mvp', 'teacher', 'proof', 'shots');

// Task 031 / .qa/DECISIONS.md A4 — ONE role-filtered shell, never a second sidebar.
// A teacher's rail is EXACTLY the design's two destinations — Results ("Classes")
// then Test sessions ("Live sessions") — under the single TEACHER VIEW overline
// (teacher task 03: R-10 retired the teacherDashboard entry, R-11 the reports
// entry, and with zero `primary` items left buildNavSections drops the empty
// Manage group); an ops account gets the ops destinations and none of the two;
// the parent portal is disabled in this release, so a parent gets the
// unavailable screen and no rail at all. Driven through the REAL /sign-in form
// against the REAL Strapi on :5500, with every role slug the expectations hang off
// read out of the REAL Postgres on :5540 with psql rather than assumed.
test.describe('teacher rail scoping (A4)', () => {
  test.use({ viewport: DESKTOP });

  // B3 REGRESSION — the cheap test that was owed. The original bug lived in the
  // LIST the sidebar fed buildNavSections (PRIMARY_NAV_ITEMS, group === 'primary'),
  // which dropped the whole 'teach' section before render. This test runs the exact
  // pipeline AppSidebar runs — the same real constants, the same real filters, in
  // the same order — with NO browser, so it fails in milliseconds if the design's
  // two teach entries ever stop reaching the section builder again, whatever the
  // component wires up. The sign-in tests below remain the end-to-end drift-catcher
  // for the component itself.
  test('the rail pipeline hands buildNavSections every teach entry (B3 regression)', () => {
    const sections = buildNavSections(filterNavByRole(NAV_ITEMS, 'teacher'));

    // R-10/R-11 removed the last `primary` teacher item, so the empty Manage
    // group is dropped and ONE section remains — the design's shape.
    expect(sections.map((section) => section.group)).toEqual(['teach']);
    // The design's order: Classes (the results surface) then Live sessions.
    expect(sections[0].labelKey).toBe('teacherView');
    expect(sections[0].items.map((item) => item.href)).toEqual([
      '/dashboard/results',
      '/dashboard/test-sessions',
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

  test('a teacher sees exactly Classes then Live sessions under the TEACHER VIEW overline', async ({
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

    // ONE section: with `reports` retired a teacher has zero `primary` items,
    // buildNavSections drops the empty Manage group, and the two destinations
    // sit under the new TEACHER VIEW overline (design :25–35).
    await expect(groupLabels(page)).toHaveCount(1);
    await expect(groupLabels(page)).toHaveText(cat(en, 'Shell.sidebar.groups.teacherView'));

    for (const item of PARENT_NAV) {
      await expect(navLink(page, cat(en, item.key))).toHaveCount(0);
    }

    // The role chip lives in the sidebar's user-menu trigger (UserMenu), not a
    // dedicated slot anymore.
    const userMenu = sidebar(page).getByRole('button', {
      name: cat(en, 'Shell.topbar.userMenuLabel'),
    });
    await expect(userMenu).toContainText(cat(en, 'Shell.userMenu.roles.teacher'));

    // Proof captures for mvp/teacher/proof/03.md, at the proof's 1440×900.
    await page.setViewportSize(PROOF_VIEWPORT);
    await page.screenshot({
      path: path.join(PROOF_SHOTS, '03-rail-teacher.png'),
      animations: 'disabled',
    });
    await sidebar(page).screenshot({
      path: path.join(PROOF_SHOTS, '03-rail-overline.png'),
      animations: 'disabled',
    });
    await page.setViewportSize(DESKTOP);
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

  // U-25 — the teacher twin of ops-session-expired.spec.ts: an EXPIRED session
  // renders the drawn wall over the kept-alive page and must NOT redirect.
  // Same honest simulation: overwrite the stored JWT, reload, and let the app
  // run a real request that answers 401 → auth-invalid → the expired signal.
  test('an expired teacher session renders the expired wall instead of a redirect', async ({
    page,
  }) => {
    await signIn(page, 'teacher');
    await page.goto('/dashboard/results');
    await expect(page.locator('[data-surface="teacher-results"]')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator('[data-slot="ops-session-expired"]')).toHaveCount(0);

    await page.evaluate(() => {
      window.localStorage.setItem('app.auth.token', 'expired-simulation-not-a-jwt');
    });
    await page.reload();

    const card = page.locator('[data-slot="ops-session-expired"]');
    await card.waitFor({ state: 'visible', timeout: 60_000 });
    await expect(card).toContainText(cat(en, 'Auth.sessionExpired'));
    // The body names the configured timeout since D-14, so it comes in two
    // variants; with the junk token the settings read cannot resolve and the
    // no-timeout sentence renders. Both share the same tail — assert that,
    // derived from the catalog rather than hard-coded.
    const expiredBodyTail = en['Ops.capabilities.sessionExpiredBodyNoTimeout'].split('. ').pop()!;
    await expect(card).toContainText(expiredBodyTail);
    const action = card.getByRole('link', { name: cat(en, 'Auth.sessionExpiredAction') });
    await expect(action).toBeVisible();
    await expect(action).toHaveAttribute('href', /\/sign-in$/);
    // the wall keeps the guarded tree underneath — the URL is untouched, no yank
    expect(page.url()).toContain('/dashboard/results');

    await page.setViewportSize(PROOF_VIEWPORT);
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(PROOF_SHOTS, '03-session-expired-teacher.png'),
      animations: 'disabled',
    });
    await page.setViewportSize(DESKTOP);
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
  // role on this stack, and its rail is the current ops shape — Schools under
  // "Manage" plus Settings pinned to the footer's account group (ops chrome
  // restructure). A RESOLVED non-teacher rail, not a fallback. Ops is simply
  // outside the teach group's `roles` gate, so the two teacher destinations
  // never appear. Were the identity grant to go missing the slug would stay
  // null and this rail would render EMPTY, which is the honest answer and would
  // fail here loudly rather than quietly showing someone else's nav.
  test('the ops account keeps its Schools and footer Settings destinations and gets none of the teacher two', async ({
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
    // Proof capture: the ops rail is untouched by the teacher retirement, at
    // the proof's 1440×900 (byte-comparison target for proof/03.md).
    await page.setViewportSize(PROOF_VIEWPORT);
    await page.screenshot({
      path: path.join(PROOF_SHOTS, '03-rail-ops.png'),
      animations: 'disabled',
    });
    await page.setViewportSize(DESKTOP);
  });
});
