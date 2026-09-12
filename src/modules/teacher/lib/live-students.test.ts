import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';

import type { RosterRow } from '@/modules/results';
import { batchPlan, controlErrorOf, rowActionsFor } from '@/modules/teacher/lib/live-student-actions';
import {
  buildLiveRows,
  notSignedInCount,
  resitQueue,
  selectionOf,
  toggleAllShown,
  toggleOne,
  visibleRows,
} from '@/modules/teacher/lib/live-students';
import { t2Roster } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import {
  t2Live409,
  t2LivePaused,
  t2LiveRunning,
  t2LiveScoringFailed,
  t2LiveStalled,
} from '@/modules/teacher/lib/v2/__fixtures__/t2-live';
import type { LiveMonitorTile, LiveStudentRow } from '@/modules/teacher/types/live-students.types';

type Snapshot = typeof t2LiveRunning;

const NO_FORCED = new Map<string, string>();
const rowsOf = (snap: Snapshot, roster: readonly RosterRow[] = t2Roster, forced = NO_FORCED) =>
  buildLiveRows({ tiles: snap.teacher.students, sittingRows: snap.sitting.students, roster, forcedResults: forced });
const named = (rows: readonly LiveStudentRow[], first: string): LiveStudentRow => {
  const row = rows.find((entry) => entry.name.startsWith(`${first} `));
  if (row === undefined) throw new Error(`no recorded row for ${first}`);
  return row;
};
const tileOf = (snap: Snapshot, studentId: string): LiveMonitorTile => {
  const tile = snap.teacher.students.find((entry) => entry.student_document_id === studentId);
  if (tile === undefined) throw new Error(`no recorded tile for ${studentId}`);
  return tile;
};
const rosterOf = (studentId: string): RosterRow => {
  const row = t2Roster.find((entry) => entry.student.document_id === studentId);
  if (row === undefined) throw new Error(`no recorded roster row for ${studentId}`);
  return row;
};
const keys = (row: LiveStudentRow, retried: ReadonlySet<string> = new Set()) =>
  rowActionsFor(row, retried).map((action) => action.key);
const names = (rows: readonly LiveStudentRow[]) => rows.map((row) => row.name.split(' ')[0]);
const all = (rows: readonly LiveStudentRow[]) => new Set(rows.map((row) => row.studentId));
const count = (rows: readonly LiveStudentRow[], filter: Parameters<typeof visibleRows>[1]) =>
  visibleRows(rows, filter, '').length;

/** A recorded snapshot with one student's tile and board row moved to `state` (an edge case derived from it). */
function withState(snap: Snapshot, studentId: string, state: LiveMonitorTile['state'], sessionId?: string): Snapshot {
  return {
    teacher: {
      ...snap.teacher,
      students: snap.teacher.students.map((tile) =>
        tile.student_document_id === studentId
          ? { ...tile, state, stage: null, total_stages: null, connection: null }
          : tile,
      ),
    },
    sitting: {
      ...snap.sitting,
      students: snap.sitting.students.map((row) =>
        row.documentId === studentId
          ? { ...row, state, session_documentId: sessionId ?? row.session_documentId }
          : row,
      ),
    },
  };
}

function axiosFailure(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('failed', 'ERR_BAD_RESPONSE', config, null, { status, statusText: '', headers: {}, config, data });
}

describe('buildLiveRows over a recorded running sitting', () => {
  const rows = rowsOf(t2LiveRunning);

  it('keeps the monitor order and each member’s server state', () => {
    expect(rows.map((row) => row.status)).toEqual(t2LiveRunning.teacher.students.map((tile) => tile.state));
    expect(rows.map((row) => row.status)).toEqual(['in_progress', 'joined', 'absent', 'not_joined']);
  });

  it('takes name and email from the sitting monitor and progress from the teacher monitor', () => {
    const qadir = named(rows, 'Qadir');
    const identity = t2LiveRunning.sitting.students.find((row) => row.documentId === qadir.studentId);
    const tile = tileOf(t2LiveRunning, qadir.studentId);
    expect(qadir.name).toBe(`${identity?.given_name} ${identity?.family_name}`);
    expect(qadir.name).not.toBe(tile.display_name);
    expect(qadir.email).toBe(identity?.email);
    expect(qadir.sessionId).toBe(identity?.session_documentId);
    expect(qadir.stage).toBe(tile.stage);
    expect(qadir.stage).not.toBeNull();
    expect(qadir.connection).toBe(tile.connection);
  });

  it('marks the joined attempt with no answers as empty, never the answered one', () => {
    expect(named(rows, 'Rosa').emptyAttempt).toBe(true);
    expect(named(rows, 'Qadir').emptyAttempt).toBe(false);
  });

  it('holds no result id when the roster has no Result for this sitting’s session', () => {
    expect(rows.map((row) => row.resultId)).toEqual([null, null, null, null]);
  });

  it('never claims a missing email for a student the sitting monitor did not list', () => {
    const [first] = buildLiveRows({ tiles: t2LiveRunning.teacher.students, sittingRows: [], roster: t2Roster, forcedResults: NO_FORCED });
    expect(first.hasIdentity).toBe(false);
    expect(first.name).toBe(t2LiveRunning.teacher.students[0].display_name);
  });
});

