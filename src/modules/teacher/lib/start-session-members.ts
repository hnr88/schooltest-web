import { windowsOverlap, zonedParts } from '@/modules/teacher/lib/start-session-schedule';
import type {
  BlockedMap,
  BlockedReason,
  RosterEntry,
  RosterStudent,
  SessionWindowIso,
} from '@/modules/teacher/types/start-session-modal.types';
import type { TeacherTestSession } from '@/modules/teacher/types/teacher-session.types';

/** The roster read's rows (`/my/students/results?class=`) as pickable students. */
export function toRosterStudents(
  rows: readonly { student: { document_id: string; name: string } }[],
): RosterStudent[] {
  return rows.map(({ student }) => ({ id: student.document_id, name: student.name }));
}

/**
 * Booked elsewhere during the window: the members of another booking of the
 * class whose window overlaps (the booking being edited excluded). While the
 * times cannot form a window, a booking on the same school date blocks.
 */
export function bookedInWindow(
  bookings: readonly TeacherTestSession[],
  window: SessionWindowIso | null,
  date: string,
  editSittingId: string | null,
  rosterIds: readonly string[],
): BlockedMap {
  const blocked = new Map<string, BlockedReason>();
  for (const booking of bookings) {
    const booked = booking.window;
    if (!booked || booking.phase !== 'scheduled' || booking.sitting_document_id === editSittingId) continue;
    const opens = zonedParts(new Date(booked.opens_at), booked.timezone);
    const clashes = window
      ? windowsOverlap(window.opens_at, window.closes_at, booked.opens_at, booked.closes_at)
      : opens.date === date;
    if (!clashes) continue;
    const reason: BlockedReason = { kind: 'booked', formLabel: booking.form?.label ?? '', opensAt: opens.time };
    const members = Array.isArray(booking.member_student_ids) ? booking.member_student_ids : rosterIds;
    for (const id of members) blocked.set(id, reason);
  }
  return blocked;
}

export function mergeBlocked(...maps: readonly BlockedMap[]): BlockedMap {
  const merged = new Map<string, BlockedReason>();
  for (const map of maps) for (const [id, reason] of map) merged.set(id, reason);
  return merged;
}

export function freeIds(roster: readonly RosterStudent[], blocked: BlockedMap): string[] {
  return roster.filter((student) => !blocked.has(student.id)).map((student) => student.id);
}

/** The picked students who are still free, in roster order. */
export function pickedFreeIds(
  roster: readonly RosterStudent[],
  blocked: BlockedMap,
  picked: readonly string[],
): string[] {
  const chosen = new Set(picked);
  return roster.filter((student) => chosen.has(student.id) && !blocked.has(student.id)).map((student) => student.id);
}

export function rosterEntries(
  roster: readonly RosterStudent[],
  blocked: BlockedMap,
  picked: readonly string[],
): RosterEntry[] {
  const chosen = new Set(picked);
  return roster.map((student) => {
    const reason = blocked.get(student.id) ?? null;
    return { ...student, blocked: reason, picked: reason === null && chosen.has(student.id) };
  });
}
