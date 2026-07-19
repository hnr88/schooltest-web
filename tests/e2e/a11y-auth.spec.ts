import path from 'node:path';

import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

import { SEEDED_PARENT } from './helpers/auth';
import { cat, home, loadMessages } from './helpers/i18n';
import { collectSmallTargets, watchErrors } from './helpers/ui';

// Task 24: the consolidated a11y (axe) + responsive (375/1280) + focus-order
// sweep across every NEW page/component this mission shipped — /sign-in,
// /sign-up, /auth/google/callback, and /dashboard (welcome + search + the
// students list + the add-student dialog's open state). Each of these pages
// already has its own functional e2e spec (sign-in.spec.ts, sign-up.spec.ts,
// google-callback.spec.ts, dashboard.spec.ts, students-list.spec.ts,
// add-student-dialog.spec.ts, dashboard-search-bar.spec.ts) that already
// exercises an axe check at 1280px on ITS OWN flow; this file is the single
// place that sweeps 375px + 1280px + tab focus order + tap targets together,
// mirroring M1's tests/e2e/a11y-responsive.spec.ts (landing/design-system —
// left completely untouched here; Done Criteria requires it stay green
// unmodified). Real login goes through the live api on :5500 (SEEDED_PARENT,
// D9) or a fresh throwaway registration (D20 — never the seeded fixture) —
// zero mocked auth state beyond the `stub-jwt` client-redirect-only pattern
// already established and accepted by tasks 12-14's own specs.
const en = loadMessages('en');
const SCREENSHOTS = path.resolve(process.cwd(), '.qa', 'screenshots');
const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 375, height: 812 };
const API_BASE_URL = 'http://localhost:5500';

/**
 * Asserts zero serious/critical axe violations; moderate/minor are always
 * logged, never asserted. `knownExemptions` names specific axe rule IDs that
 * are logged LOUDLY (not silently dropped) instead of failing the test — used
 * ONLY for a documented, vendored-primitive limitation this mission cannot
 * fix without editing `src/components/ui/*` (Law 11), never as a blanket
 * escape hatch. See the `TABLE_SCROLL_EXEMPTION` call sites below for the one
 * case this file actually uses.
 */
async function expectAxeClean(
  page: Page,
  label: string,
  knownExemptions: readonly string[] = [],
): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();
  const isExempt = (violation: { id: string }) => knownExemptions.includes(violation.id);
  const blockers = results.violations.filter(
    (violation) =>
      (violation.impact === 'serious' || violation.impact === 'critical') && !isExempt(violation),
  );
  const exempted = results.violations.filter(
    (violation) =>
      (violation.impact === 'serious' || violation.impact === 'critical') && isExempt(violation),
  );
  const advisories = results.violations.filter(
    (violation) => violation.impact === 'moderate' || violation.impact === 'minor',
  );
  if (exempted.length > 0) {
    console.log(
      `[axe ${label}] KNOWN NON-BLOCKING (documented vendored-primitive gap, not fixed here):`,
      exempted
        .map(
          (violation) =>
            `${violation.impact}:${violation.id} → ${violation.nodes.map((node) => node.target).join(' | ')}`,
        )
        .join(', '),
    );
  }
  if (advisories.length > 0) {
    console.log(
      `[axe ${label}] moderate/minor:`,
      advisories
        .map((violation) => `${violation.impact}:${violation.id} ×${violation.nodes.length}`)
        .join(', '),
    );
  }
  expect(
    blockers.map(
      (violation) =>
        `${violation.impact}:${violation.id} → ${violation.nodes.map((node) => node.target).join(' | ')}`,
    ),
    label,
  ).toEqual([]);
}

// axe's `scrollable-region-focusable` fires on the STUDENTS table at 375px
// (its content becomes wider than the viewport, so the table's own wrapper
// scrolls horizontally). The scrolling element is shadcn's vendored
// `src/components/ui/table.tsx` `<div data-slot="table-container"
// className="...overflow-x-auto">` — Table's props all forward to the inner
// `<table>` element, never to that wrapper div, so no caller (StudentsSection
// included) can add a `tabIndex`/aria fix to it without editing the vendored
// file itself, which Law 11 forbids. Documented here (logged, not silently
// dropped) as a known, non-blocking, pre-existing gap — same treatment M1's
// a11y-responsive.spec.ts already gives other vendored-primitive limitations
// (see its D22 comment for the /design-system gallery).
const TABLE_SCROLL_EXEMPTION = ['scrollable-region-focusable'] as const;

