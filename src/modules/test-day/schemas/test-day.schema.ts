import { z } from 'zod';

// Boundary schemas for the sitting reads the test-day screen depends on
// (task 64). Defensive parsing at the query boundary; the UI consumes the
// types from types/test-day.types.ts.

export const sittingStatusSchema = z.enum(['open', 'closed']);

// teacher/12 — ONE vocabulary across both reads: C-SIT-02's state widens UP
// to `monitorStateSchema`'s eight members (never narrowed down). The read is
// a plain object mirror, so payloads from before the widen still parse.
export const sittingStudentStateSchema = z.enum([
  'not_joined',
  'joined',
  'in_progress',
  'submitted',
  'stalled',
  'scoring_failed',
  'absent',
  'paused',
]);

// Teacher-scoped GET /api/sittings row (create returns the same shape, so one
// schema covers both).
export const classSittingSchema = z.object({
  documentId: z.string(),
  code: z.string().nullable(),
  status: sittingStatusSchema,
  mode: z.string(),
  skill: z.string(),
  createdAt: z.string(),
  form: z.object({ documentId: z.string(), form_code: z.string() }).nullable(),
  class: z.object({ documentId: z.string(), name: z.string() }).nullable(),
});

// C-SIT-07 sitting history row (summary mode on the teacher-scoped sitting
// list). The lifecycle fields are nullable on the content-type, so the
// boundary keeps them nullable rather than trusting the fixture data.
export const sittingHistoryRowSchema = z.object({
  documentId: z.string(),
  code: z.string().nullable(),
  form_code: z.string().nullable(),
  status: sittingStatusSchema,
  opened_at: z.string().nullable(),
  closed_at: z.string().nullable(),
  joined: z.number(),
  submitted: z.number(),
  total: z.number(),
});

// C-SIT-08 end-of-test-day summary payload (task 136).
export const sittingSummarySchema = z.object({
  sitting: z.object({
    documentId: z.string(),
    code: z.string().nullable(),
    status: sittingStatusSchema,
  }),
  sat: z.number(),
  absent: z.number(),
  needs_resit: z.number(),
  results_pending: z.number(),
  results_ready: z.number(),
});

// C-SIT-02 monitor payload. Teacher Portal v2 B2 adds the room pause, the
// room's extra time and its extension count to the sitting, and per student
// their pause (the room's or their own) and the minutes granted to them.
// OPTIONAL on the mirror only, so a payload from before B2 still parses.
export const sittingMonitorSchema = z.object({
  sitting: z.object({
    documentId: z.string(),
    code: z.string().nullable(),
    status: sittingStatusSchema,
    paused: z.boolean().optional(),
    paused_at: z.iso.datetime().nullable().optional(),
    extra_seconds: z.number().int().nonnegative().optional(),
    extensions: z.number().int().nonnegative().optional(),
  }),
  students: z.array(
    z.object({
      documentId: z.string(),
      given_name: z.string(),
      family_name: z.string(),
      email: z.string().nullable(),
      state: sittingStudentStateSchema,
      session_documentId: z.string().nullable(),
      absent: z.boolean(),
      needs_to_sit: z.boolean(),
      paused: z.boolean().optional(),
      extra_minutes: z.number().int().nonnegative().optional(),
    }),
  ),
});

/* ── Teacher Portal v2 B2 · room + per-student controls ───────────────────
 * Client mirror of schooltest-api/src/contracts/teacher-sessions.ts (B2):
 * POST /api/sittings/:id/{pause,resume,extend} and
 * POST /api/sittings/:id/students/:studentId/{pause,resume,extend,submit,relaunch},
 * each answering `{ data }`; a 409 carries `details.reason` + `details.phase`.
 * They act on a running sitting only — never on a booking. */

const documentIdSchema = z.string().min(1);

const sittingPhaseSchema = z.enum(['scheduled', 'open', 'running', 'closed', 'cancelled']);

/** "+5 min" / "+10 min" for the room, "Allow 10 more minutes" for a student. */
export const sittingExtendMinutesSchema = z.literal([5, 10]);

export const roomControlRequestSchema = z.union([
  z.strictObject({ sittingDocumentId: documentIdSchema, action: z.enum(['pause', 'resume']) }),
  z.strictObject({
    sittingDocumentId: documentIdSchema,
    action: z.literal('extend'),
    minutes: sittingExtendMinutesSchema,
  }),
]);
export type RoomControlRequest = z.infer<typeof roomControlRequestSchema>;

export const studentControlRequestSchema = z.union([
  z.strictObject({
    sittingDocumentId: documentIdSchema,
    studentDocumentId: documentIdSchema,
    action: z.enum(['pause', 'resume', 'submit', 'relaunch']),
  }),
  z.strictObject({
    sittingDocumentId: documentIdSchema,
    studentDocumentId: documentIdSchema,
    action: z.literal('extend'),
    minutes: sittingExtendMinutesSchema,
  }),
]);
export type StudentControlRequest = z.infer<typeof studentControlRequestSchema>;

/** 409 `details`: why a control cannot act right now. */
export const sittingControlConflictDetailsSchema = z.strictObject({
  reason: z.enum(['not_running', 'already_paused', 'not_paused', 'no_active_attempt']),
  phase: sittingPhaseSchema,
});
export type SittingControlConflictDetails = z.infer<typeof sittingControlConflictDetailsSchema>;

/** The room after a room control: `paused_at` only while paused; the credit is paused time already given back. */
export const sittingRoomStateSchema = z.strictObject({
  sitting_document_id: documentIdSchema,
  phase: z.literal('running'),
  paused: z.boolean(),
  paused_at: z.iso.datetime().nullable(),
  extra_seconds: z.number().int().nonnegative(),
  extensions: z.number().int().nonnegative(),
  pause_credit_seconds: z.number().int().nonnegative(),
});
export type SittingRoomState = z.infer<typeof sittingRoomStateSchema>;

/** One student's attempt after a per-student control; a force submit names its Result. */
export const sittingStudentControlStateSchema = z.strictObject({
  sitting_document_id: documentIdSchema,
  student_document_id: documentIdSchema,
  session_document_id: documentIdSchema,
  session_status: z.enum(['in_progress', 'terminated', 'complete']),
  paused: z.boolean(),
  paused_at: z.iso.datetime().nullable(),
  extra_seconds: z.number().int().nonnegative(),
  submitted_by_teacher: z.boolean(),
  result_document_id: documentIdSchema.nullable(),
});
export type SittingStudentControlState = z.infer<typeof sittingStudentControlStateSchema>;
