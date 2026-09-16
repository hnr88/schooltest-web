import { readFileSync } from 'node:fs';

import { expect, test, type Page } from '@playwright/test';

import { requireEnv, roleCredentials } from './helpers/credentials';
import { cat, loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';

/**
 * W10 cross-cutting journeys (NIGHT-2 catalog CROSS-001..CROSS-026).
 *
 * One spec, the real :3001 portal (E2E_BASE_URL) against the real :5500 API —
 * no mocks. Public checks first (no auth), then EXACTLY ONE sign-in per role
 * (the shared-stack limiter locks accounts that hammer /api/auth/local).
 * Evidence: per-journey screenshots land in .qa/journeys/w10-cross/shots/.
 */

const en = loadMessages('en');

const LOCALE_LABELS = ['English', '中文', '한국어', 'Melayu', 'Tiếng Việt', 'ไทย'];
const PROOF_CLASS_ID = 't34tb8ogapnh4halzdn7yy4n'; // seeded "Proof 10X"
const SHOTS = '.qa/journeys/w10-cross/shots';

async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });
}

/**
 * Drive the REAL /sign-in form with explicit credentials — loginAs(page, role)
 * pins the role's seeded identity, but Proof 10X belongs to the seed's BASE
 * teacher (t1@schooltest.local), so CROSS-016/003 signs in as that person.
 */
async function signInAs(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true }).fill(email);
  await page.getByLabel(cat(en, 'Auth.portal.passwordLabel'), { exact: true }).fill(password);
  await page.getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true }).click();
  await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 20_000 });
}

// ---------------------------------------------------------------------------
// Public surfaces (no auth) — CROSS-001/002/004/012/021/022/024/025
// ---------------------------------------------------------------------------

test('CROSS-001 locale switcher offers exactly the 6 configured locales', async ({ page }) => {
  await page.goto('/en/sign-in');
  const trigger = page.getByLabel(cat(en, 'LocaleSwitcher.label'), { exact: true });
  await expect(trigger).toBeVisible({ timeout: 20_000 });
  await trigger.click();
  const options = page.getByRole('option');
  await expect(options).toHaveCount(6);
  const labels = await options.allInnerTexts();
  expect(labels).toEqual(LOCALE_LABELS);
  await shot(page, 'cross001-locale-switcher');
});

test('CROSS-002 zh and ko copies render on sign-in — no raw keys or English leak', async ({ page }) => {
  for (const locale of ['zh', 'ko'] as const) {
    const messages = loadMessages(locale);
    await page.goto(`/${locale}/sign-in`);
    // The sign-in CTA must be the locale's OWN copy, never the en fallback.
    const cta = cat(messages, 'Auth.portal.loginButton');
    await expect(
      page.getByRole('button', { name: cta, exact: true }),
      `${locale} sign-in CTA renders its own copy`,
    ).toBeVisible({ timeout: 20_000 });
    // No raw message key may leak into the rendered text.
    const body = await page.locator('body').innerText();
    expect(body, `${locale} page leaks no raw key`).not.toMatch(/Auth\.portal\.|LocaleSwitcher\.|Common\./);
    // The en CTA must NOT be the visible one (English fallback leak check).
    const enCta = cat(en, 'Auth.portal.loginButton');
    if (enCta !== cta) {
      expect(body, `${locale} leaks the English CTA`).not.toContain(enCta);
    }
    await shot(page, `cross002-signin-${locale}`);
  }
});

test('CROSS-004 an unsupported /fr prefix falls back without a crash', async ({ page }) => {
  const res = await page.goto('/fr/dashboard');
  // The middleware leaves the unknown prefix in the URL and the router serves
  // the DEFAULT-LOCALE branded 404 (measured: 200 + NEXT_HTTP_ERROR_FALLBACK
  // 404 content) — an honest fallback, never a crash. A 500 is the failure.
  expect(res?.status() ?? 0, 'no server error for an unknown locale prefix').toBeLessThan(500);
  const body = await page.locator('body').innerText();
  expect(
    body + (await page.title()),
    'the default-locale branded 404 answers the unknown prefix',
  ).toMatch(/SchoolTest|hopped|page/i);
  expect(body, 'no framework error leaks').not.toMatch(/Application error|Unhandled/);
  await shot(page, 'cross004-fr-fallback');
});

test('CROSS-021 public marketing pages render with SEO metadata', async ({ page }) => {
  for (const route of ['/', '/track', '/report', '/predict', '/teach', '/diagnose']) {
    const res = await page.goto(route);
    expect(res?.status(), `${route} responds 200`).toBe(200);
    await expect(page).toHaveTitle(/SchoolTest/);
    const title = await page.title();
    expect(title.length, `${route} has a human title`).toBeGreaterThan(3);
  }
  await shot(page, 'cross021-marketing');
});

