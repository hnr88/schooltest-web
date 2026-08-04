import type { SchoolChildFormValues } from '@/modules/school-children/schemas/school-child.schema';

export const BLANK_VALUES: SchoolChildFormValues = {
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
