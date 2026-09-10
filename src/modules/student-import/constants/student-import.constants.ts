import {
  PORTAL_IMPORT_DOB_FORMAT,
  PORTAL_IMPORT_TEMPLATE_COLUMNS,
  PORTAL_IMPORT_TEMPLATE_OPTIONAL_COLUMNS,
  PORTAL_IMPORT_YEAR_LEVEL_MAX,
  PORTAL_IMPORT_YEAR_LEVEL_MIN,
} from '@schooltest/ops-contracts';

// Shared CSV student-import contract — ONE vocabulary with the ops portal and
// the server validator (schooltest-api src/api/ops/lib/import-validate.ts
// validatePortalRows). The columns, the DOB format and the year-level bounds
// are IMPORTED from @schooltest/ops-contracts, never retyped, so the school
// admin's template, this parser and the preview/commit engine cannot drift.
// A row that passes here is a row POST /schools/me/import-students/preview
// accepts.

/** The required portal columns, in contract order. */
export const STUDENT_IMPORT_COLUMNS = PORTAL_IMPORT_TEMPLATE_COLUMNS;

/** Accepted but never required: disambiguates two students with one name+DOB. */
export const STUDENT_IMPORT_OPTIONAL_COLUMNS = PORTAL_IMPORT_TEMPLATE_OPTIONAL_COLUMNS;

/** Every column a header row or a paste may name. */
export const STUDENT_IMPORT_ALL_COLUMNS = [
  ...STUDENT_IMPORT_COLUMNS,
  ...STUDENT_IMPORT_OPTIONAL_COLUMNS,
] as const;

/** The template download stays the REQUIRED columns only, like the server's. */
export const STUDENT_IMPORT_HEADER_ROW = STUDENT_IMPORT_COLUMNS.join(',');

export const STUDENT_IMPORT_TEMPLATE_FILENAME = 'student-import-template.csv';

export const STUDENT_IMPORT_FILE_ACCEPT = '.csv,text/csv';

/** ISO calendar date — the ONLY accepted date-of-birth form, server and client. */
export const STUDENT_IMPORT_DOB_FORMAT = PORTAL_IMPORT_DOB_FORMAT;

export const STUDENT_IMPORT_DOB_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const STUDENT_IMPORT_YEAR_LEVEL_MIN = PORTAL_IMPORT_YEAR_LEVEL_MIN;

export const STUDENT_IMPORT_YEAR_LEVEL_MAX = PORTAL_IMPORT_YEAR_LEVEL_MAX;

export const STUDENT_IMPORT_YEAR_PATTERN = /^\d+$/;

// Zod issue path -> the template column and the message key a consumer renders.
export const STUDENT_IMPORT_FIELD_ERRORS = {
  given_name: { column: 'given name', reason: 'givenNameRequired' },
  family_name: { column: 'family name', reason: 'familyNameRequired' },
  date_of_birth: { column: 'date of birth', reason: 'dobInvalid' },
  year_level: { column: 'year level', reason: 'yearLevelInvalid' },
  first_language: { column: 'home language', reason: 'homeLanguageRequired' },
} as const;
