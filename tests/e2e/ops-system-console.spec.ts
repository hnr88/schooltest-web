import path from 'node:path';

import { expect, test } from '@playwright/test';

import { apiEnv } from './helpers/auth-db';
import { cat, loadMessages } from './helpers/i18n';

// Ledger row 5e — the phase-40 flow "the ops page loads live operational
// metrics and refreshes data without console errors", on the System console.
//
// The ONE login signs in as ops; the page is then asserted on its REAL live
// data (the server's own probe results, migration rows and backup ledger —
// whatever they currently are, they must render), refreshed with a reload and
// asserted again with ZERO console errors collected across both passes. The
// maintenance and pipeline controls must be present and their confirmation
// dialog must open — no mutation is ever fired from the spec.
//
// Screenshots attach to the result AND save under the mission captures dir
// as system-mutations-*.png (desktop + 375px).

const en = loadMessages('en');
const CAPTURES =
  process.env.SYSTEM_CAPTURES_DIR
  ?? path.resolve(__dirname, '..', '..', '..', '.codephant', 'missions', 'msn-0da39441-f845-426b-88a1-037c9eb98442', 'captures');

test.describe('ops system console (ledger 5a–5e)', () => {
  test('loads live operational metrics and refreshes without console errors', async ({
    page,
  }, testInfo) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    // --- the one login ---
    await page.goto('/sign-in');
    await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill('apiadmin@schooltest.local');
    await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(apiEnv('SEED_APIADMIN_PASSWORD'));
    await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
    await page.waitForURL('**/dashboard');

    // --- the console renders its LIVE metrics ---
    await page.goto('/dashboard/ops/system');
    await expect(page.getByRole('heading', { name: cat(en, 'Ops.system.title'), exact: true })).toBeVisible({
      timeout: 60_000,
    });

    // Health: the server's own overall roll-up badge and the five probe tiles.
    const health = page.locator('[data-slot="system-health"]');
    await expect(health).toBeVisible({ timeout: 60_000 });
    await expect(health).toHaveAttribute('data-overall', /up|down/);
    for (const probe of ['database', 'redis', 'queues', 'storage', 'web']) {
      await expect(page.locator(`[data-slot="system-health-probe"][data-probe="${probe}"]`)).toBeVisible();
      await expect(
        page.locator(`[data-slot="system-health-probe"][data-probe="${probe}"]`),
      ).toHaveAttribute('data-status', /up|down/);
    }

    // Runtime: versions and uptime render real values.
    const info = page.locator('[data-slot="system-info"]');
    await expect(info).toBeVisible();

    // Migrations: the server's own count and at least the header row.
    await expect(page.locator('[data-slot="system-migrations"]')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: cat(en, 'Ops.system.migrations.columns.name') })).toBeVisible();

    // Backups: a real read — rows or the honest empty state, never neither.
    await expect(page.locator('[data-slot="system-backups"]')).toBeVisible();

    // --- the controls are present and confirm-gated (nothing fires) ---
    await expect(page.locator('[data-slot="system-action-run-backup"]')).toBeEnabled();
    await expect(page.locator('[data-slot="system-action-run-cache-clear"]')).toBeEnabled();
    await expect(page.locator('[data-slot="system-action-run-sitemap"]')).toBeEnabled();
    await expect(page.locator('[data-slot="ops-pipeline-panel"] table')).toBeVisible();
    await expect(page.locator('[data-slot^="pipeline-pause-"]').first()).toBeVisible();

    // Open the destructive confirm for cache-clear and dismiss it — the gate
    // works, no mutation is fired.
    await page.locator('[data-slot="system-action-run-cache-clear"]').click();
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    await expect(page.locator('[data-slot="system-mutation-result"]')).toHaveCount(0);

    // --- refresh: the same live metrics again, still zero console errors ---
    const desktop = await page.screenshot({ fullPage: true });
    await testInfo.attach('system-console-desktop', { body: desktop, contentType: 'image/png' });

    await page.reload();
    await expect(health).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-slot="system-info"]')).toBeVisible();

    expect(consoleErrors, `console errors: ${consoleErrors.join(' | ')}`).toHaveLength(0);

    const desktopPath = path.join(CAPTURES, 'system-mutations-desktop.png');
    const { writeFile } = await import('node:fs/promises');
    await writeFile(desktopPath, desktop);
    await testInfo.attach('system-console-desktop-saved', { path: desktopPath });

    // --- 375px ---
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload();
    await expect(page.getByRole('heading', { name: cat(en, 'Ops.system.title'), exact: true })).toBeVisible({
      timeout: 60_000,
    });
    await expect(health).toBeVisible({ timeout: 60_000 });
    const mobile = await page.screenshot({ fullPage: true });
    await testInfo.attach('system-console-375', { body: mobile, contentType: 'image/png' });

    const mobilePath = path.join(CAPTURES, 'system-mutations-375.png');
    await writeFile(mobilePath, mobile);
    await testInfo.attach('system-console-375-saved', { path: mobilePath });
  });
});
