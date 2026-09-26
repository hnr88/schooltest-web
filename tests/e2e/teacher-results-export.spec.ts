import path from 'node:path';

import { expect, test, type Locator, type Page } from '@playwright/test';

import { classRosterResponseSchema } from '@/modules/results/schemas/roster.schema';

import {
  downloadFrom,
  expectDeIdentified,
  expectSameDocument,
  readTeacherExportLive,
} from './helpers/teacher-export-live';
import {
  API_BASE,
  bearer,
  openResultsList,
  readLiveResults,
  signedInTeacherPage,
  TEACHER_EMAIL,
} from './helpers/teacher-results-live';

// Task 046 — the class AI export, driven in a real browser against the running app.
// The Teaching-tab export panel (and its preview dialog) retired with the Teacher
// Portal v2 redesign; the SAME C-TR-5 download now hangs off each Classes-list row
// ("LLM", TeacherClassRow → ExportButtons). The test CLICKS that button, catches the
// browser's own download, and compares the saved file with an independent
// server-to-server read of C-TR-5. Nothing here asserts an expected document: the
// server owns the bytes, the filename and the de-identification, and this spec proves
// the portal only carried them. The roster names the file must not carry come from the
// surviving roster read (GET /api/my/students/results?class=); the retired C-TR-1
// detail answers 410.
//
// Retired with Teacher Portal v2: the Progress export panel (C-TR-6) is not in the
// design, the student page's exports are proven by teacher-v2/student.spec.ts, and the
// injected-500 failure test intercepted the network (RULE 0: real data only).

test.describe.configure({ mode: 'serial' });

/** The mission's evidence folder at the workspace root, as tasks 032-043 used. */
const SCREENSHOTS = path.resolve(process.cwd(), '..', '.qa', 'screenshots');

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

/** The class row's LLM button — the live C-TR-5 download on the Classes list. */
const exportButton = (): Locator =>
  page.locator(`[data-slot="results-class-row"][data-class-id="${classDocumentId}"] button[data-export="llm"]`);

test('Classes list: the class row LLM export downloads C-TR-5 verbatim', async ({ playwright }) => {
  await openResultsList(page);
  const button = exportButton();
  await expect(button, 'the class exports only when it holds scored results').toBeVisible({
    timeout: 30_000,
  });

  // The portal shell scrolls INSIDE its own region, so `fullPage` cannot reach the
  // row — the element is scrolled to and shot directly.
  await button.scrollIntoViewIfNeeded();
  await button.screenshot({ path: `${SCREENSHOTS}/046-insights-export-panel.png` });

  const server = await readTeacherExportLive(playwright, { kind: 'insights', classDocumentId });
  const downloaded = await downloadFrom(button);

  expect(downloaded.filename).toMatch(/^teaching-insights-.+\.md$/);
  expectSameDocument(downloaded, server);
  expect(rosterNames.length, 'the roster read names the class students').toBeGreaterThan(0);
  expectDeIdentified(downloaded.body, rosterNames);
});
