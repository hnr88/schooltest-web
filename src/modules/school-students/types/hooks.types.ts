import type {
  SchoolStudent,
  SchoolStudentLevelFilter,
  SchoolStudentsQuery,
} from '@/modules/school-students/types/school-students.types';
import type { ParsedStudentCsv } from '@/modules/student-import';

export type StudentFormTarget = { mode: 'create' } | { mode: 'edit'; student: SchoolStudent };

export interface StudentsFilters {
  query: SchoolStudentsQuery;
  search: string;
  level: SchoolStudentLevelFilter;
  setSearch: (value: string) => void;
  selectClass: (value: string) => void;
  selectLevel: (value: SchoolStudentLevelFilter) => void;
  setPage: (page: number) => void;
  filtered: boolean;
}

export interface StudentImportState {
  parsed: ParsedStudentCsv;
  setParsed: (parsed: ParsedStudentCsv) => void;
  classId: string;
  setClassId: (documentId: string) => void;
  canSubmit: boolean;
  pending: boolean;
  submit: () => Promise<void>;
}
