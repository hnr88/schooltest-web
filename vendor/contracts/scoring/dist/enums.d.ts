/**
 * Every controlled vocabulary the scoring contract needs, in ONE place.
 *
 * The values that also exist in `schooltest-api/src/contracts/vocab.ts` are
 * repeated here BYTE-EXACT and cited to Doc 1 s.3: this package is portable and
 * cannot import from an app, and house rule 2 makes it the source of truth the
 * apps re-export from (tasks 02, 23, 25) rather than the other way round.
 */
import { z } from 'zod';
/**
 * The seven MODEL attributes, memo §2-§3 canonical order: Matrix 1 first
 * (Decoding, Vocab_A2, Grammar) then Matrix 2 (Vocab_B1, Gist, Detail,
 * Inference). Critical reading is NOT here — memo §1 holds Section 3 out of the
 * CDM entirely; it is a Rasch mini-scale reported as a display skill.
 */
export declare const attributeNameSchema: z.ZodEnum<{
    Decoding: "Decoding";
    Vocab_A2: "Vocab_A2";
    Grammar: "Grammar";
    Vocab_B1: "Vocab_B1";
    Gist: "Gist";
    Detail: "Detail";
    Inference: "Inference";
}>;
export type AttributeName = z.infer<typeof attributeNameSchema>;
/**
 * The seven DISPLAY skills — the bars on screen (data contract §2.2, dashboard
 * §1.1 / §5). Not the same list as the model attributes: `Vocabulary` is the
 * items-seen-weighted blend of `Vocab_A2` + `Vocab_B1` (memo §7, data contract
 * §3) and `Critical` is the Section 3 graded score (data contract §4).
 */
export declare const displaySkillSchema: z.ZodEnum<{
    Decoding: "Decoding";
    Grammar: "Grammar";
    Gist: "Gist";
    Detail: "Detail";
    Inference: "Inference";
    Vocabulary: "Vocabulary";
    Critical: "Critical";
}>;
export type DisplaySkill = z.infer<typeof displaySkillSchema>;
/**
 * spec v2 §5.2 — FOUR bands off the posterior `prob` against the Crosswalk's
 * `label_rules` (secure >= .80, developing .50-.79, emerging .20-.49, not_yet
 * < .20), plus the not-assessed sentinel. The v1 platform enum
 * (`mastered/emerging/not_mastered`) and the teacher-tile enum
 * (`mastered/approaching/not_yet`) are both retired.
 */
export declare const bandSchema: z.ZodEnum<{
    secure: "secure";
    developing: "developing";
    emerging: "emerging";
    not_yet: "not_yet";
    not_assessed: "not_assessed";
}>;
export type Band = z.infer<typeof bandSchema>;
/**
 * The four REAL bands. An assessed attribute always has one of these; absence of
 * evidence is the separate `notAssessedSchema` branch, never a fifth band value
 * squeezed into a scored object.
 */
export declare const assessedBandSchema: z.ZodEnum<{
    secure: "secure";
    developing: "developing";
    emerging: "emerging";
    not_yet: "not_yet";
}>;
export type AssessedBand = z.infer<typeof assessedBandSchema>;
/** memo §1 / spec v2 §8 `MODEL_VERSION` — the decided three-model reading scorer. */
export declare const MODEL_VERSION = "reading-3model/1";
/**
 * Task 08b — the LISTENING scorer's version, the other value a score-req/1
 * envelope may carry. Listening still runs the frozen 7-column L1..L7 scorer
 * (q-matrix.ts "frozen 7-column model"); no versioned name existed in the tree,
 * so this is minted fresh. R routes on model_version: this value takes the
 * generic path, MODEL_VERSION the two-matrix reading path. `legacy-r7` is a
 * stored-result isolation tag only — R never accepts it on the wire.
 */
