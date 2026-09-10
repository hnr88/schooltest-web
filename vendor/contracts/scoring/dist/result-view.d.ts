/**
 * `ResultView` v2 — the read model of GET /results/{documentId} (spec v2 §6.3).
 *
 * Dashboard D3: every judgment (band, reliable-change gating, band-movement vs
 * point delta, not-assessed) arrives precomputed. The client renders; it never
 * re-derives. Spec v2 §6.1: the only displayed numbers are
 * `overall.domain_score`, per-attribute `domain_score`, `vocab.blended` and
 * `gate.domain_score`; `prob`/`prob_se` ride along for audit and no client
 * renders them (dashboard §7 grep guard).
 *
 * This coexists with the API's v1 `resultViewSchema` until task 23 deletes that
 * one. Nothing here widens to accept the v1 shape.
 */
import { z } from 'zod';
/** Result-grain release states; session-grain states never belong in a view. */
export declare const resultViewReleaseStateSchema: z.ZodEnum<{
    held: "held";
    released: "released";
    recalled: "recalled";
    manual: "manual";
}>;
export type ResultViewReleaseState = z.infer<typeof resultViewReleaseStateSchema>;
/**
 * One assessed attribute on the view. `band_before`/`band_after` are present
 * only on the band-movement path (§6.2: a skill outside `ANCHORED_SKILLS` gets
 * `delta: null` and `delta_display: "band_movement"`, because a point delta
 * across unanchored forms is not a valid claim).
 */
