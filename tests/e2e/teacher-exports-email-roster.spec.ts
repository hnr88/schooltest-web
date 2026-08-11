import { expect, test, type Page } from '@playwright/test';

import type { TeacherExportKind } from '@/modules/teacher/types/teacher-export.types';

import { downloadFrom, expectSameDocument } from './helpers/teacher-export-live';
import { expectProgressNumbers } from './helpers/teacher-export-markdown';
import {
  dbClassRoster,
  expectAnonymisedIds,
  expectNoRosterIdentity,
  readExportResponse,
  type RosterIdentity,
} from './helpers/teacher-export-privacy';
import { cat } from './helpers/i18n';
import { en } from './helpers/teacher-rail';
import {
  openClassResults,
  readClassProgressLive,
  readLiveResults,
  signedInTeacherPage,
} from './helpers/teacher-results-live';

// Sibling of teacher-exports.spec.ts (200-line rule), same flows 21 + 25 — run
// against the teacher's OTHER class, the one whose roster students actually HAVE
// email addresses in Postgres. On the first class every `email` column is empty, so
// the email leg of the de-identification sweep could not bite there; here all five
// forbidden fields are non-empty for every student, and the sweep asserts it.

test.describe.configure({ mode: 'serial' });

let page: Page;
let classDocumentId: string;
let roster: RosterIdentity[];

test.beforeAll(async ({ browser, playwright }) => {
  const live = await readLiveResults(playwright);
  for (const entry of live.classes) {
    const candidate = dbClassRoster(entry.class_document_id);
    if (candidate.every((row) => row.email && row.studentKey && row.givenName && row.familyName)) {
      classDocumentId = entry.class_document_id;
      roster = candidate;
      break;
    }
  }
  if (!roster) throw new Error('[e2e] no class roster in Postgres carries a student email');
  page = await signedInTeacherPage(browser);
});

test.afterAll(async () => {
  await page.close();
});

async function downloadTab(kind: Extract<TeacherExportKind, 'insights' | 'progress'>) {
  await openClassResults(page, classDocumentId);
  await page.getByRole('tab', { name: cat(en, `Teacher.results.tabs.${kind}`) }).click();
  const slot = kind === 'insights' ? 'teaching-insights' : 'class-progress';
  await expect(page.locator(`[data-slot="${slot}"]`)).toHaveAttribute('data-status', 'ready', {
    timeout: 20_000,
  });
  return downloadFrom(page.locator(`button[data-export-kind="${kind}"]`));
}

/** All five forbidden fields are populated here, so 5 values per student are searched. */
function expectFullSweep(file: { body: string; filename: string }): void {
  expect(expectNoRosterIdentity(file.body, roster)).toBe(roster.length * 5);
  expectNoRosterIdentity(file.filename, roster);
  expectAnonymisedIds(file.body, roster);
}

test('flow 21 on the emailed roster: the insights .md leaks no email', async ({ playwright }) => {
  const server = await readExportResponse(playwright, { kind: 'insights', classDocumentId });
  const downloaded = await downloadTab('insights');
  expect(downloaded.filename).toBe(server.filename);
  expectSameDocument(downloaded, server);
  expectFullSweep(downloaded);
});

test('flow 25 on the emailed roster: the progress .md leaks no email', async ({ playwright }) => {
  const progress = await readClassProgressLive(playwright, classDocumentId);
  const server = await readExportResponse(playwright, { kind: 'progress', classDocumentId });
  const downloaded = await downloadTab('progress');
  expect(downloaded.filename).toBe(server.filename);
  expectSameDocument(downloaded, server);
  expectFullSweep(downloaded);
  expectProgressNumbers(downloaded.body, progress, roster);
});
