'use client';

import {
  useStudentImportFlow,
  type StudentImportFlowState,
} from '@/modules/student-import/hooks/use-student-import-flow';
import { CLASSES_QUERY_KEY } from '@/modules/classes/constants/queries.constants';

/** The class detail's import state — the ONE shared flow, class fixed. */
export type ClassStudentImportState = StudentImportFlowState;

// Spec §1 "Import students" wiring, on the SHARED flow the Students page uses
// — the class is fixed to the one being viewed, so the dialog renders no class
// selector. Validation, toasts and refusal messages live in the shared
// student-import module; this wrapper only names the namespace, the fixed
// class and the read a commit must invalidate.
export function useClassStudentImport(
  classDocumentId: string,
  onDone: () => void,
): ClassStudentImportState {
  return useStudentImportFlow({
    messageNamespace: 'Classes.detail.import',
    initialClassDocumentId: classDocumentId,
    invalidateQueryKeys: [CLASSES_QUERY_KEY],
    onDone,
  });
}
