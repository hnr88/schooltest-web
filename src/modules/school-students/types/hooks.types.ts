import type { SchoolStudent } from '@/modules/school-students/types/school-students.types';
import type { StudentImportFlowState } from '@/modules/student-import/hooks/use-student-import-flow';

export type StudentFormTarget = { mode: 'create' } | { mode: 'edit'; student: SchoolStudent };

// The Students page's import state IS the shared flow state — one definition
// in the student-import module, so the surfaces cannot drift.
export type StudentImportState = StudentImportFlowState;