export declare const LISTENING_MODEL_VERSION = "listening-r7/1";
/** memo §7 — the retired 24-profile joint model. Isolated, never comparable. */
export declare const LEGACY_MODEL_VERSION = "legacy-r7";
export declare const modelVersionSchema: z.ZodEnum<{
    "reading-3model/1": "reading-3model/1";
    "listening-r7/1": "listening-r7/1";
    "legacy-r7": "legacy-r7";
}>;
export type ModelVersion = z.infer<typeof modelVersionSchema>;
/** The READING model version as a literal — the value the reading wire envelope carries. */
export declare const currentModelVersionSchema: z.ZodLiteral<"reading-3model/1">;
/**
 * memo §1 — one model per section. `rasch` is new alongside Doc 1 s.3.17's
 * `dina`/`gdina`: Section 3 and the pooled overall are fixed-parameter Rasch.
 */
export declare const scoringModelTypeSchema: z.ZodEnum<{
    dina: "dina";
    gdina: "gdina";
    rasch: "rasch";
}>;
export type ScoringModelType = z.infer<typeof scoringModelTypeSchema>;
/** Which CDM an item loads on. `null` on stage 3 (spec v2 §3.1.1). */
export declare const matrixIdSchema: z.ZodLiteral<1 | 2>;
export type MatrixId = z.infer<typeof matrixIdSchema>;
/** Doc 1 s.3.4 `stage` — receptive routing stage. */
export declare const stageSchema: z.ZodLiteral<3 | 1 | 2>;
export type Stage = z.infer<typeof stageSchema>;
/** Doc 1 s.3.15 `distractor_type` — the aggregation keys of spec v2 §5.7. */
export declare const errorPatternTypeSchema: z.ZodEnum<{
    literal_match: "literal_match";
    overinference: "overinference";
    world_knowledge: "world_knowledge";
    grammatical_decoy: "grammatical_decoy";
    phonological_neighbour: "phonological_neighbour";
    orthographic_neighbour: "orthographic_neighbour";
    semantic_neighbour: "semantic_neighbour";
}>;
export type ErrorPatternType = z.infer<typeof errorPatternTypeSchema>;
/** Doc 1 s.3.1 `skill`. */
export declare const skillSchema: z.ZodEnum<{
    reading: "reading";
    listening: "listening";
    speaking: "speaking";
    writing: "writing";
}>;
export type Skill = z.infer<typeof skillSchema>;
/** spec v2 §6.3 `scope` — the two skill families a result can report on. */
export declare const resultScopeSchema: z.ZodEnum<{
    receptive: "receptive";
    productive: "productive";
}>;
export type ResultScope = z.infer<typeof resultScopeSchema>;
/** Doc 1 s.3.8 `result_status`. */
export declare const resultStatusSchema: z.ZodEnum<{
    scoring: "scoring";
    partial_pending: "partial_pending";
    complete: "complete";
    scoring_failed: "scoring_failed";
}>;
export type ResultStatus = z.infer<typeof resultStatusSchema>;
/** Doc 1 s.3.19 `result_destination`. House rule 10: transient never aggregates. */
export declare const resultDestinationSchema: z.ZodEnum<{
    transient: "transient";
    official: "official";
}>;
export type ResultDestination = z.infer<typeof resultDestinationSchema>;
/** Doc 1 s.3.18 `readiness`. */
export declare const readinessSchema: z.ZodEnum<{
    not_yet: "not_yet";
    not_assessed: "not_assessed";
    met: "met";
    approaching: "approaching";
}>;
export type Readiness = z.infer<typeof readinessSchema>;
/** Doc 1 s.3.9 `cefr_band`. Behind the existing flag on the view (spec v2 §6.3). */
export declare const cefrBandSchema: z.ZodEnum<{
    pre_A1: "pre_A1";
    A1: "A1";
    A2: "A2";
    B1: "B1";
    B2: "B2";
    C1: "C1";
}>;
export type CefrBand = z.infer<typeof cefrBandSchema>;
/**
 * Doc 4 s.2 field-test banner. spec v2 §5.1: "the existing top-level
 * `provisional` (enum `field_test`) is untouched" — it is NOT the transform
 * flag, which is `overall.provisional_transform`.
 */
export declare const provisionalSchema: z.ZodLiteral<"field_test">;
export type Provisional = z.infer<typeof provisionalSchema>;
/** Which vocabulary strand carried a blend on its own (spec v2 §5.4). */
export declare const vocabStrandNameSchema: z.ZodEnum<{
    a2: "a2";
    b1: "b1";
}>;
export type VocabStrandName = z.infer<typeof vocabStrandNameSchema>;