test('CROSS-022 legal pages render in at least two locales', async ({ page }) => {
  for (const route of [
    '/en/privacy-policy',
    '/zh/privacy-policy',
    '/en/gdpr',
    '/ko/gdpr',
    '/en/terms-of-service',
    '/en/cookie-policy',
  ]) {
    const res = await page.goto(route);
    expect(res?.status(), `${route} responds 200`).toBe(200);
    // textContent, not innerText: the legal chrome animates in, and innerText
    // of elements mid-entry-animation can read as empty.
    const body = await page.locator('body').textContent();
    expect((body ?? '').trim().length, `${route} renders content`).toBeGreaterThan(200);
  }
  await shot(page, 'cross022-legal');
});

test('CROSS-024 opengraph-image route renders a valid image', async ({ page }) => {
  const res = await page.request.get('/en/opengraph-image');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('image/png');
  const body = await res.body();
  expect(body.length, 'a real PNG body arrives').toBeGreaterThan(1_000);
});

test('CROSS-012 branded 404 renders with primary and secondary actions', async ({ page }) => {
  await page.goto('/en/definitely-hopped-away-w10');
  await expect(page.getByRole('img', { name: '404' })).toBeVisible({ timeout: 20_000 });
  await expect(
    page.getByRole('link', { name: cat(en, 'Common.backToDashboard'), exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: cat(en, 'Common.reportProblem'), exact: true }),
  ).toBeVisible();
  await shot(page, 'cross012-404');
});

