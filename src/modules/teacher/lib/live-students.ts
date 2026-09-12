import type { MonitorStudent } from '@/modules/test-day';
import { LIVE_FILTERS, LIVE_FILTER_STATUSES } from '@/modules/teacher/constants/live-students.constants';
import type {
  LiveDetail,
  LiveFilter,
  LiveMonitorTile,
  LiveResitEntry,
  LiveResitReason,
  LiveRowsInput,
  LiveSelection,
  LiveStudentRow,
} from '@/modules/teacher/types/live-students.types';

// Teacher Portal v2.dc.html:3296–3345, 3618–3632 — the Live tab's student list
// over the REAL reads: the teacher monitor (C-TS-3) owns each student's state
// and progress, the sitting monitor (C-SIT-02) their full name, email and
// session, and the class roster the Result of that session.

function fullName(row: MonitorStudent): string {
  return [row.given_name, row.family_name].filter(Boolean).join(' ').trim();
}

/** No answers yet: the server's `joined`, or a paused/stalled attempt whose progress is still null. */
export function isEmptyAttempt(tile: LiveMonitorTile): boolean {
  if (tile.state === 'joined') return true;
  const frozen = tile.state === 'paused' || tile.state === 'stalled';
  return frozen && tile.stage === null && tile.total_stages === null;
}

export function buildLiveRows({ tiles, sittingRows, roster, forcedResults }: LiveRowsInput): LiveStudentRow[] {
  const identities = new Map(sittingRows.map((row) => [row.documentId, row]));
  const rosterRows = new Map(roster.map((row) => [row.student.document_id, row]));
  return tiles.map((tile) => {
    const identity = identities.get(tile.student_document_id);
    const rosterRow = rosterRows.get(tile.student_document_id);
    const sessionId = identity?.session_documentId ?? null;
    const result = rosterRow?.result ?? null;
    const own = result !== null && sessionId !== null && result.session_document_id === sessionId ? result : null;
    return {
      studentId: tile.student_document_id,
      name: (identity ? fullName(identity) : '') || tile.display_name,
      email: identity?.email ?? null,
      hasIdentity: identity !== undefined,
      status: tile.state,
      stage: tile.stage,
      totalStages: tile.total_stages,
      inactiveMinutes: tile.inactive_minutes,
      connection: tile.connection ?? null,
      extraMinutes: tile.extra_minutes ?? 0,
      sessionId,
      resultId: own?.document_id ?? forcedResults.get(tile.student_document_id) ?? null,
      resultScored: own?.status === 'complete',
      neverSat: rosterRow?.release_state === 'nosit',
      emptyAttempt: isEmptyAttempt(tile),
    };
  });
}

export function matchesFilter(row: LiveStudentRow, filter: LiveFilter): boolean {
  return filter === 'all' || LIVE_FILTER_STATUSES[filter].includes(row.status);
}

/** :3328 — the search matches the name or the email. */
export function matchesQuery(row: LiveStudentRow, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (needle === '') return true;
  return row.name.toLowerCase().includes(needle) || (row.email ?? '').toLowerCase().includes(needle);
}

export function visibleRows(rows: readonly LiveStudentRow[], filter: LiveFilter, query: string): LiveStudentRow[] {
  return rows.filter((row) => matchesFilter(row, filter) && matchesQuery(row, query));
}

/** :3273 footnote — "n of m students in this session have not signed in yet." */
export function notSignedInCount(rows: readonly LiveStudentRow[]): number {
  return rows.filter((row) => row.status === 'not_joined').length;
}

function resitReason(row: LiveStudentRow): LiveResitReason | null {
  if (row.status === 'absent') return 'absent';
  if (row.status === 'scoring_failed') return 'scoringFailed';
  return row.neverSat && row.status === 'not_joined' ? 'neverSat' : null;
}

/** :3624 — absent in this sitting, scoring failed, or never sat anything. */
export function resitQueue(rows: readonly LiveStudentRow[]): LiveResitEntry[] {
  return rows.flatMap((row) => {
    const reason = resitReason(row);
    return reason === null ? [] : [{ studentId: row.studentId, name: row.name, reason }];
  });
}

export function selectedRows(rows: readonly LiveStudentRow[], selected: ReadonlySet<string>): LiveStudentRow[] {
  return rows.filter((row) => selected.has(row.studentId));
}

function everyShownSelected(visible: readonly LiveStudentRow[], selected: ReadonlySet<string>): boolean {
  return visible.length > 0 && visible.every((row) => selected.has(row.studentId));
}

/** :3332–3334 — the header box: full when every shown row is ticked, a dash for any other selection. */
export function selectionOf(
  visible: readonly LiveStudentRow[],
  selected: ReadonlySet<string>,
  selectedCount: number,
): LiveSelection {
  if (everyShownSelected(visible, selected)) return 'all';
  return selectedCount > 0 ? 'some' : 'none';
}

/** :4131 `toggleAll` — ticks every shown row, or clears them when all are already ticked. */
export function toggleAllShown(visible: readonly LiveStudentRow[], selected: ReadonlySet<string>): Set<string> {
  const clear = everyShownSelected(visible, selected);
  const next = new Set(selected);
  for (const row of visible) {
    if (clear) next.delete(row.studentId);
    else next.add(row.studentId);
  }
  return next;
}

export function toggleOne(selected: ReadonlySet<string>, studentId: string): Set<string> {
  const next = new Set(selected);
  if (next.has(studentId)) next.delete(studentId);
  else next.add(studentId);
  return next;
}

export function isLiveFilter(value: string): value is LiveFilter {
  return LIVE_FILTERS.some((filter) => filter === value);
}

/** The card's third line (:3378) — or null where the server serves no value for it. */
export function detailOf(row: LiveStudentRow): LiveDetail | null {
  switch (row.status) {
    case 'not_joined':
      return { key: 'notJoined' };
    case 'joined':
      return { key: 'joined' };
    case 'absent':
      return { key: 'absent' };
    case 'scoring_failed':
      return { key: 'scoringFailed' };
    case 'stalled':
      return row.inactiveMinutes === null ? null : { key: 'idle', values: { minutes: row.inactiveMinutes } };
    case 'submitted':
      // The monitor carries no submission time, so the design's "Submitted n min ago" has no value to print.
      return null;
    case 'in_progress':
    case 'paused':
      if (row.stage === null) return { key: 'joined' };
      return row.totalStages === null
        ? { key: 'stageOnly', values: { stage: row.stage } }
        : { key: 'stage', values: { stage: row.stage, total: row.totalStages } };
  }
}
