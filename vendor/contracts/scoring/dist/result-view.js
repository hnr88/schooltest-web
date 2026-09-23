"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resultViewSchema = exports.resultNarrativeSchema = exports.RESULT_HISTORY_MAX_POINTS = exports.resultHistoryPointSchema = exports.resultViewVocabSchema = exports.resultViewVocabStrandSchema = exports.resultViewAcademicVocabSchema = exports.resultViewGateSchema = exports.resultViewOverallSchema = exports.resultViewAttributeSchema = exports.resultViewAttributeScoredSchema = exports.resultViewReleaseStateSchema = void 0;
/**
 * `ResultView` v2 — the read model of GET /results/{documentId} (spec v2 §6.3).
 *
 * Dashboard D3: every judgment (band, reliable-change gating, band-movement vs
 * point delta, not-assessed) arrives precomputed. The client renders; it never
 * re-derives. Spec v2 §6.1: the only displayed numbers are
 * `overall.domain_score`, per-attribute `domain_score` and
 * `gate.domain_score`; `prob`/`prob_se` ride along for audit and no client
 * renders them (dashboard §7 grep guard).
 *
 * This coexists with the API's v1 `resultViewSchema` until task 23 deletes that
 * one. Nothing here widens to accept the v1 shape.
 */
const zod_1 = require("zod");
const result_view_supplementary_1 = require("./result-view.supplementary");
const core_1 = require("./core");
const enums_1 = require("./enums");
const stored_result_1 = require("./stored-result");
/** Result-grain release states; session-grain states never belong in a view. */
exports.resultViewReleaseStateSchema = zod_1.z.enum([
    'held',
    'released',
    'recalled',
    'manual',
]);
/**
 * The growth triplet (spec v2 §6.2). All three are null together when there is
 * no comparable previous official same-model-version Result.
 */
const growthFields = {
    delta: zod_1.z.number().nullable(),
    delta_reliable: zod_1.z.boolean().nullable(),
    delta_display: core_1.deltaDisplaySchema.nullable(),
};
/**
 * One assessed attribute on the view. `band_before`/`band_after` are present
 * only on the band-movement path (§6.2: a skill outside `ANCHORED_SKILLS` gets
 * `delta: null` and `delta_display: "band_movement"`, because a point delta
 * across unanchored forms is not a valid claim).
 */
exports.resultViewAttributeScoredSchema = zod_1.z.strictObject({
    domain_score: core_1.domainScoreSchema,
    se: core_1.standardErrorSchema,
    status: enums_1.assessedBandSchema,
    prob: core_1.probSchema,
    prob_se: core_1.standardErrorSchema,
    items_seen: core_1.itemsSeenSchema,
    ...growthFields,
    band_before: enums_1.bandSchema.optional(),
    band_after: enums_1.bandSchema.optional(),
});
/** An unassessed attribute carries no score and no delta at all. */
exports.resultViewAttributeSchema = zod_1.z.union([
    exports.resultViewAttributeScoredSchema,
    core_1.notAssessedSchema,
]);
/** spec v2 §6.3 — the headline score with its growth. Never the mean of subskills. */
exports.resultViewOverallSchema = zod_1.z.strictObject({
    domain_score: core_1.domainScoreSchema.nullable(),
    provisional_transform: zod_1.z.boolean(),
    ...growthFields,
});
/** The PUBLIC gate subset: the graded score and the boolean, no theta (spec v2 §6.3). */
exports.resultViewGateSchema = zod_1.z.strictObject({
    passed: zod_1.z.boolean().nullable(),
    domain_score: core_1.domainScoreSchema.nullable(),
    provisional_cut: zod_1.z.boolean(),
});
/**
 * Academic Vocabulary (spec 4 §4) — the 2G Rasch strand, shaped like the gate
 * but BANDED four ways (Beginning/Emerging/Developing/Consolidating are the
 * `not_yet`/`emerging`/`developing`/`secure` band values). `band: null` means
 * not assessed (or measured with no deployed cuts); `domain_score: null` means
 * not reached — never a zero. `se` is the strand theta's SE in logits, carried
 * for audit like the gate's theta: no client renders it. `provisional_cut` is
 * true for the whole field test — the cuts are placeholders pending standard
 * setting, and no screen may present the band as final while it is set.
 */
exports.resultViewAcademicVocabSchema = zod_1.z.strictObject({
    domain_score: core_1.domainScoreSchema.nullable(),
    se: core_1.standardErrorSchema.nullable(),
    band: enums_1.assessedBandSchema.nullable(),
    items_seen: core_1.itemCountSchema,
    provisional_cut: zod_1.z.boolean(),
});
/** One vocabulary strand's score: `a2` is Vocab_A2, `b1` is Vocab_B1 (spec v2 §6.3). */
exports.resultViewVocabStrandSchema = zod_1.z.strictObject({
    domain_score: core_1.domainScoreSchema.nullable(),
});
/**
 * The two vocabulary strands, side by side and never blended: each is its own
 * model attribute, and its band and growth ride on `attributes.Vocab_A2` /
 * `attributes.Vocab_B1` like every other attribute's.
 */
exports.resultViewVocabSchema = zod_1.z.strictObject({
    a2: exports.resultViewVocabStrandSchema,
    b1: exports.resultViewVocabStrandSchema,
});
/**
 * One point on the trend chart (dashboard §1.1). Keyed by the nine DISPLAY
 * skills — `Vocab_A2` and `Vocab_B1` as two lines, `Vocab_B2` the Academic
 * Vocabulary strand score, `Critical` the Section 3 graded score — and
 * exhaustive: every sitting reports all nine, `null` where that sitting did not
 * assess the skill. A `null` is an absence; it is never rendered as 0.
 */
