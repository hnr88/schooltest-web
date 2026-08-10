import { z } from 'zod';

import {
  namedAttributeSchema,
  teacherCountSchema,
  teacherStudentRefSchema,
} from '@/modules/teacher/schemas/teacher.schema';

// TEACHER PROGRESS (Test A → Test B) — client mirror of C-TR-4
// (.qa/CONTRACTS.md; schooltest-api/src/contracts/teacher-progress.ts), field
// for field. The cohort rule is the whole contract: every aggregate counts only
// students who completed BOTH tests. `available: false` is the REAL empty state
// the UI renders — never a zero-filled body pretending to be data.

const str = z.string().min(1);

export const progressCohortSchema = z.strictObject({
  both_tests: teacherCountSchema,
  test_a_completed: teacherCountSchema,
  test_b_completed: teacherCountSchema,
  total: teacherCountSchema,
});

export const progressSummarySchema = z.strictObject({
  avg_a: z.number(),
  avg_b: z.number(),
  avg_delta: z.number(),
  improved: teacherCountSchema,
  unchanged: teacherCountSchema,
  regressed: teacherCountSchema,
});

export const progressSubskillShiftSchema = namedAttributeSchema.extend({
  a_mastered: teacherCountSchema,
  b_mastered: teacherCountSchema,
  change: z.number().int(),
});

/** One `from → to` ACARA phase transition and how many students made it. */
export const acaraMovementDetailSchema = z.strictObject({
  from: str,
  to: str,
  count: teacherCountSchema,
});

export const acaraMovementSchema = z.strictObject({
  up: teacherCountSchema,
  same: teacherCountSchema,
  down: teacherCountSchema,
  up_detail: z.array(acaraMovementDetailSchema),
  down_detail: z.array(acaraMovementDetailSchema),
  same_improved_within_phase: teacherCountSchema,
});

/** Only students with a numeric score on BOTH tests can appear in either list. */
export const progressMoverSchema = teacherStudentRefSchema.extend({
  score_a: z.number().int().min(0).max(100),
  score_b: z.number().int().min(0).max(100),
  delta: z.number().int().min(-100).max(100),
});

/** `available: false` ⇒ summary/acara_movement null, every array empty. */
export const classProgressResponseSchema = z.strictObject({
  available: z.boolean(),
  cohort: progressCohortSchema,
  summary: progressSummarySchema.nullable(),
  subskill_shift: z.array(progressSubskillShiftSchema),
  acara_movement: acaraMovementSchema.nullable(),
  /** Top 3 by delta desc, delta > 0. */
  most_improved: z.array(progressMoverSchema).max(3),
  /** All with delta < 0, worst first. */
  needs_attention: z.array(progressMoverSchema),
});