describe('filters, search and counts', () => {
  it('counts each pill the way the server summary counts states', () => {
    for (const snap of [t2LiveRunning, t2LivePaused, t2LiveStalled]) {
      const rows = rowsOf(snap);
      const { summary } = snap.teacher;
      expect(count(rows, 'all')).toBe(summary.expected);
      expect(count(rows, 'inProgress')).toBe(summary.in_progress);
      expect(count(rows, 'submitted')).toBe(summary.submitted);
      expect(count(rows, 'paused')).toBe(summary.paused);
      expect(count(rows, 'attention')).toBe(summary.stalled + summary.scoring_failed);
    }
    expect(count(rowsOf(t2LiveRunning), 'notJoined')).toBe(2);
    expect(count(rowsOf(t2LiveStalled), 'attention')).toBe(1);
  });

  it('searches the name or the email, case-insensitively', () => {
    const rows = rowsOf(t2LiveRunning);
    const qadir = named(rows, 'Qadir');
    expect(names(visibleRows(rows, 'all', 'QADIR'))).toEqual(['Qadir']);
    expect(visibleRows(rows, 'all', qadir.email ?? '')).toEqual([qadir]);
    expect(visibleRows(rows, 'all', '   ')).toHaveLength(4);
    expect(visibleRows(rows, 'inProgress', 'rosa')).toHaveLength(0);
  });

  it('footnotes the members who have not signed in', () => {
    expect(notSignedInCount(rowsOf(t2LiveRunning))).toBe(1);
  });
});

