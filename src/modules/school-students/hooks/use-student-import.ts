'use client';

import {
  useStudentImportFlow,
  type StudentImportFlowState,
} from '@/modules/student-import/hooks/use-student-import-flow';
import {
  ENTITLEMENT_QUERY_KEY,
  SCHOOL_CHILDREN_QUERY_KEY,
} from '@/modules/school-students/constants/queries.constants';

/** The Students page's import state — the ONE shared flow, picker included. */
export type StudentImportState = StudentImportFlowState;

// Spec §4 import wiring: the parsed CSV, the raw csv text and the target class
// the shared fields report up, then ONE preview→commit run against
// /api/schools/me/import-students/* — the same engine the ops portal uses.
// The flow itself (validation, toasts, refusal messages) lives in the shared
// student-import module; this wrapper only names the namespace and the reads a
// commit must invalidate. Every count in a toast comes from the server result,
// never from a guess about what the file contained.
export function useStudentImport(onDone: () => void): StudentImportState {
  return useStudentImportFlow({
    messageNamespace: 'SchoolStudents.import',
    invalidateQueryKeys: [SCHOOL_CHILDREN_QUERY_KEY, ENTITLEMENT_QUERY_KEY],
    onDone,
  });
}
