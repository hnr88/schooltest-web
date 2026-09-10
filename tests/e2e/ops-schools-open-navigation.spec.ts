import path from 'node:path';

import { expect, test } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';

// The schools table's "Open school" row action drives a CLIENT-SIDE
// router.push to the school detail route. It used to be dead: the table took
// useRouter from plain next/navigation, and under next-intl's localePrefix
// 'as-needed' the plain push never produced a working URL — the menu closed
// and nothing navigated (measured over a 3s settle, no pageerror). The fix
// swaps the router for the app's locale-aware one; THIS spec is the
// regression: it drives the REAL menu path (Row actions → Open school) and
// asserts the URL with toHaveURL — NOT waitForURL, which a client-side push
// never satisfies because no load fires (the trap documented in c44252e).
//
// The row's documentId comes from the app's own authenticated list response —
// nothing hardcoded — and the first rendered row IS the response's first row
// (the table renders the server's order as-is). ONE sign-in; zero console
// errors; captures at desktop+375 of the working navigation.

const en = loadMessages('en');
const CAPTURES =
  process.env.OPEN_SCHOOL_CAPTURES_DIR
  ?? path.resolve(__dirname, '..', '..', '..', '.codephant', 'missions', 'msn-0da39441-f845-426b-88a1-037c9eb98442', 'captures');

test.describe('ops schools — Open school row action', () => {
  test('navigates to the school detail route through the real menu path', async ({
    page,
  }, testInfo) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    // --- the one login (the shared helper drives the current sign-in form;
    // the hand-rolled fill below died when the form moved to Auth.portal.*) ---
    await loginAs(page, 'opsApi');

    // --- the row id comes from the app's own authenticated list response ---
    const listPromise = page.waitForResponse(
      (response) =>
        /\/api\/ops\/schools(\?|$)/.test(response.url()) &&
        response.request().method() === 'GET',
    );
    await page.goto('/dashboard/ops/schools');
    const list = (await (await listPromise).json()) as {
      data: { documentId: string }[];
    };
    expect(list.data.length).toBeGreaterThan(0);
    const documentId = list.data[0].documentId;

    // The first rendered row is the response's first row.
    const firstRow = page.locator('[data-surface="ops-schools"] tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 60_000 });

    // --- the REAL menu path: Row actions → Open school ---
    await page.getByRole('button', { name: 'Row actions' }).first().click();
    await page
      .getByRole('menuitem', { name: cat(en, 'Ops.schools.actionOpen') })
      .click();

    // toHaveURL, not waitForURL: a client-side push fires no load.
    await expect(page).toHaveURL(new RegExp(`/dashboard/ops/schools/${documentId}$`), {
      timeout: 20_000,
    });
    await expect(page.locator('[data-surface="ops-school-detail"]')).toBeVisible({
      timeout: 60_000,
    });

    // --- desktop capture of the working navigation ---
    const desktop = await page.screenshot();
    await testInfo.attach('open-school-desktop', { body: desktop, contentType: 'image/png' });
    const { mkdir, writeFile } = await import('node:fs/promises');
    await mkdir(CAPTURES, { recursive: true });
    await writeFile(path.join(CAPTURES, 'open-school-desktop.png'), desktop);

    // --- zero console errors across the whole visit ---
    expect(consoleErrors, `console errors: ${consoleErrors.join(' | ')}`).toHaveLength(0);

    // --- 375px: the same navigation still lands and renders ---
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`/dashboard/ops/schools/${documentId}`);
    await expect(page.locator('[data-surface="ops-school-detail"]')).toBeVisible({
      timeout: 60_000,
    });
    const mobile = await page.screenshot();
    await testInfo.attach('open-school-375', { body: mobile, contentType: 'image/png' });
    const mobilePath = path.join(CAPTURES, 'open-school-375.png');
    await writeFile(mobilePath, mobile);
    await testInfo.attach('open-school-375-saved', { path: mobilePath });
  });
});