exports.resultHistoryPointSchema = zod_1.z.strictObject({
    sat_at: zod_1.z.iso.date(),
    overall: core_1.domainScoreSchema.nullable(),
    attributes: zod_1.z.record(enums_1.displaySkillSchema, core_1.domainScoreSchema.nullable()),
});
/** Dashboard §1.1 — official, same-model-version sittings, oldest first, last 8. */
exports.RESULT_HISTORY_MAX_POINTS = 8;
/**
 * The Doc 1 s.11.4 plain-language rendering, served only for
 * `?include=narrative` (spec v2 §6.3 keeps it unchanged).
 */
exports.resultNarrativeSchema = zod_1.z.strictObject({
    attribute_labels: zod_1.z.record(core_1.nonEmptyString, zod_1.z.strictObject({ name: core_1.nonEmptyString, descriptor: core_1.nonEmptyString })),
    change_since_last: zod_1.z.array(zod_1.z.string()),
    weeks_since_previous: zod_1.z.number().int().nullable(),
    plain_language: zod_1.z.array(zod_1.z.string()),
});
/**
 * spec v2 §6.3 exactly. `history` is OPTIONAL because it is included on
 * `GET /results/{id}` and omitted on `/my/students/results` for payload size —
 * omitted, not empty, so a roster row cannot be mistaken for a student with no
 * sittings. `acara_phase` stays a string: the Crosswalk owns the phase labels.
 */
exports.resultViewSchema = zod_1.z.strictObject({
    document_id: core_1.nonEmptyString,
    session_document_id: core_1.nonEmptyString.nullable(),
    /**
     * R5 / D19 — the ONLY student reference this view will ever carry. Opaque
     * document id, never a name: the diagnostic export (task 25) is built from
     * this same read model and must stay no-name, so an identity block here
     * would sit one careless spread from the export path. Name, class and
     * initials come from the separately authorised roster read, joined on this
     * field — which is also the only thing that lets `/my/students/results`
     * key a roster row to a student at all.
     */
    student_document_id: core_1.nonEmptyString,
    skill: enums_1.skillSchema,
    scope: enums_1.resultScopeSchema,
    status: enums_1.resultStatusSchema,
    destination: enums_1.resultDestinationSchema,
    published_at: zod_1.z.iso.datetime().nullable(),
    recalled_at: zod_1.z.iso.datetime().nullable(),
    release_state: exports.resultViewReleaseStateSchema,
    provisional: enums_1.provisionalSchema.nullable(),
    model_version: enums_1.modelVersionSchema,
    overall: exports.resultViewOverallSchema,
    acara_phase: core_1.nonEmptyString.nullable(),
    /**
     * Task 19 / audit F4 — the attribute that NAMES a
     * `developing_to_consolidating` phase (design §7.4 form 2).
     *
     * REQUIRED-AND-NULLABLE, not `.optional()`, and the asymmetry with
     * `resultViewSchema`'s optional `history` is deliberate. `history` is omitted
     * on the roster read for payload size, so "absent" carries meaning there. A
     * phase, by contrast, is emitted on every view, and this field is the phase's
     * own qualifier: a producer that simply forgot it would otherwise validate
     * and render a `developing_to_consolidating` label with the attribute
     * silently missing — which is the exact defect audit F4 recorded, one layer
     * up. `null` means "not a named transition"; there is no third state.
     */
    transitioning_attribute: core_1.nonEmptyString.nullable(),
    readiness: enums_1.readinessSchema.nullable(),
    gate: exports.resultViewGateSchema,
    academic_vocab: exports.resultViewAcademicVocabSchema,
    effort_valid: zod_1.z.boolean().nullable(),
    low_confidence: zod_1.z.boolean().nullable(),
    items_answered: core_1.itemCountSchema,
    items_total: core_1.itemCountSchema,
    duration_minutes: zod_1.z.number().int().min(0).nullable(),
    attributes: zod_1.z.partialRecord(enums_1.attributeNameSchema, exports.resultViewAttributeSchema),
    vocab: exports.resultViewVocabSchema,
    error_patterns: zod_1.z.array(stored_result_1.errorPatternSchema),
    history: zod_1.z.array(exports.resultHistoryPointSchema).max(exports.RESULT_HISTORY_MAX_POINTS).optional(),
    previous_result_document_id: core_1.nonEmptyString.nullable(),
    narrative: exports.resultNarrativeSchema.nullable().optional(),
    cefr_band: enums_1.cefrBandSchema.nullable(),
    // The three fields v2 was missing. See ./result-view.supplementary.ts for
    // why each one is load-bearing on a live consumer; `display_label` matches
    // v1's `z.string().nullable()` because null already means "retry" to the app
    // and has to keep meaning it.
    display_label: zod_1.z.string().nullable(),
    supplementary: result_view_supplementary_1.resultViewSupplementarySchema.nullable(),
    productive_scores: result_view_supplementary_1.resultViewProductiveScoresSchema.nullable(),
}).superRefine((view, ctx) => {
    if (view.items_answered > view.items_total) {
        ctx.addIssue({
            code: 'custom',
            path: ['items_answered'],
            message: 'items_answered counts reached responses, so it can never exceed items_total',
        });
    }
});
