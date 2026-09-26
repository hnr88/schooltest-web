import { expect, test, type Page } from '@playwright/test';

import { downloadFrom, expectSameDocument } from './helpers/teacher-export-live';
import {
  openResultsList,
  readLiveResults,
  signedInTeacherPage,
  TEACHER_EMAIL,
} from './helpers/teacher-results-live';
import {
  dbClassRoster,
  expectAnonymisedIds,
  expectNoRosterIdentity,
  readExportResponse,
  type RosterIdentity,
} from './helpers/teacher-export-privacy';

// Flow 21 against the teacher's class whose roster students actually HAVE email
// addresses in Postgres: all five forbidden fields are non-empty for every student,
// so the de-identification sweep of the class LLM export (C-TR-5, the Teaching
// insights summary) bites on the email leg too. The export itself hangs off the
// Classes list's class row since the Teaching-tab export panel retired with the v2
// redesign. The class list is C-TD-1 alone (the C-TR-1 detail answers 410).
// Flow 25 (the progress export) retired with the Progress export panel, which the
// Teacher Portal v2 design dropped.

test.describe.configure({ mode: 'serial' });

let page: Page;
let classDocumentId: string;
let roster: RosterIdentity[];

test.beforeAll(async ({ browser, playwright }) => {
  const live = await readLiveResults(playwright, TEACHER_EMAIL, { withDetail: false });
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
  await page?.close();
});

async function downloadInsights() {
  await openResultsList(page);
  return downloadFrom(
    page.locator(
      `[data-slot="results-class-row"][data-class-id="${classDocumentId}"] button[data-export="llm"]`,
    ),
  );
}

/** All five forbidden fields are populated here, so 5 values per student are searched. */
function expectFullSweep(file: { body: string; filename: string }): void {
  expect(expectNoRosterIdentity(file.body, roster)).toBe(roster.length * 5);
  expectNoRosterIdentity(file.filename, roster);
  expectAnonymisedIds(file.body, roster);
}

test('flow 21 on the emailed roster: the insights .md leaks no email', async ({ playwright }) => {
  const server = await readExportResponse(playwright, { kind: 'insights', classDocumentId });
  const downloaded = await downloadInsights();
  expect(downloaded.filename).toBe(server.filename);
  expectSameDocument(downloaded, server);
  expectFullSweep(downloaded);
});
