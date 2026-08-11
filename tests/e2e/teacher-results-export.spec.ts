import path from 'node:path';

import { expect, test, type Locator, type Page } from '@playwright/test';

import { studentResultsHref } from '@/modules/teacher/lib/results-shell';
import type { TeacherExportKind } from '@/modules/teacher/types/teacher-export.types';

import { cat } from './helpers/i18n';
import {
  downloadFrom,
  expectDeIdentified,
  expectSameDocument,
  readTeacherExportLive,
} from './helpers/teacher-export-live';
import { en } from './helpers/teacher-rail';
import {
  openClassResults,
  readLiveResults,
  signedInTeacherPage,
  type LiveResults,
} from './helpers/teacher-results-live';

// Task 046 — the three AI export buttons, driven in a real browser against the
// running app. Each test CLICKS the button, catches the browser's own download,
// and compares the saved file with an independent server-to-server read of
// C-TR-5/6/7. Nothing here asserts an expected document: the server owns the
// bytes, the filename and the de-identification, and this spec proves the portal
// only carried them.

test.describe.configure({ mode: 'serial' });

/** The mission's evidence folder at the workspace root, as tasks 032-043 used. */
const SCREENSHOTS = path.resolve(process.cwd(), '..', '.qa', 'screenshots');

const copy = (key: string) => cat(en, `Teacher.results.export.${key}`);
const tab = (key: string) => cat(en, `Teacher.results.tabs.${key}`);

let live: LiveResults;
let page: Page;

test.beforeAll(async ({ browser, playwright }) => {
  live = await readLiveResults(playwright);
  page = await signedInTeacherPage(browser);
});

test.afterAll(async () => {
  await page.close();
});

const exportPanel = (kind: TeacherExportKind): Locator =>
  page.locator(`[data-slot="teacher-export-panel"][data-export-kind="${kind}"]`);
const exportButton = (kind: TeacherExportKind): Locator =>
  page.locator(`button[data-export-kind="${kind}"]`);

/** WCAG 2.2 AA 2.5.8: the download control is a real 44px-tall target. */
async function expectTargetSize(button: Locator): Promise<void> {
  const box = await button.boundingBox();
  expect(box, 'the export button must be laid out').not.toBeNull();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
}

async function openTab(classDocumentId: string, key: 'insights' | 'progress'): Promise<void> {
  await openClassResults(page, classDocumentId);
  await page.getByRole('tab', { name: tab(key) }).click();
  const panel = page.locator(`[data-slot="${key === 'insights' ? 'teaching-insights' : 'class-progress'}"]`);
  await expect(panel).toHaveAttribute('data-status', 'ready', { timeout: 20_000 });
}

test('Teaching insights: the class export panel downloads C-TR-5 verbatim', async ({
  playwright,
}) => {
  const classDocumentId = live.classes[0].class_document_id;
  await openTab(classDocumentId, 'insights');

  const panel = exportPanel('insights');
  await expect(panel.getByRole('heading', { level: 2 })).toHaveText(copy('insightsTitle'));
  await expect(panel).toContainText(copy('insightsDescription'));
  await expect(panel.locator('[data-slot="teacher-export-footnote"]')).toHaveText(
    copy('insightsFootnote'),
  );
  await expectTargetSize(exportButton('insights'));
  // The portal shell scrolls INSIDE its own region, so `fullPage` cannot reach the
  // panel — the element is scrolled to and shot directly.
  await panel.scrollIntoViewIfNeeded();
  await panel.screenshot({ path: `${SCREENSHOTS}/046-insights-export-panel.png` });

  const server = await readTeacherExportLive(playwright, { kind: 'insights', classDocumentId });
  const downloaded = await downloadFrom(exportButton('insights'));

  expect(downloaded.filename).toMatch(/^teaching-insights-.+\.md$/);
  expectSameDocument(downloaded, server);
  expectDeIdentified(
    downloaded.body,
    live.detail.students.map((student) => student.display_name),
  );
  await expect(page.locator('[data-slot="teacher-export-error"]')).toHaveCount(0);
});

