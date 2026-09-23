// C-CLS-01 / C-CHD-01 payload shapes (school admin Classes screen).

export interface ClassTeacher {
  documentId: string;
  // Null for accounts created outside the invitation flow (e.g. seeds).
  first_name: string | null;
  last_name: string | null;
}

export type ClassPendingTeacherState = 'pending' | 'expired' | 'revoked' | 'accepted';

// BUG-006: the invited, not-yet-activated teacher a class is waiting on.
export interface ClassPendingTeacher {
  documentId: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  state: ClassPendingTeacherState;
}

export interface SchoolClass {
  documentId: string;
  name: string;
  year_band: string | null;
  teachers: ClassTeacher[];
  pending_teacher: ClassPendingTeacher | null;
  student_count: number;
}

// BUG-006: what one teacher pick means on the wire — active accounts go to
// `teacher_documentIds`, an invitation to `pending_teacher_documentId`.
export interface ClassTeacherAssignment {
  teacher_documentIds: string[];
  pending_teacher_documentId: string | null;
}

// Spec §2 "Tests completed": every student sits TWO reading tests, so a class
// carries a submitted count per test slot, both read from C-RPT-04.
export interface ClassTestCompletion {
  testA: number;
  testB: number;
}

// The rendered "X / Y" pair for that column, one fraction per test slot.
export interface ClassTestCompletionDisplay {
  testA: string;
  testB: string;
}
