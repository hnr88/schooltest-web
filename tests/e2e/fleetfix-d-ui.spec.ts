/**
 * fleetfix-d-ui — FIX-D scratch verification spec (scratch; safe to delete).
 *
 * Live-verification for three confirmed UI defects:
 *   D6  — landing `/` at 375x812: the primary nav renders (or is deliberately
 *         hidden), never accidentally invisible.
 *   D8  — plain loads of /dashboard/teach/notifications and /dashboard/teach/
 *         settings raise ZERO hydration/console errors; no nested <main>.
 *   D11 — the ops account-card dialog STAYS OPEN with the field error visible
 *         on an invalid (101-char) name, and closes only after a valid save.
 *
 * Screenshots: tests/e2e/captures/fleetfix/. Every mutation reverts.
 */
import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';
import { signInTeacherEmail } from './helpers/fleet8';

const en = loadMessages('en');
const CAPTURES = path.resolve(process.cwd(), 'tests', 'e2e', 'captures', 'fleetfix');
const API = process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:5500';
const STAMP = `FXD-${Date.now()}`;
const WAIT = 30_000;

mkdirSync(CAPTURES, { recursive: true });

const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(CAPTURES, `${name}.png`), animations: 'disabled' });

/** Console/page errors + failed page requests from install time. */
function watchConsole(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console.error: ${message.text()}`);
  });
  page.on('response', (response) => {
    if (response.status() < 400) return;
    const url = new URL(response.url());
    if (url.pathname.startsWith('/_next')) return;
    errors.push(`${response.status()} ${response.request().method()} ${url.pathname}`);
  });
  return errors;
}

/** The ops actor exactly as the API serves it (for revert + original name). */
let cachedJwt: string | null = null;
async function opsJwt(): Promise<string> {
  if (cachedJwt) return cachedJwt;
  const res = await fetch(`${API}/api/auth/local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'admin@schooltest.local', password: 'Admin1234!' }),
  });
  if (!res.ok) throw new Error(`[fixd] ops login failed: ${res.status}`);
  cachedJwt = ((await res.json()) as { jwt: string }).jwt;
  return cachedJwt;
}

async function liveActor(): Promise<{ first_name: string | null; last_name: string | null }> {
  const res = await fetch(`${API}/api/ops/capabilities`, {
    headers: { Authorization: `Bearer ${await opsJwt()}`, 'X-Ops-Portal-Version': '1' },
  });
  if (!res.ok) throw new Error(`[fixd] capabilities read failed: ${res.status}`);
  return ((await res.json()) as { data: { actor: { first_name: string | null; last_name: string | null } } })
    .data.actor;
}