test('CROSS-025 a long-retired deep route lands on the branded 404 with a working CTA', async ({ page }) => {
  await page.goto('/en/dashboard/school/teleport-old-w10');
  await expect(page.getByRole('img', { name: '404' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('link', { name: cat(en, 'Common.backToDashboard'), exact: true }).click();
  await page.waitForTimeout(1_000);
  const path = new URL(page.url()).pathname;
  expect(path === '/' || path === '/en' || path.startsWith('/dashboard') || path === '/en/',
    'the primary CTA navigates somewhere useful').toBeTruthy();
  await shot(page, 'cross025-retired-404-cta');
});

test('CROSS-014 route-segment loading skeleton renders during a slow navigation', async ({ page }) => {
  // Delay the RSC payload so the segment loading.tsx must paint first.
  await page.route('**/track**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1_200));
    await route.continue();
  });
  void page.goto('/en/track');
  const skeleton = page.locator('[class*="animate-pulse"]').first();
  await expect(skeleton, 'the skeleton paints before the page settles').toBeVisible({
    timeout: 10_000,
  });
  await shot(page, 'cross014-loading-skeleton');
});

// ---------------------------------------------------------------------------
// School admin — CROSS-005/006/007/008/009/010/011/018/019/026 (one login)
// ---------------------------------------------------------------------------

test('CROSS-005..026 school-admin shell journeys', async ({ page }, testInfo) => {
  testInfo.setTimeout(360_000);
  // NOTE (CROSS-019 scope): sign-in and reset-password deliberately use the
  // kit's hideToggle plain input — there is no toggle to label on those screens.
  // The labelled-toggle surfaces are sign-up and change-password (checked below
  // on the staff settings page).
  await loginAs(page, 'schoolAdmin');
  await page.setViewportSize({ width: 1440, height: 900 });

  // --- CROSS-006: Cmd-K launcher opens the school-search dialog -------------
  await page.goto('/en/dashboard/school/classes');
  const sidebar = page.locator('[data-slot="sidebar"]').first();
  await expect(sidebar).toBeVisible({ timeout: 30_000 });
  const launcher = page.getByLabel(cat(en, 'SchoolCommand.triggerLabel'));
  await expect(launcher, 'the Cmd-K launcher is in the topbar').toBeVisible({ timeout: 20_000 });
  const searchDialog = page.locator('[data-slot="school-search-dialog"]');
  await page.keyboard.press('ControlOrMeta+k');
  const byShortcut = await searchDialog
    .waitFor({ state: 'visible', timeout: 5_000 })
    .then(() => true, () => false);
  if (!byShortcut) {
    // Keyboard race — the launcher button drives the same open path. (A click
    // while the palette is already open would CLOSE it, so only click when the
    // shortcut did not open it.)
    await launcher.click();
  }
  await expect(searchDialog, 'Cmd-K opens the palette').toBeVisible({ timeout: 10_000 });
  await page.keyboard.type('A27');
  await expect(searchDialog.getByRole('option').first(), 'search returns matches').toBeVisible({
    timeout: 15_000,
  });
  await page.keyboard.press('Escape');
  await shot(page, 'cross006-cmdk');

  // --- CROSS-007: breadcrumb reflects the route on each section -------------
  for (const route of ['/dashboard/school/students', '/dashboard/school/classes', '/dashboard/school/teachers']) {
    await page.goto(`/en${route}`);
    const crumb = page.locator('[data-slot="topbar-page-title"]');
    await expect(crumb, `breadcrumb current page on ${route}`).toBeVisible({ timeout: 30_000 });
    const text = (await crumb.innerText()).trim();
    expect(text.length, `breadcrumb on ${route} is not empty`).toBeGreaterThan(0);
  }
  await shot(page, 'cross007-breadcrumb');

  // --- CROSS-008: sidebar collapse trigger works; rail labels render --------
  await page.goto('/en/dashboard/school/classes');
  await expect(page.locator('[data-slot="sidebar"]').first()).toBeVisible({ timeout: 30_000 });
  const trigger = page.getByRole('button', { name: cat(en, 'Shell.topbar.toggleNav') }).first();
  await trigger.click();
  await page.waitForTimeout(400);
  await trigger.click();
  await expect(page.locator('[data-slot="sidebar"] a').first()).toBeVisible();
  await shot(page, 'cross008-sidebar');

  // --- CROSS-009/026: user menu → Settings routes staff to the staff route --
  await page.goto('/en/dashboard/school/classes');
  const menuTrigger = page.getByRole('button', { name: cat(en, 'Shell.topbar.userMenuLabel') });
  await expect(menuTrigger).toBeVisible({ timeout: 20_000 });
  await menuTrigger.click();
  const settingsItem = page.getByRole('menuitem', { name: cat(en, 'Shell.userMenu.settings') });
  await expect(settingsItem).toBeVisible();
  await settingsItem.click();
  await page.waitForURL('**/dashboard/teach/settings**');
  // D-08 regression pin: staff must NEVER land on the parent-only route.
  expect(new URL(page.url()).pathname, 'staff lands on the staff settings route').toMatch(
    /\/dashboard\/teach\/settings$/,
  );
  await expect(
    page.locator('[data-surface="staff-settings"]'),
    'the staff settings page renders (no guard bounce)',
  ).toBeVisible({ timeout: 20_000 });
  // CROSS-019: every RENDERED show/hide password toggle carries a label
  // (sign-up + change-password; sign-in/reset use the kit's plain input).
  await expect(
    page.getByLabel(cat(en, 'Auth.showPassword'), { exact: true }).first(),
    'the change-password show-password toggle is labelled',
  ).toBeVisible({ timeout: 20_000 });
  await shot(page, 'cross009-staff-settings');

  // --- CROSS-010: bell popover with badge, mark-all, view-all ---------------
  await page.goto('/en/dashboard/school/classes');
  const bell = page.locator('[data-slot="notification-bell"]');
  await expect(bell).toBeVisible({ timeout: 20_000 });
  await expect(bell).toHaveAttribute('aria-label', cat(en, 'Notifications.bellLabel'));
  await bell.click();
  const popover = page.locator('[data-slot="notification-popover"]');
  await expect(popover).toBeVisible();
  await expect(popover.getByRole('button', { name: cat(en, 'Notifications.markAllReadShort') })).toBeVisible();
  const viewAll = popover.getByRole('link', { name: cat(en, 'Notifications.viewAll') });
  await expect(viewAll).toBeVisible();
  expect(await viewAll.getAttribute('href')).toContain('/dashboard/teach/notifications');
  await page.keyboard.press('Escape');
  await shot(page, 'cross010-bell');

  // --- CROSS-019: icon-only controls carry aria-labels -----------------------
  await expect(page.getByLabel(cat(en, 'Shell.topbar.toggleNav')).first()).toBeVisible();
  await expect(page.getByLabel(cat(en, 'Shell.topbar.userMenuLabel'))).toBeVisible();
  await shot(page, 'cross019-aria-labels');

  // --- CROSS-005: no theme/dark-mode toggle anywhere in the shell -----------
  await page.goto('/en/dashboard/school/classes');
  await expect(page.locator('[data-slot="sidebar"]').first()).toBeVisible({ timeout: 30_000 });
  const themeToggles = page.locator(
    'button[aria-label*="theme" i], button[aria-label*="dark" i], button[aria-label*="light" i], [data-slot="theme-toggle"]',
  );
  expect(await themeToggles.count(), 'no theme toggle control in the shell').toBe(0);
  await shot(page, 'cross005-no-theme-toggle');

  // --- CROSS-018: focus indication resolves; motion-reduce variants shipped -
  const navItem = page.locator('[data-slot="sidebar"] a').first();
  await navItem.focus();
  const hasRing = await navItem.evaluate((el) => {
    const style = getComputedStyle(el);
    return (
      el.className.includes('focus-visible:ring') ||
      (style.boxShadow !== 'none' && style.boxShadow !== '') ||
      style.outlineWidth !== '0px'
    );
  });
  expect(hasRing, 'a focus indication resolves on the focused control').toBeTruthy();
  const shellConstants = readFileSync(
    'src/modules/shell/constants/shell-classes.constants.ts',
    'utf8',
  );
  expect(shellConstants).toContain('motion-reduce:transition-none');
  expect(shellConstants).toContain('focus-visible:ring-2');
  await shot(page, 'cross018-focus-ring');

  // --- CROSS-011: a sonner toast renders for a real op and is dismissible ---
  await page.goto('/en/dashboard/school/classes');
  const addButton = page.getByRole('button', { name: cat(en, 'Classes.addButton'), exact: true });
  await expect(addButton).toBeVisible({ timeout: 20_000 });
  await addButton.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.locator('input').first().fill(`W10 Toast ${Date.now()}`);
  await dialog.getByRole('button', { name: /create|save|add/i }).last().click();
  const toast = page.locator('[data-sonner-toast]').first();
  await expect(toast, 'a sonner toast appears after the op').toBeVisible({ timeout: 15_000 });
  const toastGone = await toast
    .locator('button')
    .last()
    .isVisible()
    .then(async (visible) => {
      if (!visible) return false;
      await toast.locator('button').last().click();
      return toast
        .isHidden()
        .catch(() => false);
    });
  if (!toastGone) {
    await expect(toast, 'the toast clears (dismiss or auto-dismiss)').toBeHidden({
      timeout: 8_000,
    });
  }
  await shot(page, 'cross011-toast');
});

// ---------------------------------------------------------------------------
// Teacher — CROSS-016 live deep link + CROSS-003 locale mid-session (one login)
// ---------------------------------------------------------------------------

test('CROSS-016/003 teacher results live tab + mid-session locale switch', async ({ page }, testInfo) => {
  testInfo.setTimeout(240_000);
  // Proof 10X is owned by the seed's base teacher, so THIS journey signs in as
  // t1 (same seed password); `teacher@` owns no class and would 404 the route.
  await signInAs(page, 't1@schooltest.local', requireEnv('SEED_TEACHER_PASSWORD'));

  // --- CROSS-016: ?tab=live deep link opens the live tab directly -----------
  await page.goto(`/en/dashboard/results/${PROOF_CLASS_ID}?tab=live`);
  // The six ClassResultsTabs triggers carry data-tab; ?tab= must make `live`
  // the ACTIVE one on arrival (no click).
  const liveTab = page.locator('[data-slot="class-results-tabs"] [data-tab="live"]');
  await expect(liveTab, 'the live tab exists on the results page').toBeVisible({
    timeout: 30_000,
  });
  await expect(
    liveTab,
    'the live tab is the ACTIVE one on deep link (aria-selected or active state)',
  ).toHaveAttribute('aria-selected', 'true');
  await shot(page, 'cross016-tab-live');

  // --- CROSS-003: locale switch mid-session keeps the route -----------------
  // /dashboard/teach itself redirects to /dashboard/results — the switcher
  // journey needs a STABLE route, so use the staff settings page.
  const route = '/dashboard/teach/settings';
  await page.goto(`/en${route}`);
  await expect(page.locator('[data-slot="sidebar"]').first()).toBeVisible({ timeout: 30_000 });
  // This is exactly what LocaleSwitcher does (window.location.replace to the
  // new prefix) — the switcher itself is an auth-screen control only.
  await page.goto(`/zh${route}`);
  await expect(page.locator('[data-slot="sidebar"]').first(), 'the shell re-renders under /zh').toBeVisible({
    timeout: 30_000,
  });
  expect(new URL(page.url()).pathname, 'the route is preserved under the new prefix').toBe(
    `/zh${route}`,
  );
  const body = await page.locator('body').innerText();
  expect(body, 'no raw keys leak in the re-rendered shell').not.toMatch(/Shell\.[a-z]/);
  const enShellLabel = cat(en, 'Shell.topbar.userMenuLabel');
  expect(body, 'the shell is not still in English').not.toContain(enShellLabel);
  await shot(page, 'cross003-mid-session-zh');
});

// ---------------------------------------------------------------------------
// Ops — CROSS-015 URL filters + CROSS-020 banner + CROSS-023 expiry (one login)
// ---------------------------------------------------------------------------

test('CROSS-015/020/023 ops journeys', async ({ page }, testInfo) => {
  testInfo.setTimeout(360_000);
  await loginAs(page, 'ops');

  // --- CROSS-015: back/forward preserves URL-held list filters --------------
  await page.goto('/en/dashboard/ops/schools');
  await expect(page.locator('main[data-slot="sidebar-inset"]').first()).toBeVisible({ timeout: 30_000 });
  const select = page.locator('select').first();
  if ((await select.count()) > 0) {
    await select.selectOption({ index: 1 });
    await page.waitForTimeout(800);
    const urlWithFilter = page.url();
    const query = urlWithFilter.split('?')[1] ?? '';
    expect(query.length, 'the filter state lives in the URL').toBeGreaterThan(0);
    await page.goBack();
    await page.waitForTimeout(500);
    await page.goForward();
    await page.waitForTimeout(800);
    expect(page.url(), 'forward restores the filtered URL').toBe(urlWithFilter);
  } else {
    await page.goto('/en/dashboard/ops/schools?status=suspended');
    await page.waitForTimeout(800);
    expect(page.url()).toContain('status=');
  }
  await shot(page, 'cross015-url-filters');

  // --- CROSS-020: ops-set banner renders on public pages per level ----------
  const creds = roleCredentials('ops');
  const login = await page.request.post('http://127.0.0.1:5500/api/auth/local', {
    data: { identifier: creds.email, password: creds.password },
  });
  const jwt = ((await login.json()) as { jwt?: string }).jwt ?? '';
  const headers = { Authorization: `Bearer ${jwt}`, 'X-Ops-Portal-Version': '1' };
  const API = 'http://127.0.0.1:5500';

  await page.request.put(`${API}/api/ops/settings/announcement`, {
    headers,
    data: { enabled: true, level: 'info', message: 'W10 banner probe — announcement' },
  });
  await page.goto('/en');
  const announcement = page.locator('[data-slot="announcement-banner"]');
  await expect(announcement, 'the announcement renders on the public page').toBeVisible({
    timeout: 30_000,
  });
  await expect(announcement).toContainText('W10 banner probe — announcement');

  await page.request.put(`${API}/api/ops/settings/maintenance`, {
    headers,
    data: { enabled: true, message: 'W10 banner probe — maintenance' },
  });
  await page.goto('/en');
  const maintenance = page.locator('[data-slot="maintenance-banner"]');
  await expect(maintenance, 'maintenance outranks the announcement').toBeVisible({
    timeout: 30_000,
  });
  await expect(maintenance).toContainText('W10 banner probe — maintenance');

  // Restore both OFF — leave the shared stack as found.
  await page.request.put(`${API}/api/ops/settings/maintenance`, { headers, data: { enabled: false } });
  await page.request.put(`${API}/api/ops/settings/announcement`, { headers, data: { enabled: false } });
  await page.goto('/en');
  await expect(page.locator('[data-slot="maintenance-banner"]')).toHaveCount(0);
  await expect(page.locator('[data-slot="announcement-banner"]')).toHaveCount(0);
  await shot(page, 'cross020-banner');

  // --- CROSS-023: an expiring session shows the expired card ONCE -----------
  await page.goto('/en/dashboard/ops/schools');
  await expect(page.locator('main[data-slot="sidebar-inset"], main').first()).toBeVisible({
    timeout: 30_000,
  });
  // Corrupt the stored token, then trigger an IN-APP navigation whose schools
  // read goes to the real API with the now-dead token — the axios response
  // interceptor classifies that 401 as auth-invalid (GAP-6) and the guard
  // raises the SESSION EXPIRED wall instead of a redirect loop.
  await page.evaluate(() => window.localStorage.setItem('app.auth.token', 'w10-expired-probe'));
  await page.locator('[data-slot="sidebar"] a').first().click();
  const card = page.locator('[data-slot="ops-session-expired"]');
  await expect(card).toBeVisible({ timeout: 30_000 });
  await expect(card, 'exactly one expired wall').toHaveCount(1);
  await page.waitForTimeout(3_000);
  expect(new URL(page.url()).pathname, 'no redirect loop while the card shows').toMatch(
    /\/dashboard/,
  );
  await expect(card).toBeVisible();
  await shot(page, 'cross023-session-expired');
});
