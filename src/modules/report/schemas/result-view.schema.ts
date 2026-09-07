import { z } from 'zod';

import {
  bandSchema,
  cefrBandSchema,
  readinessSchema,
  resultDestinationSchema,
  resultStatusSchema,
  resultViewSchema,
  skillSchema,
} from '@schooltest/scoring-contracts';

// C-4 `ResultView` — the hand-written mirror that used to live here was
// replaced by the shared contract package. Re-export its schemas so existing
// import paths keep resolving; every object stays strict at the Axios boundary.
export {
  assessedBandSchema,
  attributeNameSchema,
  bandSchema,
  cefrBandSchema,
  DIAGNOSTIC_JSON_FORMAT,
  diagnosticExportSchema,
  displaySkillSchema,
  LEGACY_MODEL_VERSION,
  MODEL_VERSION,
  modelVersionSchema,
  provisionalSchema,
  readinessSchema,
  resultDestinationSchema,
  resultScopeSchema,
  resultStatusSchema,
  resultViewSchema,
  skillSchema,
} from '@schooltest/scoring-contracts';
export type {
  AssessedBand,
  AttributeName,
  Band,
  CefrBand,
  DiagnosticExport,
  DisplaySkill,
  ErrorPattern,
  ModelVersion,
  Readiness,
  ResultDestination,
  ResultScope,
  ResultStatus,
  ResultView,
  ResultViewAttribute,
  ResultViewAttributeScored,
  ResultViewGate,
  ResultViewOverall,
  ResultViewVocab,
  Skill,
} from '@schooltest/scoring-contracts';

// Legacy / non-v2 fallback for the C-4 read. The server answers v2 rows with
// the contract ResultView and EVERYTHING else (legacy-r7, listening, unscored)
// with its own v1 view (schooltest-api/src/contracts/results.ts
// resultViewBaseSchema). This schema mirrors that base shape key-for-key so a
// strict parse cannot silently drop such a row into the error fallback. Stored
// statuses are rendered VERBATIM as localized text — never recomputed, never
// turned into bars or scores.
const legacyStoredStatusSchema = z.union([
  bandSchema,
  z.enum(['mastered', 'emerging', 'not_mastered', 'not_assessed']),
]);
export type LegacyStoredStatus = z.infer<typeof legacyStoredStatusSchema>;

// The assessed wire member carries posterior AUDIT fields
// (schooltest-api/src/contracts/results.ts resultAttributeAssessedEntrySchema).
// They are NOT declared here on purpose: z.object strips them at the boundary,
// so no component can ever read one back (data contract §8, task 36).
// Stripping (not strictObject) is safe — the union still discriminates because
// this member alone requires `items`/`delta`, which the floor entry forbids.
const legacyAttributeEntrySchema = z.union([
  z.object({
    status: legacyStoredStatusSchema,
    items: z.number().int().min(0),
    delta: z.number().nullable(),
  }),
  z.strictObject({
    status: z.literal('not_assessed'),
    insufficient_evidence: z.literal(true),
    items_seen: z.number().int().min(0),
  }),
  z.literal('not_assessed'),
]);

export const legacyResultViewSchema = z.strictObject({
  document_id: z.string(),
  scope: z.enum(['skill', 'combined']),
  skill: skillSchema.nullable(),
  status: resultStatusSchema,
  attributes: z.record(z.string(), legacyAttributeEntrySchema).nullable(),
  provisional: z.literal('field_test').nullish(),
  display_label: z.string().nullable(),
  acara_phase: z.string().nullable(),
  cefr_band: cefrBandSchema.nullable(),
  readiness: readinessSchema.nullable(),
  low_confidence: z.boolean().nullable(),
  effort_valid: z.boolean().nullable(),
  productive_scores: z.record(z.string(), z.unknown()).nullable(),
  supplementary: z.unknown().nullable(),
  destination: resultDestinationSchema,
  published_at: z.string().nullable(),
  previous_result_document_id: z.string().nullable(),
  session_document_id: z.string().nullable(),
  model_version: z.string().min(1).nullish(),
  legacy_caveat: z.literal('pilot_diagnostic_earlier_model').nullish(),
  narrative: z.unknown().nullish(),
  combined_children: z.array(z.unknown()).optional(),
});
export type LegacyResultView = z.infer<typeof legacyResultViewSchema>;

/**
 * C-11 GET /api/my/students/results (no `class`) answers a BARE array — no
 * `{data, meta}` envelope — and its ROWS carry the same per-row dispatch the
 * C-4 read does: a current reading row is the contract `ResultView`, and the
 * two populations the v2 read model refuses (`scoring_failed`, listening) are
 * the server's v1 view.
 *
 * This was `z.array(resultViewSchema)`, and the server was answering 400 on the
 * whole list rather than v1 rows — so the union is what the fixed endpoint
 * actually serves, not a loosening: both members stay strict, and a row that is
 * neither shape still fails the parse.
 */
export const myStudentsResultsResponseSchema = z.array(
  z.union([resultViewSchema, legacyResultViewSchema])
);
/** One list row: whichever view the server dispatched for it. */
export type MyStudentsResultsRow = z.infer<typeof myStudentsResultsResponseSchema>[number];