describe('row menu per status — design §6.2 on real endpoints only', () => {
  it('offers the working, absent and not-joined actions', () => {
    const rows = rowsOf(t2LiveRunning);
    expect(keys(named(rows, 'Qadir'))).toEqual(['pause', 'extend', 'forceSubmit', 'incident']);
    expect(keys(named(rows, 'Rosa'))).toEqual(['pause', 'extend', 'forceSubmit', 'incident']);
    expect(keys(named(rows, 'Sunniva'))).toEqual(['undoAbsent']);
    expect(keys(named(rows, 'Tenzin'))).toEqual(['markAbsent']);
    const destructive = rowActionsFor(named(rows, 'Qadir'), new Set()).filter((action) => action.destructive);
    expect(destructive.map((action) => action.key)).toEqual(['forceSubmit']);
  });

  it('offers resume on a teacher-paused empty attempt and keeps the granted minutes', () => {
    const rows = rowsOf(t2LivePaused);
    const rosa = named(rows, 'Rosa');
    expect(rosa.status).toBe('paused');
    expect(rosa.emptyAttempt).toBe(true);
    expect(keys(rosa)).toEqual(['resume', 'forceSubmit']);
    const qadir = named(rows, 'Qadir');
    expect(qadir.extraMinutes).toBe(tileOf(t2LivePaused, qadir.studentId).extra_minutes);
    expect(qadir.extraMinutes).toBe(10);
  });

  it('offers relaunch, force submit and an incident on a stalled student', () => {
    const stalled = rowsOf(t2LiveStalled).find((row) => row.status === 'stalled');
    if (stalled === undefined) throw new Error('the recorded sitting has no stalled student');
    const tile = tileOf(t2LiveStalled, stalled.studentId);
    expect(keys(stalled)).toEqual(['relaunch', 'forceSubmit', 'incident']);
    expect(stalled.inactiveMinutes).toBe(tile.inactive_minutes);
    expect(stalled.connection).toBe(tile.connection);
  });

  it('opens review and re-score only with this session’s scored Result', () => {
    const qadirId = named(rowsOf(t2LiveRunning), 'Qadir').studentId;
    const { result } = rosterOf(qadirId);
    if (result === null) throw new Error('recorded roster row has no result');
    const submitted = named(rowsOf(withState(t2LiveRunning, qadirId, 'submitted', result.session_document_id ?? '')), 'Qadir');
    expect(submitted.resultId).toBe(result.document_id);
    expect(submitted.resultScored).toBe(result.status === 'complete');
    expect(keys(submitted)).toEqual(result.status === 'complete' ? ['review', 'rescore'] : ['review']);

    const forced = new Map([[qadirId, result.document_id]]);
    const justSubmitted = named(rowsOf(withState(t2LiveRunning, qadirId, 'submitted'), t2Roster, forced), 'Qadir');
    expect(justSubmitted.resultId).toBe(result.document_id);
    expect(keys(justSubmitted)).toEqual(['review']);
    expect(keys(named(rowsOf(withState(t2LiveRunning, qadirId, 'submitted')), 'Qadir'))).toEqual([]);
  });

  it('retries scoring, then raises it for manual scoring, only with a real Result id', () => {
    const qadirId = named(rowsOf(t2LiveRunning), 'Qadir').studentId;
    const resultId = rosterOf(qadirId).result?.document_id ?? '';
    const failed = withState(t2LiveRunning, qadirId, 'scoring_failed');
    expect(keys(named(rowsOf(failed), 'Qadir'))).toEqual([]);
    const known = named(rowsOf(failed, t2Roster, new Map([[qadirId, resultId]])), 'Qadir');
    expect(keys(known)).toEqual(['retry']);
    expect(keys(known, new Set([resultId]))).toEqual(['raiseManual']);
  });

  // TB-37 — the cold-load case, on the recorded sitting that really holds one.
  it('takes a scoring-failed row’s Result id off the tile when the roster has no row for that session', () => {
    const row = rowsOf(t2LiveScoringFailed).find((entry) => entry.status === 'scoring_failed');
    if (row === undefined) throw new Error('the recorded sitting has no scoring-failed student');
    const tile = tileOf(t2LiveScoringFailed, row.studentId);
    const rosterResult = rosterOf(row.studentId).result;

    // The premise, read off the two recordings: the tile names THIS session's
    // Result, the roster row names a DIFFERENT session's official one — so with
    // no force submit in this page session the tile is the only source there is.
    expect(tile.result_document_id).not.toBeNull();
    expect(row.sessionId).not.toBeNull();
    expect(rosterResult?.session_document_id).not.toBe(row.sessionId);
    expect(rosterResult?.document_id).not.toBe(tile.result_document_id);

    expect(row.resultId).toBe(tile.result_document_id);
    expect(row.resultScored).toBe(false);
    expect(keys(row)).toEqual(['retry']);
    expect(keys(row, new Set([row.resultId ?? '']))).toEqual(['raiseManual']);
  });

  // Derived from the same recording: the roster row the API documents for a
  // scoring-failed attempt (`result: null`) leaves the tile alone as the source.
  it('still takes it off the tile when the roster row carries no Result at all', () => {
    const row = rowsOf(t2LiveScoringFailed).find((entry) => entry.status === 'scoring_failed');
    if (row === undefined) throw new Error('the recorded sitting has no scoring-failed student');
    const roster = t2Roster.map((entry) =>
      entry.student.document_id === row.studentId ? { ...entry, result: null } : entry,
    );
    const cold = rowsOf(t2LiveScoringFailed, roster).find((entry) => entry.status === 'scoring_failed');
    if (cold === undefined) throw new Error('the derived roster dropped the scoring-failed row');
    expect(cold.resultId).toBe(tileOf(t2LiveScoringFailed, row.studentId).result_document_id);
    expect(cold.resultScored).toBe(false);
    expect(keys(cold)).toEqual(['retry']);
  });
});

