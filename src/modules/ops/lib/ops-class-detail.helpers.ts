'use client';

import type { OpsStudentRow } from '@schooltest/ops-contracts';

import { MOVE_CLASS_ACTION, VIEW_PROFILE_ACTION } from '@/modules/ops/lib/student-actions';

/** A school staff member selectable as a class teacher (from the ops staff directory). */
export interface OpsClassTeacherOption {
  documentId: string;
  label: string;
}

/** The teacher shape the ops class detail reads (or the staff directory row). */
export interface OpsClassTeacher {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

/** Display name for a teacher, falling back to their email. */
export function opsTeacherLabel(teacher: OpsClassTeacher): string {
  const name = `${teacher.first_name ?? ''} ${teacher.last_name ?? ''}`.trim();
  return name || teacher.email || '—';
}

/** Roster/summary value for an optional field — absent renders as the no-value dash. */
export function noValueIfMissing(value: string | number | null | undefined): string {
  return value === null || value === undefined ? '—' : String(value);
}

/**
 * The class-page roster row/bulk actions (task 21, `Ops Portal.dc.html:1574-
 * 1600`). "View profile" and "Move to another class" REUSE task 18's
 * `student-actions.ts` label + confirm-copy keys VERBATIM (same wording, same
 * endpoint) — this file adds only the one action the Students tab does not
 * carry: "Remove from class", which unlinks the class relation without ever
 * touching the student's own `status` (remove and deactivate are different
 * operations with different promises; they never share a mutation).
 *
 * A local key/type is declared rather than widening `StudentActionKey` —
 * `student-actions.ts` is task 18's file and outside this task's write set.
 */
export type ClassRosterActionKey = 'viewProfile' | 'moveClass' | 'removeFromClass';

export interface ClassRosterActionConfirmCopy {
  titleKey: string;
  bodyKey: string;
  ctaKey: string;
}

export interface ClassRosterAction {
  key: ClassRosterActionKey;
  labelKey: string;
  write: boolean;
  danger: boolean;
  confirm: ClassRosterActionConfirmCopy | null;
}

/** New: no other surface reaches C-OPS-ROSTER-REMOVE. */
export const REMOVE_FROM_CLASS_ACTION: ClassRosterAction = {
  key: 'removeFromClass',
  labelKey: 'rosterActionRemove',
  write: true,
  danger: true,
  confirm: {
    titleKey: 'rosterRemoveConfirmTitleRow',
    bodyKey: 'rosterRemoveConfirmBody',
    ctaKey: 'rosterActionRemove',
  },
};

/** The design's roster row menu (`:1574-1580`) — no status-conditional entry, unlike the Students tab. */
export function classRosterRowActions(): readonly ClassRosterAction[] {
  return [
    {
      key: 'viewProfile',
      labelKey: VIEW_PROFILE_ACTION.labelKey,
      write: VIEW_PROFILE_ACTION.write,
      danger: VIEW_PROFILE_ACTION.danger,
      confirm: null,
    },
    {
      key: 'moveClass',
      labelKey: MOVE_CLASS_ACTION.labelKey,
      write: MOVE_CLASS_ACTION.write,
      danger: MOVE_CLASS_ACTION.danger,
      confirm: MOVE_CLASS_ACTION.confirm,
    },
    REMOVE_FROM_CLASS_ACTION,
  ];
}

/** The design's roster bulk set (`:1596-1600`): Move class, Export (a plain download outside this list, D-16), Remove from class. */
export function classRosterBulkActions(): readonly ClassRosterAction[] {
  return [
    {
      key: 'moveClass',
      labelKey: MOVE_CLASS_ACTION.labelKey,
      write: MOVE_CLASS_ACTION.write,
      danger: MOVE_CLASS_ACTION.danger,
      confirm: MOVE_CLASS_ACTION.confirm,
    },
    REMOVE_FROM_CLASS_ACTION,
  ];
}

/** Cosmetic header avatar text — never a fact, just an abbreviation of the year band (or the class's initial). */
export function classHeaderBadge(yearBand: string | null, name: string | null): string {
  const numeric = yearBand?.match(/\d+/)?.[0];
  if (numeric) return `Y${numeric}`;
  const initial = name?.trim().charAt(0).toUpperCase();
  return initial || '—';
}

/**
 * D-08 — "Average level" from the roster's `latest_result` aggregate. The
 * MODE, never an average: `schooltest-api/.../class-write.actions.ts` states
 * plainly that "no validated CEFR band mapping exists, and CEFR labels are
 * never averaged as strings" (which is also why the class-detail read's own
 * `average_cefr` is always null). A mode only counts — it never orders or
 * sums CEFR bands — so it does not run into that problem.
 */
export function classModalCefrLevel(roster: readonly OpsStudentRow[]): string | null {
  const counts = new Map<string, number>();
  for (const student of roster) {
    const level = student.latest_result?.cefr_level;
    if (!level) continue;
    counts.set(level, (counts.get(level) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [level, count] of counts) {
    if (count > bestCount) {
      best = level;
      bestCount = count;
    }
  }
  return best;
}

/** D-08 — students with a completed official result, over the roster page fetched for the aggregate. */
export function classTestsCompletedCount(roster: readonly OpsStudentRow[]): number {
  return roster.filter((student) => student.latest_result !== null).length;
}
