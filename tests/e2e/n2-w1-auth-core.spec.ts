/**
 * NIGHT-2 W1 (AUTH) core battery — scenarios AUTH-001..004, 011..014, 019,
 * 036, 038..042 from .overnight/N2/JOURNEYS-N2.md, executed against the LIVE
 * stack (web :3001 via E2E_PORT, API :5500). Every verdict recorded in the
 * journey catalog cites an assertion from this file (or its screenshots in
 * .overnight/N2/captures/).
 *
 * Harness discipline inherited from the suite:
 *  - sign-ins go through the REAL /sign-in form, paced ≥3.1s apart (the API's
 *    brute-force guard allows 20 POST /api/auth/local per minute per IP), so
 *    this file must run with --workers=1;
 *  - throwaway parents are registered through the real register contract and
 *    confirmed via the real Mailpit link (helpers/throwaway-parent);
 *  - the ONLY DB writes are the sanctioned test-hygiene ones: throwaway
 *    auth_email_requests cleanup (afterAll) and the auth_lockout_counters
 *    lock-shift in AUTH-004 (same table the 014 spec already sanitises).
 */
import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { deleteAuthEmailRows, runSql } from './helpers/auth-db';
import { skipOnboardingViaUi } from './helpers/auth';
import { cat, loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';
import { registerAndConfirmParent, type ThrowawayParent } from './helpers/throwaway-parent';

const en = loadMessages('en');
const CAPTURES = '/Users/hunor.nagy/Code/schooltest/.overnight/N2/captures';
const WRONG_PASSWORD = 'WrongPassword123!';
const ATTEMPT_INTERVAL_MS = 3100;
const usedEmails: string[] = [];

test.afterAll(() => {
  for (const email of usedEmails) {
    const escapedEmail = email.replaceAll("'", "''");
    runSql(
      `delete from auth_lockout_counters where user_id = (select id from up_users where email = '${escapedEmail}')`,
    );
    deleteAuthEmailRows(email);
  }
});

/** Screenshot evidence into .overnight/N2/captures/. */
async function shot(page: Page, name: string): Promise<string> {
  mkdirSync(CAPTURES, { recursive: true });
  const file = path.join(CAPTURES, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

/** Paced UI login for a throwaway account (mirrors helpers/roles pacing). */
let lastLoginSubmittedAt = 0;
async function uiLogin(page: Page, email: string, password: string): Promise<void> {
  const sinceLast = Date.now() - lastLoginSubmittedAt;
  if (lastLoginSubmittedAt !== 0 && sinceLast < ATTEMPT_INTERVAL_MS) {
    await page.waitForTimeout(ATTEMPT_INTERVAL_MS - sinceLast);
  }
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true }).fill(email);
  await page.getByLabel(cat(en, 'Auth.portal.passwordLabel'), { exact: true }).fill(password);
  await page
    .getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true })
    .click();
  lastLoginSubmittedAt = Date.now();
}

async function submitLogin(page: Page): Promise<void> {
  await page
    .getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true })
    .click();
  lastLoginSubmittedAt = Date.now();
}

// ---------------------------------------------------------------------------
// AUTH-001 — parent signs in and lands on the portal dashboard
// ---------------------------------------------------------------------------
let auth001Parent: ThrowawayParent | null = null;

test('AUTH-001 parent sign-in lands on the portal dashboard', async ({ page, request }) => {
  const parent = await registerAndConfirmParent(request, 'n2w1-001');
  usedEmails.push(parent.email);
  auth001Parent = parent;

  await uiLogin(page, parent.email, parent.password);
  await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 20_000 });
  // First-ever login passes the mandatory parent-onboarding gate; walk its real
  // skip path so the portal dashboard itself is the verified landing.
  await skipOnboardingViaUi(page);
  await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 20_000 });
  // Signed-in proof: the JWT the app stored + the parent shell actually painted.
  const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  expect((token ?? '').split('.')).toHaveLength(3);
  await expect(
    page.getByRole('link', { name: cat(en, 'Shell.nav.overview'), exact: true }),
  ).toBeVisible();
  await expect(page).not.toHaveURL(/sign-in/);
  await shot(page, 'AUTH-001-parent-dashboard');
});