test('Progress: the class export panel downloads C-TR-6 verbatim', async ({ playwright }) => {
  const classDocumentId = live.classes[0].class_document_id;
  await openTab(classDocumentId, 'progress');

  const panel = exportPanel('progress');
  await expect(panel.getByRole('heading', { level: 2 })).toHaveText(copy('progressTitle'));
  await expect(panel.locator('[data-slot="teacher-export-footnote"]')).toHaveText(
    copy('progressFootnote'),
  );
  await expectTargetSize(exportButton('progress'));
  await panel.scrollIntoViewIfNeeded();
  await panel.screenshot({ path: `${SCREENSHOTS}/046-progress-export-panel.png` });

  const server = await readTeacherExportLive(playwright, { kind: 'progress', classDocumentId });
  const downloaded = await downloadFrom(exportButton('progress'));

  expect(downloaded.filename).toMatch(/^progress-.+\.md$/);
  expectSameDocument(downloaded, server);
  expectDeIdentified(
    downloaded.body,
    live.detail.students.map((student) => student.display_name),
  );
});

test('Student drill-down: "Export for AI" downloads C-TR-7 verbatim', async ({ playwright }) => {
  const classDocumentId = live.classes[0].class_document_id;
  const student = live.detail.students.find((row) => row.test_a.state === 'done');
  if (!student) throw new Error('[e2e] no student in this class has completed Test A');
  const studentDocumentId = student.student_document_id;

  await page.goto(studentResultsHref(classDocumentId, studentDocumentId));
  await expect(page.locator('[data-surface="teacher-student-drill-down"]')).toHaveAttribute(
    'data-status',
    'ready',
    { timeout: 20_000 },
  );

  const button = exportButton('student');
  await expect(button).toHaveText(copy('studentButton'));
  await expect(
    page.locator('header [data-slot="teacher-export-footnote"]'),
  ).toHaveText(copy('studentFootnote'));
  await expectTargetSize(button);
  await page
    .locator('[data-slot="student-drill-down-header"]')
    .screenshot({ path: `${SCREENSHOTS}/046-student-export-button.png` });

  const server = await readTeacherExportLive(playwright, {
    kind: 'student',
    classDocumentId,
    studentDocumentId,
  });
  const downloaded = await downloadFrom(button);

  expect(downloaded.filename).toMatch(/\.md$/);
  expectSameDocument(downloaded, server);
  expectDeIdentified(downloaded.body, [student.display_name]);
  expect(downloaded.body).toContain('## Prompt');
});

// A refused export must FAIL LOUD. The transport is broken deliberately here (the
// Server Function POST is answered 500) because a UI that quietly saved a partial
// or self-composed file would otherwise look identical to a working one.
test('a failed export states the failure in TEXT and saves no file', async () => {
  const classDocumentId = live.classes[0].class_document_id;
  const student = live.detail.students.find((row) => row.test_a.state === 'done');
  if (!student) throw new Error('[e2e] no student in this class has completed Test A');

  await page.goto(studentResultsHref(classDocumentId, student.student_document_id));
  await expect(page.locator('[data-surface="teacher-student-drill-down"]')).toHaveAttribute(
    'data-status',
    'ready',
    { timeout: 20_000 },
  );

  await page.route('**/dashboard/results/**', async (route) => {
    const request = route.request();
    if (request.method() === 'POST' && request.headers()['next-action']) {
      await route.fulfill({ status: 500, contentType: 'text/plain', body: 'injected failure' });
      return;
    }
    await route.fallback();
  });

  let downloads = 0;
  const count = () => {
    downloads += 1;
  };
  page.on('download', count);
  try {
    const button = exportButton('student');
    await button.click();
    const alert = page.getByRole('alert').filter({ hasText: copy('failed') });
    await expect(alert).toBeVisible({ timeout: 20_000 });
    await expect(button).toBeEnabled();
    expect(downloads, 'a refused export must save nothing').toBe(0);
  } finally {
    page.off('download', count);
    await page.unroute('**/dashboard/results/**');
  }
});
