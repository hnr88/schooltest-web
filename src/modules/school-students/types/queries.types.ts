import type { StudentErrorKind } from '@/modules/school-students/types/lib.types';
import type { StudentWriteBody } from '@/modules/school-students/types/school-students.types';
import type { ParsedStudentRow } from '@/modules/student-import';

export interface ArchiveStudentResult {
  documentId: string;
  status: string;
}

export interface UpdateStudentInput {
  documentId: string;
  body: StudentWriteBody;
}

export interface ImportStudentsInput {
  rows: readonly ParsedStudentRow[];
  classDocumentId: string;
}

export interface ImportStudentsResult {
  created: number;
  total: number;
  failure: StudentErrorKind | null;
}
