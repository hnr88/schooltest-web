import { z } from 'zod';

import {
  likelihoodSchema,
  masteryBandSchema,
  namedAttributeSchema,
  readingAttributeSchema,
  teacherClassRefSchema,
  teacherCountSchema,
  teacherDocumentIdSchema,
  teacherMasteryBandsSchema,
  teacherScoreSchema,
  teacherStudentRefSchema,
  testCompletionSchema,
  testProgressStateSchema,
  testVariantSchema,
  topGapSchema,
} from '@/modules/teacher/schemas/teacher.schema';

// TEACHER RESULTS — client mirror of C-TR-1..3 (.qa/CONTRACTS.md;
// schooltest-api/src/contracts/teacher-results.ts), field for field. C-TR-4
// lives in the sibling teacher-progress.schema.ts. Every number below is
// DERIVED SERVER-SIDE from persisted rows; the portal computes none of them and
// re-thresholds none of them.

const str = z.string().min(1);

/* ── C-TR-1 · GET /api/teacher/classes/:documentId/students ─────────────── */

export const studentTestCellSchema = z.strictObject({
  state: testProgressStateSchema,
  score: teacherScoreSchema,
  acara_phase: z.string().nullable(),
});

export const classStudentRowSchema = teacherStudentRefSchema.extend({
  test_a: studentTestCellSchema,
  test_b: studentTestCellSchema,
});

export const classStudentsSummarySchema = z.strictObject({
  test_a: testCompletionSchema,
  test_b: testCompletionSchema,
  avg_score: teacherScoreSchema,
  top_gap: topGapSchema.nullable(),
});

export const classStudentsResponseSchema = z.strictObject({
  class: teacherClassRefSchema.extend({
    year_band: z.string().nullable(),
    student_count: teacherCountSchema,
  }),
  summary: classStudentsSummarySchema,
  students: z.array(classStudentRowSchema),
});

/* ── C-TR-2 · GET .../students/:studentDocumentId ───────────────────────── */

/**
 * One subskill tile. `status` is the server's band — the tile colours from it
 * and prints `likelihood` as-is. `previous_likelihood`/`delta` are populated on
 * the NEWER test only and only when both tests exist: null elsewhere, never 0.
 */
export const studentSubskillSchema = namedAttributeSchema.extend({
  likelihood: likelihoodSchema,
  status: masteryBandSchema,
  previous_likelihood: likelihoodSchema,
  delta: z.number().int().min(-100).max(100).nullable(),
});

export const studentTestResultSchema = z.strictObject({
  variant: testVariantSchema,
  completed_at: z.iso.datetime().nullable(),
  score: teacherScoreSchema,
  acara_phase: z.string().nullable(),
  display_label: z.string().nullable(),
  subskills: z.array(studentSubskillSchema),
});

/** `improved`/`stable`/`regressed` are SUBSKILL COUNTS, not booleans. */
export const studentProgressSchema = z.strictObject({
  score_delta: z.number().int().min(-100).max(100),
  acara_from: z.string().nullable(),
  acara_to: z.string().nullable(),
  improved: teacherCountSchema,
  stable: teacherCountSchema,
  regressed: teacherCountSchema,
});

export const studentDrillDownResponseSchema = z.strictObject({
  student: z.strictObject({
    document_id: teacherDocumentIdSchema,
    display_name: str,
    year_band: z.string().nullable(),
    first_language: z.string().nullable(),
    class_name: str,
  }),
  /** Echoed from `Config.teacher_mastery_bands` — the UI applies no cut itself. */
  bands: teacherMasteryBandsSchema,
  /** MOST RECENT FIRST: Test B before Test A when both exist. */
  tests: z.array(studentTestResultSchema),
  progress: studentProgressSchema.nullable(),
});

/* ── C-TR-3 · GET /api/teacher/classes/:documentId/insights ─────────────── */

/** Inverted by construction: it counts MASTERED, so a short bar IS the gap. */
export const insightMasterySchema = namedAttributeSchema.extend({
  mastered_count: teacherCountSchema,
  assessed_count: teacherCountSchema,
  ratio: z.number().min(0).max(1),
});

/** A student's PRIMARY gap attribute, or `no_gaps` when they band none `not_yet`. */
export const insightGroupKeySchema = z.union([readingAttributeSchema, z.literal('no_gaps')]);

/** `label`/`hint` come from the crosswalk descriptors — never client-side copy. */
export const insightGroupSchema = z.strictObject({
  key: insightGroupKeySchema,
  label: str,
  hint: str,
  students: z.array(teacherStudentRefSchema),
});

export const classInsightsResponseSchema = z.strictObject({
  class: teacherClassRefSchema,
  completed_count: teacherCountSchema,
  mastery: z.array(insightMasterySchema),
  groups: z.array(insightGroupSchema),
});
