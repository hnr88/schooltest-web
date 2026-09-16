/**
 * F10 SWEEP 2 — refresh / back / forward + sign-out bfcache.
 *
 * The idiot-proofing question on every major page: does a RELOAD keep the
 * state intact without an error boundary, does BACK after a mutating action
 * resurrect stale rows or an open form, and does FORWARD after sign-out
 * resurrect an authed view from bfcache.
 */
import { expect, test, type Page } from '@playwright/test';

import {
  classify,
  dumpF10Console,
  settle,
  shot,
  signedInAs,
  watchF10,
} from './fleet10-helpers';

test.describe('F10 refresh / back / forward', () => {
  const MAJOR: Array<{ role: 'ops' | 'schoolAdmin' | 'teacher' | 'parent'; url: string; expectText?: string }> = [
    { role: 'ops', url: '/dashboard/ops/schools' },
    { role: 'ops', url: '/dashboard/ops/settings' },
    { role: 'schoolAdmin', url: '/dashboard/school' },
    { role: 'schoolAdmin', url: '/dashboard/school/classes' },
    { role: 'schoolAdmin', url: '/dashboard/school/teachers' },
    { role: 'teacher', url: '/dashboard/results' },
    { role: 'teacher', url: '/dashboard/test-sessions' },
    { role: 'parent', url: '/dashboard' },
  ];

  test('reload keeps every major page intact', async ({ browser }, testInfo) => {
    test.setTimeout(240_000);
    const problems: string[] = [];
    for (const major of MAJOR) {
      const { context, page } = await signedInAs(browser, major.role, testInfo);
      watchF10(page, `reload:${major.url}`);
      try {
        await page.goto(major.url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
        await settle(page);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await settle(page);
        const outcome = await classify(page, major.url);
        await shot(page, `refresh/${major.role}-${major.url.replace(/\W+/g, '-').slice(0, 60)}`);
        console.log(`[f10 reload] ${major.role} ${major.url} -> ${outcome}`);
        if (outcome !== 'rendered') problems.push(`${major.role} ${major.url} reload -> ${outcome}`);
      } finally {
        await context.close();
      }
    }
    expect(problems, problems.join('; ')).toEqual([]);
    dumpF10Console(testInfo);
  });

  test('back after a mutating action shows no stale form and no lost row', async ({ browser }, testInfo) => {
    test.setTimeout(240_000);
    const stamp = Date.now();
    const className = `F10-${stamp}-back`;
    const { context, page } = await signedInAs(browser, 'schoolAdmin', testInfo);
    watchF10(page, 'back-after-create');
    try {
      await page.goto('/dashboard/school/classes', { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await settle(page);
      const screen = page.locator('[data-slot="school-classes"]');
      await expect(screen).toBeVisible({ timeout: 30_000 });

      // Create one stamped class through the Add class modal.
      await screen.getByRole('button', { name: 'Add class', exact: true }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await dialog.getByLabel('Class name').fill(className);
      await dialog.getByRole('button', { name: 'Add class', exact: true }).click();
      await expect(dialog).toBeHidden({ timeout: 30_000 });

      // BACK: the browser may hand back a bfcache frame — the modal must stay
      // closed and the list must render.
      await page.goBack();
      await settle(page);
      await expect(page.getByRole('dialog')).toHaveCount(0);
      const afterBack = await classify(page, '/dashboard/school/classes');
      await shot(page, `refresh/back-after-create-${afterBack}`);

      // FORWARD again, then a hard reload — the row must still exist.
      await page.reload({ waitUntil: 'domcontentloaded' });
      await settle(page);
      const row = page.locator('tr', { hasText: className });
      await expect(row).toBeVisible({ timeout: 30_000 });
      await shot(page, 'refresh/back-create-persisted');
      console.log(`[f10 back-after-create] afterBack=${afterBack}, row persisted after reload`);
      expect(afterBack === 'rendered' || afterBack === 'redirect-role').toBe(true);
    } finally {
      await context.close();
    }
    dumpF10Console(testInfo);
  });

  test('forward after sign-out must not resurrect an authed view', async ({ browser }, testInfo) => {
    test.setTimeout(240_000);
    const { context, page } = await signedInAs(browser, 'parent', testInfo);
    watchF10(page, 'signout-bfcache');
    try {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await settle(page);
      await expect(page.locator('[data-slot="dashboard-content"]')).toBeVisible({ timeout: 30_000 });

      // Sign out through the real user menu.
      await page.getByRole('button', { name: 'Open user menu' }).click();
      await page.getByRole('menuitem', { name: 'Sign out' }).click();
      await page.waitForURL(/\/sign-in/, { timeout: 30_000 });
      await settle(page);

      // BACK toward the authed page, then FORWARD again — bfcache must not
      // hand back a signed-in screen.
      await page.goBack();
      await settle(page);
      await page.goForward();
      await settle(page);
      const outcome = await classify(page, '/sign-in');
      await shot(page, `refresh/forward-after-signout-${outcome}`);
      console.log(`[f10 signout-bfcache] after back+forward: url=${page.url()} outcome=${outcome}`);
      if (outcome === 'rendered') {
        console.log('[F10-FINDING] forward after sign-out resurrected an authed view (bfcache)');
      }
      expect(outcome === 'signin' || outcome === 'redirect-role').toBe(true);
    } finally {
      await context.close();
    }
    dumpF10Console(testInfo);
  });

  test('deep-link, sign-in, then back does not strand the user on a dead wall', async ({ browser }, testInfo) => {
    test.setTimeout(240_000);
    // Signed-out deep link to an authed page -> bounce carries ?next — after
    // signing in the user should land where they were heading, not on a blank
    // intermediate page; going BACK from the authed page must leave the app.
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page: Page = await context.newPage();
    page.setDefaultTimeout(30_000);
    watchF10(page, 'deeplink-back');
    try {
      await page.goto('/dashboard/children', { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await settle(page);
      const bouncedTo = page.url();
      console.log(`[f10 deeplink] /dashboard/children bounced to ${bouncedTo}`);
      await shot(page, 'refresh/deeplink-bounce');
      expect(bouncedTo).toMatch(/sign-in/);
      // Sign in THROUGH the bounced form and record where the app takes us.
      await page.getByLabel('Email address', { exact: true }).fill('parent@schooltest.local');
      await page.getByLabel('Password', { exact: true }).fill('Parent1234!');
      await page.getByRole('button', { name: 'Log in', exact: true }).click();
      await page.waitForURL(/dashboard/, { timeout: 45_000 });
      await settle(page);
      const landed = page.url();
      await shot(page, 'refresh/deeplink-after-signin');
      console.log(`[f10 deeplink] after sign-in landed on ${landed}`);
      // BACK from the authed page must not re-show the signed-out wall
      // already consumed — any outcome is recorded; a crash is a defect.
      await page.goBack();
      await settle(page);
      const backOutcome = await classify(page);
      await shot(page, `refresh/deeplink-back-${backOutcome}`);
      console.log(`[f10 deeplink] back landed on ${page.url()} -> ${backOutcome}`);
      expect(backOutcome === 'white' || backOutcome === 'crash').toBe(false);
    } finally {
      await context.close();
    }
    dumpF10Console(testInfo);
  });
});
