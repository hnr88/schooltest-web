import type { RevealAuditEntry } from '../stores/use-reveal-audit-store';
import type { MonitorRowState, MonitorStudent, SittingStatus } from '../types/test-day.types';

// C-SIT-05 (task 90, mvp-updates §4.5.3): code_shown is a pure client
// derivation over the monitor payload and the UI-only reveal audit store.
// The backend state enum is unchanged and no server data is mutated.

// Effective reveals for the board, pruned at render time: an entry for a
// student who has left not_joined is moot (their join supersedes the reveal)
// and a closed sitting renders the static final board, so its entries never
// apply.
export function effectiveRevealedIds(
  entries: RevealAuditEntry[] | undefined,
  students: MonitorStudent[],
  sittingStatus: SittingStatus,
): ReadonlySet<string> {
  if (sittingStatus !== 'open') {
    return new Set();
  }
  const notJoined = new Set(
    students.filter((student) => student.state === 'not_joined').map((student) => student.documentId),
  );
  return new Set(
    (entries ?? [])
      .map((entry) => entry.student_documentId)
      .filter((documentId) => notJoined.has(documentId)),
  );
}

export function deriveRowState(
  student: MonitorStudent,
  revealedIds: ReadonlySet<string>,
): MonitorRowState {
  if (student.state === 'not_joined' && revealedIds.has(student.documentId)) {
    return 'code_shown';
  }
  return student.state;
}

// Summary counts keyed by row state. The six buckets always sum to the
// roster, so a staggered sitting reads unambiguously.
export function summarizeRowStates(
  students: MonitorStudent[],
  revealedIds: ReadonlySet<string>,
): Record<MonitorRowState, number> {
  const counts: Record<MonitorRowState, number> = {
    not_joined: 0,
    code_shown: 0,
    joined: 0,
    in_progress: 0,
    submitted: 0,
    stalled: 0,
  };
  for (const student of students) {
    counts[deriveRowState(student, revealedIds)] += 1;
  }
  return counts;
}
