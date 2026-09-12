import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, type APIRequestContext, type Page } from '@playwright/test';

import { classRosterResponseSchema } from '@/modules/results/schemas/roster.schema';
import type { RosterRow } from '@/modules/results/types/roster.types';
import { teacherTestSessionsResponseSchema } from '@/modules/teacher/schemas/teacher-session.schema';
import type { TeacherTestSession } from '@/modules/teacher/types/teacher-session.types';

import { runSql } from './auth-db';
import { API_BASE } from './teacher-auth-rail';
import { waitForAnimationsSettled } from './ui';

// A1 (acceptance) — the Node-side half of teacher-v2/journey-acceptance.spec.ts.
// Nothing here fixtures anything: every value is read LIVE off the Strapi the browser
// talks to and parsed through the SHIPPED Zod mirrors, and the two writes it makes are
// real teacher actions (close a sitting) on the real close endpoint.

/** The parity set lives beside the other proofs, one file per design shot. */
export const ACCEPTANCE_PROOFS = path.resolve(
  process.cwd(),
  'tests',
  'e2e',
  'proofs',
  'teacher-v2',
  'acceptance',
);

const auth = (jwt: string) => ({ Authorization: `Bearer ${jwt}` });

/**
 * One parity capture, named after the design shot it answers
 * (`$TPV2/design/design-shots/<name>.png`). The viewport is the design's 1440×900 at
 * scroll 0, with every finite animation finished first, so the file is the settled
 * screen and never a mid-fade frame.
 */
export async function capture(page: Page, designShot: string): Promise<string> {
  mkdirSync(ACCEPTANCE_PROOFS, { recursive: true });
  // A toast from the step before (2.8s, 6s with an action) is not part of the screen the
  // design draws; let it expire on its own rather than capture the app mid-announcement.
  // Capture hygiene only — never an assertion, so a toast that outlives the wait is kept.
  await page
    .locator('[data-sonner-toast]')
    .last()
    .waitFor({ state: 'detached', timeout: 9_000 })
    .catch(() => undefined);
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    for (const element of document.querySelectorAll('main, [data-slot="page-scroll"]')) {
      element.scrollTop = 0;
    }
  });
  await waitForAnimationsSettled(page);
  const file = path.join(ACCEPTANCE_PROOFS, `${designShot}.png`);
  await page.screenshot({ path: file, animations: 'disabled' });
  return file;
}

/** The canonical roster read the Students and Family reports tabs both render. */
export async function readRoster(
  request: APIRequestContext,
  jwt: string,
  classDocumentId: string,
): Promise<RosterRow[]> {
  const response = await request.get(`${API_BASE}/api/my/students/results`, {
    headers: auth(jwt),
    params: { class: classDocumentId },
  });
  expect(response.status(), 'GET /api/my/students/results?class=').toBe(200);
  return classRosterResponseSchema.parse(await response.json());
}

/** How many roster rows sit in each release state — the tally cleanup compares against. */
export function releaseTally(roster: readonly RosterRow[]): Record<string, number> {
  const tally: Record<string, number> = {};
  for (const row of roster) tally[row.release_state] = (tally[row.release_state] ?? 0) + 1;
  return tally;
}

async function listSittings(
  request: APIRequestContext,
  jwt: string,
  params: Record<string, string>,
): Promise<TeacherTestSession[]> {
  const response = await request.get(`${API_BASE}/api/teacher/test-sessions`, {
    headers: auth(jwt),
    params,
  });
  expect(response.status(), `GET /api/teacher/test-sessions ${JSON.stringify(params)}`).toBe(200);
  return teacherTestSessionsResponseSchema.parse(await response.json()).sessions;
}

/** Live = open and not a booking (a booking is `status: 'open'`, `phase: 'scheduled'`). */
export async function liveSittingsOf(
  request: APIRequestContext,
  jwt: string,
  classDocumentId: string,
): Promise<TeacherTestSession[]> {
  const rows = await listSittings(request, jwt, { status: 'open', class: classDocumentId });
  return rows.filter((row) => row.phase !== 'scheduled');
}

/** The status the API holds for one sitting, whatever page of the list it is on. */
export async function sittingStatusOf(
  request: APIRequestContext,
  jwt: string,
  sittingDocumentId: string,
): Promise<string | undefined> {
  const rows = await listSittings(request, jwt, { page: '1', pageSize: '100' });
  return rows.find((row) => row.sitting_document_id === sittingDocumentId)?.status;
}

/**
 * Empties the room before the journey starts: an acceptance run has to reach the
 * design's "No sitting open" card, and it may only do that by CLOSING what is open —
 * the teacher's own action on the real endpoint (C-TS-4), never by editing a row.
 * Returns the sittings it closed so the spec can report them (TB-36's stale probe
 * sittings are exactly what this finds on the shared stack).
 */
export async function quietClass(
  request: APIRequestContext,
  jwt: string,
  classDocumentId: string,
): Promise<string[]> {
  const closed: string[] = [];
  for (const row of await liveSittingsOf(request, jwt, classDocumentId)) {
    const response = await request.post(
      `${API_BASE}/api/teacher/test-sessions/${row.sitting_document_id}/close`,
      { headers: auth(jwt) },
    );
    expect(response.status(), `POST /api/teacher/test-sessions/${row.sitting_document_id}/close`).toBe(200);
    closed.push(row.sitting_document_id);
  }
  expect(
    (await liveSittingsOf(request, jwt, classDocumentId)).map((row) => row.sitting_document_id),
    'the class is quiet before the journey opens its own sitting',
  ).toEqual([]);
  return closed;
}

