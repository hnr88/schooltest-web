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

import {
  resultViewProductiveScoresSchema,
  resultViewSupplementarySchema,
} from './result-view.supplementary';
import {
  deltaDisplaySchema,
  domainScoreSchema,
  itemCountSchema,
  itemsSeenSchema,
  nonEmptyString,
  notAssessedSchema,
  probSchema,
  standardErrorSchema,
} from './core';
import {
  assessedBandSchema,
  attributeNameSchema,
  bandSchema,
  cefrBandSchema,
  displaySkillSchema,
  modelVersionSchema,
  provisionalSchema,
  readinessSchema,
  resultDestinationSchema,
  resultScopeSchema,
  resultStatusSchema,
  skillSchema,
  vocabStrandNameSchema,
} from './enums';
import { errorPatternSchema } from './stored-result';

/**
 * The growth triplet (spec v2 §6.2). All three are null together when there is
 * no comparable previous official same-model-version Result.
 */
const growthFields = {
  delta: z.number().nullable(),
  delta_reliable: z.boolean().nullable(),
  delta_display: deltaDisplaySchema.nullable(),
} as const;

/**
 * One assessed attribute on the view. `band_before`/`band_after` are present
 * only on the band-movement path (§6.2: a skill outside `ANCHORED_SKILLS` gets
 * `delta: null` and `delta_display: "band_movement"`, because a point delta
 * across unanchored forms is not a valid claim).
 */
export const resultViewAttributeScoredSchema = z.strictObject({
  domain_score: domainScoreSchema,
  se: standardErrorSchema,
  status: assessedBandSchema,
  prob: probSchema,
  prob_se: standardErrorSchema,
  items_seen: itemsSeenSchema,
  ...growthFields,
  band_before: bandSchema.optional(),
  band_after: bandSchema.optional(),
});
export type ResultViewAttributeScored = z.infer<typeof resultViewAttributeScoredSchema>;

/** An unassessed attribute carries no score and no delta at all. */
export const resultViewAttributeSchema = z.union([
  resultViewAttributeScoredSchema,
  notAssessedSchema,
]);
export type ResultViewAttribute = z.infer<typeof resultViewAttributeSchema>;

/** spec v2 §6.3 — the headline score with its growth. Never the mean of subskills. */
export const resultViewOverallSchema = z.strictObject({
  domain_score: domainScoreSchema.nullable(),
  provisional_transform: z.boolean(),
  ...growthFields,
});
export type ResultViewOverall = z.infer<typeof resultViewOverallSchema>;

/** The PUBLIC gate subset: the graded score and the boolean, no theta (spec v2 §6.3). */
export const resultViewGateSchema = z.strictObject({
  passed: z.boolean().nullable(),
  domain_score: domainScoreSchema.nullable(),
  provisional_cut: z.boolean(),
});
export type ResultViewGate = z.infer<typeof resultViewGateSchema>;

/** The strand detail behind the Vocabulary bar (spec v2 §6.3). */
export const resultViewVocabStrandSchema = z.strictObject({
  domain_score: domainScoreSchema.nullable(),
});

export const resultViewVocabSchema = z
  .strictObject({
    blended: domainScoreSchema.nullable(),
    status: bandSchema,
    ...growthFields,
    a2: resultViewVocabStrandSchema,
    b1: resultViewVocabStrandSchema,
    single_strand: vocabStrandNameSchema.nullable(),
  })
  .superRefine((vocab, ctx) => {
    // D20 — the gap invariant lives HERE, not per-component. A blend exists
    // exactly when at least one strand was assessed, which is also exactly
    // when the band is a real band: `blended === null` ⇔ `status ===
    // "not_assessed"`, in BOTH directions. Without it a chip renderer can put
    // an untranslateable band on a gap card, and a number can appear with no
    // band to name it.
    if ((vocab.blended === null) !== (vocab.status === 'not_assessed')) {
      ctx.addIssue({
        code: 'custom',
        path: ['blended'],
        message:
          'vocab gap invariant: blended === null exactly when status === "not_assessed" (a blend exists exactly when a band does)',
      });
    }
  });
export type ResultViewVocab = z.infer<typeof resultViewVocabSchema>;

/**
 * One point on the trend chart (dashboard §1.1). Keyed by the seven DISPLAY
 * skills — `Vocabulary` already blended, `Critical` the Section 3 graded score —
 * and exhaustive: every sitting reports all seven, `null` where that sitting did
 * not assess the skill. A `null` is an absence; it is never rendered as 0.
 */
