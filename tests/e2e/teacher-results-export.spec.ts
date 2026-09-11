import path from 'node:path';

import { expect, test, type Locator, type Page } from '@playwright/test';

import { classRosterResponseSchema } from '@/modules/results/schemas/roster.schema';

import { cat } from './helpers/i18n';
import { sectionTab } from './helpers/teacher-class-detail';
import {
  downloadFrom,
  expectDeIdentified,
  expectSameDocument,
  readTeacherExportLive,
} from './helpers/teacher-export-live';
import { en } from './helpers/teacher-rail';
import {
  API_BASE,
  bearer,
  openClassResults,
  readLiveResults,
  signedInTeacherPage,
  TEACHER_EMAIL,
} from './helpers/teacher-results-live';

// Task 046 — the class AI export on Teaching insights, driven in a real browser against
// the running app. The test CLICKS the button, catches the browser's own download, and
// compares the saved file with an independent server-to-server read of C-TR-5. Nothing
// here asserts an expected document: the server owns the bytes, the filename and the
// de-identification, and this spec proves the portal only carried them. The roster names
// the file must not carry come from the surviving roster read (GET
// /api/my/students/results?class=); the retired C-TR-1 detail answers 410.
//
// Retired with Teacher Portal v2: the Progress export panel (C-TR-6) is not in the
// design, the student page's exports are proven by teacher-v2/student.spec.ts, and the
// injected-500 failure test intercepted the network (RULE 0: real data only).

test.describe.configure({ mode: 'serial' });

/** The mission's evidence folder at the workspace root, as tasks 032-043 used. */
const SCREENSHOTS = path.resolve(process.cwd(), '..', '.qa', 'screenshots');

const copy = (key: string) => cat(en, `Teacher.results.export.${key}`);

let classDocumentId: string;
let rosterNames: string[];
let page: Page;

test.beforeAll(async ({ browser, playwright }) => {
  const [first] = (await readLiveResults(playwright, TEACHER_EMAIL, { withDetail: false })).classes;
  if (first === undefined) throw new Error('[e2e] the seeded teacher owns no class');
  classDocumentId = first.class_document_id;
  const request = await playwright.request.newContext();
  try {
    const jwt = await bearer(request);
    const response = await request.get(`${API_BASE}/api/my/students/results?class=${classDocumentId}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(response.status(), 'GET /api/my/students/results').toBe(200);
    rosterNames = classRosterResponseSchema.parse(await response.json()).map((row) => row.student.name);
  } finally {
    await request.dispose();
  }
  page = await signedInTeacherPage(browser);
});

test.afterAll(async () => {
  await page.close();
});

const exportPanel = (): Locator =>
  page.locator('[data-slot="teacher-export-panel"][data-export-kind="insights"]');
const exportButton = (): Locator => page.locator('button[data-export-kind="insights"]');

/** WCAG 2.2 AA 2.5.8: the download control is a real 44px-tall target. */
async function expectTargetSize(button: Locator): Promise<void> {
  const box = await button.boundingBox();
  expect(box, 'the export button must be laid out').not.toBeNull();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
}

test('Teaching insights: the class export panel downloads C-TR-5 verbatim', async ({
  playwright,
}) => {
  await openClassResults(page, classDocumentId);
  await sectionTab(page, 'insights').click();
  await expect(page.locator('[data-slot="teaching-insights"]')).toHaveAttribute('data-status', 'ready', {
    timeout: 30_000,
  });

  const panel = exportPanel();
  await expect(panel.getByRole('heading', { level: 2 })).toHaveText(copy('insightsTitle'));
  await expect(panel).toContainText(copy('insightsDescription'));
  await expect(panel.locator('[data-slot="teacher-export-footnote"]')).toHaveText(
    copy('insightsFootnote'),
  );
  await expectTargetSize(exportButton());
  // The portal shell scrolls INSIDE its own region, so `fullPage` cannot reach the
  // panel — the element is scrolled to and shot directly.
  await panel.scrollIntoViewIfNeeded();
  await panel.screenshot({ path: `${SCREENSHOTS}/046-insights-export-panel.png` });

  const server = await readTeacherExportLive(playwright, { kind: 'insights', classDocumentId });
  const downloaded = await downloadFrom(exportButton());

  expect(downloaded.filename).toMatch(/^teaching-insights-.+\.md$/);
  expectSameDocument(downloaded, server);
  expect(rosterNames.length, 'the roster read names the class students').toBeGreaterThan(0);
  expectDeIdentified(downloaded.body, rosterNames);
  await expect(page.locator('[data-slot="teacher-export-error"]')).toHaveCount(0);
});
