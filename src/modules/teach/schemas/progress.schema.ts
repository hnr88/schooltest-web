import { z } from 'zod';

// Boundary schema for the C-RPT-02 class progress payload (task 76).
// Defensive parsing at the query boundary; the UI consumes ClassProgress
// from types/progress.types.ts.
export const progressTransitionSchema = z.object({
  attribute: z.string(),
  from_status: z.enum(['mastered', 'emerging', 'not_mastered']),
  to_status: z.enum(['mastered', 'emerging', 'not_mastered']),
  statement: z.string(),
});

export const progressStudentSchema = z.object({
  student_ref: z.string(),
  transitions: z.array(progressTransitionSchema),
  weeks_between: z.number(),
});

export const progressNotAssessedSchema = z.object({
  student_ref: z.string(),
  attribute: z.string(),
});

export const classProgressSchema = z.object({
  populated: z.boolean(),
  reason: z.string().nullable(),
  benchmark_form: z.string().nullable(),
  progress_form: z.string().nullable(),
  students: z.array(progressStudentSchema),
  not_assessed: z.array(progressNotAssessedSchema),
});
