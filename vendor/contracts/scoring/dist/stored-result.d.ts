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
import { z } from 'zod';
/**
 * spec v2 §5.7 — distractor types aggregated over incorrect, reached,
 * non-rapid-guess responses. Suppressed entirely below MIN_ERRORS_FOR_PATTERNS,
 * so a listed pattern always has at least one response behind it.
 */
export declare const errorPatternSchema: z.ZodObject<{
    type: z.ZodEnum<{
        literal_match: "literal_match";
        overinference: "overinference";
        world_knowledge: "world_knowledge";
        grammatical_decoy: "grammatical_decoy";
        phonological_neighbour: "phonological_neighbour";
        orthographic_neighbour: "orthographic_neighbour";
        semantic_neighbour: "semantic_neighbour";
    }>;
    count: z.ZodNumber;
    pct: z.ZodNumber;
}, z.core.$strict>;
export type ErrorPattern = z.infer<typeof errorPatternSchema>;
/**
 * One assessed attribute (spec v2 §5.1): R's posterior and expected score plus
 * the band Strapi derived from `prob` (§5.2). `prob`/`prob_se` are audit fields.
 */
export declare const storedAttributeScoredSchema: z.ZodObject<{
    prob: z.ZodNumber;
    prob_se: z.ZodNumber;
    domain_score: z.ZodNumber;
    se: z.ZodNumber;
    items_seen: z.ZodNumber;
    status: z.ZodEnum<{
        secure: "secure";
        developing: "developing";
        emerging: "emerging";
        not_yet: "not_yet";
    }>;
}, z.core.$strict>;
export type StoredAttributeScored = z.infer<typeof storedAttributeScoredSchema>;
/**
 * Either the full claim or the not-assessed object. §5.3 drops the numeric
 * fields below the minimum-evidence floor — they stay in the audit record — so
 * there is no shape that carries a score without enough evidence to justify it.
 */
export declare const storedAttributeSchema: z.ZodUnion<readonly [z.ZodObject<{
    prob: z.ZodNumber;
    prob_se: z.ZodNumber;
    domain_score: z.ZodNumber;
    se: z.ZodNumber;
    items_seen: z.ZodNumber;
    status: z.ZodEnum<{
        secure: "secure";
        developing: "developing";
        emerging: "emerging";
        not_yet: "not_yet";
    }>;
}, z.core.$strict>, z.ZodObject<{
    status: z.ZodLiteral<"not_assessed">;
    insufficient_evidence: z.ZodOptional<z.ZodBoolean>;
    items_seen: z.ZodNumber;
}, z.core.$strict>]>;
export type StoredAttribute = z.infer<typeof storedAttributeSchema>;
/** spec v2 §5.1 — the pooled Rasch headline. `provisional_transform` is the transform flag. */
export declare const storedOverallSchema: z.ZodObject<{
    theta: z.ZodNumber;
    theta_se: z.ZodNumber;
    domain_score: z.ZodNumber;
    provisional_transform: z.ZodBoolean;
}, z.core.$strict>;
export type StoredOverall = z.infer<typeof storedOverallSchema>;
/** spec v2 §5.1 / §2.5 — Section 3 as stored, including the not-reached form. */
export declare const storedGateSchema: z.ZodUnion<readonly [z.ZodObject<{
    passed: z.ZodNull;
}, z.core.$strict>, z.ZodObject<{
    passed: z.ZodBoolean;
    theta: z.ZodNumber;
    se: z.ZodNumber;
    domain_score: z.ZodNumber;
    provisional_cut: z.ZodBoolean;
}, z.core.$strict>]>;
export type StoredGate = z.infer<typeof storedGateSchema>;
/**
 * Academic Vocabulary as stored (spec 4 §4) — the 2G Rasch strand, stored the
 * way the gate is, but BANDED instead of passed/failed:
 *
 * - not reached (or an incomplete attempt withheld) is the not-assessed object,
 *   never a zero;
 * - reached carries R's theta and SE (logits, audit), the provisional-linear
 *   domain score, the evidence count, and the four-step band Strapi cut from the
 *   DOMAIN SCORE with the active Crosswalk's provisional Academic cuts (it has no
 *   posterior, so the .20/.50/.80 posterior cuts never apply). `band` is null
 *   only when the active Crosswalk carries no Academic cuts: measured, not
 *   banded — a band is never guessed. `provisional_cut` stays true until
 *   standard setting replaces the placeholder cuts.
 */
