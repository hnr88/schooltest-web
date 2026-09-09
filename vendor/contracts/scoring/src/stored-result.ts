/**
 * The stored Result — what the worker writes after validation (spec v2 §5.1).
 *
 * These are the SCORING-WRITTEN fields of the Result row. The row's own envelope
 * (status, destination, published_at, the top-level `provisional` field-test
 * banner) is untouched by scoring and lives on the content type; the read model
 * that joins the two is `resultViewSchema`.
 *
 * House rule 8: this parses or nothing is persisted. There is no partial Result.
 */
import { z } from 'zod';

import {
  domainScoreSchema,
  itemsSeenSchema,
  nonEmptyString,
  notAssessedSchema,
  probSchema,
  standardErrorSchema,
  thetaSchema,
} from './core';
import {
  assessedBandSchema,
  attributeNameSchema,
  bandSchema,
  errorPatternTypeSchema,
  modelVersionSchema,
  vocabStrandNameSchema,
} from './enums';

/**
 * spec v2 §5.7 — distractor types aggregated over incorrect, reached,
 * non-rapid-guess responses. Suppressed entirely below MIN_ERRORS_FOR_PATTERNS,
 * so a listed pattern always has at least one response behind it.
 */
export const errorPatternSchema = z.strictObject({
  type: errorPatternTypeSchema,
  count: z.number().int().min(1),
  pct: z.number().min(0).max(100),
});
export type ErrorPattern = z.infer<typeof errorPatternSchema>;

/**
 * One assessed attribute (spec v2 §5.1): R's posterior and expected score plus
 * the band Strapi derived from `prob` (§5.2). `prob`/`prob_se` are audit fields.
 */
export const storedAttributeScoredSchema = z.strictObject({
  prob: probSchema,
  prob_se: standardErrorSchema,
  domain_score: domainScoreSchema,
  se: standardErrorSchema,
  items_seen: itemsSeenSchema,
  status: assessedBandSchema,
});
export type StoredAttributeScored = z.infer<typeof storedAttributeScoredSchema>;

/**
 * Either the full claim or the not-assessed object. §5.3 drops the numeric
 * fields below the minimum-evidence floor — they stay in the audit record — so
 * there is no shape that carries a score without enough evidence to justify it.
 */
export const storedAttributeSchema = z.union([storedAttributeScoredSchema, notAssessedSchema]);
export type StoredAttribute = z.infer<typeof storedAttributeSchema>;

/** spec v2 §5.1 — the pooled Rasch headline. `provisional_transform` is the transform flag. */
export const storedOverallSchema = z.strictObject({
  theta: thetaSchema,
  theta_se: standardErrorSchema,
  domain_score: domainScoreSchema,
  provisional_transform: z.boolean(),
});
export type StoredOverall = z.infer<typeof storedOverallSchema>;

/** spec v2 §5.1 / §2.5 — Section 3 as stored, including the not-reached form. */
export const storedGateSchema = z.union([
  z.strictObject({ passed: z.null() }),
  z.strictObject({
    passed: z.boolean(),
    theta: thetaSchema,
    se: standardErrorSchema,
    domain_score: domainScoreSchema,
    provisional_cut: z.boolean(),
  }),
]);
export type StoredGate = z.infer<typeof storedGateSchema>;

/**
 * One vocabulary strand as stored (spec v2 §5.4 — "store both strand statuses
 * too"). An unreached strand is the not-assessed object, never a zero.
 */
export const storedVocabStrandSchema = z.union([
  z.strictObject({
    domain_score: domainScoreSchema,
    se: standardErrorSchema,
    items_seen: itemsSeenSchema,
    status: assessedBandSchema,
  }),
  notAssessedSchema,
]);
export type StoredVocabStrand = z.infer<typeof storedVocabStrandSchema>;

/**
 * spec v2 §5.4 — the items-seen-weighted blend of Vocab_A2 and Vocab_B1.
 *
 * `status` is a `bandSchema` and not the four-band `assessedBandSchema`: a blend
 * has no posterior of its own, so its band is borrowed from the strand with more
 * `items_seen` (tie -> the lower band) and is `not_assessed` when neither strand
 * was reached. `blended` is then null — never 0 (data contract §8).
 */
export const storedVocabSchema = z.strictObject({
  blended: domainScoreSchema.nullable(),
  blended_se: standardErrorSchema.nullable(),
  status: bandSchema,
  single_strand: vocabStrandNameSchema.nullable(),
  a2: storedVocabStrandSchema,
  b1: storedVocabStrandSchema,
});
export type StoredVocab = z.infer<typeof storedVocabSchema>;

/**
 * spec v2 §5.1. `attributes` is PARTIAL over the seven: a skill whose matrix was
 * never reached is absent rather than present-and-empty.
 */
export const storedResultSchema = z.strictObject({
  model_version: modelVersionSchema,
  reference_sets_version: nonEmptyString,
  attributes: z.partialRecord(attributeNameSchema, storedAttributeSchema),
  overall: storedOverallSchema,
  gate: storedGateSchema,
  vocab: storedVocabSchema,
  error_patterns: z.array(errorPatternSchema),
  effort_valid: z.boolean(),
  /**
   * NULLABLE, and the asymmetry with `effort_valid` above is deliberate — do
   * not tidy them into agreement.
   *
   * `effort_valid` has a threshold that EXISTS (`Config.effort_invalid_threshold`),
   * so it is computable for every new row and a non-nullable stored value is the
   * honest one. `low_confidence` has no rule at all:
   * `scoringConfigSchema.low_confidence_se_threshold` is `z.null()` by standing
   * ruling because spec v2's cited SE rule is never specified, and score-resp/1
   * carries no `map_posterior` for the retired joint-model formula to use. So
   * there is nothing to compute from even in principle, and `false` would assert
   * "this result is NOT low confidence" from no rule whatsoever.
   *
   * `resultViewSchema.low_confidence` was ALREADY `z.boolean().nullable()`, so
   * before this line the contract described a system that could display a state
   * it could not record. This converges that inconsistency rather than relaxing
   * a constraint.
   *
   * UPDATED after task 20 (7ad3c4c): I first wrote that task 20 would fill this
   * in once standard setting landed. It will not. Task 20 established that the
   * data contract specifies NO SE rule for this column at all, and landed the
   * null as PERMANENT — there is no later rule for it to wait for. So the
   * nullability is the final shape, not a staging post.
   */
  low_confidence: z.boolean().nullable(),
});
export type StoredResult = z.infer<typeof storedResultSchema>;
