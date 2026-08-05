import { z } from 'zod';

import {
  ACARA_PHASE_OPTIONS,
  FIRST_LANGUAGE_OPTIONS,
} from '@/modules/school-students/constants/student-picklists.constants';
import { DOB_MIN_YEAR, TRI_STATE_VALUES, YEAR_LEVEL_OPTIONS } from '@/modules/school-students/constants/schemas.constants';

// Server response schemas for the C-CHD-01..04 school students endpoints plus
// the add/edit form schema, which mirrors the C-CHD-02 v2 body exactly: name,
// email, first-language picklist, optional ACARA phase, date of birth, year
// level, the flat EAL/D background fields and an optional class assignment.
// Guardian, media and parent fields do not exist here by design — the server
// rejects them with a 400.

export const schoolStudentSchema = z.object({
  documentId: z.string(),
  given_name: z.string().nullable(),
  family_name: z.string().nullable(),
  status: z.string().nullable(),
  email_fix_requested: z.boolean(),
  // Absent and null are the same thing to the roster: only the C-CHD-01 list
  // projection carries the EAL/D pair and the computed diagnostic status (the
  // C-CHD-02/03 detail response omits them), and a missing key must not fail
  // the whole page parse. The three stay strings here and are narrowed to their
  // contract values at the render boundary.
  first_language: z.string().nullish().transform((value) => value ?? null),
  acara_phase: z.string().nullish().transform((value) => value ?? null),
  diagnostic_status: z.string().nullish().transform((value) => value ?? null),
  class: z
    .object({ documentId: z.string(), name: z.string().nullable() })
    .nullable(),
});

// C-CHD-06 single read: the list row shape, plus the email the roster table
// projects but does not render. Nullish for the same reason as the fields
// above — an absent key reads as "not set", never as a parse failure.
export const schoolStudentRecordSchema = schoolStudentSchema.extend({
  email: z.string().nullish().transform((value) => value ?? null),
});

export const schoolStudentDetailSchema = schoolStudentSchema.extend({
  date_of_birth: z.string().nullable(),
  year_level: z.number().nullable(),
  email: z.string().nullable(),
  school: z.object({ documentId: z.string() }).nullable(),
});

export const schoolStudentsResponseSchema = z.object({
  data: z.array(schoolStudentSchema),
  meta: z.object({
    pagination: z.object({
      page: z.number(),
      pageSize: z.number(),
      pageCount: z.number(),
      total: z.number(),
    }),
  }),
});

function isValidDateOfBirth(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }
  if (Number(value.slice(0, 4)) < DOB_MIN_YEAR) {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parsed.getTime() <= today.getTime();
}

function isValidYears(value: string): boolean {
  const parsed = Number(value);
  return !Number.isNaN(parsed) && parsed >= 0 && parsed <= 80;
}

// The add/edit form (C-CHD-02 v2 create / C-CHD-03 edit). Text controls stay
// strings on the form; numeric/boolean coercion happens at the boundary. The
// picklists keep '' as "not set / keep current" alongside the contract keys.
export function createSchoolStudentFormSchema(tv: (key: string) => string) {
  return z.object({
    given_name: z.string().trim().min(1, tv('givenNameRequired')).max(100, tv('tooLong')),
    family_name: z.string().trim().max(100, tv('tooLong')),
    email: z.literal('').or(z.string().trim().max(254, tv('tooLong')).pipe(z.email(tv('emailInvalid')))),
    date_of_birth: z
      .string()
      .refine((value) => value === '' || isValidDateOfBirth(value), tv('dobInvalid')),
    year_level: z.enum(YEAR_LEVEL_OPTIONS),
    first_language: z.enum(['', ...FIRST_LANGUAGE_OPTIONS]),
    acara_phase: z.enum(['', ...ACARA_PHASE_OPTIONS]),
    other_languages: z.string().trim().max(255, tv('tooLong')),
    l1_literate: z.enum(TRI_STATE_VALUES),
    time_learning_english_yrs: z
      .string()
      .trim()
      .refine((value) => value === '' || isValidYears(value), tv('yearsInvalid')),
    time_in_australia_months: z
      .string()
      .trim()
      .refine((value) => value === '' || /^\d+$/.test(value), tv('monthsInvalid')),
    prior_schooling_interrupted: z.enum(TRI_STATE_VALUES),
    class_documentId: z.string(),
  });
}

export type SchoolStudentFormValues = z.infer<ReturnType<typeof createSchoolStudentFormSchema>>;
