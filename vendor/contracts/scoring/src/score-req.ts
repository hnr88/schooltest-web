/**
 * `score-req/1` — the ONLY request shape POSTed to the R sidecar (spec v2 §3).
 *
 * R is strictly stateless (memo §5): no config, no files, no DB. Everything the
 * scorer needs rides this body, including the reference sets, so every persisted
 * audit record is self-contained and offline-reproducible.
 *
 * Retired from the v1 wire and absent here on purpose: `rapid_guess` (memo §6 —
 * rapid guesses never touch scoring), `hierarchy` and `prior` (memo §2-§3 —
 * the profile spaces are constants), `attribute_names`, `q_matrix` and
 * `item_params` as parallel arrays (each response now carries its own row).
 */
import { z } from 'zod';

import {
  itemScoreSchema,
  binaryIndicatorSchema,
  nonEmptyString,
} from './core';
import {
  attributeNameSchema,
  currentModelVersionSchema,
  matrixIdSchema,
  scoringModelTypeSchema,
  stageSchema,
} from './enums';
import { MATRIX_1_WIDTH, MATRIX_2_WIDTH } from './constants';

export const SCORE_REQUEST_SCHEMA_VERSION = 'score-req/1';

/**
 * DINA / G-DINA parameters copied VERBATIM from the Item (spec v2 §3.1.4) —
 * `{ slip, guess }` for DINA, the delta vector for a saturated G-DINA item.
 * Missing params fail assembly loudly in the worker; they are never defaulted.
 */
export const itemParamsSchema = z.record(
  nonEmptyString,
  z.union([z.number(), z.array(z.number())])
);
export type ItemParams = z.infer<typeof itemParamsSchema>;

/**
 * One reached, core response (spec v2 §3.1). Not-reached and supplementary rows
 * are excluded by the assembler and can never appear here.
 *
 * The cross-field rules are memo §1 made unfalsifiable on the wire: stage 3 is
 * held out of the CDM, so it is exactly the rows with no matrix and no Q-vector,
 * and a Q-vector's width is fixed by its matrix.
 */
export const scoreRequestResponseSchema = z
  .strictObject({
    item_code: nonEmptyString,
    score: itemScoreSchema,
    stage: stageSchema,
    /** The item's Q-row over its matrix's attributes. `null` on stage 3. */
    attribute_vector: z.array(binaryIndicatorSchema).nullable(),
    matrix: matrixIdSchema.nullable(),
    model_type: scoringModelTypeSchema,
    params: itemParamsSchema.nullable(),
    /** Doc 1: fixed-parameter anchor item. Drives the reference sets (memo §5). */
    anchor: z.boolean(),
    /** Testlet key — items sharing a passage share it. `null` until passages carry one. */
    block_id: nonEmptyString.nullable(),
    /** Fixed calibrated Rasch difficulty. `null` on an item with no calibration yet. */
    difficulty: z.number().nullable(),
  })
  .superRefine((row, ctx) => {
    const isStageThree = row.stage === 3;
    if (isStageThree !== (row.matrix === null)) {
      ctx.addIssue({
        code: 'custom',
        path: ['matrix'],
        message: 'memo §1: stage 3 is held out of the CDM — `matrix` is null exactly on stage 3',
      });
    }
    if ((row.matrix === null) !== (row.attribute_vector === null)) {
      ctx.addIssue({
        code: 'custom',
        path: ['attribute_vector'],
        message: 'an attribute_vector exists exactly when the row loads on a matrix',
      });
    }
    const expectedWidth =
      row.matrix === 1 ? MATRIX_1_WIDTH : row.matrix === 2 ? MATRIX_2_WIDTH : null;
    if (expectedWidth !== null && row.attribute_vector?.length !== expectedWidth) {
      ctx.addIssue({
        code: 'custom',
        path: ['attribute_vector'],
        message: `Matrix ${row.matrix} Q-rows are ${expectedWidth} wide (memo §2-§3)`,
      });
    }
  });
export type ScoreRequestResponse = z.infer<typeof scoreRequestResponseSchema>;

/** One reference item for a skill's expected domain score (memo §5, spec v2 §3.2). */
export const referenceItemSchema = z.strictObject({
  item_code: nonEmptyString,
  attribute_vector: z.array(binaryIndicatorSchema),
  params: itemParamsSchema,
});
export type ReferenceItem = z.infer<typeof referenceItemSchema>;

/** One Rasch pool member: item code plus its fixed calibrated difficulty. */
export const raschPoolItemSchema = z.strictObject({
  item_code: nonEmptyString,
  difficulty: z.number(),
});
export type RaschPoolItem = z.infer<typeof raschPoolItemSchema>;

/**
 * How theta becomes the 0-100 domain score (data contract §2.1). ONE field, TWO
 * kinds, discriminated on `kind` — and the arms carry genuinely different data,
 * which is why this is a union and not one object with optional numbers:
 *
 * - `linear` — the interim map `clamp(round(a + b*theta), 0, 100)`. `a` and `b`
 *   are standard-setting outputs that arrive through the anchor registry and are
 *   never invented in code (memo §9), so R reports
 *   `scale_score.provisional_transform: true` when it uses this arm.
 * - `tcc` — `100 * TCC(theta) / |overall_pool|`, computed from the pool's own
 *   calibrated difficulties. It carries no `a`/`b` because it invents nothing,
 *   so the flag flips to `false`. The asymmetry in that flag is the point: it
 *   states truthfully whether a placeholder was involved.
 *
 * The `tcc` arm REJECTS a stray `a` or `b` rather than ignoring them. A pool
 * carrying leftover linear constants is a registry that has half-migrated, and
 * silently discarding them would hide it.
 */
export const overallTransformSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('linear'), a: z.number(), b: z.number() }),
  z.strictObject({ kind: z.literal('tcc') }),
]);
export type OverallTransform = z.infer<typeof overallTransformSchema>;

export const overallPoolSchema = z.strictObject({
  items: z.array(raschPoolItemSchema).min(1),
  transform: overallTransformSchema,
});
export type OverallPool = z.infer<typeof overallPoolSchema>;

/**
 * Section 3's Rasch pool and its exit cut. `provisional` stays true while the
 * junior/senior cuts are placeholders (memo §4, §9).
 */
export const section3PoolSchema = z.strictObject({
  items: z.array(raschPoolItemSchema).min(1),
  cut: z.number(),
  provisional: z.boolean(),
});
export type Section3Pool = z.infer<typeof section3PoolSchema>;

/**
 * spec v2 §3.2. `skills` is PARTIAL over the seven attributes: a skill with no
 * reference set yet simply has no key, and R omits it from both output blocks.
 */
export const referenceSetsSchema = z.strictObject({
  version: nonEmptyString,
  skills: z.partialRecord(attributeNameSchema, z.array(referenceItemSchema).min(1)),
  overall_pool: overallPoolSchema,
  section3_pool: section3PoolSchema,
});
export type ReferenceSets = z.infer<typeof referenceSetsSchema>;

/** spec v2 §3.3 — the versioned envelope. R answers 422 `schema_mismatch` to any other pair. */
export const scoreRequestSchema = z.strictObject({
  schema_version: z.literal(SCORE_REQUEST_SCHEMA_VERSION),
  model_version: currentModelVersionSchema,
  session_key: nonEmptyString,
  responses: z.array(scoreRequestResponseSchema),
  reference_sets: referenceSetsSchema,
});
export type ScoreRequest = z.infer<typeof scoreRequestSchema>;