// ---------------------------------------------------------------------------
// AUTH-002 — wrong password shows incorrect-password + attempts counter
// ---------------------------------------------------------------------------
test('AUTH-002 wrong password shows the attempts-remaining error', async ({ page }) => {
  const parent = auth001Parent;
  test.skip(!parent, 'AUTH-001 must run first (needs a confirmed parent)');

  await page.goto('/sign-in');
  await page
    .getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true })
    .fill(parent!.email);
  await page
    .getByLabel(cat(en, 'Auth.portal.passwordLabel'), { exact: true })
    .fill(WRONG_PASSWORD);
  await submitLogin(page);

  const alert = page.locator('[data-slot="alert"][role="alert"]');
  await expect(alert).toBeVisible();
  await expect(alert.getByText(cat(en, 'Auth.portal.errorTitle'))).toBeVisible();
  // The live counter: one attempt consumed → 4 remain (server-driven field).
  await expect(page.getByText(/4 attempts remain/i)).toBeVisible();
  // The password field carries the incorrect-password message.
  await expect(page.getByText(cat(en, 'Auth.portal.incorrectPassword'))).toBeVisible();
  await shot(page, 'AUTH-002-wrong-password');
});

// ---------------------------------------------------------------------------
// AUTH-003 — 5th consecutive failure locks the account with a countdown
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// AUTH-004 — countdown reaching zero re-enables the form; correct password works
// ---------------------------------------------------------------------------
test('AUTH-003/004 lockout on 5th failure, countdown expiry re-enables sign-in', async ({
  page,
  request,
}) => {
  test.setTimeout(180_000);
  const parent = await registerAndConfirmParent(request, 'n2w1-003');
  usedEmails.push(parent.email);

  await page.goto('/sign-in');
  await page
    .getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true })
    .fill(parent.email);

  // Attempts 1..4 show the live counter.
  for (const remaining of [4, 3, 2, 1]) {
    await page
      .getByLabel(cat(en, 'Auth.portal.passwordLabel'), { exact: true })
      .fill(WRONG_PASSWORD);
    await submitLogin(page);
    const counter =
      remaining === 1 ? /one attempt remains/i : new RegExp(`${remaining} attempts remain`, 'i');
    await expect(page.getByText(counter)).toBeVisible();
    await page.waitForTimeout(ATTEMPT_INTERVAL_MS);
  }

  // 5th attempt → the locked state replaces the form.
  await page
    .getByLabel(cat(en, 'Auth.portal.passwordLabel'), { exact: true })
    .fill(WRONG_PASSWORD);
  await submitLogin(page);
  await expect(
    page.getByRole('heading', { level: 1, name: cat(en, 'Auth.accountLockedTitle') }),
  ).toBeVisible();
  await expect(page.getByText(cat(en, 'Auth.accountLockedAlertTitle'))).toBeVisible();
  await expect(page.getByText(cat(en, 'Auth.accountLockedAuditNotice'))).toBeVisible();
  // The countdown button reads "Log in — available in mm:ss".
  const lockedButton = page.getByRole('button', { name: /available in/i });
  await expect(lockedButton).toBeVisible();
  await expect(lockedButton).toBeDisabled();
  expect(await shot(page, 'AUTH-003-locked-state')).toBeTruthy();
  // AUTH-004: pull the lock's unlockAt forward to now+45s (test hygiene on
  // auth_lockout_counters — same table the 014 suite sanitises), then reload
  // and submit again: the still-locked 400 returns the SERVER's fresh unlockAt
  // and the locked screen counts down through the shortened window. When the
  // countdown reaches zero the button flips to "Log in", returns the form, and
  // the CORRECT password signs in.
  runSql(
    `update auth_lockout_counters set locked_until = now() + interval '45 seconds'
     where user_id = (select id from up_users where email = '${parent.email}')`,
  );
  await page.goto('/sign-in');
  await page
    .getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true })
    .fill(parent.email);
  await page
    .getByLabel(cat(en, 'Auth.portal.passwordLabel'), { exact: true })
    .fill(WRONG_PASSWORD);
  await submitLogin(page);
  await expect(
    page.getByRole('heading', { level: 1, name: cat(en, 'Auth.accountLockedTitle') }),
  ).toBeVisible();
  const countdownButton = page.getByRole('button', { name: /available in/i });
  await expect(countdownButton).toBeDisabled();

  // The countdown ticks to zero and the button re-enables (real client timer).
  await expect(countdownButton).toBeEnabled({ timeout: 60_000 });
  await expect(
    page.getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true }),
  ).toBeVisible();
  // Re-enabling collapsed the locked state back into the sign-in form.
  await page
    .getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: cat(en, 'Auth.portal.signInTitle') }),
  ).toBeVisible();

  await uiLogin(page, parent.email, parent.password);
  await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 20_000 });
  await expect(page).not.toHaveURL(/sign-in/);
  const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  expect((token ?? '').split('.')).toHaveLength(3);
  await shot(page, 'AUTH-004-unlocked-signin');
});

