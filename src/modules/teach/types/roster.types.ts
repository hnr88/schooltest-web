// C-CHD-01 roster row shape as consumed by the teacher roster screen (task 63,
// st-mvp-pivot). The task-63 widening adds `email` so missing emails can be
// flagged before test day; the school's proficiency label (D-10) is never
// projected onto this teacher-scoped read, so it is deliberately absent here.

export interface RosterChild {
  documentId: string;
  given_name: string | null;
  family_name: string | null;
  email: string | null;
  status: string | null;
  class: { documentId: string; name: string | null } | null;
}
