/**
 * fleet4-04 — the ops_support (read-only) session across MY slice's web
 * surfaces: /dashboard/ops/settings and the capabilities banner.
 *
 * Proven: support reaches the settings page (it is entitled to), the read-only
 * banner is announced, the account card edit is its ONE permitted write (and
 * it works), privileged controls are NOT reachable by URL/keyboard tricks, and
 * the console stays clean. Screenshots: tests/e2e/captures/fleet4/.
 */
import { mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';

const en = loadMessages('en');
const CAPTURES = path.resolve(__dirname, 'captures/fleet4');
const SETTINGS_ROUTE = '/dashboard/ops/settings';
const CARD = '[data-slot="ops-account-card"][data-ops-scope="ops-account"]';
const EDIT = '[data-testid="ops-account-edit"]';
const FIRST = '#ops-profile-first-name';
const LAST = '#ops-profile-last-name';
const BANNER = '[data-slot="ops-capabilities-read-only"]';
const API = process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:5500';
const STATE = path.join(os.tmpdir(), 'schooltest-f4-support-state.json');
const STAMP = `F4-${Date.now()}`;
const WAIT = 20_000;

const SUPPORT_EMAIL = process.env.E2E_OPS_SUPPORT_EMAIL ?? 'opssupport@schooltest.local';
const SUPPORT_PASSWORD = process.env.E2E_OPS_SUPPORT_PASSWORD ?? 'SupWvEStNXzqs6rljOl5YOSm!7';

const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(CAPTURES, `${name}.png`), fullPage: true });

function watchConsole(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console.error: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  return errors;
}

/** Support sign-in through the real form, riding out the shared rate limit. */
async function loginAsSupport(page: Page, attempts = 6): Promise<void> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await page.goto('/sign-in');
    await page
      .getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true })
      .fill(SUPPORT_EMAIL);
    await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(SUPPORT_PASSWORD);
    await page.getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true }).click();
    const landed = await page
      .waitForURL(/\/dashboard(\/|$)/, { timeout: WAIT })
      .then(() => true)
      .catch(() => false);
    if (landed) return;
    await page.waitForTimeout(15_000);
  }
  throw new Error(`[f4] ops_support sign-in never landed — last URL ${page.url()}`);
}

test.describe.configure({ mode: 'serial' });
test.describe.configure({ timeout: 150_000 });

