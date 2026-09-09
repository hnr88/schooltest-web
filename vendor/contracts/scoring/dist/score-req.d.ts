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
export declare const SCORE_REQUEST_SCHEMA_VERSION = "score-req/1";
/**
 * DINA / G-DINA parameters copied VERBATIM from the Item (spec v2 §3.1.4) —
 * `{ slip, guess }` for DINA, the delta vector for a saturated G-DINA item.
 * Missing params fail assembly loudly in the worker; they are never defaulted.
 */
export declare const itemParamsSchema: z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodNumber, z.ZodArray<z.ZodNumber>]>>;
export type ItemParams = z.infer<typeof itemParamsSchema>;
/**
 * One reached, core response (spec v2 §3.1). Not-reached and supplementary rows
 * are excluded by the assembler and can never appear here.
 *
 * The cross-field rules are memo §1 made unfalsifiable on the wire: stage 3 is
 * held out of the CDM, so it is exactly the rows with no matrix and no Q-vector,
 * and a Q-vector's width is fixed by its matrix.
 */
export declare const scoreRequestResponseSchema: z.ZodObject<{
    item_code: z.ZodString;
    score: z.ZodLiteral<0 | 1>;
    stage: z.ZodLiteral<3 | 1 | 2>;
    attribute_vector: z.ZodNullable<z.ZodArray<z.ZodLiteral<0 | 1>>>;
    matrix: z.ZodNullable<z.ZodLiteral<1 | 2>>;
    model_type: z.ZodEnum<{
        dina: "dina";
        gdina: "gdina";
        rasch: "rasch";
    }>;
    params: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodNumber, z.ZodArray<z.ZodNumber>]>>>;
    anchor: z.ZodBoolean;
    block_id: z.ZodNullable<z.ZodString>;
    difficulty: z.ZodNullable<z.ZodNumber>;
}, z.core.$strict>;
export type ScoreRequestResponse = z.infer<typeof scoreRequestResponseSchema>;
/** One reference item for a skill's expected domain score (memo §5, spec v2 §3.2). */
export declare const referenceItemSchema: z.ZodObject<{
    item_code: z.ZodString;
    attribute_vector: z.ZodArray<z.ZodLiteral<0 | 1>>;
    params: z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodNumber, z.ZodArray<z.ZodNumber>]>>;
}, z.core.$strict>;
export type ReferenceItem = z.infer<typeof referenceItemSchema>;
/** One Rasch pool member: item code plus its fixed calibrated difficulty. */
export declare const raschPoolItemSchema: z.ZodObject<{
    item_code: z.ZodString;
    difficulty: z.ZodNumber;
}, z.core.$strict>;
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
export declare const overallTransformSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    kind: z.ZodLiteral<"linear">;
    a: z.ZodNumber;
    b: z.ZodNumber;
}, z.core.$strict>, z.ZodObject<{
    kind: z.ZodLiteral<"tcc">;
}, z.core.$strict>], "kind">;
export type OverallTransform = z.infer<typeof overallTransformSchema>;
export declare const overallPoolSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        item_code: z.ZodString;
        difficulty: z.ZodNumber;
    }, z.core.$strict>>;
    transform: z.ZodDiscriminatedUnion<[z.ZodObject<{
        kind: z.ZodLiteral<"linear">;
        a: z.ZodNumber;
        b: z.ZodNumber;
    }, z.core.$strict>, z.ZodObject<{
        kind: z.ZodLiteral<"tcc">;
    }, z.core.$strict>], "kind">;
}, z.core.$strict>;
export type OverallPool = z.infer<typeof overallPoolSchema>;
/**
 * Section 3's Rasch pool and its exit cut. `provisional` stays true while the
 * junior/senior cuts are placeholders (memo §4, §9).
 */
export declare const section3PoolSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        item_code: z.ZodString;
        difficulty: z.ZodNumber;
    }, z.core.$strict>>;
    cut: z.ZodNumber;
    provisional: z.ZodBoolean;
}, z.core.$strict>;
export type Section3Pool = z.infer<typeof section3PoolSchema>;
/**
 * spec v2 §3.2. `skills` is PARTIAL over the seven attributes: a skill with no
 * reference set yet simply has no key, and R omits it from both output blocks.
 */
