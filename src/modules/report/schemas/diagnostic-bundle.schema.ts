import { z } from 'zod';

import { readinessSchema } from '@/modules/report/schemas/result-view.schema';

// C-5 `DiagnosticBundle` — mirrored field for field from the server contract
// (schooltest-api/src/contracts/diagnostic-export.ts). Every object is STRICT:
// contract drift throws at the Axios boundary and surfaces as an error state,
// never as a half-rendered set of notes.
const str = z.string().min(1);

export const diagnosticAttributeEntrySchema = z.union([
  z.strictObject({
    status: z.enum(['mastered', 'emerging', 'not_mastered']),
    prob: z.number(),
    evidence_items: z.number().int().min(1),
    descriptor: str,
    detail: str.optional(),
  }),
  z.strictObject({ status: z.literal('not_assessed') }),
]);

export const diagnosticSkillEntrySchema = z.strictObject({
  label: z.string(),
  phase: z.string(),
  attributes: z.record(str, diagnosticAttributeEntrySchema),
  // The only field this module renders: distractor-type aggregates composed
  // server-side from the sitting's own responses (Doc 1 s.11.4).
  error_patterns: z.array(str),
  change_since_last: z.array(str),
});

export const diagnosticBundleSchema = z.strictObject({
  student: z.strictObject({
    year_group: z.number().int().nullable(),
    first_language: z.string().nullable(),
    l1_literate: z.boolean().nullable(),
  }),
  sitting: z.strictObject({
    date: z.string().nullable(),
    number: z.number().int().min(1),
    weeks_since_previous: z.number().int().nullable(),
  }),
  skills: z.record(str, diagnosticSkillEntrySchema),
  readiness: z.record(str, readinessSchema),
  caveats: z.array(str).min(1),
});

// The only accepted value of the C-5 `format` query param (400 on anything else).
export const DIAGNOSTIC_JSON_FORMAT = 'diagnostic_json';
