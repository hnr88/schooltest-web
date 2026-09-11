/**
 * `score-resp/1` — the ONLY response shape the R sidecar returns (spec v2 §2).
 *
 * R owns psychometrics and nothing else (house rule 3): posteriors, expected
 * domain scores, theta, SE and the gate boolean are here; bands, blend, ACARA
 * phase, growth, error patterns and effort validity are Strapi's and appear only
 * in `storedResultSchema` / `resultViewSchema`.
 */
import { z } from 'zod';
export declare const SCORE_RESPONSE_SCHEMA_VERSION = "score-resp/1";
/**
 * spec v2 §2.1 — Matrix 1 (DINA) over the four admissible profiles only.
 * `attributes` is a tuple of literals: R ECHOES the canonical order (§2.6) and a
 * reordered echo is a contract violation, not a detail to normalise downstream.
 */
export declare const matrix1BlockSchema: z.ZodObject<{
    attributes: z.ZodTuple<[z.ZodLiteral<"Decoding">, z.ZodLiteral<"Vocab_A2">, z.ZodLiteral<"Grammar">], null>;
    profile_posterior: z.ZodArray<z.ZodNumber>;
    map_profile: z.ZodArray<z.ZodLiteral<0 | 1>>;
    items_scored: z.ZodNumber;
}, z.core.$strict>;
export type Matrix1Block = z.infer<typeof matrix1BlockSchema>;
/** spec v2 §2.2 — Matrix 2 (G-DINA) over the sixteen saturated profiles. */
export declare const matrix2BlockSchema: z.ZodObject<{
    attributes: z.ZodTuple<[z.ZodLiteral<"Vocab_B1">, z.ZodLiteral<"Gist">, z.ZodLiteral<"Detail">, z.ZodLiteral<"Inference">], null>;
    profile_posterior: z.ZodArray<z.ZodNumber>;
    map_profile: z.ZodArray<z.ZodLiteral<0 | 1>>;
    items_scored: z.ZodNumber;
}, z.core.$strict>;
export type Matrix2Block = z.infer<typeof matrix2BlockSchema>;
/** Marginal posterior for one attribute (spec v2 §2.1). Audit fields — no client renders them. */
export declare const attributePosteriorSchema: z.ZodObject<{
    prob: z.ZodNumber;
    prob_se: z.ZodNumber;
    items_seen: z.ZodNumber;
}, z.core.$strict>;
export type AttributePosterior = z.infer<typeof attributePosteriorSchema>;
/** Expected domain score for one attribute over its reference set (spec v2 §2.3). */
export declare const attributeScoreSchema: z.ZodObject<{
    domain_score: z.ZodNumber;
    se: z.ZodNumber;
}, z.core.$strict>;
export type AttributeScore = z.infer<typeof attributeScoreSchema>;
/** spec v2 §2.4 — pooled fixed-parameter Rasch over every reached core item. */
export declare const scaleScoreSchema: z.ZodObject<{
    theta: z.ZodNumber;
    se: z.ZodNumber;
    domain_score: z.ZodNumber;
    provisional_transform: z.ZodBoolean;
}, z.core.$strict>;
export type ScaleScore = z.infer<typeof scaleScoreSchema>;
/**
 * spec v2 §2.5 — Section 3. Stage 3 not reached yields `{ passed: null }` AND
 * NOTHING ELSE: a theta with no items behind it would be an invented value.
 */
export declare const gateSchema: z.ZodUnion<readonly [z.ZodObject<{
    passed: z.ZodNull;
}, z.core.$strict>, z.ZodObject<{
    passed: z.ZodBoolean;
    theta: z.ZodNumber;
    se: z.ZodNumber;
    domain_score: z.ZodNumber;
    provisional_cut: z.ZodBoolean;
}, z.core.$strict>]>;
export type Gate = z.infer<typeof gateSchema>;
/** spec v2 §2.6 — informative, never blocking; persisted for audit. */
export declare const scoringWarningSchema: z.ZodObject<{
    code: z.ZodString;
    detail: z.ZodString;
}, z.core.$strict>;
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
export declare const scoreResponseSchema: z.ZodObject<{
    schema_version: z.ZodLiteral<"score-resp/1">;
    model_version: z.ZodLiteral<"reading-3model/1">;
    session_key: z.ZodString;
    reference_sets_version: z.ZodString;
    items_scored: z.ZodNumber;
    matrix_1: z.ZodOptional<z.ZodObject<{
        attributes: z.ZodTuple<[z.ZodLiteral<"Decoding">, z.ZodLiteral<"Vocab_A2">, z.ZodLiteral<"Grammar">], null>;
        profile_posterior: z.ZodArray<z.ZodNumber>;
        map_profile: z.ZodArray<z.ZodLiteral<0 | 1>>;
        items_scored: z.ZodNumber;
    }, z.core.$strict>>;
    matrix_2: z.ZodOptional<z.ZodObject<{
        attributes: z.ZodTuple<[z.ZodLiteral<"Vocab_B1">, z.ZodLiteral<"Gist">, z.ZodLiteral<"Detail">, z.ZodLiteral<"Inference">], null>;
        profile_posterior: z.ZodArray<z.ZodNumber>;
        map_profile: z.ZodArray<z.ZodLiteral<0 | 1>>;
        items_scored: z.ZodNumber;
    }, z.core.$strict>>;
    attribute_posteriors: z.ZodRecord<z.ZodEnum<{
        Decoding: "Decoding";
        Vocab_A2: "Vocab_A2";
        Grammar: "Grammar";
        Vocab_B1: "Vocab_B1";
        Gist: "Gist";
        Detail: "Detail";
        Inference: "Inference";
    }> & z.core.$partial, z.ZodObject<{
        prob: z.ZodNumber;
        prob_se: z.ZodNumber;
        items_seen: z.ZodNumber;
    }, z.core.$strict>>;
    attribute_scores: z.ZodRecord<z.ZodEnum<{
        Decoding: "Decoding";
        Vocab_A2: "Vocab_A2";
        Grammar: "Grammar";
        Vocab_B1: "Vocab_B1";
        Gist: "Gist";
        Detail: "Detail";
        Inference: "Inference";
    }> & z.core.$partial, z.ZodObject<{
        domain_score: z.ZodNumber;
        se: z.ZodNumber;
    }, z.core.$strict>>;
    scale_score: z.ZodOptional<z.ZodObject<{
        theta: z.ZodNumber;
        se: z.ZodNumber;
        domain_score: z.ZodNumber;
        provisional_transform: z.ZodBoolean;
    }, z.core.$strict>>;
    gate: z.ZodUnion<readonly [z.ZodObject<{
        passed: z.ZodNull;
    }, z.core.$strict>, z.ZodObject<{
        passed: z.ZodBoolean;
        theta: z.ZodNumber;
        se: z.ZodNumber;
        domain_score: z.ZodNumber;
        provisional_cut: z.ZodBoolean;
    }, z.core.$strict>]>;
    warnings: z.ZodArray<z.ZodObject<{
        code: z.ZodString;
        detail: z.ZodString;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type ScoreResponse = z.infer<typeof scoreResponseSchema>;
