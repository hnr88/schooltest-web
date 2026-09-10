/**
 * `ResultView` v1 — the LEGACY read model the C-4 route still serves to rows
 * the v2 dispatch refuses: untagged legacy rows, combined placement parents and
 * listening (`result-view-v2.compose.ts` fails loud on exactly those). Coexists
 * with the v2 `resultViewSchema` in this package; nothing here widens v2 and
 * nothing in v2 accepts this shape.
 *
 * COPIED 1:1 FROM THE SERVER CONTRACT (`schooltest-api/src/contracts/results.ts`
 * `resultViewBaseSchema`/`resultViewSchema`) — the server file stays the
 * authority; a drift guard in the API repo fails when the two key sets diverge.
 * The app's hand-written mirror of this shape silently drifted (it never learned
 * `model_version`/`legacy_caveat`) until it parsed NOTHING the server could
 * send; the fix is one source for both dispatch arms, not a third copy.
 *
 * Vocabulary: the five shared enums (skill, result status, destination,
 * readiness, CEFR) are THIS package's own — the server re-exports the same
 * definitions. Only listening's three-band stored status is defined here, the
 * one vocabulary the v2 read model has no use for.
 */
import { z } from 'zod';

import {
  bandSchema,
  cefrBandSchema,
  readinessSchema,
  resultDestinationSchema,
  resultStatusSchema,
  skillSchema,
} from './enums';
import { resultViewReleaseStateSchema } from './result-view';

const str = z.string().min(1);

/**
 * LISTENING's own three-band vocabulary, cut from Config's
 * `status_bands.mastered_cut`/`emerging_cut` (Doc 2a s.9) — a genuinely
 * different scale from reading's four §5.2 bands, not a legacy alias. Reading
 * never produces these values; one stored `Result.attributes` column holds
 * both, so the stored status is the union of the two.
 */
export const legacyListeningStatusSchema = z.enum([
  'mastered',
  'emerging',
  'not_mastered',
  'not_assessed',
]);
export type LegacyListeningStatus = z.infer<typeof legacyListeningStatusSchema>;

export const legacyStoredAttributeStatusSchema = z.union([
  bandSchema,
  legacyListeningStatusSchema,
]);
export type LegacyStoredAttributeStatus = z.infer<typeof legacyStoredAttributeStatusSchema>;

/** The assessed member: an attribute with a posterior and an evidence count. */
export const legacyAttributeAssessedEntrySchema = z.strictObject({
  status: legacyStoredAttributeStatusSchema,
  prob: z.number().nullable(),
  prob_se: z.number().optional(),
  items: z.number().int().min(0),
  delta: z.number().nullable(),
});
export type LegacyAttributeAssessed = z.infer<typeof legacyAttributeAssessedEntrySchema>;

/**
 * The MINIMUM-EVIDENCE FLOOR entry (task 17; spec v2 §5.3): scored, but on too
 * few items to report. The numeric fields are ABSENT, not null — a posterior
 * derived from one or two items is not a weak measurement to show with a
 * caveat, it is not a measurement.
 */
export const legacyAttributeFloorEntrySchema = z.strictObject({
  status: z.literal('not_assessed'),
  insufficient_evidence: z.literal(true),
  items_seen: z.number().int().min(0),
});
export type LegacyAttributeFloorEntry = z.infer<typeof legacyAttributeFloorEntrySchema>;

/**
 * Per-attribute evidence entry (Doc 1 s.10): assessed | floor | the bare
 * `"not_assessed"` literal for zero-administered attributes (CT-7). The three
 * members stay unambiguous despite the status vocabularies also admitting
 * `not_assessed`, because both objects are strict and the assessed one requires
 * `prob`/`items`/`delta` that the floor entry forbids.
 */
export const legacyAttributeEntrySchema = z.union([
  legacyAttributeAssessedEntrySchema,
  legacyAttributeFloorEntrySchema,
  z.literal('not_assessed'),
]);
export type LegacyAttributeEntry = z.infer<typeof legacyAttributeEntrySchema>;