export declare const resultViewAttributeScoredSchema: z.ZodObject<{
    band_before: z.ZodOptional<z.ZodEnum<{
        secure: "secure";
        developing: "developing";
        emerging: "emerging";
        not_yet: "not_yet";
        not_assessed: "not_assessed";
    }>>;
    band_after: z.ZodOptional<z.ZodEnum<{
        secure: "secure";
        developing: "developing";
        emerging: "emerging";
        not_yet: "not_yet";
        not_assessed: "not_assessed";
    }>>;
    delta: z.ZodNullable<z.ZodNumber>;
    delta_reliable: z.ZodNullable<z.ZodBoolean>;
    delta_display: z.ZodNullable<z.ZodUnion<readonly [z.ZodEnum<{
        steady: "steady";
        band_movement: "band_movement";
    }>, z.ZodString]>>;
    domain_score: z.ZodNumber;
    se: z.ZodNumber;
    status: z.ZodEnum<{
        secure: "secure";
        developing: "developing";
        emerging: "emerging";
        not_yet: "not_yet";
    }>;
    prob: z.ZodNumber;
    prob_se: z.ZodNumber;
    items_seen: z.ZodNumber;
}, z.core.$strict>;
export type ResultViewAttributeScored = z.infer<typeof resultViewAttributeScoredSchema>;
/** An unassessed attribute carries no score and no delta at all. */
export declare const resultViewAttributeSchema: z.ZodUnion<readonly [z.ZodObject<{
    band_before: z.ZodOptional<z.ZodEnum<{
        secure: "secure";
        developing: "developing";
        emerging: "emerging";
        not_yet: "not_yet";
        not_assessed: "not_assessed";
    }>>;
    band_after: z.ZodOptional<z.ZodEnum<{
        secure: "secure";
        developing: "developing";
        emerging: "emerging";
        not_yet: "not_yet";
        not_assessed: "not_assessed";
    }>>;
    delta: z.ZodNullable<z.ZodNumber>;
    delta_reliable: z.ZodNullable<z.ZodBoolean>;
    delta_display: z.ZodNullable<z.ZodUnion<readonly [z.ZodEnum<{
        steady: "steady";
        band_movement: "band_movement";
    }>, z.ZodString]>>;
    domain_score: z.ZodNumber;
    se: z.ZodNumber;
    status: z.ZodEnum<{
        secure: "secure";
        developing: "developing";
        emerging: "emerging";
        not_yet: "not_yet";
    }>;
    prob: z.ZodNumber;
    prob_se: z.ZodNumber;
    items_seen: z.ZodNumber;
}, z.core.$strict>, z.ZodObject<{
    status: z.ZodLiteral<"not_assessed">;
    insufficient_evidence: z.ZodOptional<z.ZodBoolean>;
    items_seen: z.ZodNumber;
}, z.core.$strict>]>;
export type ResultViewAttribute = z.infer<typeof resultViewAttributeSchema>;
/** spec v2 §6.3 — the headline score with its growth. Never the mean of subskills. */
export declare const resultViewOverallSchema: z.ZodObject<{
    delta: z.ZodNullable<z.ZodNumber>;
    delta_reliable: z.ZodNullable<z.ZodBoolean>;
    delta_display: z.ZodNullable<z.ZodUnion<readonly [z.ZodEnum<{
        steady: "steady";
        band_movement: "band_movement";
    }>, z.ZodString]>>;
    domain_score: z.ZodNullable<z.ZodNumber>;
    provisional_transform: z.ZodBoolean;
}, z.core.$strict>;
export type ResultViewOverall = z.infer<typeof resultViewOverallSchema>;
/** The PUBLIC gate subset: the graded score and the boolean, no theta (spec v2 §6.3). */
export declare const resultViewGateSchema: z.ZodObject<{
    passed: z.ZodNullable<z.ZodBoolean>;
    domain_score: z.ZodNullable<z.ZodNumber>;
    provisional_cut: z.ZodBoolean;
}, z.core.$strict>;
export type ResultViewGate = z.infer<typeof resultViewGateSchema>;
/** The strand detail behind the Vocabulary bar (spec v2 §6.3). */
export declare const resultViewVocabStrandSchema: z.ZodObject<{
    domain_score: z.ZodNullable<z.ZodNumber>;
}, z.core.$strict>;
export declare const resultViewVocabSchema: z.ZodObject<{
    a2: z.ZodObject<{
        domain_score: z.ZodNullable<z.ZodNumber>;
    }, z.core.$strict>;
    b1: z.ZodObject<{
        domain_score: z.ZodNullable<z.ZodNumber>;
    }, z.core.$strict>;
    single_strand: z.ZodNullable<z.ZodEnum<{
        a2: "a2";
        b1: "b1";
    }>>;
    delta: z.ZodNullable<z.ZodNumber>;
    delta_reliable: z.ZodNullable<z.ZodBoolean>;
    delta_display: z.ZodNullable<z.ZodUnion<readonly [z.ZodEnum<{
        steady: "steady";
        band_movement: "band_movement";
    }>, z.ZodString]>>;
    blended: z.ZodNullable<z.ZodNumber>;
    status: z.ZodEnum<{
        secure: "secure";
        developing: "developing";
        emerging: "emerging";
        not_yet: "not_yet";
        not_assessed: "not_assessed";
    }>;
}, z.core.$strict>;
export type ResultViewVocab = z.infer<typeof resultViewVocabSchema>;
/**
 * One point on the trend chart (dashboard §1.1). Keyed by the seven DISPLAY
 * skills — `Vocabulary` already blended, `Critical` the Section 3 graded score —
 * and exhaustive: every sitting reports all seven, `null` where that sitting did
 * not assess the skill. A `null` is an absence; it is never rendered as 0.
 */
export declare const resultHistoryPointSchema: z.ZodObject<{
    sat_at: z.ZodISODate;
    overall: z.ZodNullable<z.ZodNumber>;
    attributes: z.ZodRecord<z.ZodEnum<{
        Decoding: "Decoding";
        Grammar: "Grammar";
        Gist: "Gist";
        Detail: "Detail";
        Inference: "Inference";
        Vocabulary: "Vocabulary";
        Critical: "Critical";
    }>, z.ZodNullable<z.ZodNumber>>;
}, z.core.$strict>;
export type ResultHistoryPoint = z.infer<typeof resultHistoryPointSchema>;
/** Dashboard §1.1 — official, same-model-version sittings, oldest first, last 8. */
export declare const RESULT_HISTORY_MAX_POINTS = 8;
/**
 * The Doc 1 s.11.4 plain-language rendering, served only for
 * `?include=narrative` (spec v2 §6.3 keeps it unchanged).
 */
