// Sitting shapes consumed by the teacher test-day screen (task 64,
// st-mvp-pivot; mvp-updates §4.5, contracts C-SIT-01/02/03). Form selection
// stays server-side (D-10): the UI only ever renders the form code the API
// resolved, never a picker.

export type SittingStatus = 'open' | 'closed';

export type SittingStudentState =
  | 'not_joined'
  | 'joined'
  | 'in_progress'
  | 'submitted'
  | 'stalled';

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

// C-SIT-02 monitor student row.
export interface MonitorStudent {
  documentId: string;
  given_name: string;
  family_name: string;
  email: string | null;
  state: SittingStudentState;
  session_documentId: string | null;
}

// C-SIT-02 monitor payload.
export interface SittingMonitor {
  sitting: { documentId: string; code: string | null; status: SittingStatus };
  students: MonitorStudent[];
}
