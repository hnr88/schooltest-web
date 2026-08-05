import type { SchoolStudentFormValues } from '@/modules/school-students/schemas/school-student.schema';
import type { SchoolStudentStatusFilter } from '@/modules/school-students/types/school-students.types';
import type { ParsedStudentCsv } from '@/modules/student-import';

export const BLANK_VALUES: SchoolStudentFormValues = {
  given_name: '',
  family_name: '',
  email: '',
  date_of_birth: '',
  year_level: '',
  first_language: '',
  acara_phase: '',
  other_languages: '',
  l1_literate: '',
  time_learning_english_yrs: '',
  time_in_australia_months: '',
  prior_schooling_interrupted: '',
  class_documentId: '',
};

export const SEARCH_DEBOUNCE_MS = 300;

// Spec §4 gives the roster no status control, so the C-CHD-01 status param stays
// omitted and archived students remain reachable (their row keeps its pill).
export const ROSTER_STATUS: SchoolStudentStatusFilter = 'all';

export const EMPTY_PARSED_CSV: ParsedStudentCsv = { rows: [], errors: [] };
