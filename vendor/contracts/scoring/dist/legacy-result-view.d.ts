/**
 * `ResultView` v1 — the LEGACY read model the C-4 route still serves to rows
 * the v2 dispatch refuses: untagged legacy rows, combined placement parents and
 * listening (`result-view-v2.compose.ts` fails loud on exactly those). Coexists
 * with the v2 `resultViewSchema` in this package; nothing here widens v2 and
 * nothing in v2 accepts this shape.
 *
 * COPIED 1:1 FROM THE SERVER CONTRACT (`schooltest-api/src/contracts/results.ts`
 * `resultViewBaseSchema`/`resultViewSchema`) — the server file stays the
 * authority; a drift guard in the API repo fails when the two key sets diverge.
 * The app's hand-written mirror of this shape silently drifted (it never learned
 * `model_version`/`legacy_caveat`) until it parsed NOTHING the server could
 * send; the fix is one source for both dispatch arms, not a third copy.
 *
 * Vocabulary: the five shared enums (skill, result status, destination,
 * readiness, CEFR) are THIS package's own — the server re-exports the same
 * definitions. Only listening's three-band stored status is defined here, the
 * one vocabulary the v2 read model has no use for.
 */
import { z } from 'zod';
/**
 * LISTENING's own three-band vocabulary, cut from Config's
 * `status_bands.mastered_cut`/`emerging_cut` (Doc 2a s.9) — a genuinely
 * different scale from reading's four §5.2 bands, not a legacy alias. Reading
 * never produces these values; one stored `Result.attributes` column holds
 * both, so the stored status is the union of the two.
 */
export declare const legacyListeningStatusSchema: z.ZodEnum<{
    emerging: "emerging";
    not_assessed: "not_assessed";
    mastered: "mastered";
    not_mastered: "not_mastered";
}>;
export type LegacyListeningStatus = z.infer<typeof legacyListeningStatusSchema>;
export declare const legacyStoredAttributeStatusSchema: z.ZodUnion<readonly [z.ZodEnum<{
    secure: "secure";
    developing: "developing";
    emerging: "emerging";
    not_yet: "not_yet";
    not_assessed: "not_assessed";
}>, z.ZodEnum<{
    emerging: "emerging";
    not_assessed: "not_assessed";
    mastered: "mastered";
    not_mastered: "not_mastered";
}>]>;
export type LegacyStoredAttributeStatus = z.infer<typeof legacyStoredAttributeStatusSchema>;
/** The assessed member: an attribute with a posterior and an evidence count. */
export declare const legacyAttributeAssessedEntrySchema: z.ZodObject<{
    status: z.ZodUnion<readonly [z.ZodEnum<{
        secure: "secure";
        developing: "developing";
        emerging: "emerging";
        not_yet: "not_yet";
        not_assessed: "not_assessed";
    }>, z.ZodEnum<{
        emerging: "emerging";
        not_assessed: "not_assessed";
        mastered: "mastered";
        not_mastered: "not_mastered";
    }>]>;
    prob: z.ZodNullable<z.ZodNumber>;
    prob_se: z.ZodOptional<z.ZodNumber>;
    items: z.ZodNumber;
    delta: z.ZodNullable<z.ZodNumber>;
}, z.core.$strict>;
export type LegacyAttributeAssessed = z.infer<typeof legacyAttributeAssessedEntrySchema>;
/**
 * The MINIMUM-EVIDENCE FLOOR entry (task 17; spec v2 §5.3): scored, but on too
 * few items to report. The numeric fields are ABSENT, not null — a posterior
 * derived from one or two items is not a weak measurement to show with a
 * caveat, it is not a measurement.
 */
export declare const legacyAttributeFloorEntrySchema: z.ZodObject<{
    status: z.ZodLiteral<"not_assessed">;
    insufficient_evidence: z.ZodLiteral<true>;
    items_seen: z.ZodNumber;
}, z.core.$strict>;
export type LegacyAttributeFloorEntry = z.infer<typeof legacyAttributeFloorEntrySchema>;
/**
 * Per-attribute evidence entry (Doc 1 s.10): assessed | floor | the bare
 * `"not_assessed"` literal for zero-administered attributes (CT-7). The three
 * members stay unambiguous despite the status vocabularies also admitting
 * `not_assessed`, because both objects are strict and the assessed one requires
 * `prob`/`items`/`delta` that the floor entry forbids.
 */