/**
 * The page's OWN re-read of one sittings list. Closing invalidates `['teacher']`, so the
 * Live tab refetches BOTH of `useLiveTab`'s lists — the open one behind "No sitting open"
 * and the closed one behind Previous sessions — each on its own cadence. Waiting for the
 * response that already carries the new truth is what makes those assertions settled
 * states rather than races with the dev server's recompiles. Arm it BEFORE the click.
 */
export function waitForSittingsReread(
  page: Page,
  classDocumentId: string,
  status: 'open' | 'closed',
  holds: (rows: TeacherTestSession[]) => boolean,
): Promise<unknown> {
  return page.waitForResponse(
    async (response) => {
      const url = new URL(response.url());
      if (url.pathname !== '/api/teacher/test-sessions' || response.request().method() !== 'GET') return false;
      if (url.searchParams.get('status') !== status) return false;
      if (url.searchParams.get('class') !== classDocumentId || !response.ok()) return false;
      try {
        return holds(teacherTestSessionsResponseSchema.parse(await response.json()).sessions);
      } catch {
        // A body the browser already discarded (FLAKE-01) proves nothing; wait for the next.
        return false;
      }
    },
    { timeout: 90_000 },
  );
}

/** The open list the tab re-reads after a close: nothing live left (a booking is not live). */
export const waitForNothingLive = (page: Page, classDocumentId: string): Promise<unknown> =>
  waitForSittingsReread(page, classDocumentId, 'open', (rows) =>
    rows.every((row) => row.phase === 'scheduled'),
  );

/** The closed list the tab re-reads after a close: it now carries the sitting just closed. */
export const waitForClosedListing = (
  page: Page,
  classDocumentId: string,
  sittingDocumentId: string,
): Promise<unknown> =>
  waitForSittingsReread(page, classDocumentId, 'closed', (rows) =>
    rows.some((row) => row.sitting_document_id === sittingDocumentId),
  );

/** Students of the class holding an attempt in flight right now — the ones a close would end. */
export function studentsMidAttempt(classDocumentId: string): string[] {
  const rows = runSql(
    `select distinct s.document_id from students s
       join students_class_lnk l on l.student_id = s.id
       join classes c on c.id = l.class_id
       join sessions_student_lnk sl on sl.student_id = s.id
       join sessions se on se.id = sl.session_id
      where c.document_id = '${classDocumentId.replace(/'/g, "''")}'
        and s.status <> 'archived' and se.status = 'in_progress'`,
  );
  return rows === '' ? [] : rows.split('\n').map((row) => row.trim()).filter((row) => row !== '');
}

export interface StoredResult {
  student: string;
  columns: string;
}

/**
 * Every official (non-legacy) Result of the class's roster with the columns release state
 * is made of, keyed by result documentId. This is the STORAGE-level "as found" oracle: the
 * roster's `release_state` is a derived, LIST_LIMIT-windowed view that moves for students a
 * run never touched, so a journey proves it changed nothing by comparing these rows.
 */
export function officialResultsOfClass(classDocumentId: string): Map<string, StoredResult> {
  const rows = runSql(
    `select r.document_id || '~~' || s.document_id || '~~' || coalesce(r.published_at_field::text, '-')
         || '~~' || coalesce(r.recalled_at::text, '-') || '~~' || coalesce(r.recall_reason, '-')
       from results r
       join results_student_lnk rs on rs.result_id = r.id
       join students s on s.id = rs.student_id
       join students_class_lnk scl on scl.student_id = s.id
       join classes c on c.id = scl.class_id
      where c.document_id = '${classDocumentId.replace(/'/g, "''")}'
        and s.status <> 'archived' and r.destination = 'official'
        and (r.model_version is null or r.model_version <> 'legacy-r7')`,
  );
  const stored = new Map<string, StoredResult>();
  for (const line of rows.split('\n')) {
    if (line.trim() === '') continue;
    const [id, student, ...rest] = line.split('~~');
    stored.set(id, { student, columns: rest.join('~~') });
  }
  return stored;
}

/** The status Postgres holds for one delivery session ('' when the row is gone). */
export function sessionStatusOf(sessionDocumentId: string): string {
  return runSql(
    `select status from sessions where document_id = '${sessionDocumentId.replace(/'/g, "''")}'`,
  ).trim();
}

/** Students of the class that hold no open membership and no in-flight attempt. */
export function freeStudentCount(classDocumentId: string): number {
  const rows = runSql(
    `select count(*) from students s
       join students_class_lnk l on l.student_id = s.id
       join classes c on c.id = l.class_id
      where c.document_id = '${classDocumentId.replace(/'/g, "''")}' and s.status = 'active'
        and not exists (select 1 from sessions se
                          join sessions_student_lnk sl on sl.session_id = se.id
                         where sl.student_id = s.id and se.status = 'in_progress')`,
  );
  return Number(rows.trim());
}
