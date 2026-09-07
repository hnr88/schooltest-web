import { execFileSync } from 'node:child_process';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { apiEnv } from './helpers/auth-db';
import { cat, loadMessages } from './helpers/i18n';

// Ledger 10 (D-008) — the ops legal-document editor end to end against the
// REAL stack. ONE sign-in as ops; the editor hydrates from the public C-LEG-02
// read, saves through the C-LEG-03 server action, and the PUBLIC page must
// reflect the edit immediately — that assertion is the revalidate-tag proof,
// because the public pages are cached under the `legal-documents` tag with a
// 300s window that only the save action's `revalidateTag` can lift.
//
// NET-ZERO ON REAL DATA, by construction: the test saves a unique throwaway
// version, asserts the public page serves it, then saves the ORIGINAL version
// back and asserts the page serves that too. Both saves are genuine 200s
// through the real route; each writes one `legal.update` audit row (disclosed
// artifact). `afterAll` re-checks the source of truth and restores the
// original if a mid-run crash left the throwaway behind.

const en = loadMessages('en');
const CAPTURES =
  process.env.LEGAL_CAPTURES_DIR
  ?? path.resolve(__dirname, '..', '..', '..', '.codephant', 'missions', 'msn-0da39441-f845-426b-88a1-037c9eb98442', 'captures');
const SLUG = 'privacy-policy';

const PG = 'schooltest-api-st1-postgres';

function sql(statement: string): string {
  return execFileSync(
    'docker',
    ['exec', PG, 'psql', '-U', 'schooltest', '-d', 'schooltest', '-t', '-A', '-c', statement],
    { encoding: 'utf-8' },
  ).trim();
}

const editor = (page: import('@playwright/test').Page) => page.locator('[data-slot="ops-legal-editor"]');
const versionInput = (page: import('@playwright/test').Page) =>
  page.locator('[data-slot="ops-legal-version"]');

async function saveVersion(page: import('@playwright/test').Page, version: string): Promise<void> {
  await versionInput(page).fill(version);
  await page.locator('[data-slot="ops-legal-save"]').click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: cat(en, 'Ops.settings.legal.confirmAction') }).click();
  await expect(dialog).toHaveCount(0);
}

test.describe('ops legal-document editor (ledger 10)', () => {
  test.describe.configure({ mode: 'serial', timeout: 180_000 });

  const originalVersion = sql(
    `select version from legal_documents where slug='${SLUG}' and locale_code='en';`,
  );
  // The api caps `version` at 20 characters, so the throwaway stays inside it.
  const throwawayVersion = `1.0-e2e-${String(Date.now()).slice(-6)}`;

  test.afterAll(async () => {
    const stored = sql(
      `select version from legal_documents where slug='${SLUG}' and locale_code='en';`,
    );
    test.expect(stored).toBe(originalVersion);
  });

  test('edits version + body behind the confirm; the public page reflects the edit both ways', async ({
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

    // --- the editor hydrates from the public read ---
    await page.goto('/dashboard/ops/settings');
    await expect(editor(page)).toBeVisible({ timeout: 60_000 });
    await expect(versionInput(page)).toBeVisible({ timeout: 60_000 });
    await expect(versionInput(page)).toHaveValue(originalVersion, { timeout: 60_000 });
    // The body hydrates too: the first section's heading is non-empty.
    await expect(page.locator('[data-slot="ops-legal-section-heading-0"]')).not.toBeEmpty({
      timeout: 60_000,
    });

    // --- desktop capture of the hydrated editor ---
    // VIEWPORT capture anchored at the editor top: the card holds twelve
    // sections and is far taller than any viewport, so neither a full-page nor
    // an element screenshot shows it honestly — scrolling the slug select into
    // view frames the editor's header, its version/date fields and the first
    // section, which is the surface an operator edits from.
    await page.locator('#ops-legal-slug').scrollIntoViewIfNeeded();
    const desktop = await page.screenshot();
    await testInfo.attach('legal-editor-desktop', { body: desktop, contentType: 'image/png' });
    const { writeFile } = await import('node:fs/promises');
    await writeFile(path.join(CAPTURES, 'legal-editor-desktop.png'), desktop);

    // --- save the throwaway version through the confirm; the PUBLIC page
    // must serve it immediately (the revalidate-tag proof) ---
    await saveVersion(page, throwawayVersion);
    await page.goto('/privacy-policy');
    await expect(page.getByText(throwawayVersion, { exact: true })).toBeVisible({
      timeout: 60_000,
    });

    // --- restore the original the same way; the page follows again ---
    await page.goto('/dashboard/ops/settings');
    await expect(versionInput(page)).toHaveValue(throwawayVersion, { timeout: 60_000 });
    await saveVersion(page, originalVersion);
    await page.goto('/privacy-policy');
    await expect(page.getByText(originalVersion, { exact: true })).toBeVisible({
      timeout: 60_000,
    });

    // --- zero console errors across the whole visit ---
    expect(consoleErrors, `console errors: ${consoleErrors.join(' | ')}`).toHaveLength(0);

    // --- 375px ---
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard/ops/settings');
    await expect(editor(page)).toBeVisible({ timeout: 60_000 });
    await expect(versionInput(page)).toHaveValue(originalVersion, { timeout: 60_000 });
    await page.locator('#ops-legal-slug').scrollIntoViewIfNeeded();
    const mobile = await page.screenshot();
    await testInfo.attach('legal-editor-375', { body: mobile, contentType: 'image/png' });
    const mobilePath = path.join(CAPTURES, 'legal-editor-375.png');
    await writeFile(mobilePath, mobile);
    await testInfo.attach('legal-editor-375-saved', { path: mobilePath });
  });
});
