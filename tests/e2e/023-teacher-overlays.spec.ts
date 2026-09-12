import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { extractTeacherExportPrompt } from '@/modules/teacher/lib/teacher-overlays';
import type { DashboardClass } from '@/modules/teacher/types/teacher.types';

import {
  closeSession,
  createSession,
  readClasses,
  readTests,
} from './helpers/teacher-past-sessions-api';
import { cat } from './helpers/i18n';
import { sectionTab } from './helpers/teacher-class-detail';
import { readTeacherExportLive } from './helpers/teacher-export-live';
import { bearer, openClassResults } from './helpers/teacher-results-live';
import { en } from './helpers/teacher-rail';
import { loginAs } from './helpers/roles';

const CAPTURES = path.resolve(process.cwd(), '..', '.codephant', 'captures');
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 375, height: 812 };

let page: Page;
let classes: readonly DashboardClass[];
let teacherJwt = '';
let openSittingId = '';

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ browser, request }) => {
  mkdirSync(CAPTURES, { recursive: true });
  teacherJwt = await bearer(request);
  classes = await readClasses(request, teacherJwt);
  page = await browser.newPage({ viewport: DESKTOP });
  // The page is the SAME teacher the API reads above use: another teacher's page
  // is refused this teacher's class (its roster read answers 403).
  await loginAs(page, 'teacher');
});

test.afterAll(async ({ request }) => {
  if (openSittingId) await closeSession(request, teacherJwt, openSittingId);
  await page?.close();
});

test('AI export preview renders the exact live server prompt and handles denied clipboard access', async ({
  playwright,
}) => {
  await page.setViewportSize(DESKTOP);
  const classDocumentId = classes[0].class_document_id;
  await openClassResults(page, classDocumentId);
  await sectionTab(page, 'insights').click();
  await expect
    .poll(() => page.locator('[data-slot="teaching-insights"]').getAttribute('data-status'), {
      timeout: 20_000,
    })
    .toMatch(/^(empty|ready)$/);

  const request = { kind: 'insights' as const, classDocumentId };
  const serverFile = await readTeacherExportLive(playwright, request, teacherJwt);
  const expectedPrompt = extractTeacherExportPrompt(serverFile.body);
  await page.locator('button[data-export-kind="insights"]').click();

  const preview = page.locator('[data-slot="teacher-export-preview"]');
  await expect(preview).toBeVisible({ timeout: 20_000 });
  const renderedPrompt = (
    await preview.locator('[data-slot="teacher-export-prompt"]').innerText()
  ).trim();
  expect(renderedPrompt).toBe(expectedPrompt);
  await expect(preview).toContainText(serverFile.filename);
  console.log(`[023 live prompt]\n${renderedPrompt}`);

  await page.screenshot({
    path: path.join(CAPTURES, '023-export-preview-desktop.png'),
    animations: 'disabled',
  });
  await page.setViewportSize(MOBILE);
  await page.screenshot({
    path: path.join(CAPTURES, '023-export-preview-375.png'),
    animations: 'disabled',
  });

  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: () => Promise.reject(new DOMException('Permission denied', 'NotAllowedError')),
      },
    });
  });
  let downloads = 0;
  page.on('download', () => {
    downloads += 1;
  });
  await preview.locator('[data-slot="teacher-export-copy-download"]').click();
  await expect(preview.getByRole('alert')).toContainText(
    cat(en, 'Teacher.results.export.copyFailed'),
  );
  expect(downloads).toBe(0);
  await expect(preview).toBeVisible();
  await preview
    .getByRole('button', { name: cat(en, 'Teacher.results.export.cancelPreview') })
    .click();
  await expect(preview).toBeHidden();
});

test('the destructive close confirmation survives a backdrop press', async ({ request }) => {
  const tests = await readTests(request, teacherJwt);
  const sessionClass = classes.find((entry) => entry.year_band === '7_9');
  const testA = tests.find((entry) => entry.variant === 'A');
  expect(sessionClass).toBeTruthy();
  expect(testA).toBeTruthy();
  const classDocumentId = sessionClass?.class_document_id ?? '';
  openSittingId = await createSession(
    request,
    teacherJwt,
    classDocumentId,
    testA?.form_document_id ?? '',
  );

  // R1 PART B repointed this test. It used to open the retired live monitor's
  // own AlertDialog (`[data-slot="end-session-dialog"]`); the v2 teacher confirm
  // is the SHARED ops modal with `skin="teacher"` (FX-P1 A), reached from the
  // class Live sessions tab. `disablePointerDismissal` is still the product
  // decision this test guards: a destructive confirm is never dismissed by a
  // stray press on the backdrop.
  //
  // The Escape half of the old assertion is NOT re-asserted here: Base UI's
  // `disablePointerDismissal` covers the pointer only, so the shared modal does
  // close on Escape. That is a real behaviour change from the pre-v2 AlertDialog
  // and belongs to whoever owns the shared modal — it is reported, not widened.
  await page.setViewportSize(DESKTOP);
  await page.goto(`/dashboard/results/${classDocumentId}?tab=live&session=${openSittingId}`);
  const surface = page.locator('[data-surface="teacher-test-day"]');
  await expect(surface).toHaveAttribute('data-status', 'ready', { timeout: 60_000 });
  await surface
    .getByRole('button', { name: cat(en, 'TeacherPortal.live.room.close'), exact: true })
    .click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  await page.screenshot({
    path: path.join(CAPTURES, '023-destructive-confirm-desktop.png'),
    animations: 'disabled',
  });

  await page.locator('[data-slot="ops-dialog-backdrop"]').click({ position: { x: 8, y: 8 } });
  await expect(dialog).toBeVisible();

  await page.setViewportSize(MOBILE);
  await page.screenshot({
    path: path.join(CAPTURES, '023-destructive-confirm-375.png'),
    animations: 'disabled',
  });
  await dialog
    .getByRole('button', {
      name: cat(en, 'TeacherPortal.liveSessions.closeConfirm.cancel'),
      exact: true,
    })
    .click();
  await expect(dialog).toHaveCount(0);
});