/**
 * "Does this entry carry a posterior?" — the ONLY correct way to narrow the
 * entry union. Both `entry !== 'not_assessed'` and `Exclude<…, 'not_assessed'>`
 * are casts: the floor entry is an OBJECT whose `status` is `'not_assessed'`,
 * so both forms admit it while it carries no numeric fields to read.
 * `insufficient_evidence` is the discriminator.
 */
export function isLegacyAssessedAttributeEntry(
  entry: LegacyAttributeEntry | null | undefined,
): entry is LegacyAttributeAssessed {
  return typeof entry === 'object' && entry !== null && !('insufficient_evidence' in entry);
}

/**
 * The out-of-model SUPPLEMENTARY reporting strand (M-CT-RESULT-V21, spec E3.5).
 * NULL DISCIPLINE (CT-7): a band with zero administered items is `null` —
 * never 0, never 0.5. `strictObject` is the leak guard.
 */
export const legacyResultSupplementarySchema = z.strictObject({
  vocab_band_a2_accuracy: z.number().min(0).max(1).nullable(),
  vocab_band_b1_accuracy: z.number().min(0).max(1).nullable(),
  // `.default(null)` keeps historical A2/B1 rows readable while every newly
  // assembled result explicitly records the client bank's B2 evidence state.
  vocab_band_b2_accuracy: z.number().min(0).max(1).nullable().default(null),
  dprime: z.number().nullable().optional(),
});
export type LegacyResultSupplementary = z.infer<typeof legacyResultSupplementarySchema>;

/** F-REPORT-NARRATIVE: the opt-in `?include=narrative` projection (Doc 1 s.11.4). */
export const legacyResultNarrativeSchema = z.strictObject({
  attribute_labels: z.record(str, z.strictObject({ name: str, descriptor: str })),
  change_since_last: z.array(str),
  weeks_since_previous: z.number().int().nullable(),
  plain_language: z.array(str),
});
export type LegacyResultNarrative = z.infer<typeof legacyResultNarrativeSchema>;

/**
 * One result view row. NO export fields, NO student PII — keyed by document ids
 * only. `attributes` is null while status=scoring and on combined parents.
 * `model_version` is null on rows the backfill has not stamped (untagged =
 * current-model, never legacy); `legacy_caveat` carries the Doc-1 caveat on
 * `legacy-r7` rows only; both are `.nullish()` so producers that never set them
 * still validate. `narrative` is emitted ONLY for `?include=narrative`.
 */
export const legacyResultViewBaseSchema = z.strictObject({
  document_id: str,
  scope: z.enum(['skill', 'combined']),
  skill: skillSchema.nullable(), // null when scope=combined
  status: resultStatusSchema,
  attributes: z.record(str, legacyAttributeEntrySchema).nullable(),
  // Doc 4 s.2 field-test banner, lifted out of the stored attributes map.
  provisional: z.literal('field_test').nullish(),
  display_label: z.string().nullable(),
  acara_phase: z.string().nullable(),
  cefr_band: cefrBandSchema.nullable(),
  readiness: readinessSchema.nullable(),
  low_confidence: z.boolean().nullable(),
  effort_valid: z.boolean().nullable(),
  productive_scores: z.record(z.string(), z.unknown()).nullable(),
  supplementary: legacyResultSupplementarySchema.nullable(),
  destination: resultDestinationSchema,
  published_at: z.iso.datetime().nullable(),
  recalled_at: z.iso.datetime().nullable(),
  release_state: resultViewReleaseStateSchema,
  previous_result_document_id: str.nullable(),
  session_document_id: str.nullable(),
  // Task 07 legacy tagging (spec v2 §0.4, memo §7).
  model_version: z.string().min(1).nullish(),
  legacy_caveat: z.literal('pilot_diagnostic_earlier_model').nullish(),
  // F-REPORT-NARRATIVE — only on `?include=narrative`.
  narrative: legacyResultNarrativeSchema.nullable().optional(),
});
export type LegacyResultViewBase = z.infer<typeof legacyResultViewBaseSchema>;

/** Placement parent (scope=combined) additionally carries its child views. */
export const legacyResultViewSchema = legacyResultViewBaseSchema.extend({
  combined_children: z.array(legacyResultViewBaseSchema).optional(),
});
export type LegacyResultView = z.infer<typeof legacyResultViewSchema>;