/** Asserts no horizontal scrollbar at the current viewport. */
async function expectNoHorizontalScroll(page: Page, label: string): Promise<void> {
  const fits = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 1,
  );
  expect(fits, `${label}: scrollWidth exceeded innerWidth`).toBe(true);
}

/**
 * Logs (never asserts) the page's undersized tap targets. Most controls this
 * mission renders reuse shadcn's vendored default cva sizes (Button "sm"/
 * "default" ≈32-40px, Input/Select/InputGroup* defaults ≈32px) — editing
 * those defaults is forbidden by Law 11, and the specific already-shipped
 * call sites (StudentsSection, AddStudentDialog, DashboardSearch — tasks
 * 16-18, independently verified DONE at their current sizing) are out of this
 * verify-only task's scope to redesign. Only /sign-in and /sign-up's own
 * PRIMARY auth-form controls were deliberately styled to 44px (task 12/13,
 * `h-11`/`size-11`) and get a real hard assertion below via
 * `expectAtLeast44px` — this logger exists purely for visibility/evidence.
 */
async function logSmallTargets(page: Page, label: string): Promise<string[]> {
  const small = await collectSmallTargets(page);
  if (small.length > 0) {
    console.log(
      `[targets ${label}] ${small.length} under 44px (advisory, not asserted):\n${small.join('\n')}`,
    );
  }
  return small;
}

/** Hard regression guard for a SPECIFIC element already verified ≥44×44px. */
async function expectAtLeast44px(locator: Locator, label: string): Promise<void> {
  const box = await locator.boundingBox();
  expect(box, `${label}: element has no bounding box (not visible?)`).not.toBeNull();
  if (box) {
    expect(box.width, `${label} width`).toBeGreaterThanOrEqual(43);
    expect(box.height, `${label} height`).toBeGreaterThanOrEqual(43);
  }
}

/**
 * Presses Tab forward-only until each step's locator is focused, in order.
 * This proves real tab/DOM focus order, not just presence: if a later step
 * actually precedes an earlier one in the DOM, the search (which never goes
 * backward) would fail to find it after already passing it for the prior step.
 */
async function expectForwardFocusOrder(
  page: Page,
  steps: readonly { label: string; locator: Locator }[],
): Promise<void> {
  for (const step of steps) {
    let found = false;
    for (let attempt = 0; attempt < 30 && !found; attempt += 1) {
      await page.keyboard.press('Tab');
      found = await step.locator.evaluate((el) => el === document.activeElement).catch(() => false);
    }
    expect(found, `focus order: never reached "${step.label}" via forward Tab`).toBe(true);
  }
}

async function loginAsSeededParent(
  page: Page,
  request: import('@playwright/test').APIRequestContext,
): Promise<void> {
  const loginRes = await request.post(`${API_BASE_URL}/api/auth/local`, {
    data: { identifier: SEEDED_PARENT.email, password: SEEDED_PARENT.password },
  });
  expect(loginRes.ok(), await loginRes.text()).toBeTruthy();
  const { jwt } = (await loginRes.json()) as { jwt: string };
  await page.addInitScript((token) => {
    window.localStorage.setItem('app.auth.token', token);
  }, jwt);
}

