// Shared CSV student-import contract (spec §2 "Add class modal" / §4 "Import
// students" — one flow, two hosts). The column list, the ACARA phase keys and
// the first-language keys mirror the server picklists the write endpoint
// validates against (schooltest-api children.constants.ts): anything outside
// them answers 400, so the parser rejects it here instead of shipping a row
// that cannot be created.

export const STUDENT_IMPORT_COLUMNS = [
  'first name',
  'last name',
  'email',
  'first language',
  'proficiency level',
] as const;

export const STUDENT_IMPORT_HEADER_ROW = STUDENT_IMPORT_COLUMNS.join(',');

export const STUDENT_IMPORT_TEMPLATE_FILENAME = 'student-import-template.csv';

export const STUDENT_IMPORT_FILE_ACCEPT = '.csv,text/csv';

export const ACARA_PHASES = ['beginning', 'emerging', 'developing', 'consolidating'] as const;

export const FIRST_LANGUAGES = [
  'mandarin_chinese',
  'korean',
  'japanese',
  'malay',
  'thai',
  'vietnamese',
  'indonesian',
  'english',
  'other',
] as const;

export const STUDENT_IMPORT_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Zod issue path -> the template column and the message key a consumer renders.
export const STUDENT_IMPORT_FIELD_ERRORS = {
  given_name: { column: 'first name', reason: 'firstNameRequired' },
  email: { column: 'email', reason: 'emailInvalid' },
  first_language: { column: 'first language', reason: 'firstLanguageUnknown' },
  acara_phase: { column: 'proficiency level', reason: 'proficiencyLevelUnknown' },
} as const;
