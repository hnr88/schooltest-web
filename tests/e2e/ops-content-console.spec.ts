import path from 'node:path';

import { expect, test } from '@playwright/test';

import { apiEnv } from './helpers/auth-db';
import { cat, loadMessages } from './helpers/i18n';

// Ledger row 8d — the Content console e2e. The ONE login signs in as ops; the
// console must render its LIVE reads (per-type row counts, media stats, the
// orphan report) and gate every maintenance action behind its confirmation —
// with the purge dialog opened and dismissed WITHOUT firing, and the reindex
// control present in its dry-run-preview + confirmed-execute form (DRIFT-6:
// the empty payload is a report, execution requires the explicit flag).
//
// Screenshots attach to the result AND save under the mission captures dir
// as content-console-*.png (desktop + 375px). No destructive action fires.

const en = loadMessages('en');
const CAPTURES =
  process.env.CONTENT_CAPTURES_DIR
  ?? path.resolve(__dirname, '..', '..', '..', '.codephant', 'missions', 'msn-0da39441-f845-426b-88a1-037c9eb98442', 'captures');

test.describe('ops content console (ledger 8)', () => {
  test.setTimeout(180_000);

  test('renders live counts, media stats and orphans; maintenance actions are confirm-gated', async ({
    page,
  }, testInfo) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    const apiStatuses: string[] = [];
    page.on('response', (response) => {
      if (response.url().includes('/api/ops/')) {
        apiStatuses.push(`${response.request().method()} ${response.url().replace('http://127.0.0.1:5500', '')} -> ${response.status()}`);
      }
    });

    // --- the one login ---
    await page.goto('/sign-in');
    await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill('apiadmin@schooltest.local');
    await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(apiEnv('SEED_APIADMIN_PASSWORD'));
    await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
    await page.waitForURL('**/dashboard');

    // --- the console renders its LIVE reads ---
    await page.goto('/dashboard/ops/content');
    await expect(page.getByRole('heading', { name: cat(en, 'Ops.content.title'), exact: true })).toBeVisible({
      timeout: 60_000,
    });

    // Counts: the live per-type enumeration.
    try {
      await expect(page.locator('[data-slot="content-counts"]')).toBeVisible({ timeout: 60_000 });
    } catch (error) {
      console.log('API STATUSES:', JSON.stringify(apiStatuses));
      console.log('CONSOLE ERRORS:', JSON.stringify(consoleErrors));
      throw error;
    }
    await expect(
      page.getByRole('columnheader', { name: cat(en, 'Ops.content.counts.columns.contentType') }),
    ).toBeVisible();

    // Media stats: real totals.
    await expect(page.locator('[data-slot="content-media-stats"]')).toBeVisible();

    // Orphans: the live report table.
    await expect(page.locator('[data-slot="content-orphans"]')).toBeVisible();
    await expect(page.locator('[data-slot="content-orphan-row"]').first()).toBeVisible();

    // --- maintenance controls present; purge is confirm-gated ---
    await expect(page.locator('[data-slot="content-purge-submit"]')).toBeDisabled(); // nothing selected yet
    await expect(page.locator('[data-slot="content-reindex-preview"]')).toBeEnabled();
    await expect(page.locator('[data-slot="content-reindex-execute"]')).toBeEnabled();
    await expect(page.locator('[data-slot="content-prune-preview"]')).toBeEnabled();
    await expect(page.locator('[data-slot="content-prune-execute"]')).toBeEnabled();

    // Select an orphan kind, open the purge confirm, then DISMISS it — the
    // gate works and no destructive call fires.
    await page.locator('[data-slot="content-orphan-row"]').first().locator('input[type="checkbox"]').check();
    await expect(page.locator('[data-slot="content-purge-submit"]')).toBeEnabled();
    await page.locator('[data-slot="content-purge-submit"]').click();
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    await expect(page.locator('[data-slot="content-purge-result"]')).toHaveCount(0);

    // --- desktop capture ---
    const desktop = await page.screenshot({ fullPage: true });
    await testInfo.attach('content-console-desktop', { body: desktop, contentType: 'image/png' });
    const { writeFile } = await import('node:fs/promises');
    await writeFile(path.join(CAPTURES, 'content-console-desktop.png'), desktop);

    // --- zero console errors across the whole visit ---
    expect(consoleErrors, `console errors: ${consoleErrors.join(' | ')}`).toHaveLength(0);

    // --- 375px ---
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload();
    await expect(
      page.getByRole('heading', { name: cat(en, 'Ops.content.title'), exact: true }),
    ).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-slot="content-counts"]')).toBeVisible({ timeout: 60_000 });
    const mobile = await page.screenshot({ fullPage: true });
    await testInfo.attach('content-console-375', { body: mobile, contentType: 'image/png' });

    const mobilePath = path.join(CAPTURES, 'content-console-375.png');
    await writeFile(mobilePath, mobile);
    await testInfo.attach('content-console-375-saved', { path: mobilePath });
  });
});
