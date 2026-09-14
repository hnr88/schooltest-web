import type { StudentImportFlowState } from '@/modules/student-import/hooks/use-student-import-flow';

export interface StrapiErrorEnvelope {
  error?: { message?: string };
}

// The class-detail CSV import state (spec §1 "Import students") IS the shared
// flow state — one definition in the student-import module, so the surfaces
// cannot drift. No class selector: the target class is fixed.
export type ClassStudentImportState = StudentImportFlowState;
