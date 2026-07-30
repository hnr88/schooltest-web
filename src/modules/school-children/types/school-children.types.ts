// C-CHD-01..04 payload shapes (school admin Children screen, task 30).

export type SchoolChildStatusFilter = 'all' | 'active' | 'archived';

export interface SchoolChildClassRef {
  documentId: string;
  name: string | null;
}

// C-CHD-01 list-row projection: the server whitelists exactly these fields.
export interface SchoolChild {
  documentId: string;
  given_name: string | null;
  family_name: string | null;
  status: string | null;
  class: SchoolChildClassRef | null;
}

// C-CHD-02/03 write response: the list shape plus the v2 detail fields.
export interface SchoolChildDetail extends SchoolChild {
  date_of_birth: string | null;
  year_level: number | null;
  email: string | null;
  first_language: string | null;
  acara_phase: string | null;
  school: { documentId: string } | null;
}

export interface SchoolChildrenPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface SchoolChildrenPage {
  rows: SchoolChild[];
  pagination: SchoolChildrenPagination;
}

// The roster filter state, mapped 1:1 onto the C-CHD-01 query params.
// pageSize defaults to the roster page size; picker consumers (class detail
// assignment) pass the contract maximum of 100 to list every active child.
export interface SchoolChildrenQuery {
  status: SchoolChildStatusFilter;
  classId: string;
  q: string;
  page: number;
  pageSize?: number;
}

// C-CHD-02 v2/03 request body: only the contract fields, never guardian/media.
export interface ChildWriteBody {
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