export declare const referenceSetsSchema: z.ZodObject<{
    version: z.ZodString;
    skills: z.ZodRecord<z.ZodEnum<{
        Decoding: "Decoding";
        Vocab_A2: "Vocab_A2";
        Grammar: "Grammar";
        Vocab_B1: "Vocab_B1";
        Gist: "Gist";
        Detail: "Detail";
        Inference: "Inference";
    }> & z.core.$partial, z.ZodArray<z.ZodObject<{
        item_code: z.ZodString;
        attribute_vector: z.ZodArray<z.ZodLiteral<0 | 1>>;
        params: z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodNumber, z.ZodArray<z.ZodNumber>]>>;
    }, z.core.$strict>>>;
    overall_pool: z.ZodObject<{
        items: z.ZodArray<z.ZodObject<{
            item_code: z.ZodString;
            difficulty: z.ZodNumber;
        }, z.core.$strict>>;
        transform: z.ZodDiscriminatedUnion<[z.ZodObject<{
            kind: z.ZodLiteral<"linear">;
            a: z.ZodNumber;
            b: z.ZodNumber;
        }, z.core.$strict>, z.ZodObject<{
            kind: z.ZodLiteral<"tcc">;
        }, z.core.$strict>], "kind">;
    }, z.core.$strict>;
    section3_pool: z.ZodObject<{
        items: z.ZodArray<z.ZodObject<{
            item_code: z.ZodString;
            difficulty: z.ZodNumber;
        }, z.core.$strict>>;
        cut: z.ZodNumber;
        provisional: z.ZodBoolean;
    }, z.core.$strict>;
}, z.core.$strict>;
export type ReferenceSets = z.infer<typeof referenceSetsSchema>;
/** spec v2 §3.3 — the versioned envelope. R answers 422 `schema_mismatch` to any other pair. */
export declare const scoreRequestSchema: z.ZodObject<{
    schema_version: z.ZodLiteral<"score-req/1">;
    model_version: z.ZodLiteral<"reading-3model/1">;
    session_key: z.ZodString;
    responses: z.ZodArray<z.ZodObject<{
        item_code: z.ZodString;
        score: z.ZodLiteral<0 | 1>;
        stage: z.ZodLiteral<3 | 1 | 2>;
        attribute_vector: z.ZodNullable<z.ZodArray<z.ZodLiteral<0 | 1>>>;
        matrix: z.ZodNullable<z.ZodLiteral<1 | 2>>;
        model_type: z.ZodEnum<{
            dina: "dina";
            gdina: "gdina";
            rasch: "rasch";
        }>;
        params: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodNumber, z.ZodArray<z.ZodNumber>]>>>;
        anchor: z.ZodBoolean;
        block_id: z.ZodNullable<z.ZodString>;
        difficulty: z.ZodNullable<z.ZodNumber>;
    }, z.core.$strict>>;
    reference_sets: z.ZodObject<{
        version: z.ZodString;
        skills: z.ZodRecord<z.ZodEnum<{
            Decoding: "Decoding";
            Vocab_A2: "Vocab_A2";
            Grammar: "Grammar";
            Vocab_B1: "Vocab_B1";
            Gist: "Gist";
            Detail: "Detail";
            Inference: "Inference";
        }> & z.core.$partial, z.ZodArray<z.ZodObject<{
            item_code: z.ZodString;
            attribute_vector: z.ZodArray<z.ZodLiteral<0 | 1>>;
            params: z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodNumber, z.ZodArray<z.ZodNumber>]>>;
        }, z.core.$strict>>>;
        overall_pool: z.ZodObject<{
            items: z.ZodArray<z.ZodObject<{
                item_code: z.ZodString;
                difficulty: z.ZodNumber;
            }, z.core.$strict>>;
            transform: z.ZodDiscriminatedUnion<[z.ZodObject<{
                kind: z.ZodLiteral<"linear">;
                a: z.ZodNumber;
                b: z.ZodNumber;
            }, z.core.$strict>, z.ZodObject<{
                kind: z.ZodLiteral<"tcc">;
            }, z.core.$strict>], "kind">;
        }, z.core.$strict>;
        section3_pool: z.ZodObject<{
            items: z.ZodArray<z.ZodObject<{
                item_code: z.ZodString;
                difficulty: z.ZodNumber;
            }, z.core.$strict>>;
            cut: z.ZodNumber;
            provisional: z.ZodBoolean;
        }, z.core.$strict>;
    }, z.core.$strict>;
}, z.core.$strict>;
export type ScoreRequest = z.infer<typeof scoreRequestSchema>;
