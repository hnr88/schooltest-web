import type { OpsImportReject } from '@schooltest/ops-contracts';

import type { SchoolStudent } from '@/modules/school-students/types/school-students.types';
import type { ParsedStudentCsv } from '@/modules/student-import';

export type StudentFormTarget = { mode: 'create' } | { mode: 'edit'; student: SchoolStudent };

export interface StudentImportState {
  parsed: ParsedStudentCsv;
  setParsed: (parsed: ParsedStudentCsv, csv: string) => void;
  /** The rows the SERVER refused on the last submit, each with its row number. */
  rejects: readonly OpsImportReject[];
  classId: string;
  setClassId: (documentId: string) => void;
  canSubmit: boolean;
  pending: boolean;
  submit: () => Promise<void>;
}
