import path from 'node:path';

import { expect, test, type Locator, type Page } from '@playwright/test';

import { TEACHER_EXPORT_PROMPT_HEADING } from '@/modules/teacher/schemas/teacher-export.schema';
import type { TeacherExportKind } from '@/modules/teacher/types/teacher-export.types';

import { cat } from './helpers/i18n';
import { openDrillDown, readDrillDownLive } from './helpers/teacher-drill-down-live';
import { downloadFrom, expectSameDocument } from './helpers/teacher-export-live';
import { expectInsightsNumbers, expectProgressNumbers } from './helpers/teacher-export-markdown';
import {
  dbClassRoster,
  expectAnonymisedIds,
  expectNoRosterIdentity,
  readExportResponse,
  rosterEntry,
  type RosterIdentity,
} from './helpers/teacher-export-privacy';
import { readClassInsightsLive } from './helpers/teacher-insights-live';
import { en } from './helpers/teacher-rail';
import {
  openClassResults,
  readClassProgressLive,
  readLiveResults,
  signedInTeacherPage,
  type LiveResults,
} from './helpers/teacher-results-live';

// Task 057 — brief flows 21, 25 and 27 of .qa/E2E-FLOWS.md: the three AI exports,
// clicked in a real browser and asserted from the REAL DOWNLOADED BYTES.
//
// Two things are proven for each file. (1) TRANSPORT: the bytes the browser saved
// are the bytes C-TR-5/6/7 answered, under the server's own `text/markdown;
// charset=utf-8` + `attachment; filename="….md"` response, ending in `## Prompt`.
// (2) DE-IDENTIFICATION: every roster student's given_name, family_name, email,
// student_key and documentId is read out of POSTGRES and must not occur anywhere in
// the file or its filename, while every `S…` id in it is contract-shaped and belongs
// to this roster. One leaked value fails the spec — this is a privacy control.

test.describe.configure({ mode: 'serial' });

const SCREENSHOTS = path.resolve(process.cwd(), '..', '.qa', 'screenshots');
const tab = (key: string) => cat(en, `Teacher.results.tabs.${key}`);

let live: LiveResults;
let page: Page;
let classDocumentId: string;
let roster: RosterIdentity[];

test.beforeAll(async ({ browser, playwright }) => {
  live = await readLiveResults(playwright);
  classDocumentId = live.classes[0].class_document_id;
  roster = dbClassRoster(classDocumentId);
  expect(roster.length, 'the class under test must have a roster').toBeGreaterThan(1);
  page = await signedInTeacherPage(browser);
});

test.afterAll(async () => {
  await page?.close();
});

const exportButton = (kind: TeacherExportKind): Locator =>
  page.locator(`button[data-export-kind="${kind}"]`);

async function openTab(key: 'insights' | 'progress'): Promise<void> {
  await openClassResults(page, classDocumentId);
  await page.getByRole('tab', { name: tab(key) }).click();
  const slot = key === 'insights' ? 'teaching-insights' : 'class-progress';
  await expect(page.locator(`[data-slot="${slot}"]`)).toHaveAttribute('data-status', 'ready', {
    timeout: 20_000,
  });
}

/** The privacy control, applied to one downloaded file and its filename. */
function expectDeidentified(file: { body: string; filename: string }): string[] {
  const checked = expectNoRosterIdentity(file.body, roster);
  expect(checked, 'every roster identifier must have been searched for').toBeGreaterThanOrEqual(
    roster.length * 4,
  );
  expectNoRosterIdentity(file.filename, roster);
  expect(file.body).toContain(TEACHER_EXPORT_PROMPT_HEADING);
  return expectAnonymisedIds(file.body, roster);
}

