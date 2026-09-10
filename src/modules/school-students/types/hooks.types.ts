import type { SchoolStudent } from '@/modules/school-students/types/school-students.types';
import type { ParsedStudentCsv } from '@/modules/student-import';

export type StudentFormTarget = { mode: 'create' } | { mode: 'edit'; student: SchoolStudent };

export interface StudentImportState {
  parsed: ParsedStudentCsv;
  setParsed: (parsed: ParsedStudentCsv) => void;
  classId: string;
  setClassId: (documentId: string) => void;
  canSubmit: boolean;
  pending: boolean;
  submit: () => Promise<void>;
}
