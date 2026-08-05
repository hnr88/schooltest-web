import { z } from 'zod';

import { YEAR_BANDS } from '@/modules/classes/constants/year-bands.constants';

// Server response schemas for the school class endpoints (C-CLS-01..03) and
// the students picker source (C-CHD-01). Kept defensive at the boundary; the
// UI consumes the parsed types from types/classes.types.ts.

export const classTeacherSchema = z.object({
  documentId: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
});

export const schoolClassSchema = z.object({
  documentId: z.string(),
  name: z.string(),
  year_band: z.string().nullable(),
  teachers: z.array(classTeacherSchema),
  student_count: z.number(),
});

export const classStudentOptionSchema = z.object({
  documentId: z.string(),
  given_name: z.string(),
  family_name: z.string(),
  status: z.string(),
  class: z.object({ documentId: z.string(), name: z.string() }).nullable(),
});

// Create/edit form (C-CLS-02/03). Teacher and student lists are documentId
// arrays; the server applies REPLACE semantics to both relations.
export function createClassFormSchema(tv: (key: string) => string) {
  return z.object({
    name: z.string().trim().min(1, tv('required')).max(120, tv('tooLong')),
    year_band: z.enum(YEAR_BANDS),
    teacher_documentIds: z.array(z.string()),
    student_documentIds: z.array(z.string()),
  });
}

export type ClassFormValues = z.infer<ReturnType<typeof createClassFormSchema>>;

// Spec §2 "Add class modal": name required, teacher optional (assignable
// later). The CSV rows are NOT form values — StudentImportFields parses them
// and reports them through its own onChange, so the host owns that state.
export function createAddClassFormSchema(tv: (key: string) => string) {
  return z.object({
    name: z.string().trim().min(1, tv('required')).max(120, tv('tooLong')),
    teacher_documentId: z.string(),
  });
}

export type AddClassFormValues = z.infer<ReturnType<typeof createAddClassFormSchema>>;
