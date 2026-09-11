/**
 * The Live sessions roll-up (Teacher Portal v2.dc.html:218–299). Pure: it
 * reads C-TS-2's sitting rows and C-TD-1's class cards and adds no read. A row
 * is live when it is open and neither booked nor over — a booking is
 * `status: 'open'` + `phase: 'scheduled'` and is never live. The group set and
 * the idle set are complementary and exhaustive over the teacher's classes.
 */
import { classYearOf } from '@/modules/teacher/lib/classes-directory';
import { classResultsHref } from '@/modules/teacher/lib/results-shell';
import type {
  LiveRollup,
  LiveRollupBooking,
  LiveRollupGroup,
  LiveRollupIdleClass,
  LiveRollupSitting,
} from '@/modules/teacher/types/live-sessions.types';
import type { DashboardClass } from '@/modules/teacher/types/teacher.types';
import type { TeacherTestSession } from '@/modules/teacher/types/teacher-session.types';

const NOT_LIVE_PHASES: ReadonlySet<string> = new Set(['scheduled', 'closed', 'cancelled']);

export function isLiveSitting(session: TeacherTestSession): boolean {
  return session.status === 'open' && !NOT_LIVE_PHASES.has(session.phase ?? 'open');
}

export function isBooking(session: TeacherTestSession): boolean {
  return session.status === 'open' && session.phase === 'scheduled';
}

function toSitting(session: TeacherTestSession): LiveRollupSitting {
  return {
    documentId: session.sitting_document_id,
    classDocumentId: session.class.document_id,
    code: session.code,
    variant: session.variant,
    formLabel: session.form?.label ?? null,
    memberIds: session.member_student_ids ?? null,
    expected: session.stats?.expected ?? session.expected,
    joined: session.stats?.joined ?? null,
    submitted: session.stats?.submitted ?? null,
  };
}

function toBooking(session: TeacherTestSession): LiveRollupBooking {
  return {
    documentId: session.sitting_document_id,
    classDocumentId: session.class.document_id,
    className: session.class.name,
    formLabel: session.form?.label ?? null,
    memberIds: session.member_student_ids ?? null,
    expected: session.stats?.expected ?? session.expected,
    window: session.window ?? null,
  };
}

function freeCountOf(studentCount: number, sittings: readonly LiveRollupSitting[]): number {
  if (sittings.some((sitting) => sitting.memberIds === null)) return 0;
  const busy = new Set(sittings.flatMap((sitting) => sitting.memberIds ?? []));
  return Math.max(0, studentCount - busy.size);
}

/** Live sittings grouped under their class cards, bookings in served order, idle classes. */
export function deriveLiveRollup(
  sessions: readonly TeacherTestSession[],
  classes: readonly DashboardClass[],
): LiveRollup {
  const liveByClass = new Map<string, LiveRollupSitting[]>();
  const bookings: LiveRollupBooking[] = [];
  for (const session of sessions) {
    if (isBooking(session)) {
      bookings.push(toBooking(session));
    } else if (isLiveSitting(session)) {
      const sittings = liveByClass.get(session.class.document_id) ?? [];
      sittings.push(toSitting(session));
      liveByClass.set(session.class.document_id, sittings);
    }
  }

  const groups: LiveRollupGroup[] = [];
  const idleClasses: LiveRollupIdleClass[] = [];
  for (const klass of classes) {
    const sittings = liveByClass.get(klass.class_document_id);
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
        year: classYearOf(klass),
        studentCount: klass.student_count,
        freeCount: freeCountOf(klass.student_count, sittings),
        sittings,
      });
    }
  }

  return {
    groups,
    idleClasses,
    bookings,
    openSessionCount: groups.reduce((total, group) => total + group.sittings.length, 0),
    openClassCount: groups.length,
    allClassesBusy: classes.length > 0 && idleClasses.length === 0,
  };
}

/** The class detail on its Live tab with this sitting selected. */
export function liveTabHref(classDocumentId: string, sittingDocumentId: string): string {
  return `${classResultsHref(classDocumentId)}?tab=live&session=${sittingDocumentId}`;
}

/** Submitted of expected, as the bar's whole percent; 0 without counts. */
export function progressPercent(sitting: LiveRollupSitting): number {
  if (sitting.submitted === null || sitting.expected === 0) return 0;
  return Math.min(100, Math.round((sitting.submitted / sitting.expected) * 100));
}

/** Joined but not submitted — who a close cuts off; null without counts. */
export function stillWorking(sitting: LiveRollupSitting): number | null {
  if (sitting.joined === null || sitting.submitted === null) return null;
  return Math.max(0, sitting.joined - sitting.submitted);
}