// ---------------------------------------------------------------------------
// AUTH-011 — password show/hide toggle flips visibility and aria-label
// ---------------------------------------------------------------------------
test('AUTH-011 password show/hide toggles visibility and aria state', async ({ page }) => {
  await page.goto('/sign-up');
  const password = page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true });
  await password.fill('SecretPass123!');
  await expect(password).toHaveAttribute('type', 'password');

  const toggle = page.getByRole('button', { name: cat(en, 'Auth.showPassword') });
  await toggle.click();
  await expect(password).toHaveAttribute('type', 'text');
  await expect(
    page.getByRole('button', { name: cat(en, 'Auth.hidePassword') }),
  ).toBeVisible();

  // Confirm-password field has its own independent toggle.
  const confirm = page.getByLabel(cat(en, 'Auth.confirmPasswordLabel'), { exact: true });
  await confirm.fill('SecretPass123!');
  await expect(confirm).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: cat(en, 'Auth.showConfirmPassword') }).click();
  await expect(confirm).toHaveAttribute('type', 'text');
  await shot(page, 'AUTH-011-password-toggle');
});

// ---------------------------------------------------------------------------
// AUTH-012/013/014 — per-role landings
// ---------------------------------------------------------------------------
test('AUTH-012 teacher sign-in lands on the classes surface with the teacher skin', async ({
  page,
}) => {
  await loginAs(page, 'teacher');
  // ROLE_DESTINATIONS sends the teacher to /dashboard/results — the class list
  // is the teacher's home surface (Shell.nav.results = "Classes").
  await expect(page).toHaveURL(/\/dashboard\/results\/?$/, { timeout: 20_000 });
  // The teacher skin rail: data-frame="teacher" on the sidebar.
  await expect(page.locator('[data-frame="teacher"]').first()).toBeVisible();
  await expect(
    (
      page.getByRole('heading', { name: cat(en, 'Shell.nav.results'), exact: true }).or(
        page.getByRole('link', { name: cat(en, 'Shell.nav.results'), exact: true }),
      )
    ).first(),
  ).toBeVisible();
  await shot(page, 'AUTH-012-teacher-landing');
});

test('AUTH-013 school admin sign-in lands on the school admin home', async ({ page }) => {
  await loginAs(page, 'schoolAdmin');
  await expect(page).toHaveURL(/\/dashboard\/school\/?$/, { timeout: 20_000 });
  // The school home paints the school name h1 + the account-status pill.
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(
    page.locator('[data-slot="school-home"], [data-surface="school-admin-home"]').first(),
  ).toBeVisible();
  await shot(page, 'AUTH-013-sa-landing');
});

test('AUTH-014 ops admin sign-in lands on the ops schools table', async ({ page }) => {
  await loginAs(page, 'opsApi');
  await expect(page).toHaveURL(/\/dashboard\/ops\/schools\/?$/, { timeout: 20_000 });
  await expect(page.locator('[data-surface="ops-schools"], table').first()).toBeVisible();
  await shot(page, 'AUTH-014-ops-landing');
});

// ---------------------------------------------------------------------------
// AUTH-019 — sidebar renders only the signed-in role's sections
// ---------------------------------------------------------------------------
async function sidebarHrefs(page: Page): Promise<string[]> {
  const rail = page.locator('[data-slot="sidebar"], aside').first();
  const links = rail.getByRole('link');
  return links.evaluateAll((els) => els.map((el) => el.getAttribute('href') ?? ''));
}

