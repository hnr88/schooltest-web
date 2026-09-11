/**
 * ops-tabs-audit proof captures — the operator's forensic audit of the OPS
 * school-detail INSIDE TABS against `mvp/claude-design/Ops Portal.dc.html`
 * lines 292-418 (tab row, tab table card, overview grid).
 *
 * One login, the app's own first school, and a full-viewport screenshot of
 * EVERY tab (Overview, Admins, Teachers, Classes, Students) at 1440px, plus
 * one open row menu on the Admins tab (the design's 224px/radius-16 dropdown).
 *
 * Output directory is env-driven so the same spec serves the before/after
 * passes:
 *   OPS_TABS_AUDIT_DIR=tests/proofs/ops-tabs-audit       (before)
 *   OPS_TABS_AUDIT_DIR=tests/proofs/ops-tabs-audit/fixed (after)
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { loginAs } from '../helpers/roles';

const OUTPUT_DIR = path.resolve(
  process.cwd(),
  process.env.OPS_TABS_AUDIT_DIR ?? 'tests/proofs/ops-tabs-audit',
);

const TABS = ['overview', 'admins', 'teachers', 'classes', 'students'] as const;

async function save(page: import('@playwright/test').Page, name: string) {
  await page.waitForTimeout(400); // settle fonts/hover layers
  const shot = await page.screenshot();
  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(path.join(OUTPUT_DIR, `${name}.png`), shot);
}

test.describe('ops school-detail tabs — design audit captures', () => {
  test('captures all five tabs at 1440px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await loginAs(page, 'opsApi');

    // The school comes from the API's own list, paged end to end — the one with
    // the most students, so the table tabs show REAL rows to audit. The UI's
    // first page alone is all-zero seed rows on this stack.
    const apiBase = process.env.E2E_API_BASE_URL ?? 'http://localhost:5500';
    const login = await page.request.post(`${apiBase}/api/auth/local`, {
      data: { identifier: process.env.E2E_OPS_EMAIL ?? 'admin@schooltest.local', password: process.env.E2E_OPS_PASSWORD ?? 'Admin1234!' },
    });
    const jwt = ((await login.json()) as { jwt: string }).jwt;
    const listHeaders = { Authorization: `Bearer ${jwt}`, 'x-ops-portal-version': '1' };
    let documentId = '';
    let bestCount = -1;
    for (let pageNum = 1; pageNum <= 12; pageNum += 1) {
      const res = await page.request.get(`${apiBase}/api/ops/schools?page=${pageNum}&pageSize=50`, {
        headers: listHeaders,
      });
      const body = (await res.json()) as {
        data: { documentId: string; student_count: number }[] | null;
      };
      for (const school of body.data ?? []) {
        if ((school.student_count ?? 0) > bestCount) {
          bestCount = school.student_count ?? 0;
          documentId = school.documentId;
        }
      }
      if ((body.data ?? []).length < 50) break;
    }
    expect(documentId, 'a school with students exists').not.toBe('');

    await page.goto(`/dashboard/ops/schools/${documentId}?tab=overview`);
    await expect(page.locator('[data-surface="ops-school-detail"]')).toBeVisible({
      timeout: 60_000,
    });
    // The tab row itself must be present before any capture.
    const tabList = page.getByRole('tablist');
    await expect(tabList).toBeVisible({ timeout: 30_000 });

    for (const tab of TABS) {
      await page.getByRole('tab', { name: new RegExp(`^${tab}`, 'i') }).click();
      // Two back-to-back router.replace calls race in the App Router (the
      // second can land before the first commits), so give each tab switch a
      // beat to settle before asserting — and assert on the TAB, whose
      // aria-selected follows the URL, not on the URL itself.
      const trigger = page.getByRole('tab', { name: new RegExp(`^${tab}`, 'i') });
      await expect
        .poll(async () => trigger.getAttribute('aria-selected'), { timeout: 15_000 })
        .toBe('true');
      await page.waitForTimeout(250);
      await expect(page.getByRole('tabpanel')).toBeVisible({ timeout: 30_000 });
      await save(page, `tab-${tab}`);
      // The table tabs' rows sit below the fold at 1000px: capture the card
      // itself, scrolled into view, so the row anatomy is on the proof too.
      const card = page.locator('[data-slot="ops-tab-table-card"]').first();
      if (await card.isVisible().catch(() => false)) {
        await card.scrollIntoViewIfNeeded();
        await save(page, `card-${tab}`);
        await page.evaluate(() => window.scrollTo(0, 0));
      }
    }

    // The row menu (design `:406-417`): open it on the Admins tab and capture.
    await page.getByRole('tab', { name: /^admins/i }).click();
    const adminsTrigger = page.getByRole('tab', { name: /^admins/i });
    await expect
      .poll(async () => adminsTrigger.getAttribute('aria-selected'), { timeout: 15_000 })
      .toBe('true');
    await page.waitForTimeout(400);
    // The demo school's rows can still be loading when the panel mounts.
    const menuButton = page.locator('[data-directory-row] [data-directory-row-menu] button').first();
    await expect
      .poll(async () => menuButton.isVisible().catch(() => false), { timeout: 20_000 })
      .toBe(true);
    await menuButton.click();
    await save(page, 'admins-row-menu');
    await page.keyboard.press('Escape');
  });
});