test.describe('fleet4 ops_support refusals on ops tools', () => {
  test.use({ storageState: STATE });

  // The support persona's names, snapshotted before any rename so the write
  // test can restore them even if an assertion fails mid-flow.
  let originalName: { first: string; last: string } | null = null;

  test.afterAll(async () => {
    if (!originalName) return;
    const login = await fetch(`${API}/api/auth/local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: SUPPORT_EMAIL, password: SUPPORT_PASSWORD }),
    });
    if (!login.ok) return;
    const jwt = ((await login.json()) as { jwt: string }).jwt;
    await fetch(`${API}/api/ops/profile`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
        'X-Ops-Portal-Version': '1',
      },
      body: JSON.stringify({
        first_name: originalName.first,
        last_name: originalName.last,
      }),
    });
  });

  async function supportActor(): Promise<{ first_name: string; last_name: string }> {
    const login = await fetch(`${API}/api/auth/local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: SUPPORT_EMAIL, password: SUPPORT_PASSWORD }),
    });
    const jwt = ((await login.json()) as { jwt: string }).jwt;
    const res = await fetch(`${API}/api/ops/capabilities`, {
      headers: { Authorization: `Bearer ${jwt}`, 'X-Ops-Portal-Version': '1' },
    });
    return ((await res.json()) as { data: { actor: { first_name: string; last_name: string } } })
      .data.actor;
  }

  test.beforeAll(async ({ browser }) => {
    mkdirSync(CAPTURES, { recursive: true });
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    await loginAsSupport(page);
    await context.storageState({ path: STATE });
    await context.close();
  });

  test('settings page: support is admitted, banner announced, console clean', async ({ page }) => {
    const errors = watchConsole(page);
    await page.goto(SETTINGS_ROUTE);
    await expect(page.locator(CARD)).toBeVisible({ timeout: WAIT });
    const banner = page.locator(BANNER);
    await expect(banner).toBeVisible({ timeout: WAIT });
    await expect(banner).toContainText(/read-only/i);
    await shot(page, '40-support-settings-banner');
    // F4 FINDING ([BUG] reported 2026-09-16): OpsGuard's D-14 read
    // (GET /api/platform-settings, session_timeout_minutes) fires for EVERY
    // ops-portal role, but the API grants only `ops` — so an ops_support
    // session logs a 403 console error on every ops page load. Pinned here as
    // exactly one known error; anything ELSE is a regression.
    const unexpected = errors.filter(
      (entry) => !/403 \(Forbidden\)/.test(entry) || !entry.includes('Failed to load resource'),
    );
    expect(
      unexpected,
      `unexpected console errors as support: ${unexpected.join(' | ')}`,
    ).toEqual([]);
    expect(
      errors.length,
      `expected exactly the known D-14 403, saw: ${errors.join(' | ')}`,
    ).toBe(1);
  });

  test('the one permitted write: support renames ITSELF, and only itself', async ({ page }) => {
    const before = await supportActor();
    originalName = { first: before.first_name, last: before.last_name };

    await page.goto(SETTINGS_ROUTE);
    await expect(page.locator(CARD)).toBeVisible({ timeout: WAIT });
    await expect(page.locator(BANNER)).toBeVisible({ timeout: WAIT });

    await page.locator(EDIT).click();
    await expect(page.locator(FIRST)).toBeVisible({ timeout: WAIT });
    await page.locator(FIRST).fill(`Sup${STAMP}`);
    await page.locator(LAST).fill('Support');
    await page
      .getByRole('button', { name: cat(en, 'Ops.settings.account.save'), exact: true })
      .click();
    await expect(
      page.getByText(cat(en, 'Ops.settings.account.savedToast'), { exact: true }),
    ).toBeVisible({ timeout: WAIT });
    await shot(page, '41-support-rename-saved');

    // The card now shows the support identity — never the ops admin's.
    const cardText = await page.locator(CARD).innerText();
    expect(cardText).not.toContain('admin@schooltest.local');
    expect(cardText).toContain('opssupport@schooltest.local');
  });

  test('URL/keyboard reachability: no privileged control hides on this surface', async ({
    page,
  }) => {
    await page.goto(SETTINGS_ROUTE);
    await expect(page.locator(CARD)).toBeVisible({ timeout: WAIT });

    // Keyboard sweep: every focusable control is either the edit pill or a
    // nav/rail link — no hidden admin-only control is focusable into action.
    const focusables: string[] = [];
    for (let i = 0; i < 25; i += 1) {
      await page.keyboard.press('Tab');
      const info = await page
        .evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el) return null;
          return `${el.tagName}:${(el.textContent ?? '').trim().slice(0, 40)}`;
        })
        .catch(() => null);
      if (info) focusables.push(info);
    }
    console.log(`[f4] support focusables on settings: ${JSON.stringify(focusables)}`);
    const dangerous = focusables.filter((entry) =>
      /maintenance|backup|restore|purge|delete|flag|system/i.test(entry),
    );
    expect(dangerous, `privileged controls must not be keyboard-reachable: ${dangerous}`).toEqual(
      [],
    );
    await shot(page, '42-support-keyboard-sweep');

    // The retired tool screens stay retired for support as well.
    for (const retired of ['/dashboard/ops/flags', '/dashboard/ops/system']) {
      await page.goto(retired);
      await expect(page.getByText(/this page could not be found|404/i).first()).toBeVisible({
        timeout: WAIT,
      });
      await shot(page, `43-support-retired${retired.replace(/\//g, '-')}`);
    }
  });

  test('support writes land on the SUPPORT account, the admin card never moves', async ({
    page,
  }) => {
    // Sanity cross-check: while support renames itself, the ops admin identity
    // is untouched (different documentId server-side; the JWT resolves alone).
    const adminRes = await fetch(`${API}/api/ops/capabilities`, {
      headers: {
        Authorization: `Bearer ${(
          await (
            await fetch(`${API}/api/auth/local`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                identifier: 'admin@schooltest.local',
                password: 'Admin1234!',
              }),
            })
          ).json() as { jwt: string }
        ).jwt}`,
        'X-Ops-Portal-Version': '1',
      },
    });
    const admin = (await adminRes.json()) as {
      data: { actor: { email: string; first_name: string; last_name: string } };
    };
    expect(admin.data.actor.email).toBe('admin@schooltest.local');
    expect(
      admin.data.actor.first_name.startsWith('Sup'),
      `the support rename must never leak into the ops admin: ${JSON.stringify(admin.data.actor)}`,
    ).toBe(false);
  });
});
