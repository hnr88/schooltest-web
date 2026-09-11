import type { ClassYear } from '@/modules/teacher/types/classes-screen.types';
import type {
  TeacherTestSession,
  TestSessionBookedWindow,
} from '@/modules/teacher/types/teacher-session.types';

/** One live sitting as its card needs it. */
export interface LiveRollupSitting {
  documentId: string;
  classDocumentId: string;
  code: string | null;
  variant: TeacherTestSession['variant'];
  formLabel: string | null;
  /** `member_student_ids`: null is the whole class. */
  memberIds: readonly string[] | null;
  expected: number;
  /** The server's counts; null when the row carries no `stats`. */
  joined: number | null;
  submitted: number | null;
}

/** One class with at least one live sitting — the design's `schoolLive` block. */
export interface LiveRollupGroup {
  classDocumentId: string;
  name: string;
  year: ClassYear | null;
  studentCount: number;
  /**
   * Roster students no live sitting holds, by the server's rule (lib/student-availability.ts);
   * null until every whole-class sitting's monitor has answered.
   */
  freeCount: number | null;
  sittings: LiveRollupSitting[];
}

/** One class with nothing live — the design's `schoolIdle` chip. */
export interface LiveRollupIdleClass {
  classDocumentId: string;
  name: string;
  studentCount: number;
}

/** One booking — the design's `scheduledAll` card. */
export interface LiveRollupBooking {
  documentId: string;
  classDocumentId: string;
  className: string;
  formLabel: string | null;
  memberIds: readonly string[] | null;
  expected: number;
  window: TestSessionBookedWindow | null;
}

export interface LiveRollup {
  groups: readonly LiveRollupGroup[];
  idleClasses: readonly LiveRollupIdleClass[];
  bookings: readonly LiveRollupBooking[];
  openSessionCount: number;
  openClassCount: number;
  /** True only when classes exist AND none is idle. */
  allClassesBusy: boolean;
}

/** A booking's window as its card prints it, read in the school's zone. */
export interface BookingWindowView {
  date: string;
  start: string;
  end: string;
  isToday: boolean;
}