export declare const storedAcademicVocabSchema: z.ZodUnion<readonly [z.ZodObject<{
    status: z.ZodLiteral<"not_assessed">;
    insufficient_evidence: z.ZodOptional<z.ZodBoolean>;
    items_seen: z.ZodNumber;
}, z.core.$strict>, z.ZodObject<{
    theta: z.ZodNumber;
    se: z.ZodNumber;
    domain_score: z.ZodNumber;
    items_seen: z.ZodNumber;
    band: z.ZodNullable<z.ZodEnum<{
        secure: "secure";
        developing: "developing";
        emerging: "emerging";
        not_yet: "not_yet";
    }>>;
    provisional_cut: z.ZodBoolean;
}, z.core.$strict>]>;
export type StoredAcademicVocab = z.infer<typeof storedAcademicVocabSchema>;
/**
 * One vocabulary strand as stored (spec v2 §5.4 — "store both strand statuses
 * too"). An unreached strand is the not-assessed object, never a zero.
 */
export declare const storedVocabStrandSchema: z.ZodUnion<readonly [z.ZodObject<{
    domain_score: z.ZodNumber;
    se: z.ZodNumber;
    items_seen: z.ZodNumber;
    status: z.ZodEnum<{
        secure: "secure";
        developing: "developing";
        emerging: "emerging";
        not_yet: "not_yet";
    }>;
}, z.core.$strict>, z.ZodObject<{
    status: z.ZodLiteral<"not_assessed">;
    insufficient_evidence: z.ZodOptional<z.ZodBoolean>;
    items_seen: z.ZodNumber;
}, z.core.$strict>]>;
export type StoredVocabStrand = z.infer<typeof storedVocabStrandSchema>;
/**
 * The two vocabulary strands as stored (spec v2 §5.4), Vocab_A2 and Vocab_B1,
 * side by side — no blended figure.
 *
 * `z.object`, not `strictObject`, and on purpose: rows written before the blend
 * was retired still carry `blended`/`blended_se`/`status`/`single_strand` in
 * their stored `vocab` column. Stripping those keys on read keeps every existing
 * row valid with no data migration; nothing reads them.
 */
export declare const storedVocabSchema: z.ZodObject<{
    a2: z.ZodUnion<readonly [z.ZodObject<{
        domain_score: z.ZodNumber;
        se: z.ZodNumber;
        items_seen: z.ZodNumber;
        status: z.ZodEnum<{
            secure: "secure";
            developing: "developing";
            emerging: "emerging";
            not_yet: "not_yet";
        }>;
    }, z.core.$strict>, z.ZodObject<{
        status: z.ZodLiteral<"not_assessed">;
        insufficient_evidence: z.ZodOptional<z.ZodBoolean>;
        items_seen: z.ZodNumber;
    }, z.core.$strict>]>;
    b1: z.ZodUnion<readonly [z.ZodObject<{
        domain_score: z.ZodNumber;
        se: z.ZodNumber;
        items_seen: z.ZodNumber;
        status: z.ZodEnum<{
            secure: "secure";
            developing: "developing";
            emerging: "emerging";
            not_yet: "not_yet";
        }>;
    }, z.core.$strict>, z.ZodObject<{
        status: z.ZodLiteral<"not_assessed">;
        insufficient_evidence: z.ZodOptional<z.ZodBoolean>;
        items_seen: z.ZodNumber;
    }, z.core.$strict>]>;
}, z.core.$strip>;
export type StoredVocab = z.infer<typeof storedVocabSchema>;
/**
 * spec v2 §5.1. `attributes` is PARTIAL over the seven: a skill whose matrix was
 * never reached is absent rather than present-and-empty.
 */
