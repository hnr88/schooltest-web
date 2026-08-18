import { z } from 'zod';

import {
  monitorStateSchema,
  teacherClassRefSchema,
  teacherCountSchema,
  teacherDocumentIdSchema,
  testVariantSchema,
} from '@/modules/teacher/schemas/teacher.schema';

// TEACHER TEST SESSIONS — client mirror of C-TS-1..4 (.qa/CONTRACTS.md;
// schooltest-api/src/contracts/teacher-sessions.ts), field for field. C-SJ-1
// (POST /api/sittings/join-by-email) is deliberately absent: that endpoint is
// the STUDENT DESKTOP app's join path (schooltest-app), never called from the
// teacher portal, so mirroring its body here would be dead weight.

const str = z.string().min(1);

/** `api::sitting.sitting` lifecycle status. */
export const sittingStatusSchema = z.enum(['open', 'closed']);

/** 3.4 `stage` — the receptive stage ladder; `stage` IS `session.current_stage`. */
export const stageSchema = z.literal([1, 2, 3]);

/* ── C-TS-1 · POST /api/teacher/test-sessions ──────────────────────────── */

export const createTestSessionBodySchema = z.strictObject({
  class_document_id: teacherDocumentIdSchema,
  form_document_id: teacherDocumentIdSchema,
});

/**
 * 201. `code` is non-null and `status` is the literal `'open'`: C-TS-1 mints the
 * code in the same call, so a body without one is a defect, not an empty state.
 */
export const createTestSessionResponseSchema = z.strictObject({
  sitting_document_id: teacherDocumentIdSchema,
  code: str,
  class: teacherClassRefSchema,
  variant: testVariantSchema,
  status: z.enum(['open']),
  opened_at: z.iso.datetime(),
});

/* ── C-TS-2 · GET /api/teacher/test-sessions ───────────────────────────── */

/**
 * `code`/`opened_at` are nullable because the list also carries sittings created
 * outside C-TS-1 (the `api::sitting` core create mints neither); `closed_at` is
 * null on every open row; `variant` is null when the form is not the A|B pair.
 */
export const teacherTestSessionSchema = z.strictObject({
  sitting_document_id: teacherDocumentIdSchema,
  code: z.string().nullable(),
  status: sittingStatusSchema,
  class: teacherClassRefSchema,
  variant: testVariantSchema.nullable(),
  opened_at: z.iso.datetime().nullable(),
  closed_at: z.iso.datetime().nullable(),
  completed: teacherCountSchema,
  expected: teacherCountSchema,
});

export const teacherTestSessionsResponseSchema = z.strictObject({
  sessions: z.array(teacherTestSessionSchema),
});

/* ── C-TS-3 · GET /api/teacher/test-sessions/:documentId/monitor ────────── */

export const monitorSittingSchema = z.strictObject({
  document_id: teacherDocumentIdSchema,
  code: z.string().nullable(),
  status: sittingStatusSchema,
  opened_at: z.iso.datetime().nullable(),
  class: teacherClassRefSchema,
  variant: testVariantSchema.nullable(),
});

export const monitorSummarySchema = z.strictObject({
  expected: teacherCountSchema,
  joined: teacherCountSchema,
  in_progress: teacherCountSchema,
  submitted: teacherCountSchema,
  stalled: teacherCountSchema,
  /**
   * Lane E's terminal `scoring_failed` counter. OPTIONAL only while the API
   * side of C-TS-3 still partitions the roster five ways — the summary row
   * hides the stat until the server sends it, so the wider web schema can
   * deploy first without 500-ing every monitor read against the current wire.
   */
  scoring_failed: teacherCountSchema.optional(),
});

/**
 * One tile. All three optional numbers stay null until the student's real rows
 * exist — `not_joined` has no session, `joined` has no responses, and
 * `inactive_minutes` is populated only on a `stalled` tile. Never rendered as 0.
 */
export const monitorStudentSchema = z.strictObject({
  student_document_id: teacherDocumentIdSchema,
  display_name: str,
  state: monitorStateSchema,
  stage: stageSchema.nullable(),
  total_stages: teacherCountSchema.nullable(),
  inactive_minutes: z.number().nonnegative().nullable(),
});

export const testSessionMonitorResponseSchema = z.strictObject({
  sitting: monitorSittingSchema,
  /** Echoed from `Config.stall_threshold_minutes` — never hardcoded client-side. */
  stall_threshold_minutes: z.number().int().positive(),
  summary: monitorSummarySchema,
  students: z.array(monitorStudentSchema),
});

/* ── C-TS-4 · POST /api/teacher/test-sessions/:documentId/close ─────────── */

export const closeTestSessionResponseSchema = z.strictObject({
  sitting_document_id: teacherDocumentIdSchema,
  status: z.enum(['closed']),
  closed_at: z.iso.datetime(),
});
