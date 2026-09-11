import { expect, test, type Page } from '@playwright/test';

import { sectionTab } from './helpers/teacher-class-detail';
import { downloadFrom, expectSameDocument } from './helpers/teacher-export-live';
import {
  dbClassRoster,
  expectAnonymisedIds,
  expectNoRosterIdentity,
  readExportResponse,
  type RosterIdentity,
} from './helpers/teacher-export-privacy';
import {
  openClassResults,
  readLiveResults,
  signedInTeacherPage,
  TEACHER_EMAIL,
} from './helpers/teacher-results-live';

// Flow 21 against the teacher's class whose roster students actually HAVE email
// addresses in Postgres: all five forbidden fields are non-empty for every student,
// so the de-identification sweep of the Teaching insights export (C-TR-5) bites on
// the email leg too. The class list is C-TD-1 alone (the C-TR-1 detail answers 410).
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
  await openClassResults(page, classDocumentId);
  await sectionTab(page, 'insights').click();
  await expect(page.locator('[data-slot="teaching-insights"]')).toHaveAttribute('data-status', 'ready', {
    timeout: 30_000,
  });
  return downloadFrom(page.locator('button[data-export-kind="insights"]'));
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
