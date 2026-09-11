import { BUSY_MONITOR_STATES } from '@/modules/teacher/constants/start-session.constants';
import type { BlockedMap, BlockedReason } from '@/modules/teacher/types/start-session-modal.types';
import type {
  TeacherTestSession,
  TestSessionMonitorResponse,
} from '@/modules/teacher/types/teacher-session.types';

const BUSY_STATES: ReadonlySet<string> = new Set(BUSY_MONITOR_STATES);

/**
 * ONE TEST AT A TIME PER STUDENT — the server's own rule
 * (schooltest-api `sitting/lib/members.ts#busyStudentIds`, applied by C-TS-1),
 * mirrored ONCE for every teacher screen. A student is busy while:
 *  · another open, non-scheduled sitting names them in `member_student_ids`,
 *    whatever their state; or
 *  · a whole-class open sitting (`member_student_ids: null`) holds a session of
 *    theirs in progress — which only that sitting's monitor can tell (joined,
 *    in progress, stalled or paused are all an in-progress session).
 * A whole-class sitting a student never joined does NOT block them. The server
 * stays the authority: its 409 `details.busy_student_document_ids` is merged on
 * top by the caller (`start-session-errors.ts`).
 */
function isLive(sitting: TeacherTestSession): boolean {
  return sitting.status === 'open' && sitting.phase !== 'scheduled' && sitting.phase !== 'cancelled';
}

/** The open sittings whose monitor must be read to know who is mid-test (the whole-class ones). */
export function sittingsNeedingMonitor(sittings: readonly TeacherTestSession[]): string[] {
  return sittings
    .filter((sitting) => isLive(sitting) && !Array.isArray(sitting.member_student_ids))
    .map((sitting) => sitting.sitting_document_id);
}

/** Who is busy, each with the form of the sitting that holds them ("Already sitting <form>"). */
export function busyStudents(
  sittings: readonly TeacherTestSession[],
  monitors: Readonly<Record<string, TestSessionMonitorResponse | undefined>>,
): BlockedMap {
  const busy = new Map<string, BlockedReason>();
  for (const sitting of sittings) {
    if (!isLive(sitting)) continue;
    const reason: BlockedReason = { kind: 'sitting', formLabel: sitting.form?.label ?? '' };
    if (Array.isArray(sitting.member_student_ids)) {
      for (const id of sitting.member_student_ids) busy.set(id, reason);
      continue;
    }
    for (const student of monitors[sitting.sitting_document_id]?.students ?? []) {
      if (BUSY_STATES.has(student.state)) busy.set(student.student_document_id, reason);
    }
  }
  return busy;
}
