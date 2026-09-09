"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.legacyResultViewSchema = exports.legacyResultViewBaseSchema = exports.legacyResultNarrativeSchema = exports.legacyResultSupplementarySchema = exports.legacyAttributeEntrySchema = exports.legacyAttributeFloorEntrySchema = exports.legacyAttributeAssessedEntrySchema = exports.legacyStoredAttributeStatusSchema = exports.legacyListeningStatusSchema = void 0;
exports.isLegacyAssessedAttributeEntry = isLegacyAssessedAttributeEntry;
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
const zod_1 = require("zod");
const enums_1 = require("./enums");
const str = zod_1.z.string().min(1);
/**
 * LISTENING's own three-band vocabulary, cut from Config's
 * `status_bands.mastered_cut`/`emerging_cut` (Doc 2a s.9) — a genuinely
 * different scale from reading's four §5.2 bands, not a legacy alias. Reading
 * never produces these values; one stored `Result.attributes` column holds
 * both, so the stored status is the union of the two.
 */
exports.legacyListeningStatusSchema = zod_1.z.enum([
    'mastered',
    'emerging',
    'not_mastered',
    'not_assessed',
]);
exports.legacyStoredAttributeStatusSchema = zod_1.z.union([
    enums_1.bandSchema,
    exports.legacyListeningStatusSchema,
]);
/** The assessed member: an attribute with a posterior and an evidence count. */
exports.legacyAttributeAssessedEntrySchema = zod_1.z.strictObject({
    status: exports.legacyStoredAttributeStatusSchema,
    prob: zod_1.z.number().nullable(),
    prob_se: zod_1.z.number().optional(),
    items: zod_1.z.number().int().min(0),
    delta: zod_1.z.number().nullable(),
});
/**
 * The MINIMUM-EVIDENCE FLOOR entry (task 17; spec v2 §5.3): scored, but on too
 * few items to report. The numeric fields are ABSENT, not null — a posterior
 * derived from one or two items is not a weak measurement to show with a
 * caveat, it is not a measurement.
 */
exports.legacyAttributeFloorEntrySchema = zod_1.z.strictObject({
    status: zod_1.z.literal('not_assessed'),
    insufficient_evidence: zod_1.z.literal(true),
    items_seen: zod_1.z.number().int().min(0),
});
/**
 * Per-attribute evidence entry (Doc 1 s.10): assessed | floor | the bare
 * `"not_assessed"` literal for zero-administered attributes (CT-7). The three
 * members stay unambiguous despite the status vocabularies also admitting
 * `not_assessed`, because both objects are strict and the assessed one requires
 * `prob`/`items`/`delta` that the floor entry forbids.
 */
exports.legacyAttributeEntrySchema = zod_1.z.union([
    exports.legacyAttributeAssessedEntrySchema,
    exports.legacyAttributeFloorEntrySchema,
    zod_1.z.literal('not_assessed'),
]);
/**
 * "Does this entry carry a posterior?" — the ONLY correct way to narrow the
 * entry union. Both `entry !== 'not_assessed'` and `Exclude<…, 'not_assessed'>`
 * are casts: the floor entry is an OBJECT whose `status` is `'not_assessed'`,
 * so both forms admit it while it carries no numeric fields to read.
 * `insufficient_evidence` is the discriminator.
 */
function isLegacyAssessedAttributeEntry(entry) {
    return typeof entry === 'object' && entry !== null && !('insufficient_evidence' in entry);
}
/**
 * The out-of-model SUPPLEMENTARY reporting strand (M-CT-RESULT-V21, spec E3.5).
 * NULL DISCIPLINE (CT-7): a band with zero administered items is `null` —
 * never 0, never 0.5. `strictObject` is the leak guard.
 */
exports.legacyResultSupplementarySchema = zod_1.z.strictObject({
    vocab_band_a2_accuracy: zod_1.z.number().min(0).max(1).nullable(),
    vocab_band_b1_accuracy: zod_1.z.number().min(0).max(1).nullable(),
    // `.default(null)` keeps historical A2/B1 rows readable while every newly
    // assembled result explicitly records the client bank's B2 evidence state.
    vocab_band_b2_accuracy: zod_1.z.number().min(0).max(1).nullable().default(null),
    dprime: zod_1.z.number().nullable().optional(),
});
/** F-REPORT-NARRATIVE: the opt-in `?include=narrative` projection (Doc 1 s.11.4). */
exports.legacyResultNarrativeSchema = zod_1.z.strictObject({
    attribute_labels: zod_1.z.record(str, zod_1.z.strictObject({ name: str, descriptor: str })),
    change_since_last: zod_1.z.array(str),
    weeks_since_previous: zod_1.z.number().int().nullable(),
    plain_language: zod_1.z.array(str),
});
/**
 * One result view row. NO export fields, NO student PII — keyed by document ids
 * only. `attributes` is null while status=scoring and on combined parents.
 * `model_version` is null on rows the backfill has not stamped (untagged =
 * current-model, never legacy); `legacy_caveat` carries the Doc-1 caveat on
 * `legacy-r7` rows only; both are `.nullish()` so producers that never set them
 * still validate. `narrative` is emitted ONLY for `?include=narrative`.
 */
exports.legacyResultViewBaseSchema = zod_1.z.strictObject({
    document_id: str,
    scope: zod_1.z.enum(['skill', 'combined']),
    skill: enums_1.skillSchema.nullable(), // null when scope=combined
    status: enums_1.resultStatusSchema,
    attributes: zod_1.z.record(str, exports.legacyAttributeEntrySchema).nullable(),
    // Doc 4 s.2 field-test banner, lifted out of the stored attributes map.
    provisional: zod_1.z.literal('field_test').nullish(),
    display_label: zod_1.z.string().nullable(),
    acara_phase: zod_1.z.string().nullable(),
    cefr_band: enums_1.cefrBandSchema.nullable(),
    readiness: enums_1.readinessSchema.nullable(),
    low_confidence: zod_1.z.boolean().nullable(),
    effort_valid: zod_1.z.boolean().nullable(),
    productive_scores: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).nullable(),
    supplementary: exports.legacyResultSupplementarySchema.nullable(),
    destination: enums_1.resultDestinationSchema,
    published_at: zod_1.z.iso.datetime().nullable(),
    previous_result_document_id: str.nullable(),
    session_document_id: str.nullable(),
    // Task 07 legacy tagging (spec v2 §0.4, memo §7).
    model_version: zod_1.z.string().min(1).nullish(),
    legacy_caveat: zod_1.z.literal('pilot_diagnostic_earlier_model').nullish(),
    // F-REPORT-NARRATIVE — only on `?include=narrative`.
    narrative: exports.legacyResultNarrativeSchema.nullable().optional(),
});
/** Placement parent (scope=combined) additionally carries its child views. */
exports.legacyResultViewSchema = exports.legacyResultViewBaseSchema.extend({
    combined_children: zod_1.z.array(exports.legacyResultViewBaseSchema).optional(),
});
