"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIAGNOSTIC_JSON_FORMAT = exports.diagnosticExportSchema = exports.diagnosticExportHistoryPointSchema = exports.diagnosticExportGateSchema = exports.diagnosticExportVocabSchema = exports.diagnosticExportSkillSchema = exports.diagnosticExportSittingSchema = exports.diagnosticExportStudentSchema = void 0;
/**
 * Diagnostic export v2 — the LLM-ready bundle of
 * GET /results/{documentId}/export?format=diagnostic_json (spec v2 §7).
 *
 * Dashboard D5: everything sent to an LLM goes through THIS shape, never a
 * client-assembled payload of ResultView fields. So the bundle is where the
 * pseudonymisation guarantees live, and `strictObject` throughout is the leak
 * guard: `prob`, `prob_se`, `theta`, a student name or a raw transcript is a
 * parse failure rather than a wire leak. Every displayed number is a domain
 * score (spec v2 §6.1); no posterior and no theta appears anywhere below.
 */
const zod_1 = require("zod");
const core_1 = require("./core");
const enums_1 = require("./enums");
const stored_result_1 = require("./stored-result");
/** Doc 1 s.11.4 — pseudonymised: year group and language background, NO name. */
exports.diagnosticExportStudentSchema = zod_1.z.strictObject({
    year_group: zod_1.z.number().int().nullable(),
    first_language: zod_1.z.string().nullable(),
    l1_literate: zod_1.z.boolean().nullable(),
});
/** Which sitting this is, without identifying when it was booked. */
exports.diagnosticExportSittingSchema = zod_1.z.strictObject({
    date: zod_1.z.iso.date().nullable(),
    number: zod_1.z.number().int().min(1),
    weeks_since_previous: zod_1.z.number().int().nullable(),
});
/**
 * One display skill's claim (spec v2 §7, task 25): the graded score, its band
 * and how the change renders. `descriptor` is the Crosswalk's human-readable
 * text, carried so no downstream reader needs a codebook (Doc 1 s.11.4); it is
 * OMITTED when the Crosswalk describes no such skill, never synthesised.
 *
 * THREE variants, and do not tidy them back into two:
 * 1. Banded skill — the six CDM display skills: score + posterior band + gated
 *    change.
 * 2. GATE skill (Critical Reading) — score + the pass/fail verdict, and
 *    DELIBERATELY no `status` band and no `delta_display` field (D13, task 30/35
 *    rulings): the gate sits outside the CDM with no posterior, so there is no
 *    band to cut and no anchored θ_crit to claim a change from. A field that
 *    exists gets populated eventually — so neither field exists (the same
 *    structural reasoning as task 27's GateBar).
 * 3. notAssessed — zero Section-3 evidence or an unreached strand: stated as a
 *    measured absence, never as a silent missing key.
 * A null `gate.passed` (Section 3 not reached) takes variant 3, not a fourth
 * state: three variants partition every case.
 */
exports.diagnosticExportSkillSchema = zod_1.z.union([
    zod_1.z.strictObject({
        domain_score: core_1.domainScoreSchema,
        status: enums_1.assessedBandSchema,
        delta_display: core_1.deltaDisplaySchema.nullable(),
        descriptor: zod_1.z.string().min(1).optional(),
    }),
    zod_1.z.strictObject({
        domain_score: core_1.domainScoreSchema,
        gate_passed: zod_1.z.boolean(),
        descriptor: zod_1.z.string().min(1).optional(),
    }),
    core_1.notAssessedSchema,
]);
/** The Vocabulary bar plus its two strands, scores only. */
exports.diagnosticExportVocabSchema = zod_1.z.strictObject({
    blended: core_1.domainScoreSchema.nullable(),
    status: enums_1.bandSchema,
    delta_display: core_1.deltaDisplaySchema.nullable(),
    a2: zod_1.z.strictObject({ domain_score: core_1.domainScoreSchema.nullable() }),
    b1: zod_1.z.strictObject({ domain_score: core_1.domainScoreSchema.nullable() }),
    single_strand: enums_1.vocabStrandNameSchema.nullable(),
});
/** The exit gate: graded score and boolean, no theta (spec v2 §7). */
exports.diagnosticExportGateSchema = zod_1.z.strictObject({
    passed: zod_1.z.boolean().nullable(),
    domain_score: core_1.domainScoreSchema.nullable(),
});
/** History, overall only (task 25) — the trend without re-exporting every skill. */
exports.diagnosticExportHistoryPointSchema = zod_1.z.strictObject({
    sat_at: zod_1.z.iso.date(),
    overall: core_1.domainScoreSchema.nullable(),
});
/**
 * The full bundle. `skills` is exhaustive over the seven display skills so an
 * unassessed skill is stated as unassessed rather than silently missing —
 * absence of a key reads as an oversight, the not-assessed object reads as a
 * measured fact. `caveats` is `.min(1)`: the single-sitting note is
 * unconditional, and §7's provisional-transform / provisional-cut /
 * low-confidence lines join it when those flags are set.
 */
exports.diagnosticExportSchema = zod_1.z.strictObject({
    model_version: enums_1.modelVersionSchema,
    student: exports.diagnosticExportStudentSchema,
    sitting: exports.diagnosticExportSittingSchema,
    overall: zod_1.z.strictObject({
        domain_score: core_1.domainScoreSchema.nullable(),
        delta_display: core_1.deltaDisplaySchema.nullable(),
    }),
    acara_phase: zod_1.z.string().min(1).nullable(),
    readiness: enums_1.readinessSchema.nullable(),
    skills: zod_1.z.record(enums_1.displaySkillSchema, exports.diagnosticExportSkillSchema),
    vocab: exports.diagnosticExportVocabSchema,
    gate: exports.diagnosticExportGateSchema,
    error_patterns: zod_1.z.array(stored_result_1.errorPatternSchema),
    history: zod_1.z.array(exports.diagnosticExportHistoryPointSchema),
    caveats: zod_1.z.array(zod_1.z.string().min(1)).min(1),
});
/** The only accepted value of the `format` query param (400 on anything else). */
exports.DIAGNOSTIC_JSON_FORMAT = 'diagnostic_json';
