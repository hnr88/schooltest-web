"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreResponseSchema = exports.scoringWarningSchema = exports.gateSchema = exports.scaleScoreSchema = exports.attributeScoreSchema = exports.attributePosteriorSchema = exports.matrix2BlockSchema = exports.matrix1BlockSchema = exports.SCORE_RESPONSE_SCHEMA_VERSION = void 0;
/**
 * `score-resp/1` — the ONLY response shape the R sidecar returns (spec v2 §2).
 *
 * R owns psychometrics and nothing else (house rule 3): posteriors, expected
 * domain scores, theta, SE and the gate boolean are here; bands, blend, ACARA
 * phase, growth, error patterns and effort validity are Strapi's and appear only
 * in `storedResultSchema` / `resultViewSchema`.
 */
const zod_1 = require("zod");
const core_1 = require("./core");
const enums_1 = require("./enums");
const constants_1 = require("./constants");
exports.SCORE_RESPONSE_SCHEMA_VERSION = 'score-resp/1';
/** A posterior over one matrix's profile space: fixed length, sums to 1 (spec v2 §4.2). */
function profilePosteriorSchema(length) {
    return zod_1.z
        .array(core_1.probSchema)
        .length(length)
        .refine((values) => Math.abs(values.reduce((sum, value) => sum + value, 0) - 1) <=
        core_1.PROFILE_POSTERIOR_SUM_TOLERANCE, { message: 'a profile posterior sums to 1 +/- 1e-6 (spec v2 §4.2)' });
}
/** A MAP profile: 0/1, the matrix's width, and one of the admissible vectors. */
function mapProfileSchema(admissible, width) {
    return zod_1.z
        .array(core_1.binaryIndicatorSchema)
        .length(width)
        .refine((profile) => (0, constants_1.isAdmissibleProfile)(profile, admissible), {
        message: 'a MAP profile must be an admissible profile (memo §2-§3)',
    });
}
/**
 * spec v2 §2.1 — Matrix 1 (DINA) over the four admissible profiles only.
 * `attributes` is a tuple of literals: R ECHOES the canonical order (§2.6) and a
 * reordered echo is a contract violation, not a detail to normalise downstream.
 */
exports.matrix1BlockSchema = zod_1.z.strictObject({
    attributes: zod_1.z.tuple([zod_1.z.literal('Decoding'), zod_1.z.literal('Vocab_A2'), zod_1.z.literal('Grammar')]),
    profile_posterior: profilePosteriorSchema(constants_1.MATRIX_1_PROFILES.length),
    map_profile: mapProfileSchema(constants_1.MATRIX_1_PROFILES, constants_1.MATRIX_1_ATTRIBUTES.length),
    items_scored: core_1.itemCountSchema,
});
/** spec v2 §2.2 — Matrix 2 (G-DINA) over the sixteen saturated profiles. */
exports.matrix2BlockSchema = zod_1.z.strictObject({
    attributes: zod_1.z.tuple([
        zod_1.z.literal('Vocab_B1'),
        zod_1.z.literal('Gist'),
        zod_1.z.literal('Detail'),
        zod_1.z.literal('Inference'),
    ]),
    profile_posterior: profilePosteriorSchema(constants_1.MATRIX_2_PROFILES.length),
    map_profile: mapProfileSchema(constants_1.MATRIX_2_PROFILES, constants_1.MATRIX_2_ATTRIBUTES.length),
    items_scored: core_1.itemCountSchema,
});
/** Marginal posterior for one attribute (spec v2 §2.1). Audit fields — no client renders them. */
exports.attributePosteriorSchema = zod_1.z.strictObject({
    prob: core_1.probSchema,
    prob_se: core_1.standardErrorSchema,
    items_seen: core_1.itemsSeenSchema,
});
/** Expected domain score for one attribute over its reference set (spec v2 §2.3). */
exports.attributeScoreSchema = zod_1.z.strictObject({
    domain_score: core_1.domainScoreSchema,
    se: core_1.standardErrorSchema,
});
/** spec v2 §2.4 — pooled fixed-parameter Rasch over every reached core item. */
exports.scaleScoreSchema = zod_1.z.strictObject({
    theta: core_1.thetaSchema,
    se: core_1.standardErrorSchema,
    domain_score: core_1.domainScoreSchema,
    provisional_transform: zod_1.z.boolean(),
});
/**
 * spec v2 §2.5 — Section 3. Stage 3 not reached yields `{ passed: null }` AND
 * NOTHING ELSE: a theta with no items behind it would be an invented value.
 */
exports.gateSchema = zod_1.z.union([
    zod_1.z.strictObject({ passed: zod_1.z.null() }),
    zod_1.z.strictObject({
        passed: zod_1.z.boolean(),
        theta: core_1.thetaSchema,
        se: core_1.standardErrorSchema,
        domain_score: core_1.domainScoreSchema,
        provisional_cut: zod_1.z.boolean(),
    }),
]);
/** spec v2 §2.6 — informative, never blocking; persisted for audit. */
exports.scoringWarningSchema = zod_1.z.strictObject({
    code: core_1.nonEmptyString,
    detail: core_1.nonEmptyString,
});
/**
 * The full `score-resp/1` body. The refinements are the shape-only half of spec
 * v2 §4.2; the half that needs the request (session_key, reference_sets_version
 * and items_scored equality) belongs to the worker's pre-persist check.
 *
 * `matrix_1` / `matrix_2` / `scale_score` are optional because a matrix that
 * received zero reached items is OMITTED (spec v2 §2.3) — never reported as a
 * zero-evidence block.
 */
exports.scoreResponseSchema = zod_1.z
    .strictObject({
    schema_version: zod_1.z.literal(exports.SCORE_RESPONSE_SCHEMA_VERSION),
    model_version: enums_1.currentModelVersionSchema,
    session_key: core_1.nonEmptyString,
    reference_sets_version: core_1.nonEmptyString,
    items_scored: core_1.itemCountSchema,
    matrix_1: exports.matrix1BlockSchema.optional(),
    matrix_2: exports.matrix2BlockSchema.optional(),
    attribute_posteriors: zod_1.z.partialRecord(enums_1.attributeNameSchema, exports.attributePosteriorSchema),
    attribute_scores: zod_1.z.partialRecord(enums_1.attributeNameSchema, exports.attributeScoreSchema),
    scale_score: exports.scaleScoreSchema.optional(),
    gate: exports.gateSchema,
    warnings: zod_1.z.array(exports.scoringWarningSchema),
})
    .superRefine((body, ctx) => {
    const posteriorKeys = Object.keys(body.attribute_posteriors).sort();
    const scoreKeys = Object.keys(body.attribute_scores).sort();
    if (posteriorKeys.join('|') !== scoreKeys.join('|')) {
        ctx.addIssue({
            code: 'custom',
            path: ['attribute_scores'],
            message: 'spec v2 §4.2: attribute_posteriors and attribute_scores must have identical key sets',
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
