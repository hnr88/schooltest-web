"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vocabStrandNameSchema = exports.provisionalSchema = exports.cefrBandSchema = exports.readinessSchema = exports.resultDestinationSchema = exports.resultStatusSchema = exports.resultScopeSchema = exports.skillSchema = exports.errorPatternTypeSchema = exports.stageSchema = exports.matrixIdSchema = exports.scoringModelTypeSchema = exports.currentModelVersionSchema = exports.modelVersionSchema = exports.LEGACY_MODEL_VERSION = exports.LISTENING_MODEL_VERSION = exports.MODEL_VERSION = exports.assessedBandSchema = exports.bandSchema = exports.displaySkillSchema = exports.attributeNameSchema = void 0;
/**
 * Every controlled vocabulary the scoring contract needs, in ONE place.
 *
 * The values that also exist in `schooltest-api/src/contracts/vocab.ts` are
 * repeated here BYTE-EXACT and cited to Doc 1 s.3: this package is portable and
 * cannot import from an app, and house rule 2 makes it the source of truth the
 * apps re-export from (tasks 02, 23, 25) rather than the other way round.
 */
const zod_1 = require("zod");
/**
 * The seven MODEL attributes, memo §2-§3 canonical order: Matrix 1 first
 * (Decoding, Vocab_A2, Grammar) then Matrix 2 (Vocab_B1, Gist, Detail,
 * Inference). Critical reading is NOT here — memo §1 holds Section 3 out of the
 * CDM entirely; it is a Rasch mini-scale reported as a display skill.
 */
exports.attributeNameSchema = zod_1.z.enum([
    'Decoding',
    'Vocab_A2',
    'Grammar',
    'Vocab_B1',
    'Gist',
    'Detail',
    'Inference',
]);
/**
 * The seven DISPLAY skills — the bars on screen (data contract §2.2, dashboard
 * §1.1 / §5). Not the same list as the model attributes: `Vocabulary` is the
 * items-seen-weighted blend of `Vocab_A2` + `Vocab_B1` (memo §7, data contract
 * §3) and `Critical` is the Section 3 graded score (data contract §4).
 */
exports.displaySkillSchema = zod_1.z.enum([
    'Decoding',
    'Vocabulary',
    'Grammar',
    'Gist',
    'Detail',
    'Inference',
    'Critical',
]);
/**
 * spec v2 §5.2 — FOUR bands off the posterior `prob` against the Crosswalk's
 * `label_rules` (secure >= .80, developing .50-.79, emerging .20-.49, not_yet
 * < .20), plus the not-assessed sentinel. The v1 platform enum
 * (`mastered/emerging/not_mastered`) and the teacher-tile enum
 * (`mastered/approaching/not_yet`) are both retired.
 */
exports.bandSchema = zod_1.z.enum(['secure', 'developing', 'emerging', 'not_yet', 'not_assessed']);
/**
 * The four REAL bands. An assessed attribute always has one of these; absence of
 * evidence is the separate `notAssessedSchema` branch, never a fifth band value
 * squeezed into a scored object.
 */
exports.assessedBandSchema = zod_1.z.enum(['secure', 'developing', 'emerging', 'not_yet']);
/** memo §1 / spec v2 §8 `MODEL_VERSION` — the decided three-model reading scorer. */
exports.MODEL_VERSION = 'reading-3model/1';
/**
 * Task 08b — the LISTENING scorer's version, the other value a score-req/1
 * envelope may carry. Listening still runs the frozen 7-column L1..L7 scorer
 * (q-matrix.ts "frozen 7-column model"); no versioned name existed in the tree,
 * so this is minted fresh. R routes on model_version: this value takes the
 * generic path, MODEL_VERSION the two-matrix reading path. `legacy-r7` is a
 * stored-result isolation tag only — R never accepts it on the wire.
 */
exports.LISTENING_MODEL_VERSION = 'listening-r7/1';
/** memo §7 — the retired 24-profile joint model. Isolated, never comparable. */
exports.LEGACY_MODEL_VERSION = 'legacy-r7';
exports.modelVersionSchema = zod_1.z.enum([
    exports.MODEL_VERSION,
    exports.LISTENING_MODEL_VERSION,
    exports.LEGACY_MODEL_VERSION,
]);
/** The READING model version as a literal — the value the reading wire envelope carries. */
exports.currentModelVersionSchema = zod_1.z.literal(exports.MODEL_VERSION);
/**
 * memo §1 — one model per section. `rasch` is new alongside Doc 1 s.3.17's
 * `dina`/`gdina`: Section 3 and the pooled overall are fixed-parameter Rasch.
 */
exports.scoringModelTypeSchema = zod_1.z.enum(['dina', 'gdina', 'rasch']);
/** Which CDM an item loads on. `null` on stage 3 (spec v2 §3.1.1). */
exports.matrixIdSchema = zod_1.z.literal([1, 2]);
/** Doc 1 s.3.4 `stage` — receptive routing stage. */
exports.stageSchema = zod_1.z.literal([1, 2, 3]);
/** Doc 1 s.3.15 `distractor_type` — the aggregation keys of spec v2 §5.7. */
exports.errorPatternTypeSchema = zod_1.z.enum([
    'literal_match',
    'overinference',
    'world_knowledge',
    'grammatical_decoy',
    'phonological_neighbour',
    'orthographic_neighbour',
    'semantic_neighbour',
]);
/** Doc 1 s.3.1 `skill`. */
exports.skillSchema = zod_1.z.enum(['reading', 'listening', 'speaking', 'writing']);
/** spec v2 §6.3 `scope` — the two skill families a result can report on. */
exports.resultScopeSchema = zod_1.z.enum(['receptive', 'productive']);
/**
 * Doc 1 s.3.8 `result_status`. `manual_scoring` (scoring/09, C-RSC-1) is the
 * module's only enum change: a result raised to the assessment team after its
 * R retries were exhausted. A reader that has not widened throws on the
 * unknown member, so every declaration of this vocabulary moves together.
 */
exports.resultStatusSchema = zod_1.z.enum([
    'scoring',
    'partial_pending',
    'complete',
    'scoring_failed',
    'manual_scoring',
]);
/** Doc 1 s.3.19 `result_destination`. House rule 10: transient never aggregates. */
exports.resultDestinationSchema = zod_1.z.enum(['transient', 'official']);
/** Doc 1 s.3.18 `readiness`. */
exports.readinessSchema = zod_1.z.enum(['met', 'approaching', 'not_yet', 'not_assessed']);
/** Doc 1 s.3.9 `cefr_band`. Behind the existing flag on the view (spec v2 §6.3). */
exports.cefrBandSchema = zod_1.z.enum(['pre_A1', 'A1', 'A2', 'B1', 'B2', 'C1']);
/**
 * Doc 4 s.2 field-test banner. spec v2 §5.1: "the existing top-level
 * `provisional` (enum `field_test`) is untouched" — it is NOT the transform
 * flag, which is `overall.provisional_transform`.
 */
exports.provisionalSchema = zod_1.z.literal('field_test');
/** Which vocabulary strand carried a blend on its own (spec v2 §5.4). */
exports.vocabStrandNameSchema = zod_1.z.enum(['a2', 'b1']);
