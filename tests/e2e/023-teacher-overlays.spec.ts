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
import { readTeacherExportLive } from './helpers/teacher-export-live';
import { bearer, openClassResults } from './helpers/teacher-results-live';
import { en } from './helpers/teacher-rail';
import { loginAs } from './helpers/roles';

const CAPTURES = path.resolve(process.cwd(), '..', '.codephant', 'captures');
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 375, height: 812 };
const LIVE_COPY = 'Teacher.testSessions.live';

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
  await loginAs(page, 'teacher2');
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
  await page.getByRole('tab', { name: cat(en, 'Teacher.results.tabs.insights') }).click();
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

test('destructive confirmation stays open on Escape and backdrop press', async ({ request }) => {
  const tests = await readTests(request, teacherJwt);
  const sessionClass = classes.find((entry) => entry.year_band === '7_9');
  const testA = tests.find((entry) => entry.variant === 'A');
  expect(sessionClass).toBeTruthy();
  expect(testA).toBeTruthy();
  openSittingId = await createSession(
    request,
    teacherJwt,
    sessionClass?.class_document_id ?? '',
    testA?.form_document_id ?? '',
  );

  await page.setViewportSize(DESKTOP);
  await page.goto(`/dashboard/test-sessions/${openSittingId}`);
  await expect(page.locator('[data-surface="teacher-live-monitor"]')).toHaveAttribute(
    'data-status',
    'ready',
  );
  await page.getByRole('button', { name: cat(en, `${LIVE_COPY}.endSession`), exact: true }).click();
  const dialog = page.locator('[data-slot="end-session-dialog"]');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('role', 'alertdialog');
  await page.screenshot({
    path: path.join(CAPTURES, '023-destructive-confirm-desktop.png'),
    animations: 'disabled',
  });

  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  await page.locator('[data-slot="alert-dialog-overlay"]').click({ position: { x: 8, y: 8 } });
  await expect(dialog).toBeVisible();

  await page.setViewportSize(MOBILE);
  await page.screenshot({
    path: path.join(CAPTURES, '023-destructive-confirm-375.png'),
    animations: 'disabled',
  });
  await dialog
    .getByRole('button', { name: cat(en, `${LIVE_COPY}.endDialogCancel`), exact: true })
    .click();
  await expect(dialog).toBeHidden();
});
