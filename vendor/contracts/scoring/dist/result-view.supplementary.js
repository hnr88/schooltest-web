"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resultViewProductiveScoresSchema = exports.resultViewSupplementarySchema = void 0;
/**
 * `ResultView` v2 — the three v1 fields the v2 read model was missing.
 *
 * These are NOT a widening toward the v1 shape; they are fields the v2 view
 * should always have carried, established by measuring the live consumers
 * rather than by reading either schema:
 *
 *  - `display_label` is a PROTOCOL, not a rendering nicety. The app treats a
 *    null label as a retry state (`useStudentResult.ts:104`) and derives a
 *    category from it (:108). Omit the key and `=== null` is false, so a
 *    missing label falls straight through as `undefined` into
 *    `categoryFromDisplayLabel` — a silent wrong category on the student's own
 *    result screen. `result-agreement.ts:96` also compares the label across the
 *    student and teacher faces of one result, which is why the WIRE value has
 *    to exist rather than each face inventing its own.
 *  - `supplementary` is rendered by the web teacher report
 *    (`supplementary-view-model.ts:19` -> `SupplementaryStrand.tsx`), localised
 *    with its own honesty-guardrail copy: "This is an absence, not a zero."
 *    Dropping the field would turn a deliberate absence into nothing at all.
 *  - `productive_scores` is null on every reading row, and that is exactly why
 *    it must be PRESENT: the app parses this endpoint with a strict schema, and
 *    in a strict schema a missing key is a parse error.
 *
 * THE RULE THAT PRODUCED THIS FILE: in a strict schema, "nothing displays it"
 * says nothing about whether it may be absent. The app's own comment on
 * `supplementary` — "the student result screen never renders it" — sat directly
 * above a required key, and not rendering a field never made it optional.
 *
 * Shapes match the v1 producer EXACTLY (`schooltest-api/src/contracts/results.ts`),
 * because v1 is what the wire carries today and the consumers are being moved
 * onto this schema, not onto a new dialect of it.
 */
const zod_1 = require("zod");
exports.resultViewSupplementarySchema = zod_1.z.strictObject({
    vocab_band_a2_accuracy: zod_1.z.number().min(0).max(1).nullable(),
    vocab_band_b1_accuracy: zod_1.z.number().min(0).max(1).nullable(),
    /**
     * `.default(null)` mirrors v1: it keeps historical A2/B1-only rows readable
     * while newly assembled results record the client bank's B2 evidence state.
     */
    vocab_band_b2_accuracy: zod_1.z.number().min(0).max(1).nullable().default(null),
    dprime: zod_1.z.number().nullable().optional(),
});
/**
 * Productive (speaking/writing) scores. Opaque here on purpose — a reading or
 * listening row carries `null`, and the productive shape is owned by the
 * productive scoring path, not by this read model.
 */
exports.resultViewProductiveScoresSchema = zod_1.z.record(zod_1.z.string(), zod_1.z.unknown());