export declare const storedResultSchema: z.ZodObject<{
    model_version: z.ZodEnum<{
        "reading-3model/1": "reading-3model/1";
        "listening-r7/1": "listening-r7/1";
        "legacy-r7": "legacy-r7";
    }>;
    reference_sets_version: z.ZodString;
    attributes: z.ZodRecord<z.ZodEnum<{
        Decoding: "Decoding";
        Vocab_A2: "Vocab_A2";
        Grammar: "Grammar";
        Vocab_B1: "Vocab_B1";
        Gist: "Gist";
        Detail: "Detail";
        Inference: "Inference";
    }> & z.core.$partial, z.ZodUnion<readonly [z.ZodObject<{
        prob: z.ZodNumber;
        prob_se: z.ZodNumber;
        domain_score: z.ZodNumber;
        se: z.ZodNumber;
        items_seen: z.ZodNumber;
        status: z.ZodEnum<{
            secure: "secure";
            developing: "developing";
            emerging: "emerging";
            not_yet: "not_yet";
        }>;
    }, z.core.$strict>, z.ZodObject<{
        status: z.ZodLiteral<"not_assessed">;
        insufficient_evidence: z.ZodOptional<z.ZodBoolean>;
        items_seen: z.ZodNumber;
    }, z.core.$strict>]>>;
    overall: z.ZodObject<{
        theta: z.ZodNumber;
        theta_se: z.ZodNumber;
        domain_score: z.ZodNumber;
        provisional_transform: z.ZodBoolean;
    }, z.core.$strict>;
    gate: z.ZodUnion<readonly [z.ZodObject<{
        passed: z.ZodNull;
    }, z.core.$strict>, z.ZodObject<{
        passed: z.ZodBoolean;
        theta: z.ZodNumber;
        se: z.ZodNumber;
        domain_score: z.ZodNumber;
        provisional_cut: z.ZodBoolean;
    }, z.core.$strict>]>;
    academic_vocab: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
        status: z.ZodLiteral<"not_assessed">;
        insufficient_evidence: z.ZodOptional<z.ZodBoolean>;
        items_seen: z.ZodNumber;
    }, z.core.$strict>, z.ZodObject<{
        theta: z.ZodNumber;
        se: z.ZodNumber;
        domain_score: z.ZodNumber;
        items_seen: z.ZodNumber;
        band: z.ZodNullable<z.ZodEnum<{
            secure: "secure";
            developing: "developing";
            emerging: "emerging";
            not_yet: "not_yet";
        }>>;
        provisional_cut: z.ZodBoolean;
    }, z.core.$strict>]>>;
    vocab: z.ZodObject<{
        a2: z.ZodUnion<readonly [z.ZodObject<{
            domain_score: z.ZodNumber;
            se: z.ZodNumber;
            items_seen: z.ZodNumber;
            status: z.ZodEnum<{
                secure: "secure";
                developing: "developing";
                emerging: "emerging";
                not_yet: "not_yet";
            }>;
        }, z.core.$strict>, z.ZodObject<{
            status: z.ZodLiteral<"not_assessed">;
            insufficient_evidence: z.ZodOptional<z.ZodBoolean>;
            items_seen: z.ZodNumber;
        }, z.core.$strict>]>;
        b1: z.ZodUnion<readonly [z.ZodObject<{
            domain_score: z.ZodNumber;
            se: z.ZodNumber;
            items_seen: z.ZodNumber;
            status: z.ZodEnum<{
                secure: "secure";
                developing: "developing";
                emerging: "emerging";
                not_yet: "not_yet";
            }>;
        }, z.core.$strict>, z.ZodObject<{
            status: z.ZodLiteral<"not_assessed">;
            insufficient_evidence: z.ZodOptional<z.ZodBoolean>;
            items_seen: z.ZodNumber;
        }, z.core.$strict>]>;
    }, z.core.$strip>;
    error_patterns: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<{
            literal_match: "literal_match";
            overinference: "overinference";
            world_knowledge: "world_knowledge";
            grammatical_decoy: "grammatical_decoy";
            phonological_neighbour: "phonological_neighbour";
            orthographic_neighbour: "orthographic_neighbour";
            semantic_neighbour: "semantic_neighbour";
        }>;
        count: z.ZodNumber;
        pct: z.ZodNumber;
    }, z.core.$strict>>;
    effort_valid: z.ZodBoolean;
    low_confidence: z.ZodNullable<z.ZodBoolean>;
}, z.core.$strict>;
export type StoredResult = z.infer<typeof storedResultSchema>;