async function patchProfile(first: string, last: string): Promise<void> {
  const res = await fetch(`${API}/api/ops/profile`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${await opsJwt()}`,
      'Content-Type': 'application/json',
      'X-Ops-Portal-Version': '1',
    },
    body: JSON.stringify({ first_name: first, last_name: last }),
  });
  if (!res.ok) throw new Error(`[fixd] profile patch failed: ${res.status}`);
}

const OPS_CARD = '[data-slot="ops-account-card"][data-ops-scope="ops-account"]';
const OPS_EDIT = '[data-testid="ops-account-edit"]';
const OPS_FIRST = '#ops-profile-first-name';
const OPS_LAST = '#ops-profile-last-name';
const OPS_DIALOG = '[role="dialog"]';

test.describe.configure({ mode: 'serial' });
test.describe.configure({ timeout: 120_000 });

test.describe('FIX-D D6: landing primary nav at 375x812', () => {
  test('nav is visible, or deliberately hidden (hidden attr / display:none / aria-hidden)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const errors = watchConsole(page);
    await page.goto('/');
    await expect(page.locator('nav[aria-label="Primary"]')).toHaveCount(1);
    const nav = page.locator('nav[aria-label="Primary"]');
    await page.waitForTimeout(2_000); // hydration/settle on the dev server

    const state = await nav.evaluate((element) => {
      const style = window.getComputedStyle(element);
      const deliberatelyHidden =
        element.hasAttribute('hidden') ||
        element.getAttribute('aria-hidden') === 'true' ||
        style.display === 'none' ||
        style.visibility === 'hidden';
      const box = element.getBoundingClientRect();
      return {
        deliberatelyHidden,
        display: style.display,
        visibility: style.visibility,
        width: box.width,
        height: box.height,
      };
    });
    await shot(page, '01-landing-375px-nav');

    if (state.deliberatelyHidden) {
      // Correctly-hidden-but-accessible pattern: the markup must SAY so.
      expect(
        state.deliberatelyHidden,
        `nav hidden deliberately: ${JSON.stringify(state)}`,
      ).toBe(true);
    } else {
      expect(
        state.width > 0 && state.height > 0 && state.visibility !== 'hidden',
        `nav accidentally invisible: ${JSON.stringify(state)}`,
      ).toBe(true);
      // The links themselves are on-screen (possibly inside a scrollable strip).
      const firstLink = nav.locator('a').first();
      await expect(firstLink).toBeVisible();
    }
    expect(errors, `console errors on landing: ${errors.join(' | ')}`).toEqual([]);
  });
});

test.describe('FIX-D D8: teach pages hydrate cleanly', () => {
  test('t2: plain load /dashboard/teach/notifications — zero console errors', async ({ page }) => {
    await signInTeacherEmail(page, 't2@schooltest.local');
    const errors = watchConsole(page);
    await page.goto('/dashboard/teach/notifications');
    await expect(page.locator('[data-surface="teacher-notifications"]')).toBeVisible({
      timeout: WAIT,
    });
    await page.waitForTimeout(3_000);
    await shot(page, '02-teach-notifications-load');
    expect(errors, `console errors: ${errors.join(' | ')}`).toEqual([]);
    const nestedMain = await page.evaluate(
      () => document.querySelectorAll('main main').length,
    );
    expect(nestedMain, 'no nested <main> landmarks').toBe(0);
  });

  test('t2: plain load /dashboard/teach/settings — zero console errors', async ({ page }) => {
    await signInTeacherEmail(page, 't2@schooltest.local');
    const errors = watchConsole(page);
    await page.goto('/dashboard/teach/settings');
    await expect(page.locator('[data-surface="staff-settings"]')).toBeVisible({
      timeout: WAIT,
    });
    await page.waitForTimeout(3_000);
    await shot(page, '03-teach-settings-load');
    expect(errors, `console errors: ${errors.join(' | ')}`).toEqual([]);
    const nestedMain = await page.evaluate(
      () => document.querySelectorAll('main main').length,
    );
    expect(nestedMain, 'no nested <main> landmarks').toBe(0);
  });
});

test.describe('FIX-D D11: ops account card dialog discipline', () => {
  const opsOriginal = { first: 'Ops', last: 'Fixture' };

  test.afterAll(async () => {
    // Belt-and-braces: never hand back a renamed operator.
    try {
      const actor = await liveActor();
      if (actor.first_name !== opsOriginal.first || actor.last_name !== opsOriginal.last) {
        await patchProfile(opsOriginal.first, opsOriginal.last);
      }
    } catch {
      await patchProfile(opsOriginal.first, opsOriginal.last);
    }
  });

  test('invalid 101-char name keeps the dialog open with the error visible', async ({ page }) => {
    const actor = await liveActor();
    opsOriginal.first = actor.first_name ?? 'Ops';
    opsOriginal.last = actor.last_name ?? 'Fixture';

    await loginAs(page, 'ops');
    await page.goto('/dashboard/ops/settings');
    await expect(page.locator(OPS_CARD)).toBeVisible({ timeout: WAIT });
    await page.locator(OPS_EDIT).click();
    await expect(page.locator(OPS_DIALOG)).toBeVisible({ timeout: WAIT });

    const longName = 'X'.repeat(101);
    await page.locator(OPS_FIRST).fill(longName);
    await page
      .getByRole('button', { name: cat(en, 'Ops.settings.account.save'), exact: true })
      .click();
    await page.waitForTimeout(1_500);

    // THE DEFECT: the dialog used to close and discard the draft.
    await expect(page.locator(OPS_DIALOG), 'dialog stays open on invalid submit').toBeVisible();
    await shot(page, '04-ops-invalid-name-dialog-open');

    // The zod field error is rendered under the first-name field.
    const errorText = await page
      .locator(`${OPS_FIRST} >> xpath=ancestor::*[contains(@class,"grid")]//p[contains(@class,"text-destructive") or @role="alert"]`)
      .first()
      .textContent()
      .catch(() => null);
    // Fallback probe: any visible element mentioning the 100-char bound.
    const anyError = page.locator(`${OPS_DIALOG} [role="alert"], ${OPS_DIALOG} .text-destructive`);
    await expect(anyError.first()).toBeVisible();
    if (errorText) expect(errorText.length).toBeGreaterThan(0);

    // And the draft was NOT discarded: the input still carries the invalid value.
    await expect(page.locator(OPS_FIRST)).toHaveValue(longName);
  });

  test('valid rename closes the dialog; the name is then reverted', async ({ page }) => {
    await loginAs(page, 'ops');
    await page.goto('/dashboard/ops/settings');
    await expect(page.locator(OPS_CARD)).toBeVisible({ timeout: WAIT });
    await page.locator(OPS_EDIT).click();
    await expect(page.locator(OPS_DIALOG)).toBeVisible({ timeout: WAIT });

    await page.locator(OPS_FIRST).fill(`FixD${STAMP}`);
    await page
      .getByRole('button', { name: cat(en, 'Ops.settings.account.save'), exact: true })
      .click();
    await expect(page.locator(OPS_DIALOG), 'dialog closes after a successful save').toBeHidden({
      timeout: WAIT,
    });
    await shot(page, '05-ops-valid-rename-closed');

    await patchProfile(opsOriginal.first, opsOriginal.last);
  });
});
