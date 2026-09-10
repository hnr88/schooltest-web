import { z } from 'zod';

import {
  STUDENT_IMPORT_ALL_COLUMNS,
  STUDENT_IMPORT_DOB_PATTERN,
  STUDENT_IMPORT_YEAR_LEVEL_MAX,
  STUDENT_IMPORT_YEAR_LEVEL_MIN,
} from '@/modules/student-import/constants/student-import.constants';

// The judge for one mapped CSV row. Every rule here mirrors the SERVER rule the
// preview/commit engine enforces (schooltest-api validatePortalRows): given
// name required, family name required, date of birth a real YYYY-MM-DD date,
// year level a whole number 7-12, home language required, student key
// optional. A row that passes is a row the endpoint accepts — the parser is
// deliberately exactly as strict as the server, never stricter.

/** `Number.isNaN(Date.parse(v))` — the same real-date check the server runs. */
const isRealDate = (value: string): boolean => !Number.isNaN(Date.parse(value));

export const studentImportRowSchema = z.object({
  line: z.number().int().positive(),
  student_key: z.string().min(1).nullable(),
  given_name: z.string().min(1),
  family_name: z.string().min(1),
  date_of_birth: z.string().regex(STUDENT_IMPORT_DOB_PATTERN).refine(isRealDate),
  year_level: z
    .number()
    .int()
    .min(STUDENT_IMPORT_YEAR_LEVEL_MIN)
    .max(STUDENT_IMPORT_YEAR_LEVEL_MAX),
  first_language: z.string().min(1),
});

export const studentImportRowErrorSchema = z.object({
  line: z.number().int().positive(),
  column: z.enum(STUDENT_IMPORT_ALL_COLUMNS),
  reason: z.enum([
    'givenNameRequired',
    'familyNameRequired',
    'dobInvalid',
    'yearLevelInvalid',
    'homeLanguageRequired',
  ]),
  value: z.string(),
});

export const parsedStudentCsvSchema = z.object({
  rows: z.array(studentImportRowSchema),
  errors: z.array(studentImportRowErrorSchema),
});
