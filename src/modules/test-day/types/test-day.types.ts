// Sitting shapes consumed by the teacher test-day screen (task 64,
// st-mvp-pivot; mvp-updates §4.5, contracts C-SIT-01/02/03). Form selection
// is automatic on this surface, but the exact C-TD-2 id is sent explicitly so
// D-32 can reject every genuinely implicit progress session.

export type SittingStatus = 'open' | 'closed';

export type SittingStudentState = 'not_joined' | 'joined' | 'in_progress' | 'submitted' | 'stalled';

// C-SIT-05 derived row state (task 90, mvp-updates §4.5.3): the backend enum
// is unchanged; the monitor intersects not_joined with the UI-only reveal
// audit to show who has the code but has not joined yet.
export type MonitorRowState = SittingStudentState | 'code_shown';

// One row of the teacher-scoped GET /api/sittings list (core route, the owning
// teacher filter is forced server-side).
export interface ClassSitting {
  documentId: string;
  code: string | null;
  status: SittingStatus;
  mode: string;
  skill: string;
  createdAt: string;
  form: { documentId: string; form_code: string } | null;
  class: { documentId: string; name: string } | null;
}

// C-SIT-02 monitor student row. absent/needs_to_sit are the C-SIT-06 fields
// (task 119, mvp-updates §4.5.6): absent is the teacher-set flag persisted on
// the sitting; needs_to_sit is the server derivation (not_joined or stalled,
// never absent).
export interface MonitorStudent {
  documentId: string;
  given_name: string;
  family_name: string;
  email: string | null;
  state: SittingStudentState;
  session_documentId: string | null;
  absent: boolean;
  needs_to_sit: boolean;
}

// C-SIT-02 monitor payload.
export interface SittingMonitor {
  sitting: { documentId: string; code: string | null; status: SittingStatus };
  students: MonitorStudent[];
}