export declare const legacyAttributeEntrySchema: z.ZodUnion<readonly [z.ZodObject<{
    status: z.ZodUnion<readonly [z.ZodEnum<{
        secure: "secure";
        developing: "developing";
        emerging: "emerging";
        not_yet: "not_yet";
        not_assessed: "not_assessed";
    }>, z.ZodEnum<{
        emerging: "emerging";
        not_assessed: "not_assessed";
        mastered: "mastered";
        not_mastered: "not_mastered";
    }>]>;
    prob: z.ZodNullable<z.ZodNumber>;
    prob_se: z.ZodOptional<z.ZodNumber>;
    items: z.ZodNumber;
    delta: z.ZodNullable<z.ZodNumber>;
}, z.core.$strict>, z.ZodObject<{
    status: z.ZodLiteral<"not_assessed">;
    insufficient_evidence: z.ZodLiteral<true>;
    items_seen: z.ZodNumber;
}, z.core.$strict>, z.ZodLiteral<"not_assessed">]>;
export type LegacyAttributeEntry = z.infer<typeof legacyAttributeEntrySchema>;
/**
 * "Does this entry carry a posterior?" — the ONLY correct way to narrow the
 * entry union. Both `entry !== 'not_assessed'` and `Exclude<…, 'not_assessed'>`
 * are casts: the floor entry is an OBJECT whose `status` is `'not_assessed'`,
 * so both forms admit it while it carries no numeric fields to read.
 * `insufficient_evidence` is the discriminator.
 */
export declare function isLegacyAssessedAttributeEntry(entry: LegacyAttributeEntry | null | undefined): entry is LegacyAttributeAssessed;
/**
 * The out-of-model SUPPLEMENTARY reporting strand (M-CT-RESULT-V21, spec E3.5).
 * NULL DISCIPLINE (CT-7): a band with zero administered items is `null` —
 * never 0, never 0.5. `strictObject` is the leak guard.
 */
