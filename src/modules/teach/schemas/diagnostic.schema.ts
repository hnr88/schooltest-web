import { z } from 'zod';

// Boundary schema for the C-RPT-01 class diagnostic payload (task 75).
// Defensive parsing at the query boundary; the UI consumes ClassDiagnostic
// from types/diagnostic.types.ts.
export const diagnosticAttributeSchema = z.object({
  code: z.string(),
  status: z.enum(['mastered', 'emerging', 'not_mastered', 'not_assessed']),
  prob: z.number().nullable(),
});

export const diagnosticMasteryRowSchema = z.object({
  student_ref: z.string(),
  student_document_id: z.string(),
  attributes: z.array(diagnosticAttributeSchema),
});

export const diagnosticHeatmapRowSchema = z.object({
  item_code: z.string(),
  section: z.number(),
  correct: z.number(),
  responses: z.number(),
  fraction: z.number(),
});

export const classDiagnosticSchema = z.object({
  class: z.object({
    documentId: z.string(),
    name: z.string().nullable(),
    year_band: z.string().nullable(),
  }),
  form_code: z.string().nullable(),
  sat_count: z.number(),
  roster_count: z.number(),
  mastery: z.array(diagnosticMasteryRowSchema),
  heatmap: z.array(diagnosticHeatmapRowSchema),
});