export declare const resultNarrativeSchema: z.ZodObject<{
    attribute_labels: z.ZodRecord<z.ZodString, z.ZodObject<{
        name: z.ZodString;
        descriptor: z.ZodString;
    }, z.core.$strict>>;
    change_since_last: z.ZodArray<z.ZodString>;
    weeks_since_previous: z.ZodNullable<z.ZodNumber>;
    plain_language: z.ZodArray<z.ZodString>;
}, z.core.$strict>;
export type ResultNarrative = z.infer<typeof resultNarrativeSchema>;
/**
 * spec v2 §6.3 exactly. `history` is OPTIONAL because it is included on
 * `GET /results/{id}` and omitted on `/my/students/results` for payload size —
 * omitted, not empty, so a roster row cannot be mistaken for a student with no
 * sittings. `acara_phase` stays a string: the Crosswalk owns the phase labels.
 */
export declare const resultViewSchema: z.ZodObject<{
    document_id: z.ZodString;
    session_document_id: z.ZodNullable<z.ZodString>;
    student_document_id: z.ZodString;
    skill: z.ZodEnum<{
        reading: "reading";
        listening: "listening";
        speaking: "speaking";
        writing: "writing";
    }>;
    scope: z.ZodEnum<{
        receptive: "receptive";
        productive: "productive";
    }>;
    status: z.ZodEnum<{
        scoring: "scoring";
        partial_pending: "partial_pending";
        complete: "complete";
        scoring_failed: "scoring_failed";
    }>;
    destination: z.ZodEnum<{
        transient: "transient";
        official: "official";
    }>;
    published_at: z.ZodNullable<z.ZodISODateTime>;
    recalled_at: z.ZodNullable<z.ZodISODateTime>;
    release_state: z.ZodEnum<{
        held: "held";
        released: "released";
        recalled: "recalled";
        manual: "manual";
    }>;
    provisional: z.ZodNullable<z.ZodLiteral<"field_test">>;
    model_version: z.ZodEnum<{
        "reading-3model/1": "reading-3model/1";
        "listening-r7/1": "listening-r7/1";
        "legacy-r7": "legacy-r7";
    }>;
    overall: z.ZodObject<{
        delta: z.ZodNullable<z.ZodNumber>;
        delta_reliable: z.ZodNullable<z.ZodBoolean>;
        delta_display: z.ZodNullable<z.ZodUnion<readonly [z.ZodEnum<{
            steady: "steady";
            band_movement: "band_movement";
        }>, z.ZodString]>>;
        domain_score: z.ZodNullable<z.ZodNumber>;
        provisional_transform: z.ZodBoolean;
    }, z.core.$strict>;
    acara_phase: z.ZodNullable<z.ZodString>;
    transitioning_attribute: z.ZodNullable<z.ZodString>;
    readiness: z.ZodNullable<z.ZodEnum<{
        not_yet: "not_yet";
        not_assessed: "not_assessed";
        met: "met";
        approaching: "approaching";
    }>>;
    gate: z.ZodObject<{
        passed: z.ZodNullable<z.ZodBoolean>;
        domain_score: z.ZodNullable<z.ZodNumber>;
        provisional_cut: z.ZodBoolean;
    }, z.core.$strict>;
    effort_valid: z.ZodNullable<z.ZodBoolean>;
    low_confidence: z.ZodNullable<z.ZodBoolean>;
    items_answered: z.ZodNumber;
    items_total: z.ZodNumber;
    duration_minutes: z.ZodNullable<z.ZodNumber>;
    attributes: z.ZodRecord<z.ZodEnum<{
        Decoding: "Decoding";
        Vocab_A2: "Vocab_A2";
        Grammar: "Grammar";
        Vocab_B1: "Vocab_B1";
        Gist: "Gist";
        Detail: "Detail";
        Inference: "Inference";
    }> & z.core.$partial, z.ZodUnion<readonly [z.ZodObject<{
        band_before: z.ZodOptional<z.ZodEnum<{
            secure: "secure";
            developing: "developing";
            emerging: "emerging";
            not_yet: "not_yet";
            not_assessed: "not_assessed";
        }>>;
        band_after: z.ZodOptional<z.ZodEnum<{
            secure: "secure";
            developing: "developing";
            emerging: "emerging";
            not_yet: "not_yet";
            not_assessed: "not_assessed";
        }>>;
        delta: z.ZodNullable<z.ZodNumber>;
        delta_reliable: z.ZodNullable<z.ZodBoolean>;
        delta_display: z.ZodNullable<z.ZodUnion<readonly [z.ZodEnum<{
            steady: "steady";
            band_movement: "band_movement";
        }>, z.ZodString]>>;
        domain_score: z.ZodNumber;
        se: z.ZodNumber;
        status: z.ZodEnum<{
            secure: "secure";
            developing: "developing";
            emerging: "emerging";
            not_yet: "not_yet";
        }>;
        prob: z.ZodNumber;
        prob_se: z.ZodNumber;
        items_seen: z.ZodNumber;
    }, z.core.$strict>, z.ZodObject<{
        status: z.ZodLiteral<"not_assessed">;
        insufficient_evidence: z.ZodOptional<z.ZodBoolean>;
        items_seen: z.ZodNumber;
    }, z.core.$strict>]>>;
    vocab: z.ZodObject<{
        a2: z.ZodObject<{
            domain_score: z.ZodNullable<z.ZodNumber>;
        }, z.core.$strict>;
        b1: z.ZodObject<{
            domain_score: z.ZodNullable<z.ZodNumber>;
        }, z.core.$strict>;
        single_strand: z.ZodNullable<z.ZodEnum<{
            a2: "a2";
            b1: "b1";
        }>>;
        delta: z.ZodNullable<z.ZodNumber>;
        delta_reliable: z.ZodNullable<z.ZodBoolean>;
        delta_display: z.ZodNullable<z.ZodUnion<readonly [z.ZodEnum<{
            steady: "steady";
            band_movement: "band_movement";
        }>, z.ZodString]>>;
        blended: z.ZodNullable<z.ZodNumber>;
        status: z.ZodEnum<{
            secure: "secure";
            developing: "developing";
            emerging: "emerging";
            not_yet: "not_yet";
            not_assessed: "not_assessed";
        }>;
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
    history: z.ZodOptional<z.ZodArray<z.ZodObject<{
        sat_at: z.ZodISODate;
        overall: z.ZodNullable<z.ZodNumber>;
        attributes: z.ZodRecord<z.ZodEnum<{
            Decoding: "Decoding";
            Grammar: "Grammar";
            Gist: "Gist";
            Detail: "Detail";
            Inference: "Inference";
            Vocabulary: "Vocabulary";
            Critical: "Critical";
        }>, z.ZodNullable<z.ZodNumber>>;
    }, z.core.$strict>>>;
    previous_result_document_id: z.ZodNullable<z.ZodString>;
    narrative: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        attribute_labels: z.ZodRecord<z.ZodString, z.ZodObject<{
            name: z.ZodString;
            descriptor: z.ZodString;
        }, z.core.$strict>>;
        change_since_last: z.ZodArray<z.ZodString>;
        weeks_since_previous: z.ZodNullable<z.ZodNumber>;
        plain_language: z.ZodArray<z.ZodString>;
    }, z.core.$strict>>>;
    cefr_band: z.ZodNullable<z.ZodEnum<{
        pre_A1: "pre_A1";
        A1: "A1";
        A2: "A2";
        B1: "B1";
        B2: "B2";
        C1: "C1";
    }>>;
    display_label: z.ZodNullable<z.ZodString>;
    supplementary: z.ZodNullable<z.ZodObject<{
        vocab_band_a2_accuracy: z.ZodNullable<z.ZodNumber>;
        vocab_band_b1_accuracy: z.ZodNullable<z.ZodNumber>;
        vocab_band_b2_accuracy: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
        dprime: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, z.core.$strict>>;
    productive_scores: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strict>;
export type ResultView = z.infer<typeof resultViewSchema>;
