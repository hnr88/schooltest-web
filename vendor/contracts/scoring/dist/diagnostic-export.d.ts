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
import { z } from 'zod';
/** Doc 1 s.11.4 — pseudonymised: year group and language background, NO name. */
export declare const diagnosticExportStudentSchema: z.ZodObject<{
    year_group: z.ZodNullable<z.ZodNumber>;
    first_language: z.ZodNullable<z.ZodString>;
    l1_literate: z.ZodNullable<z.ZodBoolean>;
}, z.core.$strict>;
/** Which sitting this is, without identifying when it was booked. */
export declare const diagnosticExportSittingSchema: z.ZodObject<{
    date: z.ZodNullable<z.ZodISODate>;
    number: z.ZodNumber;
    weeks_since_previous: z.ZodNullable<z.ZodNumber>;
}, z.core.$strict>;
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
export declare const diagnosticExportSkillSchema: z.ZodUnion<readonly [z.ZodObject<{
    domain_score: z.ZodNumber;
    status: z.ZodEnum<{
        secure: "secure";
        developing: "developing";
        emerging: "emerging";
        not_yet: "not_yet";
    }>;
    delta_display: z.ZodNullable<z.ZodUnion<readonly [z.ZodEnum<{
        steady: "steady";
        band_movement: "band_movement";
    }>, z.ZodString]>>;
    descriptor: z.ZodOptional<z.ZodString>;
}, z.core.$strict>, z.ZodObject<{
    domain_score: z.ZodNumber;
    gate_passed: z.ZodBoolean;
    descriptor: z.ZodOptional<z.ZodString>;
}, z.core.$strict>, z.ZodObject<{
    status: z.ZodLiteral<"not_assessed">;
    insufficient_evidence: z.ZodOptional<z.ZodBoolean>;
    items_seen: z.ZodNumber;
}, z.core.$strict>]>;
export type DiagnosticExportSkill = z.infer<typeof diagnosticExportSkillSchema>;
/** The Vocabulary bar plus its two strands, scores only. */
export declare const diagnosticExportVocabSchema: z.ZodObject<{
    blended: z.ZodNullable<z.ZodNumber>;
    status: z.ZodEnum<{
        secure: "secure";
        developing: "developing";
        emerging: "emerging";
        not_yet: "not_yet";
        not_assessed: "not_assessed";
    }>;
    delta_display: z.ZodNullable<z.ZodUnion<readonly [z.ZodEnum<{
        steady: "steady";
        band_movement: "band_movement";
    }>, z.ZodString]>>;
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
}, z.core.$strict>;
/** The exit gate: graded score and boolean, no theta (spec v2 §7). */
export declare const diagnosticExportGateSchema: z.ZodObject<{
    passed: z.ZodNullable<z.ZodBoolean>;
    domain_score: z.ZodNullable<z.ZodNumber>;
}, z.core.$strict>;
/** History, overall only (task 25) — the trend without re-exporting every skill. */
export declare const diagnosticExportHistoryPointSchema: z.ZodObject<{
    sat_at: z.ZodISODate;
    overall: z.ZodNullable<z.ZodNumber>;
}, z.core.$strict>;
/**
 * The full bundle. `skills` is exhaustive over the seven display skills so an
 * unassessed skill is stated as unassessed rather than silently missing —
 * absence of a key reads as an oversight, the not-assessed object reads as a
 * measured fact. `caveats` is `.min(1)`: the single-sitting note is
 * unconditional, and §7's provisional-transform / provisional-cut /
 * low-confidence lines join it when those flags are set.
 */
export declare const diagnosticExportSchema: z.ZodObject<{
    model_version: z.ZodEnum<{
        "reading-3model/1": "reading-3model/1";
        "listening-r7/1": "listening-r7/1";
        "legacy-r7": "legacy-r7";
    }>;
    student: z.ZodObject<{
        year_group: z.ZodNullable<z.ZodNumber>;
        first_language: z.ZodNullable<z.ZodString>;
        l1_literate: z.ZodNullable<z.ZodBoolean>;
    }, z.core.$strict>;
    sitting: z.ZodObject<{
        date: z.ZodNullable<z.ZodISODate>;
        number: z.ZodNumber;
        weeks_since_previous: z.ZodNullable<z.ZodNumber>;
    }, z.core.$strict>;
    overall: z.ZodObject<{
        domain_score: z.ZodNullable<z.ZodNumber>;
        delta_display: z.ZodNullable<z.ZodUnion<readonly [z.ZodEnum<{
            steady: "steady";
            band_movement: "band_movement";
        }>, z.ZodString]>>;
    }, z.core.$strict>;
    acara_phase: z.ZodNullable<z.ZodString>;
    readiness: z.ZodNullable<z.ZodEnum<{
        not_yet: "not_yet";
        not_assessed: "not_assessed";
        met: "met";
        approaching: "approaching";
    }>>;
    skills: z.ZodRecord<z.ZodEnum<{
        Decoding: "Decoding";
        Grammar: "Grammar";
        Gist: "Gist";
        Detail: "Detail";
        Inference: "Inference";
        Vocabulary: "Vocabulary";
        Critical: "Critical";
    }>, z.ZodUnion<readonly [z.ZodObject<{
        domain_score: z.ZodNumber;
        status: z.ZodEnum<{
            secure: "secure";
            developing: "developing";
            emerging: "emerging";
            not_yet: "not_yet";
        }>;
        delta_display: z.ZodNullable<z.ZodUnion<readonly [z.ZodEnum<{
            steady: "steady";
            band_movement: "band_movement";
        }>, z.ZodString]>>;
        descriptor: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>, z.ZodObject<{
        domain_score: z.ZodNumber;
        gate_passed: z.ZodBoolean;
        descriptor: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>, z.ZodObject<{
        status: z.ZodLiteral<"not_assessed">;
        insufficient_evidence: z.ZodOptional<z.ZodBoolean>;
        items_seen: z.ZodNumber;
    }, z.core.$strict>]>>;
    vocab: z.ZodObject<{
        blended: z.ZodNullable<z.ZodNumber>;
        status: z.ZodEnum<{
            secure: "secure";
            developing: "developing";
            emerging: "emerging";
            not_yet: "not_yet";
            not_assessed: "not_assessed";
        }>;
        delta_display: z.ZodNullable<z.ZodUnion<readonly [z.ZodEnum<{
            steady: "steady";
            band_movement: "band_movement";
        }>, z.ZodString]>>;
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
    }, z.core.$strict>;
    gate: z.ZodObject<{
        passed: z.ZodNullable<z.ZodBoolean>;
        domain_score: z.ZodNullable<z.ZodNumber>;
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
    history: z.ZodArray<z.ZodObject<{
        sat_at: z.ZodISODate;
        overall: z.ZodNullable<z.ZodNumber>;
    }, z.core.$strict>>;
    caveats: z.ZodArray<z.ZodString>;
}, z.core.$strict>;
export type DiagnosticExport = z.infer<typeof diagnosticExportSchema>;
/** The only accepted value of the `format` query param (400 on anything else). */
export declare const DIAGNOSTIC_JSON_FORMAT = "diagnostic_json";