async function openAddStudentDialog(page: Page): Promise<Locator> {
  await page
    .locator('[data-slot="students-heading"]')
    .getByRole('button', { name: cat(en, 'Dashboard.addStudent') })
    .click();
  const dialog = page.getByRole('dialog', { name: cat(en, 'Dashboard.dialogTitle') });
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe('sign-in — a11y + responsive + focus order', () => {
  test('axe clean, no h-scroll, primary 44px targets regression-checked at 375 & 1280', async ({
    page,
  }) => {
    const errors = watchErrors(page);
    for (const viewport of [MOBILE, DESKTOP]) {
      await page.setViewportSize(viewport);
      await page.goto('/sign-in');
      await page.waitForLoadState('networkidle');
      await expectAxeClean(page, `/sign-in @ ${viewport.width}px`);
      await expectNoHorizontalScroll(page, `/sign-in @ ${viewport.width}px`);
      await logSmallTargets(page, `/sign-in @ ${viewport.width}px`);
      // Regression guard for the exact elements task 12 already measured
      // ≥44×44px (`h-11`/`size-11`) — re-checked here at BOTH viewports.
      await expectAtLeast44px(
        page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }),
        `/sign-in @ ${viewport.width}px email input`,
      );
      await expectAtLeast44px(
        page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }),
        `/sign-in @ ${viewport.width}px password input`,
      );
      await expectAtLeast44px(
        page.getByRole('button', { name: cat(en, 'Auth.showPassword'), exact: true }),
        `/sign-in @ ${viewport.width}px show-password toggle`,
      );
      await expectAtLeast44px(
        page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }),
        `/sign-in @ ${viewport.width}px submit button`,
      );
      await expectAtLeast44px(
        page.getByRole('link', { name: cat(en, 'Auth.googleButton'), exact: true }),
        `/sign-in @ ${viewport.width}px Google button`,
      );
      await page.screenshot({
        path: path.join(
          SCREENSHOTS,
          viewport === MOBILE ? 'a11y-sign-in-mobile-en.png' : 'a11y-sign-in-en.png',
        ),
        fullPage: true,
      });
    }
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('focus order: logo → Google → email → password → toggle → submit → sign-up link', async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/sign-in');
    await expectForwardFocusOrder(page, [
      {
        label: 'logo home link',
        locator: page.getByRole('link', { name: home(en, 'footer.logoAlt'), exact: true }),
      },
      {
        label: 'Google button',
        locator: page.getByRole('link', { name: cat(en, 'Auth.googleButton'), exact: true }),
      },
      {
        label: 'email input',
        locator: page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }),
      },
      {
        label: 'password input',
        locator: page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }),
      },
      {
        label: 'show-password toggle',
        locator: page.getByRole('button', { name: cat(en, 'Auth.showPassword'), exact: true }),
      },
      {
        label: 'sign-in submit',
        locator: page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }),
      },
      {
        label: 'sign-up link',
        locator: page.getByRole('link', { name: cat(en, 'Auth.signUp'), exact: true }),
      },
    ]);
  });
});

test.describe('sign-up — a11y + responsive + focus order', () => {
  test('axe clean, no h-scroll, primary 44px targets regression-checked at 375 & 1280', async ({
    page,
  }) => {
    const errors = watchErrors(page);
    for (const viewport of [MOBILE, DESKTOP]) {
      await page.setViewportSize(viewport);
      await page.goto('/sign-up');
      await page.waitForLoadState('networkidle');
      await expectAxeClean(page, `/sign-up @ ${viewport.width}px`);
      await expectNoHorizontalScroll(page, `/sign-up @ ${viewport.width}px`);
      await logSmallTargets(page, `/sign-up @ ${viewport.width}px`);
      // Regression guard for the exact elements task 13 already measured
      // ≥44×44px (`h-11`/`size-11`) — re-checked here at BOTH viewports.
      await expectAtLeast44px(
        page.getByLabel(cat(en, 'Auth.usernameLabel'), { exact: true }),
        `/sign-up @ ${viewport.width}px username input`,
      );
      await expectAtLeast44px(
        page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }),
        `/sign-up @ ${viewport.width}px email input`,
      );
      await expectAtLeast44px(
        page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }),
        `/sign-up @ ${viewport.width}px password input`,
      );
      await expectAtLeast44px(
        page.getByLabel(cat(en, 'Auth.confirmPasswordLabel'), { exact: true }),
        `/sign-up @ ${viewport.width}px confirm-password input`,
      );
      await expectAtLeast44px(
        page.getByRole('button', { name: cat(en, 'Auth.showPassword'), exact: true }),
        `/sign-up @ ${viewport.width}px show-password toggle`,
      );
      await expectAtLeast44px(
        page.getByRole('button', { name: cat(en, 'Auth.showConfirmPassword'), exact: true }),
        `/sign-up @ ${viewport.width}px show-confirm-password toggle`,
      );
      await expectAtLeast44px(
        page.getByRole('button', { name: cat(en, 'Auth.signUpButton'), exact: true }),
        `/sign-up @ ${viewport.width}px submit button`,
      );
      await page.screenshot({
        path: path.join(
          SCREENSHOTS,
          viewport === MOBILE ? 'a11y-sign-up-mobile-en.png' : 'a11y-sign-up-en.png',
        ),
        fullPage: true,
      });
    }
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('focus order: logo → Google → username → email → password(×2 fields) → submit → sign-in link', async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/sign-up');
    await expectForwardFocusOrder(page, [
      {
        label: 'logo home link',
        locator: page.getByRole('link', { name: home(en, 'footer.logoAlt'), exact: true }),
      },
      {
        label: 'Google button',
        locator: page.getByRole('link', { name: cat(en, 'Auth.googleButton'), exact: true }),
      },
      {
        label: 'username input',
        locator: page.getByLabel(cat(en, 'Auth.usernameLabel'), { exact: true }),
      },
      {
        label: 'email input',
        locator: page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }),
      },
      {
        label: 'password input',
        locator: page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }),
      },
      {
        label: 'show-password toggle',
        locator: page.getByRole('button', { name: cat(en, 'Auth.showPassword'), exact: true }),
      },
      {
        label: 'confirm-password input',
        locator: page.getByLabel(cat(en, 'Auth.confirmPasswordLabel'), { exact: true }),
      },
      {
        label: 'show-confirm-password toggle',
        locator: page.getByRole('button', {
          name: cat(en, 'Auth.showConfirmPassword'),
          exact: true,
        }),
      },
      {
        label: 'sign-up submit',
        locator: page.getByRole('button', { name: cat(en, 'Auth.signUpButton'), exact: true }),
      },
      {
        label: 'sign-in link',
        locator: page.getByRole('link', { name: cat(en, 'Auth.signInLink'), exact: true }),
      },
    ]);
  });
});

