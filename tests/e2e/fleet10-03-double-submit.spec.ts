/**
 * F10 SWEEP 3 — double submits.
 *
 * Doubled clicks are what actual users do. Every quickly reachable form gets
 * a deliberate double-click and the app must produce EXACTLY ONE effect —
 * one auth session, one class, one invitation — counted on the wire, not in
 * the DOM alone. Created rows are stamped F10-<epoch>.
 */
import { expect, test } from '@playwright/test';

import { dumpF10Console, settle, shot, signedInAs, watchF10 } from './fleet10-helpers';

test.describe('F10 double submits', () => {
  test('sign-in: double-click creates exactly one session', async ({ browser }, testInfo) => {
    test.setTimeout(180_000);
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    page.setDefaultTimeout(30_000);
    watchF10(page, 'double:sign-in');
    try {
      const logins: number[] = [];
      page.on('response', (res) => {
        if (res.url().includes('/api/auth/local') && res.request().method() === 'POST') {
          logins.push(res.status());
        }
      });
      await page.goto('/sign-in');
      await page.getByLabel('Email address', { exact: true }).fill('parent@schooltest.local');
      await page.getByLabel('Password', { exact: true }).fill('Parent1234!');
      const button = page.getByRole('button', { name: 'Log in', exact: true });
      await button.dblclick();
      await page.waitForURL(/dashboard/, { timeout: 45_000 });
      await settle(page);
      await shot(page, 'double/sign-in-landed');
      console.log(`[f10 double sign-in] POST /api/auth/local statuses: [${logins.join(', ')}]`);
      expect(logins.filter((status) => status === 200).length, 'exactly one successful login').toBe(1);
    } finally {
      await context.close();
    }
    dumpF10Console(testInfo);
  });

  test('add class: double-click creates exactly one class', async ({ browser }, testInfo) => {
    test.setTimeout(240_000);
    const stamp = Date.now();
    const className = `F10-${stamp}-dblclass`;
    const { context, page } = await signedInAs(browser, 'schoolAdmin', testInfo);
    watchF10(page, 'double:add-class');
    try {
      await page.goto('/dashboard/school/classes', { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await settle(page);
      const screen = page.locator('[data-slot="school-classes"]');
      await expect(screen).toBeVisible({ timeout: 30_000 });

      const creates: number[] = [];
      page.on('response', (res) => {
        if (res.url().includes('/api/schools/me/classes') && res.request().method() === 'POST') {
          creates.push(res.status());
        }
      });

      await screen.getByRole('button', { name: 'Add class', exact: true }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await dialog.getByLabel('Class name').fill(className);
      await dialog.getByRole('button', { name: 'Add class', exact: true }).dblclick();
      await expect(dialog).toBeHidden({ timeout: 30_000 });
      await settle(page);
      await shot(page, 'double/add-class-after-dblclick');

      console.log(`[f10 double add-class] POST statuses: [${creates.join(', ')}]`);
      expect(creates.filter((status) => status === 201 || status === 200).length, 'exactly one create POST').toBe(1);

      // Truth after reload: exactly ONE row with this name.
      await page.reload({ waitUntil: 'domcontentloaded' });
      await settle(page);
      const rows = page.locator('tr', { hasText: className });
      await expect(rows).toHaveCount(1, { timeout: 30_000 });
      await shot(page, 'double/add-class-single-row');
    } finally {
      await context.close();
    }
    dumpF10Console(testInfo);
  });

  test('invite staff: double-click sends exactly one invitation', async ({ browser }, testInfo) => {
    test.setTimeout(240_000);
    const stamp = Date.now();
    const email = `f10-dbl-${stamp}@schooltest.local`;
    const { context, page } = await signedInAs(browser, 'schoolAdmin', testInfo);
    watchF10(page, 'double:invite');
    try {
      await page.goto('/dashboard/school/teachers', { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await settle(page);
      const screen = page.locator('[data-surface="school-admin-teachers"]');
      await expect(screen).toBeVisible({ timeout: 30_000 });

      const invites: number[] = [];
      page.on('response', (res) => {
        if (res.url().includes('/api/schools/me/invitations') && res.request().method() === 'POST') {
          invites.push(res.status());
        }
      });

      await screen.getByRole('button', { name: 'Add teacher', exact: true }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await dialog.getByLabel('First name').fill('F10');
      await dialog.getByLabel('Last name', { exact: true }).fill(`Double${stamp}`);
      await dialog.getByLabel('Email', { exact: true }).fill(email);
      await dialog.getByRole('button', { name: 'Send invitation', exact: true }).dblclick();
      await expect(dialog).toBeHidden({ timeout: 30_000 });
      await settle(page);
      await shot(page, 'double/invite-after-dblclick');

      console.log(`[f10 double invite] POST statuses: [${invites.join(', ')}]`);
      expect(
        invites.filter((status) => status === 201 || status === 200).length,
        'exactly one invitation POST',
      ).toBe(1);

      await page.reload({ waitUntil: 'domcontentloaded' });
      await settle(page);
      const rows = page.locator('tr', { hasText: email });
      await expect(rows).toHaveCount(1, { timeout: 30_000 });
      await shot(page, 'double/invite-single-row');
    } finally {
      await context.close();
    }
    dumpF10Console(testInfo);
  });
});