export const resultHistoryPointSchema = z.strictObject({
  sat_at: z.iso.date(),
  overall: domainScoreSchema.nullable(),
  attributes: z.record(displaySkillSchema, domainScoreSchema.nullable()),
});
export type ResultHistoryPoint = z.infer<typeof resultHistoryPointSchema>;

/** Dashboard §1.1 — official, same-model-version sittings, oldest first, last 8. */
export const RESULT_HISTORY_MAX_POINTS = 8;

/**
 * The Doc 1 s.11.4 plain-language rendering, served only for
 * `?include=narrative` (spec v2 §6.3 keeps it unchanged).
 */
export const resultNarrativeSchema = z.strictObject({
  attribute_labels: z.record(
    nonEmptyString,
    z.strictObject({ name: nonEmptyString, descriptor: nonEmptyString })
  ),
  change_since_last: z.array(z.string()),
  weeks_since_previous: z.number().int().nullable(),
  plain_language: z.array(z.string()),
});
export type ResultNarrative = z.infer<typeof resultNarrativeSchema>;

/**
 * spec v2 §6.3 exactly. `history` is OPTIONAL because it is included on
 * `GET /results/{id}` and omitted on `/my/students/results` for payload size —
 * omitted, not empty, so a roster row cannot be mistaken for a student with no
 * sittings. `acara_phase` stays a string: the Crosswalk owns the phase labels.
 */
export const resultViewSchema = z.strictObject({
  document_id: nonEmptyString,
  session_document_id: nonEmptyString.nullable(),
  /**
   * R5 / D19 — the ONLY student reference this view will ever carry. Opaque
   * document id, never a name: the diagnostic export (task 25) is built from
   * this same read model and must stay no-name, so an identity block here
   * would sit one careless spread from the export path. Name, class and
   * initials come from the separately authorised roster read, joined on this
   * field — which is also the only thing that lets `/my/students/results`
   * key a roster row to a student at all.
   */
  student_document_id: nonEmptyString,
  skill: skillSchema,
  scope: resultScopeSchema,
  status: resultStatusSchema,
  destination: resultDestinationSchema,
  published_at: z.iso.datetime().nullable(),
  provisional: provisionalSchema.nullable(),
  model_version: modelVersionSchema,

  overall: resultViewOverallSchema,
  acara_phase: nonEmptyString.nullable(),
  /**
   * Task 19 / audit F4 — the attribute that NAMES a
   * `developing_to_consolidating` phase (design §7.4 form 2).
   *
   * REQUIRED-AND-NULLABLE, not `.optional()`, and the asymmetry with
   * `resultViewSchema`'s optional `history` is deliberate. `history` is omitted
   * on the roster read for payload size, so "absent" carries meaning there. A
   * phase, by contrast, is emitted on every view, and this field is the phase's
   * own qualifier: a producer that simply forgot it would otherwise validate
   * and render a `developing_to_consolidating` label with the attribute
   * silently missing — which is the exact defect audit F4 recorded, one layer
   * up. `null` means "not a named transition"; there is no third state.
   */
  transitioning_attribute: nonEmptyString.nullable(),
  readiness: readinessSchema.nullable(),
  gate: resultViewGateSchema,
  effort_valid: z.boolean().nullable(),
  low_confidence: z.boolean().nullable(),
  items_answered: itemCountSchema,
  items_total: itemCountSchema,
  duration_minutes: z.number().int().min(0).nullable(),

  attributes: z.partialRecord(attributeNameSchema, resultViewAttributeSchema),
  vocab: resultViewVocabSchema,
  error_patterns: z.array(errorPatternSchema),
  history: z.array(resultHistoryPointSchema).max(RESULT_HISTORY_MAX_POINTS).optional(),

  previous_result_document_id: nonEmptyString.nullable(),
  narrative: resultNarrativeSchema.nullable().optional(),
  cefr_band: cefrBandSchema.nullable(),

  // The three fields v2 was missing. See ./result-view.supplementary.ts for
  // why each one is load-bearing on a live consumer; `display_label` matches
  // v1's `z.string().nullable()` because null already means "retry" to the app
  // and has to keep meaning it.
  display_label: z.string().nullable(),
  supplementary: resultViewSupplementarySchema.nullable(),
  productive_scores: resultViewProductiveScoresSchema.nullable(),
}).superRefine((view, ctx) => {
  if (view.items_answered > view.items_total) {
    ctx.addIssue({
      code: 'custom',
      path: ['items_answered'],
      message: 'items_answered counts reached responses, so it can never exceed items_total',
    });
  }
});
export type ResultView = z.infer<typeof resultViewSchema>;