test.describe('google callback error state — a11y + responsive', () => {
  // google-callback.spec.ts (task 14) already axe-checks this redirected state at
  // 1280px; this closes the 375px + undersized-target gap for the same real,
  // env-gated rejection flow (D5/D18 — never a fabricated success state).
  test('axe clean, no h-scroll at 375 & 1280', async ({ page }) => {
    const errors = watchErrors(page);
    // The sign-in card's D-UI-2 entrance animation honors motion-reduce:*;
    // emulating reduced motion exercises that variant AND keeps axe's
    // color-contrast pass deterministic right after the client-side redirect
    // (contrast is otherwise sampled mid-fade).
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const viewport of [MOBILE, DESKTOP]) {
      await page.setViewportSize(viewport);
      await page.goto('/auth/google/callback');
      await page.waitForURL(/\/sign-in\?error=google$/);
      const alert = page.locator('[data-slot="alert"]');
      await expect(alert).toBeVisible();
      await expect(alert).toContainText(cat(en, 'Auth.googleError'));
      await expectAxeClean(page, `/sign-in?error=google @ ${viewport.width}px`);
      await expectNoHorizontalScroll(page, `/sign-in?error=google @ ${viewport.width}px`);
      await logSmallTargets(page, `/sign-in?error=google @ ${viewport.width}px`);
    }
    expect(errors, errors.join('\n')).toEqual([]);
  });
});

