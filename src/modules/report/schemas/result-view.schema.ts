import { z } from 'zod';

// C-4 `ResultView` — mirrored field for field from the server contract
// (schooltest-api/src/contracts/results.ts). Every object is STRICT: an
// unexpected key or a missing field throws at the Axios boundary so a
// contract drift surfaces as an error state, never as a half-rendered report.
export const attributeStatusSchema = z.enum([
  'mastered',
  'emerging',
  'not_mastered',
  'not_assessed',
]);
export const skillSchema = z.enum(['reading', 'listening', 'speaking', 'writing']);
export const cefrBandSchema = z.enum(['pre_A1', 'A1', 'A2', 'B1', 'B2', 'C1']);
export const readinessSchema = z.enum(['met', 'approaching', 'not_yet', 'not_assessed']);
export const resultStatusSchema = z.enum(['scoring', 'partial_pending', 'complete']);
export const resultDestinationSchema = z.enum(['transient', 'official']);

// A zero-administered attribute is the LITERAL string 'not_assessed' — never a
// 0, never a 0.5 (CT-7). The union keeps that distinction on the wire.
export const resultAttributeEntrySchema = z.union([
  z.strictObject({
    status: attributeStatusSchema,
    prob: z.number().nullable(),
    prob_se: z.number().optional(),
    items: z.number().int().min(0),
    delta: z.number().nullable(),
  }),
  z.literal('not_assessed'),
]);

// The out-of-model supplementary strand. A band with zero administered items is
// `null` — rendering it as 0% would be a false claim (CT-7).
export const resultSupplementarySchema = z.strictObject({
  vocab_band_a2_accuracy: z.number().min(0).max(1).nullable(),
  vocab_band_b1_accuracy: z.number().min(0).max(1).nullable(),
  dprime: z.number().nullable().optional(),
});

export const resultViewBaseSchema = z.strictObject({
  document_id: z.string().min(1),
  scope: z.enum(['skill', 'combined']),
  skill: skillSchema.nullable(),
  status: resultStatusSchema,
  attributes: z.record(z.string().min(1), resultAttributeEntrySchema).nullable(),
  provisional: z.literal('field_test').nullish(),
  display_label: z.string().nullable(),
  acara_phase: z.string().nullable(),
  cefr_band: cefrBandSchema.nullable(),
  readiness: readinessSchema.nullable(),
  low_confidence: z.boolean().nullable(),
  effort_valid: z.boolean().nullable(),
  productive_scores: z.record(z.string(), z.unknown()).nullable(),
  supplementary: resultSupplementarySchema.nullable(),
  destination: resultDestinationSchema,
  published_at: z.iso.datetime().nullable(),
  previous_result_document_id: z.string().min(1).nullable(),
  session_document_id: z.string().min(1).nullable(),
});

export const resultViewSchema = resultViewBaseSchema.extend({
  combined_children: z.array(resultViewBaseSchema).optional(),
});

// C-11 answers a BARE array — no `{data, meta}` envelope on this route.
export const myStudentsResultsResponseSchema = z.array(resultViewSchema);
