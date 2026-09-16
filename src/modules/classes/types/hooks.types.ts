import type { StudentImportFlowState } from '@/modules/student-import/hooks/use-student-import-flow';

export interface StrapiErrorEnvelope {
  error?: {
    message?: string;
    // D5: contract-coded refusals (e.g. CLASS_NAME_TAKEN on class create)
    // carry a stable details.code, so the client can pick a surface by the
    // server's meaning instead of parsing messages.
    details?: { code?: string };
  };
}

// The class-detail CSV import state (spec §1 "Import students") IS the shared
// flow state — one definition in the student-import module, so the surfaces
// cannot drift. No class selector: the target class is fixed.
export type ClassStudentImportState = StudentImportFlowState;
