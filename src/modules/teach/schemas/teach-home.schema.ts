import { z } from 'zod';

// Boundary schema for the C-TEACH-01 teach home payload (task 83). Defensive
// parsing at the query boundary like the roster/diagnostic queries; the UI
// consumes TeachHome from types/teach-home.types.ts.
export const teachHomeDiagnosticSchema = z.object({
  sat_count: z.number(),
  roster_count: z.number(),
  latest_form: z.string().nullable(),
  mastered_pct: z.number(),
});

export const teachHomeMonitorSchema = z.object({
  not_joined: z.number(),
  joined: z.number(),
  in_progress: z.number(),
  submitted: z.number(),
  stalled: z.number(),
});

export const teachHomeClassSchema = z.object({
  documentId: z.string(),
  name: z.string(),
  diagnostic: teachHomeDiagnosticSchema.nullable(),
  monitor: teachHomeMonitorSchema.nullable(),
});

export const teachHomeSchema = z.object({
  classes: z.array(teachHomeClassSchema),
});