describe('batch eligibility — design §6.3', () => {
  it('acts on the eligible selected students only', () => {
    const rows = rowsOf(t2LiveRunning);
    const selected = all(rows);
    expect(names(batchPlan('pause', rows, selected).eligible)).toEqual(['Qadir', 'Rosa']);
    expect(names(batchPlan('extend', rows, selected).eligible)).toEqual(['Qadir', 'Rosa']);
    expect(names(batchPlan('absent', rows, selected).eligible)).toEqual(['Tenzin']);
    expect(batchPlan('rescore', rows, selected).eligible).toEqual([]);
    expect(batchPlan('pause', rows, selected).selectedCount).toBe(4);
  });

  it('pauses only the unpaused and extends the paused too', () => {
    const rows = rowsOf(t2LivePaused);
    expect(names(batchPlan('pause', rows, all(rows)).eligible)).toEqual(['Qadir']);
    expect(names(batchPlan('extend', rows, all(rows)).eligible)).toEqual(['Qadir', 'Rosa']);
  });

  it('ignores a selected id that is not on this sitting', () => {
    const rows = rowsOf(t2LiveRunning);
    const stranger = t2LiveStalled.teacher.students[0].student_document_id;
    const plan = batchPlan('extend', rows, new Set([...all(rows), stranger]));
    expect(plan.selectedCount).toBe(rows.filter((row) => row.studentId !== stranger).length);
  });
});

describe('waiting on a re-sit', () => {
  it('lists the absent student from the recorded sitting', () => {
    const queue = resitQueue(rowsOf(t2LiveRunning));
    expect(queue.map((entry) => [entry.name.split(' ')[0], entry.reason])).toEqual([['Sunniva', 'absent']]);
  });

  it('adds a never-sat student who has not joined, never one sitting it now', () => {
    const rows = rowsOf(t2LiveRunning);
    const nosit = new Set([named(rows, 'Tenzin').studentId, named(rows, 'Qadir').studentId]);
    const roster = t2Roster.map((row) =>
      nosit.has(row.student.document_id) ? { ...row, result: null, release_state: 'nosit' as const } : row,
    );
    const queue = resitQueue(rowsOf(t2LiveRunning, roster));
    expect(queue.map((entry) => [entry.name.split(' ')[0], entry.reason])).toEqual([
      ['Sunniva', 'absent'],
      ['Tenzin', 'neverSat'],
    ]);
  });

  it('adds a failed-scoring attempt', () => {
    const qadirId = named(rowsOf(t2LiveRunning), 'Qadir').studentId;
    const queue = resitQueue(rowsOf(withState(t2LiveRunning, qadirId, 'scoring_failed')));
    expect(queue.map((entry) => entry.reason)).toEqual(['scoringFailed', 'absent']);
  });
});

describe('selection', () => {
  const rows = rowsOf(t2LiveRunning);

  it('ticks every shown row, then clears them', () => {
    const ticked = toggleAllShown(rows, new Set());
    expect(ticked).toEqual(all(rows));
    expect(selectionOf(rows, ticked, ticked.size)).toBe('all');
    expect(toggleAllShown(rows, ticked).size).toBe(0);
  });

  it('shows the dash for a partial selection and keeps hidden ticks', () => {
    const one = toggleOne(new Set(), rows[0].studentId);
    expect(selectionOf(rows, one, 1)).toBe('some');
    expect(selectionOf(rows, new Set(), 0)).toBe('none');
    const notJoined = visibleRows(rows, 'notJoined', '');
    const next = toggleAllShown(notJoined, one);
    expect(next).toEqual(new Set([rows[0].studentId, ...notJoined.map((row) => row.studentId)]));
    expect(selectionOf(notJoined, next, next.size)).toBe('all');
    expect(toggleOne(one, rows[0].studentId).size).toBe(0);
  });
});

describe('control errors', () => {
  it('reads the reason off the recorded 409', () => {
    expect(t2Live409.status).toBe(409);
    expect(controlErrorOf(axiosFailure(t2Live409.status, t2Live409.body))).toBe('already_paused');
  });

  it('falls back on the status for everything else', () => {
    expect(controlErrorOf(axiosFailure(409, { error: { details: { reason: 'something_new' } } }))).toBe('conflict');
    expect(controlErrorOf(axiosFailure(404, null))).toBe('notOnRoster');
    expect(controlErrorOf(axiosFailure(400, null))).toBe('badRequest');
    expect(controlErrorOf(axiosFailure(500, null))).toBe('generic');
    expect(controlErrorOf(new Error('offline'))).toBe('generic');
  });
});
