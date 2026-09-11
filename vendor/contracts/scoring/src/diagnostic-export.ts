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

import {
  deltaDisplaySchema,
  domainScoreSchema,
  notAssessedSchema,
} from './core';
import {
  assessedBandSchema,
  bandSchema,
  displaySkillSchema,
  modelVersionSchema,
  readinessSchema,
  vocabStrandNameSchema,
} from './enums';
import { errorPatternSchema } from './stored-result';

/** Doc 1 s.11.4 — pseudonymised: year group and language background, NO name. */
export const diagnosticExportStudentSchema = z.strictObject({
  year_group: z.number().int().nullable(),
  first_language: z.string().nullable(),
  l1_literate: z.boolean().nullable(),
});

/** Which sitting this is, without identifying when it was booked. */
export const diagnosticExportSittingSchema = z.strictObject({
  date: z.iso.date().nullable(),
  number: z.number().int().min(1),
  weeks_since_previous: z.number().int().nullable(),
});

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
export const diagnosticExportSkillSchema = z.union([
  z.strictObject({
    domain_score: domainScoreSchema,
    status: assessedBandSchema,
    delta_display: deltaDisplaySchema.nullable(),
    descriptor: z.string().min(1).optional(),
  }),
  z.strictObject({
    domain_score: domainScoreSchema,
    gate_passed: z.boolean(),
    descriptor: z.string().min(1).optional(),
  }),
  notAssessedSchema,
]);
export type DiagnosticExportSkill = z.infer<typeof diagnosticExportSkillSchema>;

/** The Vocabulary bar plus its two strands, scores only. */
export const diagnosticExportVocabSchema = z.strictObject({
  blended: domainScoreSchema.nullable(),
  status: bandSchema,
  delta_display: deltaDisplaySchema.nullable(),
  a2: z.strictObject({ domain_score: domainScoreSchema.nullable() }),
  b1: z.strictObject({ domain_score: domainScoreSchema.nullable() }),
  single_strand: vocabStrandNameSchema.nullable(),
});

/** The exit gate: graded score and boolean, no theta (spec v2 §7). */
export const diagnosticExportGateSchema = z.strictObject({
  passed: z.boolean().nullable(),
  domain_score: domainScoreSchema.nullable(),
});

/** History, overall only (task 25) — the trend without re-exporting every skill. */
export const diagnosticExportHistoryPointSchema = z.strictObject({
  sat_at: z.iso.date(),
  overall: domainScoreSchema.nullable(),
});

/**
 * The full bundle. `skills` is exhaustive over the seven display skills so an
 * unassessed skill is stated as unassessed rather than silently missing —
 * absence of a key reads as an oversight, the not-assessed object reads as a
 * measured fact. `caveats` is `.min(1)`: the single-sitting note is
 * unconditional, and §7's provisional-transform / provisional-cut /
 * low-confidence lines join it when those flags are set.
 */
export const diagnosticExportSchema = z.strictObject({
  model_version: modelVersionSchema,
  student: diagnosticExportStudentSchema,
  sitting: diagnosticExportSittingSchema,
  overall: z.strictObject({
    domain_score: domainScoreSchema.nullable(),
    delta_display: deltaDisplaySchema.nullable(),
  }),
  acara_phase: z.string().min(1).nullable(),
  readiness: readinessSchema.nullable(),
  skills: z.record(displaySkillSchema, diagnosticExportSkillSchema),
  vocab: diagnosticExportVocabSchema,
  gate: diagnosticExportGateSchema,
  error_patterns: z.array(errorPatternSchema),
  history: z.array(diagnosticExportHistoryPointSchema),
  caveats: z.array(z.string().min(1)).min(1),
});
export type DiagnosticExport = z.infer<typeof diagnosticExportSchema>;

/** The only accepted value of the `format` query param (400 on anything else). */
export const DIAGNOSTIC_JSON_FORMAT = 'diagnostic_json';
