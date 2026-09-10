import path from 'node:path';

import { expect, type APIRequestContext, type Page, type TestInfo } from '@playwright/test';

import { API } from './class-detail';
import { deleteStudents } from './student-cleanup';

// Shared plumbing for the class-scoped CSV import specs (spec §1 flows 13/13b):
// the probe files, the journey shots dir, and the two-step cleanup every import
// spec owes the fixture school.

/**
 * Where the journey's proof screenshots land: `.qa/journeys/03-import-students/shots`,
 * the per-journey folder the operator asked for (sibling of 06-scoring-to-report),
 * with the README next to it.
 *
 * Resolved from `process.cwd()` — Playwright runs with the web package as cwd, and
 * `helpers/auth-db.ts` already reaches the sibling `schooltest-api/.env` the same way.
 * A `__dirname` walk is what put the first captures in the wrong tree when these
 * helpers moved one directory deeper.
 */
export const IMPORT_CAPTURES =
  process.env.J03_CAPTURES_DIR ??
  path.resolve(process.cwd(), '..', '.qa', 'journeys', '03-import-students', 'shots');

/**
 * A well-formed file: the portal columns — the ONE vocabulary shared with the
 * ops portal and the server's preview/commit validator — then one row per name.
 */
export function csvFor(names: readonly string[]): string {
  const header = 'given name,family name,date of birth,year level,home language';
  const rows = names.map((name) => {
    const [given, ...rest] = name.split(' ');
    return `${given},${rest.join(' ')},2013-03-04,8,english`;
  });
  return [header, ...rows].join('\n');
}

/**
 * The same file plus the two rows the SERVER refuses: line 4 has no given name,
 * line 5 has a date of birth that is not a date. The good rows stay on lines
 * 2-3, so a spec can assert the exact lines that are named back.
 */
export function csvWithBadRows(names: readonly string[]): string {
  return [
    csvFor(names),
    ',NoGivenName,2013-03-04,8,english',
    'Broken Dob,Row,not-a-date,8,english',
  ].join('\n');
}

/**
 * One proof capture: saved under the mission captures dir AND attached to the
 * run, so the evidence survives whichever of the two a reader opens.
 */
export async function attachImportShot(
  page: Page,
  testInfo: TestInfo,
  name: string,
  fullPage = false,
): Promise<void> {
  const body = await page.screenshot({ path: `${IMPORT_CAPTURES}/${name}.png`, fullPage });
  await testInfo.attach(`${name}.png`, { body, contentType: 'image/png' });
}

/** C-CHD-03 archive, asserted: a silent cleanup failure would hide the leak. */
export async function archiveStudent(
  request: APIRequestContext,
  jwt: string,
  documentId: string,
): Promise<void> {
  const res = await request.post(`${API}/api/schools/me/children/${documentId}/archive`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.status(), `archive ${documentId} -> ${await res.text()}`).toBe(200);
}

/** Archive every probe through the app's real write, one asserted call each. */
export async function archiveImportProbes(
  request: APIRequestContext,
  jwt: string,
  documentIds: readonly string[],
): Promise<void> {
  for (const documentId of documentIds) {
    await archiveStudent(request, jwt, documentId);
  }
}

/**
 * Delete the probes through the admin route, LAST — after the class-count
 * assertion has already been made.
 *
 * The delete is not optional: archiving alone leaves every probe on the
 * school-wide Students page, newest first, and one archived pair per past run
 * pushed the real roster off page one — the leak
 * `helpers/student-cleanup.ts` exists to prevent. It is deliberately the final
 * act of the test, so no assertion depends on a best-effort cleanup that
 * swallows its own errors.
 */
export async function deleteImportProbes(
  request: APIRequestContext,
  documentIds: readonly string[],
): Promise<void> {
  await deleteStudents(request, documentIds);
}