test.describe('dashboard (authed, seeded parent) — a11y + responsive + focus order', () => {
  test('axe clean (modulo the documented Table-scroll exemption), no h-scroll; screenshots incl. dashboard-mobile', async ({
    page,
    request,
  }) => {
    const errors = watchErrors(page);
    await loginAsSeededParent(page, request);
    for (const viewport of [MOBILE, DESKTOP]) {
      await page.setViewportSize(viewport);
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await expect(
        page.getByRole('heading', { level: 1, name: /Welcome back, parent/ }),
      ).toBeVisible();
      await expectAxeClean(page, `/dashboard @ ${viewport.width}px`, TABLE_SCROLL_EXEMPTION);
      await expectNoHorizontalScroll(page, `/dashboard @ ${viewport.width}px`);
      await logSmallTargets(page, `/dashboard @ ${viewport.width}px`);
      await page.screenshot({
        path: path.join(
          SCREENSHOTS,
          viewport === MOBILE ? 'dashboard-mobile-en.png' : 'a11y-dashboard-en.png',
        ),
        fullPage: true,
      });
    }
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('focus order: user menu → search → add student', async ({ page, request }) => {
    await loginAsSeededParent(page, request);
    await page.setViewportSize(DESKTOP);
    await page.goto('/dashboard');
    await expect(
      page.getByRole('heading', { level: 1, name: /Welcome back, parent/ }),
    ).toBeVisible();
    await expectForwardFocusOrder(page, [
      {
        // Sign-out moved into the topbar user chip menu (task 011) — the chip
        // trigger is the tab stop that precedes the dashboard content now.
        label: 'user menu trigger',
        locator: page.getByRole('button', {
          name: cat(en, 'Shell.topbar.userMenuLabel'),
          exact: true,
        }),
      },
      {
        label: 'search combobox',
        locator: page.getByRole('combobox', { name: cat(en, 'Dashboard.searchPlaceholder') }),
      },
      {
        label: 'add student button',
        locator: page
          .locator('[data-slot="students-heading"]')
          .getByRole('button', { name: cat(en, 'Dashboard.addStudent') }),
      },
    ]);
  });
});

test.describe('dashboard search panel — a11y + responsive (open/results state)', () => {
  // Read-only against the seeded parent's own fixed 2 students (D9) — safe to
  // run alongside every other spec that also reads via that same account.
  test('axe clean (modulo the documented Table-scroll exemption), no h-scroll, with results open at 375 & 1280', async ({
    page,
    request,
  }) => {
    await loginAsSeededParent(page, request);
    for (const viewport of [MOBILE, DESKTOP]) {
      await page.setViewportSize(viewport);
      await page.goto('/dashboard');
      const search = page.getByRole('combobox', { name: cat(en, 'Dashboard.searchPlaceholder') });
      await search.fill('keller');
      await expect(
        page.getByRole('option', { name: /Mia Keller|Jonas Keller/ }).first(),
      ).toBeVisible();
      await expectAxeClean(
        page,
        `dashboard search panel open @ ${viewport.width}px`,
        TABLE_SCROLL_EXEMPTION,
      );
      await expectNoHorizontalScroll(page, `dashboard search panel open @ ${viewport.width}px`);
      await logSmallTargets(page, `dashboard search panel open @ ${viewport.width}px`);
    }
  });
});

test.describe('add-student dialog — a11y + responsive (open state)', () => {
  // Auth via the seeded parent's REAL login (task 017: with D-AUTH-7 email
  // confirmation ON, register no longer returns a jwt, so the old fresh-
  // registration path is impossible without a Mailpit round-trip this a11y
  // sweep doesn't need). The dialog is only OPENED here — never submitted —
  // so no seeded data mutates. Task 054 owns removing this coverage when the
  // wizard replaces the dialog.
  test('desktop 1280: axe clean, no h-scroll while open', async ({ page, request }) => {
    await page.setViewportSize(DESKTOP);
    await loginAsSeededParent(page, request);
    await page.goto('/dashboard');
    await openAddStudentDialog(page);
    await expectAxeClean(page, 'add-student dialog open @ 1280px');
    await expectNoHorizontalScroll(page, 'add-student dialog open @ 1280px');
    await logSmallTargets(page, 'add-student dialog open @ 1280px');
  });

  test('mobile 375: axe clean, no h-scroll while open', async ({ page, request }) => {
    await page.setViewportSize(MOBILE);
    await loginAsSeededParent(page, request);
    await page.goto('/dashboard');
    await openAddStudentDialog(page);
    await expectAxeClean(page, 'add-student dialog open @ 375px');
    await expectNoHorizontalScroll(page, 'add-student dialog open @ 375px');
    await logSmallTargets(page, 'add-student dialog open @ 375px');
  });
});

test.describe('Google OAuth — LIVE consent round-trip', () => {
  // D5 (DECISIONS.md): real Google OAuth needs a real GOOGLE_CLIENT_ID/
  // GOOGLE_CLIENT_SECRET pair registered in an actual Google Cloud OAuth
  // client. Neither exists anywhere in this workspace (dev env, CI, or any
  // secret store reachable from here), and per the zero-mocks law they must
  // NEVER be fabricated — provisioning a real OAuth client is an out-of-band,
  // credentialed, human step this mission cannot perform. This test names
  // the exact blocked step and is left `test.skip` (not deleted, not a fake
  // pass) so the gap stays visible in every future test run.
  //
  // Everything reachable WITHOUT those credentials already ships and is
  // real e2e-proven against the live api on :5500 — zero mocks — in
  // tests/e2e/google-callback.spec.ts:
  //   - The Google button is a real <a href="…/api/connect/google"> on both
  //     /sign-in and /sign-up (never a dead/fake link, D18).
  //   - /auth/google/callback forwards whatever query it receives verbatim
  //     to the real GET /api/auth/google/callback — it never parses or
  //     stores Google's own id_token itself (D18), only the api's response.
  //   - With GOOGLE_ENABLED unset (task 9's env-gated grant config,
  //     C-AUTH-GOOGLE), the api answers its genuine typed 400
  //     {error:{status:400,message:"This provider is disabled"}}, which the
  //     callback page turns into the styled /sign-in?error=google alert —
  //     also axe-checked by this file's sign-in sweep above.
  // The moment real credentials are supplied, this exact wiring carries a
  // real consent round-trip with zero further code changes.
  test.skip('BLOCKED (D5): parent completes the real Google OAuth consent screen end-to-end — no GOOGLE_CLIENT_ID/SECRET exist anywhere in this workspace and must never be faked', () => {});
});