export declare const legacyResultSupplementarySchema: z.ZodObject<{
    vocab_band_a2_accuracy: z.ZodNullable<z.ZodNumber>;
    vocab_band_b1_accuracy: z.ZodNullable<z.ZodNumber>;
    vocab_band_b2_accuracy: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
    dprime: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, z.core.$strict>;
export type LegacyResultSupplementary = z.infer<typeof legacyResultSupplementarySchema>;
/** F-REPORT-NARRATIVE: the opt-in `?include=narrative` projection (Doc 1 s.11.4). */
export declare const legacyResultNarrativeSchema: z.ZodObject<{
    attribute_labels: z.ZodRecord<z.ZodString, z.ZodObject<{
        name: z.ZodString;
        descriptor: z.ZodString;
    }, z.core.$strict>>;
    change_since_last: z.ZodArray<z.ZodString>;
    weeks_since_previous: z.ZodNullable<z.ZodNumber>;
    plain_language: z.ZodArray<z.ZodString>;
}, z.core.$strict>;
export type LegacyResultNarrative = z.infer<typeof legacyResultNarrativeSchema>;
/**
 * One result view row. NO export fields, NO student PII — keyed by document ids
 * only. `attributes` is null while status=scoring and on combined parents.
 * `model_version` is null on rows the backfill has not stamped (untagged =
 * current-model, never legacy); `legacy_caveat` carries the Doc-1 caveat on
 * `legacy-r7` rows only; both are `.nullish()` so producers that never set them
 * still validate. `narrative` is emitted ONLY for `?include=narrative`.
 */
export declare const legacyResultViewBaseSchema: z.ZodObject<{
    document_id: z.ZodString;
    scope: z.ZodEnum<{
        skill: "skill";
        combined: "combined";
    }>;
    skill: z.ZodNullable<z.ZodEnum<{
        reading: "reading";
        listening: "listening";
        speaking: "speaking";
        writing: "writing";
    }>>;
    status: z.ZodEnum<{
        scoring: "scoring";
        partial_pending: "partial_pending";
        complete: "complete";
        scoring_failed: "scoring_failed";
        manual_scoring: "manual_scoring";
    }>;
    attributes: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodObject<{
        status: z.ZodUnion<readonly [z.ZodEnum<{
            secure: "secure";
            developing: "developing";
            emerging: "emerging";
            not_yet: "not_yet";
            not_assessed: "not_assessed";
        }>, z.ZodEnum<{
            emerging: "emerging";
            not_assessed: "not_assessed";
            mastered: "mastered";
            not_mastered: "not_mastered";
        }>]>;
        prob: z.ZodNullable<z.ZodNumber>;
        prob_se: z.ZodOptional<z.ZodNumber>;
        items: z.ZodNumber;
        delta: z.ZodNullable<z.ZodNumber>;
    }, z.core.$strict>, z.ZodObject<{
        status: z.ZodLiteral<"not_assessed">;
        insufficient_evidence: z.ZodLiteral<true>;
        items_seen: z.ZodNumber;
    }, z.core.$strict>, z.ZodLiteral<"not_assessed">]>>>;
    provisional: z.ZodOptional<z.ZodNullable<z.ZodLiteral<"field_test">>>;
    display_label: z.ZodNullable<z.ZodString>;
    acara_phase: z.ZodNullable<z.ZodString>;
    cefr_band: z.ZodNullable<z.ZodEnum<{
        pre_A1: "pre_A1";
        A1: "A1";
        A2: "A2";
        B1: "B1";
        B2: "B2";
        C1: "C1";
    }>>;
    readiness: z.ZodNullable<z.ZodEnum<{
        not_yet: "not_yet";
        not_assessed: "not_assessed";
        met: "met";
        approaching: "approaching";
    }>>;
    low_confidence: z.ZodNullable<z.ZodBoolean>;
    effort_valid: z.ZodNullable<z.ZodBoolean>;
    productive_scores: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    supplementary: z.ZodNullable<z.ZodObject<{
        vocab_band_a2_accuracy: z.ZodNullable<z.ZodNumber>;
        vocab_band_b1_accuracy: z.ZodNullable<z.ZodNumber>;
        vocab_band_b2_accuracy: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
        dprime: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, z.core.$strict>>;
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
    previous_result_document_id: z.ZodNullable<z.ZodString>;
    session_document_id: z.ZodNullable<z.ZodString>;
    model_version: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    legacy_caveat: z.ZodOptional<z.ZodNullable<z.ZodLiteral<"pilot_diagnostic_earlier_model">>>;
    narrative: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        attribute_labels: z.ZodRecord<z.ZodString, z.ZodObject<{
            name: z.ZodString;
            descriptor: z.ZodString;
        }, z.core.$strict>>;
        change_since_last: z.ZodArray<z.ZodString>;
        weeks_since_previous: z.ZodNullable<z.ZodNumber>;
        plain_language: z.ZodArray<z.ZodString>;
    }, z.core.$strict>>>;
}, z.core.$strict>;
export type LegacyResultViewBase = z.infer<typeof legacyResultViewBaseSchema>;
/** Placement parent (scope=combined) additionally carries its child views. */
export declare const legacyResultViewSchema: z.ZodObject<{
    document_id: z.ZodString;
    scope: z.ZodEnum<{
        skill: "skill";
        combined: "combined";
    }>;
    skill: z.ZodNullable<z.ZodEnum<{
        reading: "reading";
        listening: "listening";
        speaking: "speaking";
        writing: "writing";
    }>>;
    status: z.ZodEnum<{
        scoring: "scoring";
        partial_pending: "partial_pending";
        complete: "complete";
        scoring_failed: "scoring_failed";
        manual_scoring: "manual_scoring";
    }>;
    attributes: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodObject<{
        status: z.ZodUnion<readonly [z.ZodEnum<{
            secure: "secure";
            developing: "developing";
            emerging: "emerging";
            not_yet: "not_yet";
            not_assessed: "not_assessed";
        }>, z.ZodEnum<{
            emerging: "emerging";
            not_assessed: "not_assessed";
            mastered: "mastered";
            not_mastered: "not_mastered";
        }>]>;
        prob: z.ZodNullable<z.ZodNumber>;
        prob_se: z.ZodOptional<z.ZodNumber>;
        items: z.ZodNumber;
        delta: z.ZodNullable<z.ZodNumber>;
    }, z.core.$strict>, z.ZodObject<{
        status: z.ZodLiteral<"not_assessed">;
        insufficient_evidence: z.ZodLiteral<true>;
        items_seen: z.ZodNumber;
    }, z.core.$strict>, z.ZodLiteral<"not_assessed">]>>>;
    provisional: z.ZodOptional<z.ZodNullable<z.ZodLiteral<"field_test">>>;
    display_label: z.ZodNullable<z.ZodString>;
    acara_phase: z.ZodNullable<z.ZodString>;
    cefr_band: z.ZodNullable<z.ZodEnum<{
        pre_A1: "pre_A1";
        A1: "A1";
        A2: "A2";
        B1: "B1";
        B2: "B2";
        C1: "C1";
    }>>;
    readiness: z.ZodNullable<z.ZodEnum<{
        not_yet: "not_yet";
        not_assessed: "not_assessed";
        met: "met";
        approaching: "approaching";
    }>>;
    low_confidence: z.ZodNullable<z.ZodBoolean>;
    effort_valid: z.ZodNullable<z.ZodBoolean>;
    productive_scores: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    supplementary: z.ZodNullable<z.ZodObject<{
        vocab_band_a2_accuracy: z.ZodNullable<z.ZodNumber>;
        vocab_band_b1_accuracy: z.ZodNullable<z.ZodNumber>;
        vocab_band_b2_accuracy: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
        dprime: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, z.core.$strict>>;
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
    previous_result_document_id: z.ZodNullable<z.ZodString>;
    session_document_id: z.ZodNullable<z.ZodString>;
    model_version: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    legacy_caveat: z.ZodOptional<z.ZodNullable<z.ZodLiteral<"pilot_diagnostic_earlier_model">>>;
    narrative: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        attribute_labels: z.ZodRecord<z.ZodString, z.ZodObject<{
            name: z.ZodString;
            descriptor: z.ZodString;
        }, z.core.$strict>>;
        change_since_last: z.ZodArray<z.ZodString>;
        weeks_since_previous: z.ZodNullable<z.ZodNumber>;
        plain_language: z.ZodArray<z.ZodString>;
    }, z.core.$strict>>>;
    combined_children: z.ZodOptional<z.ZodArray<z.ZodObject<{
        document_id: z.ZodString;
        scope: z.ZodEnum<{
            skill: "skill";
            combined: "combined";
        }>;
        skill: z.ZodNullable<z.ZodEnum<{
            reading: "reading";
            listening: "listening";
            speaking: "speaking";
            writing: "writing";
        }>>;
        status: z.ZodEnum<{
            scoring: "scoring";
            partial_pending: "partial_pending";
            complete: "complete";
            scoring_failed: "scoring_failed";
            manual_scoring: "manual_scoring";
        }>;
        attributes: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodObject<{
            status: z.ZodUnion<readonly [z.ZodEnum<{
                secure: "secure";
                developing: "developing";
                emerging: "emerging";
                not_yet: "not_yet";
                not_assessed: "not_assessed";
            }>, z.ZodEnum<{
                emerging: "emerging";
                not_assessed: "not_assessed";
                mastered: "mastered";
                not_mastered: "not_mastered";
            }>]>;
            prob: z.ZodNullable<z.ZodNumber>;
            prob_se: z.ZodOptional<z.ZodNumber>;
            items: z.ZodNumber;
            delta: z.ZodNullable<z.ZodNumber>;
        }, z.core.$strict>, z.ZodObject<{
            status: z.ZodLiteral<"not_assessed">;
            insufficient_evidence: z.ZodLiteral<true>;
            items_seen: z.ZodNumber;
        }, z.core.$strict>, z.ZodLiteral<"not_assessed">]>>>;
        provisional: z.ZodOptional<z.ZodNullable<z.ZodLiteral<"field_test">>>;
        display_label: z.ZodNullable<z.ZodString>;
        acara_phase: z.ZodNullable<z.ZodString>;
        cefr_band: z.ZodNullable<z.ZodEnum<{
            pre_A1: "pre_A1";
            A1: "A1";
            A2: "A2";
            B1: "B1";
            B2: "B2";
            C1: "C1";
        }>>;
        readiness: z.ZodNullable<z.ZodEnum<{
            not_yet: "not_yet";
            not_assessed: "not_assessed";
            met: "met";
            approaching: "approaching";
        }>>;
        low_confidence: z.ZodNullable<z.ZodBoolean>;
        effort_valid: z.ZodNullable<z.ZodBoolean>;
        productive_scores: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        supplementary: z.ZodNullable<z.ZodObject<{
            vocab_band_a2_accuracy: z.ZodNullable<z.ZodNumber>;
            vocab_band_b1_accuracy: z.ZodNullable<z.ZodNumber>;
            vocab_band_b2_accuracy: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
            dprime: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        }, z.core.$strict>>;
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
        previous_result_document_id: z.ZodNullable<z.ZodString>;
        session_document_id: z.ZodNullable<z.ZodString>;
        model_version: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        legacy_caveat: z.ZodOptional<z.ZodNullable<z.ZodLiteral<"pilot_diagnostic_earlier_model">>>;
        narrative: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            attribute_labels: z.ZodRecord<z.ZodString, z.ZodObject<{
                name: z.ZodString;
                descriptor: z.ZodString;
            }, z.core.$strict>>;
            change_since_last: z.ZodArray<z.ZodString>;
            weeks_since_previous: z.ZodNullable<z.ZodNumber>;
            plain_language: z.ZodArray<z.ZodString>;
        }, z.core.$strict>>>;
    }, z.core.$strict>>>;
}, z.core.$strict>;
export type LegacyResultView = z.infer<typeof legacyResultViewSchema>;
