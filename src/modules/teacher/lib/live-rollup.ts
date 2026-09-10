/**
 * teacher/09 — the live-sessions roll-up derivation. Pure: the components
 * render what this returns and the unit fixtures prove it. It consumes
 * exactly what two existing reads already serve — C-TS-2's sitting list and
 * C-TD-1's class cards — so the roll-up adds no query, no fetch path and no
 * wire change. The group set and the idle set are complementary and
 * exhaustive over the teacher's classes by construction.
 */
import type { DashboardClass } from '@/modules/teacher/types/teacher.types';
import type { TeacherTestSession } from '@/modules/teacher/types/teacher-session.types';

/** One open sitting as a roll-up card needs it — the wire's two integers win. */
export interface LiveRollupSitting {
  documentId: string;
  classDocumentId: string;
  code: string | null;
  variant: TeacherTestSession['variant'];
  completed: number;
  expected: number;
}

/** One class with at least one open sitting — the design's `schoolLive` group. */
export interface LiveRollupGroup {
  classDocumentId: string;
  name: string;
  yearBand: string | null;
  studentCount: number;
  sittings: LiveRollupSitting[];
}

/** One class with nothing running — the design's `schoolIdle` chip. */
export interface LiveRollupIdleClass {
  classDocumentId: string;
  name: string;
  studentCount: number;
}

export interface LiveRollup {
  /** Classes WITH an open sitting, in the served class order. */
  groups: readonly LiveRollupGroup[];
  /** Classes WITHOUT one — never overlaps `groups`, and with it covers all. */
  idleClasses: readonly LiveRollupIdleClass[];
  openSessionCount: number;
  openClassCount: number;
  /** True only when classes exist AND none is idle (the `:296` sentence). */
  allClassesBusy: boolean;
}

/**
 * Groups C-TS-2's OPEN sittings under their C-TD-1 class cards. Closed rows
 * are the past table's business and are dropped here; a class without an open
 * sitting is idle. A sitting whose class is absent from the dashboard read
 * cannot exist — both reads share the caller's ownership scope — and one that
 * somehow did would have no badge, meta or roster to render against, so the
 * class list remains the roll-up's spine (the design's own iteration order).
 */
export function deriveLiveRollup(
  sessions: readonly TeacherTestSession[],
  classes: readonly DashboardClass[],
): LiveRollup {
  const openByClass = new Map<string, LiveRollupSitting[]>();
  for (const session of sessions) {
    if (session.status !== 'open') continue;
    const classDocumentId = session.class.document_id;
    const sittings = openByClass.get(classDocumentId) ?? [];
    sittings.push({
      documentId: session.sitting_document_id,
      classDocumentId,
      code: session.code,
      variant: session.variant,
      completed: session.completed,
      expected: session.expected,
    });
    openByClass.set(classDocumentId, sittings);
  }

  const groups: LiveRollupGroup[] = [];
  const idleClasses: LiveRollupIdleClass[] = [];
  for (const klass of classes) {
    const sittings = openByClass.get(klass.class_document_id);
    if (sittings === undefined) {
      idleClasses.push({
        classDocumentId: klass.class_document_id,
        name: klass.name,
        studentCount: klass.student_count,
      });
    } else {
      groups.push({
        classDocumentId: klass.class_document_id,
        name: klass.name,
        yearBand: klass.year_band,
        studentCount: klass.student_count,
        sittings,
      });
    }
  }

  return {
    groups,
    idleClasses,
    openSessionCount: groups.reduce((total, group) => total + group.sittings.length, 0),
    openClassCount: groups.length,
    allClassesBusy: classes.length > 0 && idleClasses.length === 0,
  };
}
