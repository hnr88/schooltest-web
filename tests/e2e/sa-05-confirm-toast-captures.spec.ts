/**
 * school-admin/05 — PROOF CAPTURES for the one-confirm/one-toast rule.
 *
 * The behaviour itself is pinned elsewhere: the four confirm variants and both
 * slots in tests/unit/confirm-dialog-variants.test.tsx, the live destructive
 * confirm in zz-redesign-school-admin.spec.ts ("05:"), and the toast rule in
 * the import hooks' success paths. This spec produces the two PROOF
 * screenshots still missing from mvp/school-admin/proof/shots/ and the
 * mission evidence folder:
 *
 *   1. 05-confirm-advisory.png — the REAL OpsConfirmDialog rendering its
 *      advisory variant in the app's real CSS. No live surface consumes the
 *      advisory yet (the bulk scopes that render "Nothing to <action>" are
 *      later waves — DirectoryBulkBar's U-24 seam comment names school-admin/05
 *      as its basis), so the dialog is mounted client-side from the REAL
 *      module through a Vite transform server bound to an EPHEMERAL localhost
 *      port inside this test (started and closed here; it never touches the
 *      shared dev servers). Same technique as 01-figure-kit-harness.spec.ts,
 *      client-side instead of SSR, because a portal dialog renders nothing in
 *      server-side markup.
 *   2. 05-toast-clears-inline.png — the Done-when e2e case: an inline import
 *      error on screen, a subsequent write succeeding, and the error gone with
 *      the closed dialog. Driven on a THROWAWAY class created through the real
 *      school-admin write so the shared fixture classes are never polluted.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';
import { createViteServer } from 'vitest/node';

import { apiClassDetail, gotoClassDetail, schoolAdminJwt } from './helpers/class-detail';
import {
  csvFor,
  csvWithBadRows,
  createImportClass,
  deleteImportClasses,
} from './helpers/class-import';
import { cat, loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';

const VIEWPORT = { width: 1440, height: 900 };
const QA_SHOTS = path.resolve(__dirname, '../../../.qa/journeys/sa-05-confirm-toast/shots');
const PROOF_SHOTS = path.resolve(__dirname, '../../../mvp/school-admin/proof/shots');
const PIECE = path.resolve(process.cwd(), 'tests/e2e/sa-05-confirm-toast-captures.piece.ts');

test.describe.configure({ mode: 'serial' });

async function saveShot(page: Page, name: string): Promise<void> {
  const shot = await page.screenshot();
  mkdirSync(QA_SHOTS, { recursive: true });
  mkdirSync(PROOF_SHOTS, { recursive: true });
  writeFileSync(path.join(QA_SHOTS, name), shot);
  writeFileSync(path.join(PROOF_SHOTS, name), shot);
}

test('05 capture: the advisory variant renders from the real shared confirm', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize(VIEWPORT);

  const vite = await createViteServer({
    configFile: false,
    root: process.cwd(),
    logLevel: 'error',
    resolve: { alias: { '@': path.resolve(process.cwd(), 'src') } },
    optimizeDeps: { include: ['react', 'react-dom', 'next-intl'] },
    ssr: { noExternal: ['next-intl'] },
    server: { middlewareMode: true, hmr: false, watch: null },
  });
  let httpServer: import('node:http').Server | undefined;
  let port = 0;
  try {
    httpServer = await new Promise<import('node:http').Server>((resolve) => {
      const bound = vite.middlewares.listen(0, () => resolve(bound as import('node:http').Server));
    });
    const address = httpServer.address();
    port = typeof address === 'object' && address !== null ? address.port : 0;
    expect(port, 'the ephemeral transform server bound to a port').toBeGreaterThan(0);

    // The app's live compiled CSS, fetched from the running dev server the way
    // 01-figure-kit-harness.spec.ts does, so the dialog wears real styling.
    await page.goto('/design-system', { waitUntil: 'domcontentloaded' });
    const css = await page.evaluate(async () => {
      const parts: string[] = [];
      for (const node of document.querySelectorAll('style')) parts.push(node.textContent ?? '');
      for (const link of document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')) {
        parts.push(await fetch(link.href).then((response) => response.text()));
      }
      return parts.join('\n');
    });
    const htmlClass = await page.evaluate(() => document.documentElement.className);

    // A blank page on the TRANSFORM SERVER's origin, so the module import
    // resolves through Vite; the dialog mounts itself into #host.
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded' });
    await page.setContent(
      `<!doctype html><html class="${htmlClass}"><head><meta charset="utf-8">` +
        `<style>${css}</style></head><body><div id="host"></div></body></html>`,
      { waitUntil: 'domcontentloaded' },
    );
    await page.addScriptTag({
      type: 'module',
      content: `import '/@fs${PIECE}';`,
    });

    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible({ timeout: 30_000 });
    await expect(dialog.getByText('Nothing to pause')).toBeVisible();
    // Advisory semantics: ONE dismissal button — there is no consequence to
    // accept, so no confirming action and no Cancel beside it.
    await expect(dialog.getByRole('button')).toHaveCount(1);
    await saveShot(page, '05-confirm-advisory.png');
  } finally {
    if (httpServer) {
      const server = httpServer;
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  }
});

test('05 capture: a successful import closes the dialog and clears the inline rejects', async ({
  page,
}, testInfo) => {
  await page.setViewportSize(VIEWPORT);
  const en = loadMessages('en');
  const STAMP = Date.now();
  const GOOD_ROWS = [`Sa05 Probe ${STAMP}A`, `Sa05 Probe ${STAMP}B`];

  await loginAs(page, 'schoolAdmin');
  const jwt = await schoolAdminJwt(page.request);
  const classId = await createImportClass(page.request, jwt, `Sa05 Capture Class ${STAMP}`);
  try {
    await gotoClassDetail(page, classId);
    await page
      .getByRole('button', { name: cat(en, 'Classes.detail.importStudents') })
      .first()
      .click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Two usable rows + two the server refuses: the partial write leaves the
    // dialog OPEN with the refused rows named inline — the inline error state.
    await dialog.getByLabel(cat(en, 'StudentImport.pasteLabel')).fill(csvWithBadRows(GOOD_ROWS));
    await dialog.getByRole('button', { name: cat(en, 'Classes.detail.import.submit') }).click();
    const rejects = dialog.locator('[data-slot="student-import-rejects"]');
    await expect(rejects).toBeVisible();
    await expect(rejects.locator('tbody tr')).toHaveCount(2);
    await expect(page.locator('[data-sonner-toast]')).toContainText('2 of 4');

    // The subsequent FULLY-successful write: the toast fires, the dialog
    // closes, and the inline error is gone from the screen.
    await dialog
      .getByLabel(cat(en, 'StudentImport.pasteLabel'))
      .fill(csvFor([`Sa05 Probe ${STAMP}C`]));
    await dialog.getByRole('button', { name: cat(en, 'Classes.detail.import.submit') }).click();
    await expect(page.locator('[data-sonner-toast]').last()).toBeVisible();
    await expect(dialog).toBeHidden();
    await expect(rejects).toHaveCount(0);
    await saveShot(page, '05-toast-clears-inline.png');

    // The write really happened: one new student on THIS throwaway class.
    const after = await apiClassDetail(page.request, jwt, classId);
    expect(after.student_count).toBe(3);
  } finally {
    await deleteImportClasses(page.request, [classId]);
  }
});