test('flow 21: Teaching insights AI export downloads a de-identified .md', async ({
  playwright,
}) => {
  const insights = await readClassInsightsLive(playwright, classDocumentId);
  await openTab('insights');

  const server = await readExportResponse(playwright, { kind: 'insights', classDocumentId });
  expect(server.disposition).toBe(`attachment; filename="${server.filename}"`);
  expect(server.filename).toMatch(/^teaching-insights-.+\.md$/);

  const downloaded = await downloadFrom(exportButton('insights'));
  expect(downloaded.filename).toBe(server.filename);
  expectSameDocument(downloaded, server);

  const ids = expectDeidentified(downloaded);
  expectInsightsNumbers(downloaded.body, insights, roster);
  expect(downloaded.body).toContain(`Students on the class table: ${roster.length}`);
  await page
    .locator('[data-slot="teacher-export-panel"][data-export-kind="insights"]')
    .screenshot({ path: `${SCREENSHOTS}/057-flow21-insights-export.png` });

  // The ids are contractually STABLE, so a full reload and a second click must save
  // the same document under the same anonymised ids — not a fresh shuffle. The tab is
  // re-opened after the reload because `ClassResultsTabs` holds the active tab in
  // React state rather than the URL, so a reload lands back on the default tab.
  await page.reload();
  await openTab('insights');
  const again = await downloadFrom(exportButton('insights'));
  expect(again.filename).toBe(server.filename);
  expectSameDocument(again, server);
  expect(expectAnonymisedIds(again.body, roster)).toEqual(ids);
});

test('flow 25: Progress AI export downloads a de-identified .md with comparison data', async ({
  playwright,
}) => {
  const progress = await readClassProgressLive(playwright, classDocumentId);
  expect(progress.available, 'flow 25 needs a class with Test B completions').toBe(true);
  await openTab('progress');

  const server = await readExportResponse(playwright, { kind: 'progress', classDocumentId });
  expect(server.disposition).toBe(`attachment; filename="${server.filename}"`);
  expect(server.filename).toMatch(/^progress-.+\.md$/);

  const downloaded = await downloadFrom(exportButton('progress'));
  expect(downloaded.filename).toBe(server.filename);
  expectSameDocument(downloaded, server);

  expectDeidentified(downloaded);
  expectProgressNumbers(downloaded.body, progress, roster);
  for (const mover of [...progress.most_improved, ...progress.needs_attention]) {
    expect(downloaded.body, 'the API display_name must not reach the export').not.toContain(
      mover.display_name,
    );
  }
  await page
    .locator('[data-slot="teacher-export-panel"][data-export-kind="progress"]')
    .screenshot({ path: `${SCREENSHOTS}/057-flow25-progress-export.png` });
});

test('flow 27: student drill-down AI export replaces names with anonymised IDs', async ({
  playwright,
}) => {
  const subject = live.detail.students.find((row) => row.test_a.state === 'done');
  if (!subject) throw new Error('[e2e] no student in this class has completed Test A');
  const studentDocumentId = subject.student_document_id;
  const entry = rosterEntry(roster, studentDocumentId);
  const drill = await readDrillDownLive(playwright, classDocumentId, studentDocumentId);

  await openDrillDown(page, classDocumentId, studentDocumentId);
  const server = await readExportResponse(playwright, {
    kind: 'student',
    classDocumentId,
    studentDocumentId,
  });
  expect(server.disposition).toBe(`attachment; filename="${server.filename}"`);

  const downloaded = await downloadFrom(exportButton('student'));
  expect(downloaded.filename).toBe(server.filename);
  expectSameDocument(downloaded, server);

  // The subject's OWN identity is included in the roster sweep, and the file may
  // carry no anonymised id other than the one roster order assigns to this student.
  expect(expectDeidentified(downloaded)).toEqual([entry.anonymisedId]);
  expect(downloaded.filename.toLowerCase()).toContain(entry.anonymisedId.toLowerCase());
  expect(downloaded.body).toContain(`student ${entry.anonymisedId}`);
  expect(downloaded.body).not.toContain(drill.student.display_name);

  const latest = drill.tests[0];
  expect(downloaded.body).toContain(`| Overall score | ${latest.score} / 100 |`);
  if (latest.acara_phase) {
    expect(downloaded.body).toContain(`| ACARA phase | ${latest.acara_phase} |`);
  }
  for (const subskill of latest.subskills) {
    expect(downloaded.body).toContain(
      `| ${subskill.attribute} — ${subskill.name} | ${subskill.likelihood} | ${subskill.status} |`,
    );
  }
  await page
    .locator('[data-slot="student-drill-down-header"]')
    .screenshot({ path: `${SCREENSHOTS}/057-flow27-student-export.png` });
});
