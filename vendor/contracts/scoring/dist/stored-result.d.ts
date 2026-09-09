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
 * spec v2 §5.4 — the items-seen-weighted blend of Vocab_A2 and Vocab_B1.
 *
 * `status` is a `bandSchema` and not the four-band `assessedBandSchema`: a blend
 * has no posterior of its own, so its band is borrowed from the strand with more
 * `items_seen` (tie -> the lower band) and is `not_assessed` when neither strand
 * was reached. `blended` is then null — never 0 (data contract §8).
 */
export declare const storedVocabSchema: z.ZodObject<{
    blended: z.ZodNullable<z.ZodNumber>;
    blended_se: z.ZodNullable<z.ZodNumber>;
    status: z.ZodEnum<{
        secure: "secure";
        developing: "developing";
        emerging: "emerging";
        not_yet: "not_yet";
        not_assessed: "not_assessed";
    }>;
    single_strand: z.ZodNullable<z.ZodEnum<{
        a2: "a2";
        b1: "b1";
    }>>;
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
}, z.core.$strict>;
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
    vocab: z.ZodObject<{
        blended: z.ZodNullable<z.ZodNumber>;
        blended_se: z.ZodNullable<z.ZodNumber>;
        status: z.ZodEnum<{
            secure: "secure";
            developing: "developing";
            emerging: "emerging";
            not_yet: "not_yet";
            not_assessed: "not_assessed";
        }>;
        single_strand: z.ZodNullable<z.ZodEnum<{
            a2: "a2";
            b1: "b1";
        }>>;
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
    }, z.core.$strict>;
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
