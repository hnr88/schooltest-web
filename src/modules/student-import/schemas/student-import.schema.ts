import { z } from 'zod';

import {
  ACARA_PHASES,
  FIRST_LANGUAGES,
  STUDENT_IMPORT_COLUMNS,
  STUDENT_IMPORT_EMAIL_PATTERN,
} from '@/modules/student-import/constants/student-import.constants';

// The judge for one mapped CSV row. Every rule here mirrors a server rule the
// C-CHD-02 write endpoint enforces (given_name required, email pattern, both
// picklists), so a row that passes is a row the endpoint accepts. The parser
// feeds it the raw cell text for the two picklist fields when the value does
// not map, which turns a silent default into a reported error row.
export const studentImportRowSchema = z.object({
  line: z.number().int().positive(),
  given_name: z.string().min(1),
  family_name: z.string().nullable(),
  email: z.string().regex(STUDENT_IMPORT_EMAIL_PATTERN).nullable(),
  first_language: z.enum(FIRST_LANGUAGES).nullable(),
  acara_phase: z.enum(ACARA_PHASES).nullable(),
});

export const studentImportRowErrorSchema = z.object({
  line: z.number().int().positive(),
  column: z.enum(STUDENT_IMPORT_COLUMNS),
  reason: z.enum([
    'firstNameRequired',
    'emailInvalid',
    'firstLanguageUnknown',
    'proficiencyLevelUnknown',
  ]),
  value: z.string(),
});

export const parsedStudentCsvSchema = z.object({
  rows: z.array(studentImportRowSchema),
  errors: z.array(studentImportRowErrorSchema),
});
