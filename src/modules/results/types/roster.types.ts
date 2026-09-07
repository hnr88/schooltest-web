import type { ResultView } from '@schooltest/scoring-contracts';

/**
 * The roster read (spec v2 §6.3, task 23 contract): one row per student of the
 * class — NOT one row per result. `result` is `null` where the student holds no
 * official Result, which is precisely what lets "No result yet" rows render and
 * `scoredCount.total` be the ROSTER SIZE rather than the count of students who
 * happen to have a result (open-risk R5's extension).
 */

/** The student block of one roster row. Opaque reference + the display trio; no PII beyond what the roster already shows. */
export interface RosterStudent {
  document_id: string;
  name: string;
  initials: string;
  /** EAL/D designation carried for the drill-down; the roster table itself does not render it. */
  eald_flag: boolean;
}

/** One roster row: a student and their official ResultView — or `null` before their first official sitting. */
export interface RosterRow {
  student: RosterStudent;
  result: ResultView | null;
}
