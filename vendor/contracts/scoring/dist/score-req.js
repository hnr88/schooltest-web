"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreRequestSchema = exports.referenceSetsSchema = exports.academicVocabPoolSchema = exports.section3PoolSchema = exports.overallPoolSchema = exports.overallTransformSchema = exports.raschPoolItemSchema = exports.referenceItemSchema = exports.scoreRequestResponseSchema = exports.itemParamsSchema = exports.SCORE_REQUEST_SCHEMA_VERSION = void 0;
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
const zod_1 = require("zod");
const core_1 = require("./core");
const enums_1 = require("./enums");
const constants_1 = require("./constants");
exports.SCORE_REQUEST_SCHEMA_VERSION = 'score-req/1';
/**
 * DINA / G-DINA parameters copied VERBATIM from the Item (spec v2 §3.1.4) —
 * `{ slip, guess }` for DINA, the delta vector for a saturated G-DINA item.
 * Missing params fail assembly loudly in the worker; they are never defaulted.
 */
exports.itemParamsSchema = zod_1.z.record(core_1.nonEmptyString, zod_1.z.union([zod_1.z.number(), zod_1.z.array(zod_1.z.number())]));
/**
 * One reached, core response (spec v2 §3.1). Not-reached and supplementary rows
 * are excluded by the assembler and can never appear here.
 *
 * The cross-field rules are memo §1 made unfalsifiable on the wire: stage 3 is
 * held out of the CDM, so it is exactly the rows with no matrix and no Q-vector,
 * and a Q-vector's width is fixed by its matrix. A row held out of the CDM names
 * the Rasch strand it feeds (`rasch_strand`) — Section 3's gate or the Academic
 * Vocabulary mini-scale — so the two stage-3 strands can never be pooled into one
 * theta by accident; a matrix row names none.
 */
exports.scoreRequestResponseSchema = zod_1.z
    .strictObject({
    item_code: core_1.nonEmptyString,
    score: core_1.itemScoreSchema,
    stage: enums_1.stageSchema,
    /** The item's Q-row over its matrix's attributes. `null` on stage 3. */
    attribute_vector: zod_1.z.array(core_1.binaryIndicatorSchema).nullable(),
    matrix: enums_1.matrixIdSchema.nullable(),
    model_type: enums_1.scoringModelTypeSchema,
    params: exports.itemParamsSchema.nullable(),
    /** Doc 1: fixed-parameter anchor item. Drives the reference sets (memo §5). */
    anchor: zod_1.z.boolean(),
    /** Testlet key — items sharing a passage share it. `null` until passages carry one. */
    block_id: core_1.nonEmptyString.nullable(),
    /** Fixed calibrated Rasch difficulty. `null` on an item with no calibration yet. */
    difficulty: zod_1.z.number().nullable(),
    /** The pooled Rasch strand a matrix-null row feeds (7A-7C `critical`, 2G `academic_vocab`). `null` on a matrix row. */
    rasch_strand: enums_1.raschStrandSchema.nullable(),
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
    if ((row.matrix === null) !== (row.rasch_strand !== null)) {
        ctx.addIssue({
            code: 'custom',
            path: ['rasch_strand'],
            message: 'a rasch_strand exists exactly when the row is held out of the CDM (`matrix` null)',
        });
    }
    const expectedWidth = row.matrix === 1 ? constants_1.MATRIX_1_WIDTH : row.matrix === 2 ? constants_1.MATRIX_2_WIDTH : null;
    if (expectedWidth !== null && row.attribute_vector?.length !== expectedWidth) {
        ctx.addIssue({
            code: 'custom',
            path: ['attribute_vector'],
            message: `Matrix ${row.matrix} Q-rows are ${expectedWidth} wide (memo §2-§3)`,
        });
    }
});
/** One reference item for a skill's expected domain score (memo §5, spec v2 §3.2). */
exports.referenceItemSchema = zod_1.z.strictObject({
    item_code: core_1.nonEmptyString,
    attribute_vector: zod_1.z.array(core_1.binaryIndicatorSchema),
    params: exports.itemParamsSchema,
});
/** One Rasch pool member: item code plus its fixed calibrated difficulty. */
exports.raschPoolItemSchema = zod_1.z.strictObject({
    item_code: core_1.nonEmptyString,
    difficulty: zod_1.z.number(),
});
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
exports.overallTransformSchema = zod_1.z.discriminatedUnion('kind', [
    zod_1.z.strictObject({ kind: zod_1.z.literal('linear'), a: zod_1.z.number(), b: zod_1.z.number() }),
    zod_1.z.strictObject({ kind: zod_1.z.literal('tcc') }),
]);
exports.overallPoolSchema = zod_1.z.strictObject({
    items: zod_1.z.array(exports.raschPoolItemSchema).min(1),
    transform: exports.overallTransformSchema,
});
/**
 * Section 3's Rasch pool and its exit cut. `provisional` stays true while the
 * junior/senior cuts are placeholders (memo §4, §9).
 */
exports.section3PoolSchema = zod_1.z.strictObject({
    items: zod_1.z.array(exports.raschPoolItemSchema).min(1),
    cut: zod_1.z.number(),
    provisional: zod_1.z.boolean(),
});
/**
 * The Academic Vocabulary (2G) Rasch pool and the transform that maps its theta
 * to 0-100 (spec 4 §4). Its own pool, never the Section 3 one. During the field
 * test the transform is the registry's provisional linear placeholder, so R
 * reports `academic_vocab.provisional_transform: true`.
 */
exports.academicVocabPoolSchema = zod_1.z.strictObject({
    items: zod_1.z.array(exports.raschPoolItemSchema).min(1),
    transform: exports.overallTransformSchema,
});
/**
 * spec v2 §3.2. `skills` is PARTIAL over the seven attributes: a skill with no
 * reference set yet simply has no key, and R omits it from both output blocks.
 * `academic_vocab_pool` is OPTIONAL: a registry version from before the strand
 * existed carries none, and a request that sends an `academic_vocab` row
 * without it is refused below rather than scored against nothing.
 */
exports.referenceSetsSchema = zod_1.z.strictObject({
    version: core_1.nonEmptyString,
    skills: zod_1.z.partialRecord(enums_1.attributeNameSchema, zod_1.z.array(exports.referenceItemSchema).min(1)),
    overall_pool: exports.overallPoolSchema,
    section3_pool: exports.section3PoolSchema,
    academic_vocab_pool: exports.academicVocabPoolSchema.optional(),
});
/** spec v2 §3.3 — the versioned envelope. R answers 422 `schema_mismatch` to any other pair. */
exports.scoreRequestSchema = zod_1.z
    .strictObject({
    schema_version: zod_1.z.literal(exports.SCORE_REQUEST_SCHEMA_VERSION),
    model_version: enums_1.currentModelVersionSchema,
    session_key: core_1.nonEmptyString,
    responses: zod_1.z.array(exports.scoreRequestResponseSchema),
    reference_sets: exports.referenceSetsSchema,
})
    .superRefine((body, ctx) => {
    const academic = body.responses.some((row) => row.rasch_strand === 'academic_vocab');
    if (academic && body.reference_sets.academic_vocab_pool === undefined) {
        ctx.addIssue({
            code: 'custom',
            path: ['reference_sets', 'academic_vocab_pool'],
            message: 'academic_vocab rows need reference_sets.academic_vocab_pool to map their theta to 0-100 (spec 4 §4)',
        });
    }
});