test('AUTH-019 sidebar shows only role-permitted sections (4 roles)', async ({ page }) => {
  test.setTimeout(120_000);

  // PARENT: overview/children/search/settings; never school/ops/teach links.
  const parent = auth001Parent;
  test.skip(!parent, 'AUTH-001 must run first');
  await uiLogin(page, parent!.email, parent!.password);
  await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 20_000 });
  await skipOnboardingViaUi(page);
  let hrefs = await sidebarHrefs(page);
  expect(hrefs).toContain('/dashboard');
  expect(hrefs).toContain('/dashboard/children');
  expect(hrefs.join(' ')).not.toMatch(/dashboard\/school|dashboard\/ops|dashboard\/results/);
  await shot(page, 'AUTH-019-parent-sidebar');
  await page.getByRole('button', { name: cat(en, 'Shell.topbar.userMenuLabel') }).click();
  await page.getByRole('menuitem', { name: cat(en, 'Shell.userMenu.signOut') }).click();
  await page.waitForURL(/sign-in/, { timeout: 15_000 });

  // TEACHER: classes/live sessions; never school-admin or ops sections.
  await loginAs(page, 'teacher');
  hrefs = await sidebarHrefs(page);
  expect(hrefs.join(' ')).not.toMatch(/dashboard\/school(?!\/account)|dashboard\/ops/);
  expect(hrefs.join(' ')).toMatch(/dashboard\/results|test-sessions/);
  await shot(page, 'AUTH-019-teacher-sidebar');
  await page.getByRole('button', { name: cat(en, 'Shell.topbar.userMenuLabel') }).click();
  await page.getByRole('menuitem', { name: cat(en, 'Shell.userMenu.signOut') }).click();
  await page.waitForURL(/sign-in/, { timeout: 15_000 });

  // SCHOOL ADMIN: school/classes/teachers/students/account; never ops.
  await loginAs(page, 'schoolAdminB');
  hrefs = await sidebarHrefs(page);
  expect(hrefs.join(' ')).toMatch(/dashboard\/school/);
  expect(hrefs.join(' ')).not.toMatch(/dashboard\/ops/);
  await shot(page, 'AUTH-019-sa-sidebar');
  await page.getByRole('button', { name: cat(en, 'Shell.topbar.userMenuLabel') }).click();
  await page.getByRole('menuitem', { name: cat(en, 'Shell.userMenu.signOut') }).click();
  await page.waitForURL(/sign-in/, { timeout: 15_000 });

  // OPS: schools + platform settings; never school-admin sections.
  await loginAs(page, 'opsApi');
  hrefs = await sidebarHrefs(page);
  expect(hrefs.join(' ')).toMatch(/dashboard\/ops/);
  expect(hrefs.join(' ')).not.toMatch(/dashboard\/school|dashboard\/children/);
  await shot(page, 'AUTH-019-ops-sidebar');
});

// ---------------------------------------------------------------------------
// AUTH-036 — expired session shows the card; re-auth returns to the same page
// ---------------------------------------------------------------------------
test('AUTH-036 ops session-expiry card and re-authentication round-trip', async ({ page }) => {
  await loginAs(page, 'ops');
  await expect(page).toHaveURL(/\/dashboard\/ops/, { timeout: 20_000 });

  // Kill the session server-side-visible: swap in a syntactically valid but
  // rejected token, then hit the guarded surface — the axios boundary's 401
  // raises the in-memory sessionExpired flag and the guard paints the card.
  await page.evaluate(() => {
    window.localStorage.setItem('app.auth.token', 'n2w1.expired.token');
  });
  await page.goto('/dashboard/ops/schools');
  const expiredHeading = page
    .getByText(cat(en, 'Auth.sessionExpired'))
    .or(page.getByText(cat(en, 'Auth.sessionExpiredBody')));
  await expect(expiredHeading.first()).toBeVisible({ timeout: 20_000 });
  await shot(page, 'AUTH-036-session-expired');

  // Re-authenticate and land back on the ops surface.
  await page
    .getByRole('button', { name: cat(en, 'Auth.sessionExpiredAction') })
    .or(page.getByRole('link', { name: cat(en, 'Auth.sessionExpiredAction') }))
    .first()
    .click();
  await page.waitForURL(/sign-in/, { timeout: 15_000 });
  await loginAs(page, 'ops');
  await expect(page).toHaveURL(/\/dashboard\/ops/, { timeout: 20_000 });
  await shot(page, 'AUTH-036-reauth-ops');
});

