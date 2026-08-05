// C-CHD-01..04 payload shapes (school admin Students screen, task 30).

import type { AcaraPhase } from '@/modules/school-students/types/constants.types';

export type SchoolStudentStatusFilter = 'all' | 'active' | 'archived';

// The Level column/filter: the four ACARA phases plus the "no narrowing" value.
export type SchoolStudentLevelFilter = 'all' | AcaraPhase;

export interface SchoolStudentClassRef {
  documentId: string;
  name: string | null;
}

// C-CHD-01 list-row projection. first_language and acara_phase are nullable
// because the server projection may omit them entirely — the row keeps the key
// so the Level and First language columns read one shape either way.
export interface SchoolStudent {
  documentId: string;
  given_name: string | null;
  family_name: string | null;
  status: string | null;
  email_fix_requested: boolean;
  first_language: string | null;
  acara_phase: string | null;
  class: SchoolStudentClassRef | null;
}

// C-CHD-02/03 write response: the list shape plus the v2 detail fields.
export interface SchoolStudentDetail extends SchoolStudent {
  date_of_birth: string | null;
  year_level: number | null;
  email: string | null;
  school: { documentId: string } | null;
}

export interface SchoolStudentsPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface SchoolStudentsPage {
  rows: SchoolStudent[];
  pagination: SchoolStudentsPagination;
}

// The roster filter state, mapped 1:1 onto the C-CHD-01 query params.
// pageSize defaults to the roster page size; picker consumers (class detail
// assignment) pass the contract maximum of 100 to list every active student.
export interface SchoolStudentsQuery {
  status: SchoolStudentStatusFilter;
  classId: string;
  q: string;
  page: number;
  pageSize?: number;
}

// C-CHD-02 v2/03 request body: only the contract fields, never guardian/media.
export interface StudentWriteBody {
  given_name?: string;
  family_name?: string | null;
  email?: string | null;
  date_of_birth?: string | null;
  year_level?: number | null;
  first_language?: string | null;
  acara_phase?: string | null;
  other_languages?: string[] | null;
  l1_literate?: boolean | null;
  time_learning_english_yrs?: number | null;
  time_in_australia_months?: number | null;
  prior_schooling_interrupted?: boolean | null;
  class_documentId?: string | null;
}
