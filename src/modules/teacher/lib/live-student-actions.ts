import { isAxiosError } from 'axios';

import {
  LIVE_BATCH_ELIGIBLE,
  LIVE_BATCH_KINDS,
  LIVE_CONTROL_REASONS,
  LIVE_INCIDENT_NOTE_MAX,
} from '@/modules/teacher/constants/live-students.constants';
import type {
  LiveBatchKind,
  LiveBatchPlan,
  LiveControlError,
  LiveRowAction,
  LiveRowActionKey,
  LiveStudentRow,
} from '@/modules/teacher/types/live-students.types';

// Teacher Portal v2.dc.html:3373 `rowActions` and :4141 `batchAct`, keeping only
// what a real endpoint performs. Left out, with no mechanism behind them:
// "Resend join code", "Allow a late start", "Reopen attempt", "Send reminder",
// and "Reset attempt" (its only row is Scoring failed, where /resit ends
// nothing because no attempt is in flight).

const act = (key: LiveRowActionKey, destructive = false): LiveRowAction => ({ key, destructive });

/**
 * The row menu per status. Review and re-score need this sitting's real Result
 * id; retry and manual scoring need it too, and since TB-37 the C-TS-3 tile
 * carries it, so a Scoring failed row offers them on a cold page load — no
 * longer only after a force submit made here returned that id.
 */
export function rowActionsFor(row: LiveStudentRow, retried: ReadonlySet<string>): LiveRowAction[] {
  switch (row.status) {
    case 'not_joined':
      return [act('markAbsent', true)];
    case 'absent':
      return [act('undoAbsent')];
    case 'paused':
      return [act('resume'), act('forceSubmit', true)];
    case 'stalled':
      return [act('relaunch'), act('forceSubmit', true), act('incident')];
    case 'scoring_failed':
      return row.resultId === null ? [] : [act(retried.has(row.resultId) ? 'raiseManual' : 'retry')];
    case 'submitted':
      return row.resultId === null ? [] : [act('review'), ...(row.resultScored ? [act('rescore')] : [])];
    case 'joined':
    case 'in_progress':
      return [act('pause'), act('extend'), act('forceSubmit', true), act('incident')];
  }
}

export function isBatchEligible(kind: LiveBatchKind, row: LiveStudentRow): boolean {
  if (!LIVE_BATCH_ELIGIBLE[kind].includes(row.status)) return false;
  return kind !== 'rescore' || (row.resultId !== null && row.resultScored);
}

/** :3341 — the selected students this action applies to, and how many were selected. */
export function batchPlan(
  kind: LiveBatchKind,
  rows: readonly LiveStudentRow[],
  selected: ReadonlySet<string>,
): LiveBatchPlan {
  const picked = rows.filter((row) => selected.has(row.studentId));
  return { kind, eligible: picked.filter((row) => isBatchEligible(kind, row)), selectedCount: picked.length };
}

function reasonOf(data: unknown): unknown {
  if (typeof data !== 'object' || data === null || !('error' in data)) return null;
  const { error } = data;
  if (typeof error !== 'object' || error === null || !('details' in error)) return null;
  const { details } = error;
  return typeof details === 'object' && details !== null && 'reason' in details ? details.reason : null;
}

/** B2: a 409 names `details.reason`; a student off the roster is a 404; a bad body a 400. */
export function controlErrorOf(error: unknown): LiveControlError {
  if (!isAxiosError(error) || !error.response) return 'generic';
  const { status, data } = error.response;
  if (status === 409) {
    const reason = reasonOf(data);
    return LIVE_CONTROL_REASONS.find((known) => known === reason) ?? 'conflict';
  }
  if (status === 404) return 'notOnRoster';
  if (status === 400) return 'badRequest';
  return 'generic';
}

export function incidentNote(text: string): string {
  return text.slice(0, LIVE_INCIDENT_NOTE_MAX);
}

/** The "n of m" each batch button prints beside its label (:4143 `countLabel`). */
export function batchTallies(
  rows: readonly LiveStudentRow[],
  selected: ReadonlySet<string>,
): { kind: LiveBatchKind; hit: number }[] {
  return LIVE_BATCH_KINDS.map((kind) => ({ kind, hit: batchPlan(kind, rows, selected).eligible.length }));
}
