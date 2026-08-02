import { z } from 'zod';

// Boundary schemas for the sitting reads the test-day screen depends on
// (task 64). Defensive parsing at the query boundary; the UI consumes the
// types from types/test-day.types.ts.

export const sittingStatusSchema = z.enum(['open', 'closed']);

export const sittingStudentStateSchema = z.enum([
  'not_joined',
  'joined',
  'in_progress',
  'submitted',
  'stalled',
]);

// Teacher-scoped GET /api/sittings row (create returns the same shape, so one
// schema covers both).
export const classSittingSchema = z.object({
  documentId: z.string(),
  code: z.string().nullable(),
  status: sittingStatusSchema,
  mode: z.string(),
  skill: z.string(),
  createdAt: z.string(),
  form: z.object({ documentId: z.string(), form_code: z.string() }).nullable(),
  class: z.object({ documentId: z.string(), name: z.string() }).nullable(),
});

// C-SIT-02 monitor payload.
export const sittingMonitorSchema = z.object({
  sitting: z.object({
    documentId: z.string(),
    code: z.string().nullable(),
    status: sittingStatusSchema,
  }),
  students: z.array(
    z.object({
      documentId: z.string(),
      given_name: z.string(),
      family_name: z.string(),
      email: z.string().nullable(),
      state: sittingStudentStateSchema,
      session_documentId: z.string().nullable(),
      absent: z.boolean(),
      needs_to_sit: z.boolean(),
    }),
  ),
});