// ---------------------------------------------------------------------------
// AUTH-038 — teacher signs out from the user menu; deep links blocked after
// ---------------------------------------------------------------------------
test('AUTH-038 teacher sign-out via user menu; teacher deep links blocked after', async ({
  page,
}) => {
  await loginAs(page, 'teacher');
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });

  // Teacher skin menu: Sign out only (no Settings row).
  await page.getByRole('button', { name: cat(en, 'Shell.topbar.userMenuLabel') }).click();
  const menu = page.getByRole('menu');
  await expect(menu.getByRole('menuitem', { name: cat(en, 'Shell.userMenu.signOut') })).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: cat(en, 'Shell.userMenu.settings') })).toHaveCount(0);
  await menu.getByRole('menuitem', { name: cat(en, 'Shell.userMenu.signOut') }).click();
  await page.waitForURL(/sign-in/, { timeout: 15_000 });
  const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  expect(token).toBeNull();
  await shot(page, 'AUTH-038-teacher-signed-out');

  // The old deep link no longer restores the teacher surface.
  await page.goto('/dashboard/results');
  await page.waitForURL(/sign-in/, { timeout: 15_000 });
  await shot(page, 'AUTH-038-deep-link-blocked');
});

// ---------------------------------------------------------------------------
// AUTH-039 — school admin signs out via the account page sign-out panel
// ---------------------------------------------------------------------------
test('AUTH-039 school admin account-page sign-out clears the session token', async ({ page }) => {
  await loginAs(page, 'schoolAdmin');
  await expect(page).toHaveURL(/\/dashboard\/school/, { timeout: 20_000 });

  await page.goto('/dashboard/school/account');
  await expect(page).toHaveURL(/\/dashboard\/school\/account/, { timeout: 20_000 });
  // The "Sign out" tab mounts the sign-out panel, which signs out on mount.
  await page.getByRole('tab', { name: cat(en, 'SchoolAdmin.account.tabs.signout') }).click();
  await page.waitForURL(/sign-in/, { timeout: 15_000 });
  const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  expect(token).toBeNull();
  await shot(page, 'AUTH-039-sa-signed-out');
});

// ---------------------------------------------------------------------------
// AUTH-040 — browser back after sign-out restores no authenticated view
// ---------------------------------------------------------------------------
test('AUTH-040 browser back after sign-out does not restore the dashboard', async ({ page }) => {
  await loginAs(page, 'schoolAdminB');
  await expect(page).toHaveURL(/\/dashboard\/school/, { timeout: 20_000 });
  // Push a second dashboard entry so browser-back from the post-sign-out
  // sign-in genuinely re-enters dashboard history.
  await page.goto('/dashboard/school/students');

  await page.getByRole('button', { name: cat(en, 'Shell.topbar.userMenuLabel') }).click();
  await page.getByRole('menuitem', { name: cat(en, 'Shell.userMenu.signOut') }).click();
  await page.waitForURL(/sign-in/, { timeout: 15_000 });

  await page.goBack();
  // The guard re-bounces the tokenless visitor — never the authenticated view.
  await page.waitForURL(/sign-in/, { timeout: 15_000 });
  const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  expect(token).toBeNull();
  await shot(page, 'AUTH-040-back-after-signout');
});

// ---------------------------------------------------------------------------
// AUTH-041 — unknown locale-prefixed path renders the branded 404
// ---------------------------------------------------------------------------
test('AUTH-041 unknown locale path renders the branded 404', async ({ page }) => {
  await page.goto('/en/definitely-not-a-real-page-n2w1');
  await expect(
    page.getByRole('heading', { name: cat(en, 'Common.notFoundTitle') }),
  ).toBeVisible();
  await expect(page.getByText(cat(en, 'Common.notFoundDescription'))).toBeVisible();
  await shot(page, 'AUTH-041-branded-404');
});

// ---------------------------------------------------------------------------
// AUTH-042 — SA deep link to an unknown student id shows an honest error
// ---------------------------------------------------------------------------
test('AUTH-042 unknown student documentId shows the not-found state, no crash', async ({
  page,
}) => {
  await loginAs(page, 'schoolAdmin');
  await page.goto('/dashboard/school/students/n2w1-no-such-student');
  await expect(
    page.getByText(cat(en, 'SchoolStudents.detail.notFoundTitle')),
  ).toBeVisible({ timeout: 20_000 });
  await expect(
    page.getByText(cat(en, 'SchoolStudents.detail.notFoundDescription')),
  ).toBeVisible();
  // The shell survived (no crash): the rail and topbar are still mounted.
  await expect(page.getByRole('button', { name: cat(en, 'Shell.topbar.userMenuLabel') })).toBeVisible();
  await shot(page, 'AUTH-042-unknown-student');
});
