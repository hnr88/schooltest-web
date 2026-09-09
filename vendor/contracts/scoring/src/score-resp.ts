/**
 * `score-resp/1` — the ONLY response shape the R sidecar returns (spec v2 §2).
 *
 * R owns psychometrics and nothing else (house rule 3): posteriors, expected
 * domain scores, theta, SE and the gate boolean are here; bands, blend, ACARA
 * phase, growth, error patterns and effort validity are Strapi's and appear only
 * in `storedResultSchema` / `resultViewSchema`.
 */
import { z } from 'zod';

import {
  domainScoreSchema,
  itemCountSchema,
  itemsSeenSchema,
  nonEmptyString,
  binaryIndicatorSchema,
  probSchema,
  standardErrorSchema,
  thetaSchema,
  PROFILE_POSTERIOR_SUM_TOLERANCE,
} from './core';
import { attributeNameSchema, currentModelVersionSchema } from './enums';
import {
  MATRIX_1_ATTRIBUTES,
  MATRIX_2_ATTRIBUTES,
  MATRIX_1_PROFILES,
  MATRIX_2_PROFILES,
  isAdmissibleProfile,
  type ProfileVector,
} from './constants';

export const SCORE_RESPONSE_SCHEMA_VERSION = 'score-resp/1';

/** A posterior over one matrix's profile space: fixed length, sums to 1 (spec v2 §4.2). */
function profilePosteriorSchema(length: number) {
  return z
    .array(probSchema)
    .length(length)
    .refine(
      (values) =>
        Math.abs(values.reduce((sum, value) => sum + value, 0) - 1) <=
        PROFILE_POSTERIOR_SUM_TOLERANCE,
      { message: 'a profile posterior sums to 1 +/- 1e-6 (spec v2 §4.2)' }
    );
}

/** A MAP profile: 0/1, the matrix's width, and one of the admissible vectors. */
function mapProfileSchema(admissible: readonly ProfileVector[], width: number) {
  return z
    .array(binaryIndicatorSchema)
    .length(width)
    .refine((profile) => isAdmissibleProfile(profile, admissible), {
      message: 'a MAP profile must be an admissible profile (memo §2-§3)',
    });
}

/**
 * spec v2 §2.1 — Matrix 1 (DINA) over the four admissible profiles only.
 * `attributes` is a tuple of literals: R ECHOES the canonical order (§2.6) and a
 * reordered echo is a contract violation, not a detail to normalise downstream.
 */
export const matrix1BlockSchema = z.strictObject({
  attributes: z.tuple([z.literal('Decoding'), z.literal('Vocab_A2'), z.literal('Grammar')]),
  profile_posterior: profilePosteriorSchema(MATRIX_1_PROFILES.length),
  map_profile: mapProfileSchema(MATRIX_1_PROFILES, MATRIX_1_ATTRIBUTES.length),
  items_scored: itemCountSchema,
});
export type Matrix1Block = z.infer<typeof matrix1BlockSchema>;

/** spec v2 §2.2 — Matrix 2 (G-DINA) over the sixteen saturated profiles. */
export const matrix2BlockSchema = z.strictObject({
  attributes: z.tuple([
    z.literal('Vocab_B1'),
    z.literal('Gist'),
    z.literal('Detail'),
    z.literal('Inference'),
  ]),
  profile_posterior: profilePosteriorSchema(MATRIX_2_PROFILES.length),
  map_profile: mapProfileSchema(MATRIX_2_PROFILES, MATRIX_2_ATTRIBUTES.length),
  items_scored: itemCountSchema,
});
export type Matrix2Block = z.infer<typeof matrix2BlockSchema>;

/** Marginal posterior for one attribute (spec v2 §2.1). Audit fields — no client renders them. */
export const attributePosteriorSchema = z.strictObject({
  prob: probSchema,
  prob_se: standardErrorSchema,
  items_seen: itemsSeenSchema,
});
export type AttributePosterior = z.infer<typeof attributePosteriorSchema>;

/** Expected domain score for one attribute over its reference set (spec v2 §2.3). */
export const attributeScoreSchema = z.strictObject({
  domain_score: domainScoreSchema,
  se: standardErrorSchema,
});
export type AttributeScore = z.infer<typeof attributeScoreSchema>;

/** spec v2 §2.4 — pooled fixed-parameter Rasch over every reached core item. */
export const scaleScoreSchema = z.strictObject({
  theta: thetaSchema,
  se: standardErrorSchema,
  domain_score: domainScoreSchema,
  provisional_transform: z.boolean(),
});
export type ScaleScore = z.infer<typeof scaleScoreSchema>;

/**
 * spec v2 §2.5 — Section 3. Stage 3 not reached yields `{ passed: null }` AND
 * NOTHING ELSE: a theta with no items behind it would be an invented value.
 */
export const gateSchema = z.union([
  z.strictObject({ passed: z.null() }),
  z.strictObject({
    passed: z.boolean(),
    theta: thetaSchema,
    se: standardErrorSchema,
    domain_score: domainScoreSchema,
    provisional_cut: z.boolean(),
  }),
]);
export type Gate = z.infer<typeof gateSchema>;

/** spec v2 §2.6 — informative, never blocking; persisted for audit. */
export const scoringWarningSchema = z.strictObject({
  code: nonEmptyString,
  detail: nonEmptyString,
});
export type ScoringWarning = z.infer<typeof scoringWarningSchema>;

/**
 * The full `score-resp/1` body. The refinements are the shape-only half of spec
 * v2 §4.2; the half that needs the request (session_key, reference_sets_version
 * and items_scored equality) belongs to the worker's pre-persist check.
 *
 * `matrix_1` / `matrix_2` / `scale_score` are optional because a matrix that
 * received zero reached items is OMITTED (spec v2 §2.3) — never reported as a
 * zero-evidence block.
 */
export const scoreResponseSchema = z
  .strictObject({
    schema_version: z.literal(SCORE_RESPONSE_SCHEMA_VERSION),
    model_version: currentModelVersionSchema,
    session_key: nonEmptyString,
    reference_sets_version: nonEmptyString,
    items_scored: itemCountSchema,
    matrix_1: matrix1BlockSchema.optional(),
    matrix_2: matrix2BlockSchema.optional(),
    attribute_posteriors: z.partialRecord(attributeNameSchema, attributePosteriorSchema),
    attribute_scores: z.partialRecord(attributeNameSchema, attributeScoreSchema),
    scale_score: scaleScoreSchema.optional(),
    gate: gateSchema,
    warnings: z.array(scoringWarningSchema),
  })
  .superRefine((body, ctx) => {
    const posteriorKeys = Object.keys(body.attribute_posteriors).sort();
    const scoreKeys = Object.keys(body.attribute_scores).sort();
    if (posteriorKeys.join('|') !== scoreKeys.join('|')) {
      ctx.addIssue({
        code: 'custom',
        path: ['attribute_scores'],
        message:
          'spec v2 §4.2: attribute_posteriors and attribute_scores must have identical key sets',
      });
    }
    if (body.items_scored > 0 && body.scale_score === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['scale_score'],
        message: 'spec v2 §4.2: scale_score is present whenever items_scored > 0',
      });
    }
  });
export type ScoreResponse = z.infer<typeof scoreResponseSchema>;
