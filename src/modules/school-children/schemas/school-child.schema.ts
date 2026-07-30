import { z } from 'zod';

import {
  ACARA_PHASE_OPTIONS,
  FIRST_LANGUAGE_OPTIONS,
} from '@/modules/school-children/constants/child-picklists.constants';

// Server response schemas for the C-CHD-01..04 school children endpoints plus
// the add/edit form schema, which mirrors the C-CHD-02 v2 body exactly: name,
// email, first-language picklist, optional ACARA phase, date of birth, year
// level, the flat EAL/D background fields and an optional class assignment.
// Guardian, media and parent fields do not exist here by design — the server
// rejects them with a 400.

export const schoolChildSchema = z.object({
  documentId: z.string(),
  given_name: z.string().nullable(),
  family_name: z.string().nullable(),
  status: z.string().nullable(),
  class: z
    .object({ documentId: z.string(), name: z.string().nullable() })
    .nullable(),
});

export const schoolChildDetailSchema = schoolChildSchema.extend({
  date_of_birth: z.string().nullable(),
  year_level: z.number().nullable(),
  email: z.string().nullable(),
  first_language: z.string().nullable(),
  acara_phase: z.string().nullable(),
  school: z.object({ documentId: z.string() }).nullable(),
});

export const schoolChildrenResponseSchema = z.object({
  data: z.array(schoolChildSchema),
  meta: z.object({
    pagination: z.object({
      page: z.number(),
      pageSize: z.number(),
      pageCount: z.number(),
      total: z.number(),
    }),
  }),
});

const DOB_MIN_YEAR = 1900;

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

// Tri-state selects keep '' as the "not set / keep current" option; the body
// builder in lib/child-request.ts maps it to omit (create) or null (edit).
export const TRI_STATE_VALUES = ['', 'yes', 'no'] as const;
export const YEAR_LEVEL_OPTIONS = ['', '7', '8', '9', '10', '11', '12'] as const;

// The add/edit form (C-CHD-02 v2 create / C-CHD-03 edit). Text controls stay
// strings on the form; numeric/boolean coercion happens at the boundary. The
// picklists keep '' as "not set / keep current" alongside the contract keys.
export function createSchoolChildFormSchema(tv: (key: string) => string) {
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

export type SchoolChildFormValues = z.infer<ReturnType<typeof createSchoolChildFormSchema>>;
