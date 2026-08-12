import { expect } from '@playwright/test';

import type { MonitorStudent } from '@/modules/teacher/types/teacher-session.types';

import { runSql } from './auth-db';

// Task 053 — the ROW half of the tile-state harness (brief flows 10, 11): the
// Postgres rows that entitle C-TS-3 to paint a tile the way it did. Split out of
// teacher-monitor-stall.ts for the 200-line file rule. Reads only.

/** Real `responses` rows on a session — the reason a tile may say "Stage X of 3". */
export function answeredCount(sessionDocumentId: string): number {
  return Number(
    runSql(
      `select count(*) from responses r
         join responses_session_lnk l on l.response_id = r.id
         join sessions s on s.id = l.session_id
        where s.document_id = '${sessionDocumentId}'`,
    ),
  );
}

/** `sessions.status` + `current_stage` for one session, straight out of Postgres. */
export function sessionRow(sessionDocumentId: string): { status: string; currentStage: string } {
  const [status = '', currentStage = ''] = runSql(
    `select status, coalesce(current_stage::text, '') from sessions
      where document_id = '${sessionDocumentId}'`,
  ).split('|');
  return { status, currentStage };
}

/** Flow 10's row-level proof: the tile's numbers ARE this session's own columns. */
export function expectInProgressRows(sessionDocumentId: string, stage: number | null): void {
  const row = sessionRow(sessionDocumentId);
  expect(row.status, 'the session row behind an in_progress tile').toBe('in_progress');
  expect(row.currentStage, 'the tile stage IS session.current_stage').toBe(String(stage));
  expect(answeredCount(sessionDocumentId), 'no response row persisted').toBeGreaterThan(0);
}

/**
 * Why C-TS-3 is entitled to call a student `submitted`, read out of Postgres:
 * the LATEST session that student holds on this sitting, plus whether a Result
 * row hangs off it. The contract admits exactly `complete`, or `terminated` with
 * a Result — anything else returned here is a state the datastore does not hold.
 */
export function submittedProof(sittingDocumentId: string, studentDocumentId: string): string {
  return runSql(
    `select s.status || '+' || case when count(r.id) = 0 then 'no-result' else 'result' end
       from sessions s
       join sittings_sessions_lnk l on l.session_id = s.id
       join sittings si on si.id = l.sitting_id
       join sessions_student_lnk sl on sl.session_id = s.id
       join students st on st.id = sl.student_id
       left join results_session_lnk rl on rl.session_id = s.id
       left join results r on r.id = rl.result_id
      where si.document_id = '${sittingDocumentId}' and st.document_id = '${studentDocumentId}'
      group by s.id, s.status, s.started_at, s.document_id
      order by s.started_at desc nulls last, s.document_id desc
      limit 1`,
  ).trim();
}

/** Flow 11's row-level proof for every green tile on one sitting. */
export function expectSubmittedRows(
  sittingDocumentId: string,
  students: readonly MonitorStudent[],
): void {
  for (const row of students) {
    expect(
      submittedProof(sittingDocumentId, row.student_document_id),
      `${row.display_name} is painted submitted — the session row must say so`,
    ).toMatch(/^(complete\+(result|no-result)|terminated\+result)$/);
  }
}
