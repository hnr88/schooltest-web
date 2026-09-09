"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storedResultSchema = exports.storedVocabSchema = exports.storedVocabStrandSchema = exports.storedGateSchema = exports.storedOverallSchema = exports.storedAttributeSchema = exports.storedAttributeScoredSchema = exports.errorPatternSchema = void 0;
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
const zod_1 = require("zod");
const core_1 = require("./core");
const enums_1 = require("./enums");
/**
 * spec v2 §5.7 — distractor types aggregated over incorrect, reached,
 * non-rapid-guess responses. Suppressed entirely below MIN_ERRORS_FOR_PATTERNS,
 * so a listed pattern always has at least one response behind it.
 */
exports.errorPatternSchema = zod_1.z.strictObject({
    type: enums_1.errorPatternTypeSchema,
    count: zod_1.z.number().int().min(1),
    pct: zod_1.z.number().min(0).max(100),
});
/**
 * One assessed attribute (spec v2 §5.1): R's posterior and expected score plus
 * the band Strapi derived from `prob` (§5.2). `prob`/`prob_se` are audit fields.
 */
exports.storedAttributeScoredSchema = zod_1.z.strictObject({
    prob: core_1.probSchema,
    prob_se: core_1.standardErrorSchema,
    domain_score: core_1.domainScoreSchema,
    se: core_1.standardErrorSchema,
    items_seen: core_1.itemsSeenSchema,
    status: enums_1.assessedBandSchema,
});
/**
 * Either the full claim or the not-assessed object. §5.3 drops the numeric
 * fields below the minimum-evidence floor — they stay in the audit record — so
 * there is no shape that carries a score without enough evidence to justify it.
 */
exports.storedAttributeSchema = zod_1.z.union([exports.storedAttributeScoredSchema, core_1.notAssessedSchema]);
/** spec v2 §5.1 — the pooled Rasch headline. `provisional_transform` is the transform flag. */
exports.storedOverallSchema = zod_1.z.strictObject({
    theta: core_1.thetaSchema,
    theta_se: core_1.standardErrorSchema,
    domain_score: core_1.domainScoreSchema,
    provisional_transform: zod_1.z.boolean(),
});
/** spec v2 §5.1 / §2.5 — Section 3 as stored, including the not-reached form. */
exports.storedGateSchema = zod_1.z.union([
    zod_1.z.strictObject({ passed: zod_1.z.null() }),
    zod_1.z.strictObject({
        passed: zod_1.z.boolean(),
        theta: core_1.thetaSchema,
        se: core_1.standardErrorSchema,
        domain_score: core_1.domainScoreSchema,
        provisional_cut: zod_1.z.boolean(),
    }),
]);
/**
 * One vocabulary strand as stored (spec v2 §5.4 — "store both strand statuses
 * too"). An unreached strand is the not-assessed object, never a zero.
 */
exports.storedVocabStrandSchema = zod_1.z.union([
    zod_1.z.strictObject({
        domain_score: core_1.domainScoreSchema,
        se: core_1.standardErrorSchema,
        items_seen: core_1.itemsSeenSchema,
        status: enums_1.assessedBandSchema,
    }),
    core_1.notAssessedSchema,
]);
/**
 * spec v2 §5.4 — the items-seen-weighted blend of Vocab_A2 and Vocab_B1.
 *
 * `status` is a `bandSchema` and not the four-band `assessedBandSchema`: a blend
 * has no posterior of its own, so its band is borrowed from the strand with more
 * `items_seen` (tie -> the lower band) and is `not_assessed` when neither strand
 * was reached. `blended` is then null — never 0 (data contract §8).
 */
exports.storedVocabSchema = zod_1.z.strictObject({
    blended: core_1.domainScoreSchema.nullable(),
    blended_se: core_1.standardErrorSchema.nullable(),
    status: enums_1.bandSchema,
    single_strand: enums_1.vocabStrandNameSchema.nullable(),
    a2: exports.storedVocabStrandSchema,
    b1: exports.storedVocabStrandSchema,
});
/**
 * spec v2 §5.1. `attributes` is PARTIAL over the seven: a skill whose matrix was
 * never reached is absent rather than present-and-empty.
 */
exports.storedResultSchema = zod_1.z.strictObject({
    model_version: enums_1.modelVersionSchema,
    reference_sets_version: core_1.nonEmptyString,
    attributes: zod_1.z.partialRecord(enums_1.attributeNameSchema, exports.storedAttributeSchema),
    overall: exports.storedOverallSchema,
    gate: exports.storedGateSchema,
    vocab: exports.storedVocabSchema,
    error_patterns: zod_1.z.array(exports.errorPatternSchema),
    effort_valid: zod_1.z.boolean(),
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
    low_confidence: zod_1.z.boolean().nullable(),
});
