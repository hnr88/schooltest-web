import type { SchoolStudent, SchoolStudentDetail } from '@/modules/school-students/types/school-students.types';
import type { StudentImportFlowState } from '@/modules/student-import/hooks/use-student-import-flow';

// NIGHT-2 (W-R3, SA-007): the edit target may be the list row (C-CHD-01) OR the
// full record the detail screen holds (C-CHD-06 adds email, date_of_birth and
// year_level). The form prefills whatever the record actually carries, so the
// type carries both shapes.
export type StudentFormTarget =
  | { mode: 'create' }
  | { mode: 'edit'; student: SchoolStudent & Partial<SchoolStudentDetail> };

// The Students page's import state IS the shared flow state — one definition
// in the student-import module, so the surfaces cannot drift.
export type StudentImportState = StudentImportFlowState;
