import { z } from 'zod';

import {
  connectionStateSchema,
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

/* ── C-SIT-SETTINGS · PATCH /api/sittings/:documentId/settings (teacher 11) ── */

/**
 * Client mirror of the api contract's `sittingSettingsSchema`
 * (schooltest-api/src/contracts/teacher-sessions.ts) — eleven camelCase keys,
 * byte-for-byte. Strict on the REQUEST boundary only: the stored column is
 * read leniently by C-SIT-02 and the desktop (D-34), so the mirror is used to
 * VALIDATE what the server answered, never to reject a lenient read. Declared
 * ahead of C-TS-1, which takes the same settings at create.
 */
export const sittingSettingsSchema = z.strictObject({
  lowBw: z.boolean(),
  skip: z.boolean(),
  review: z.boolean(),
  flag: z.boolean(),
  bigText: z.boolean(),
  lockdown: z.boolean(),
  focusFlag: z.boolean(),
  warn5: z.boolean(),
  autoSubmit: z.boolean(),
  showScore: z.boolean(),
  timeLimit: z.number().int().min(1).max(180),
});
export type SittingSettings = z.infer<typeof sittingSettingsSchema>;

/** The design's `defaultSettings` — what `settings: null` (never written) renders. */
export const DEFAULT_SITTING_SETTINGS: SittingSettings = {
  lowBw: false,
  skip: true,
  review: true,
  flag: true,
  bigText: true,
  lockdown: true,
  focusFlag: true,
  warn5: true,
  autoSubmit: true,
  showScore: false,
  timeLimit: 40,
};

/** PATCH accepts a PARTIAL body; unknown keys still reject — strict, not silent. */
export const sittingSettingsPatchSchema = sittingSettingsSchema.partial();
export type SittingSettingsPatch = z.infer<typeof sittingSettingsPatchSchema>;

/** `sitting.phase`, and `member_student_ids` (`null` is the whole class). */
export const sittingPhaseSchema = z.enum(['scheduled', 'open', 'running', 'closed', 'cancelled']);
export const sittingMembersSchema = z.array(str).nullable();

/* ── Booking window (Teacher Portal v2 "Schedule a window") ─────────────── */

/**
 * A booking is a sitting with `phase: 'scheduled'`, `status: 'open'`, no code
 * and no `opened_at`; the server opens it at `opens_at` and closes it at
 * `closes_at`. The 07:00–19:00 rule is read in the school's zone, echoed back
 * as `window.timezone`.
 */
export const testSessionWindowSchema = z.strictObject({
  opens_at: z.iso.datetime({ offset: true }),
  closes_at: z.iso.datetime({ offset: true }),
});

export const testSessionBookedWindowSchema = z.strictObject({
  opens_at: z.iso.datetime(),
  closes_at: z.iso.datetime(),
  timezone: str,
});

/** 400 `details.schedule_errors[]`: the design's sentence per refused rule. */
export const bookingScheduleReasonSchema = z.enum([
  'date_passed',
  'outside_school_hours',
  'close_before_open',
  'window_shorter_than_time_limit',
  'start_earlier_today',
]);

export const bookingScheduleErrorSchema = z.strictObject({
  reason: bookingScheduleReasonSchema,
  message: str,
});

export const bookingScheduleErrorDetailsSchema = z.strictObject({
  fields: z.array(str),
  issues: z.array(str),
  schedule_errors: z.array(bookingScheduleErrorSchema).min(1),
});

export const testSessionStudentIdsSchema = z
  .array(teacherDocumentIdSchema)
  .min(1)
  .max(500)
  .refine((ids) => new Set(ids).size === ids.length, 'must not name a student twice');

/* ── C-TS-1 · POST /api/teacher/test-sessions ──────────────────────────── */

/**
 * The start-now keys are optional, so the original two-key body stays valid:
 * `student_document_ids` (active students of the class, none busy),
 * `settings` (saved at create) and `start` (server default `true`). `window`
 * books it instead (the 201 is then a booking); the server refuses it with
 * `start: true`.
 */
export const createTestSessionBodySchema = z.strictObject({
  class_document_id: teacherDocumentIdSchema,
  form_document_id: teacherDocumentIdSchema,
  student_document_ids: testSessionStudentIdsSchema.optional(),
  settings: sittingSettingsPatchSchema.optional(),
  start: z.boolean().optional(),
  window: testSessionWindowSchema.optional(),
});

/** 409 `details` — one test at a time per student. */
export const testSessionBusyDetailsSchema = z.strictObject({
  busy_student_document_ids: z.array(teacherDocumentIdSchema).min(1),
});

/**
 * 201. `code` is non-null and `status` is the literal `'open'`: C-TS-1 mints the
 * code in the same call, so a body without one is a defect, not an empty state.
 * The start-now fields are OPTIONAL on the web mirror only (the mirror's
 * tolerance rule); the API contract requires them.
 */
export const createTestSessionResponseSchema = z.strictObject({
  sitting_document_id: teacherDocumentIdSchema,
  code: str,
  class: teacherClassRefSchema,
  variant: testVariantSchema,
  status: z.enum(['open']),
  opened_at: z.iso.datetime(),
  phase: sittingPhaseSchema.extract(['open', 'running']).optional(),
  settings: sittingSettingsSchema.nullable().optional(),
  member_student_ids: sittingMembersSchema.optional(),
  expected: teacherCountSchema.optional(),
});

/* ── C-TS-2 · GET /api/teacher/test-sessions ───────────────────────────── */

/**
 * Optional server filters and paging; `meta.pagination` answers only a paged
 * read. `status`: `open` excludes bookings, `scheduled` is the bookings (sorted
 * by `window.opens_at`), `closed` is the sittings that actually RAN — api b10's
 * TB-50 filter drops every never-opened row, so a cancelled or lapsed booking is
 * in neither list and only in the unfiltered answer.
 */
export const teacherTestSessionsQuerySchema = z.strictObject({
  status: z.enum(['open', 'closed', 'scheduled']).optional(),
  class: teacherDocumentIdSchema.optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
});
export type TeacherTestSessionsQuery = z.infer<typeof teacherTestSessionsQuerySchema>;

export const testSessionFormSchema = z.strictObject({
  document_id: teacherDocumentIdSchema,
  label: str,
  variant: testVariantSchema.nullable(),
});

/** Counted over the expected students, latest session per student. */
export const testSessionStatsSchema = z.strictObject({
  expected: teacherCountSchema,
  joined: teacherCountSchema,
  submitted: teacherCountSchema,
});

/**
 * `code`/`opened_at` are nullable because the list also carries sittings created
 * outside C-TS-1 (the `api::sitting` core create mints neither); `closed_at` is
 * null on every open row; `variant` is null when the form is not the A|B pair.
 * The start-now fields are OPTIONAL on the web mirror only.
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
  phase: sittingPhaseSchema.optional(),
  form: testSessionFormSchema.nullable().optional(),
  settings: sittingSettingsSchema.nullable().optional(),
  member_student_ids: sittingMembersSchema.optional(),
  stats: testSessionStatsSchema.optional(),
  window: testSessionBookedWindowSchema.nullable().optional(),
});

export const teacherTestSessionsResponseSchema = z.strictObject({
  sessions: z.array(teacherTestSessionSchema),
  meta: z
    .strictObject({
      pagination: z.strictObject({
        page: z.number().int().min(1),
        pageSize: z.number().int().min(1),
        pageCount: teacherCountSchema,
        total: teacherCountSchema,
      }),
    })
    .optional(),
});

/* ── C-TS-3 · GET /api/teacher/test-sessions/:documentId/monitor ────────── */

export const monitorSittingSchema = z.strictObject({
  document_id: teacherDocumentIdSchema,
  code: z.string().nullable(),
  status: sittingStatusSchema,
  opened_at: z.iso.datetime().nullable(),
  class: teacherClassRefSchema,
  variant: testVariantSchema.nullable(),
  /**
   * Teacher Portal v2 B2 room controls: the room pause, when the pause in
   * force began (null while the room runs), the room's extra time (0 when
   * never extended) and how many extensions made it. OPTIONAL on the web
   * mirror only; the API contract requires them.
   */
  paused: z.boolean().optional(),
  paused_at: z.iso.datetime().nullable().optional(),
  extra_seconds: teacherCountSchema.optional(),
  extensions: teacherCountSchema.optional(),
});

export const monitorSummarySchema = z.strictObject({
  expected: teacherCountSchema,
  joined: teacherCountSchema,
  in_progress: teacherCountSchema,
  submitted: teacherCountSchema,
  stalled: teacherCountSchema,
  /** Lane E's terminal `scoring_failed` counter. */
  scoring_failed: teacherCountSchema,
  /**
   * teacher/12 — the two new states are counted like the rest. OPTIONAL on
   * the web mirror only: a payload emitted before the API's half still parses
   * (the mirror's own tolerance rule), and `monitorSummaryItems` coalesces a
   * missing counter to 0. The API contract itself requires them.
   */
  absent: teacherCountSchema.optional(),
  paused: teacherCountSchema.optional(),
});

/* ── C-PR-1 read side · proctoring signals on a monitor tile (rule 35) ───── */

/** The 11 concern kinds `api::proctoring-event` ingests (Lane N, C-PR-1). */
export const proctoringEventKindSchema = z.enum([
  'gaze_away',
  'no_face',
  'focus_lost',
  'multiple_faces',
  'extra_person',
  'phone_detected',
  'extra_voice',
  'help_seeking',
  'mouse_inactive',
  'screen_snapshot',
  'integrity_anomaly',
]);

export const proctoringSeveritySchema = z.enum(['info', 'warn', 'flag']);

/**
 * Server-computed per-student signal summary for the monitor. INFORMATION
 * ONLY (rule 35): it is a count of guidance reminders delivered to the
 * student, never an integrity verdict — the teacher reads "reminders noted",
 * never "suspicious".
 */
export const proctoringSummarySchema = z.strictObject({
  count_by_severity: z.strictObject({
    info: teacherCountSchema,
    warn: teacherCountSchema,
    flag: teacherCountSchema,
  }),
  /** Newest first, server-capped — the tile prints only the count. */
  latest: z.array(
    z.strictObject({
      kind: proctoringEventKindSchema,
      severity: proctoringSeveritySchema,
      occurred_at: z.iso.datetime(),
      detail: z.string().max(500),
    }),
  ),
});

/**
 * One tile. All three optional numbers stay null until the student's real rows
 * exist — `not_joined` has no session, `joined` has no responses, and
 * `inactive_minutes` is populated only on a `stalled` tile. Never rendered as 0.
 *
 * `proctoring` is null when no signals were recorded; the chip is then omitted.
 */
export const monitorStudentSchema = z.strictObject({
  student_document_id: teacherDocumentIdSchema,
  display_name: str,
  state: monitorStateSchema,
  stage: stageSchema.nullable(),
  total_stages: teacherCountSchema.nullable(),
  inactive_minutes: z.number().nonnegative().nullable(),
  proctoring: proctoringSummarySchema.nullable(),
  /**
   * teacher/12 — absence and pause, both as booleans beside the STATE, and
   * the D-07 connection recency (null on the three terminal states). OPTIONAL
   * on the web mirror only, so a payload emitted before the API's half still
   * parses — the mirror tolerates an older server, never the reverse. The
   * API contract itself requires all three.
   */
  absent: z.boolean().optional(),
  paused: z.boolean().optional(),
  connection: connectionStateSchema.optional(),
  /**
   * Teacher Portal v2 B2: `paused` is the room's pause OR this student's own;
   * `extra_minutes` is the time granted to this student alone (0 when none).
   * OPTIONAL on the web mirror only; the API contract requires it.
   */
  extra_minutes: teacherCountSchema.optional(),
  /**
   * TB-37: the Result of the session THIS tile reports — the same id a force
   * submit answers with, null while the attempt has none. It is what the Live
   * tab's "Retry scoring" / "Raise for manual scoring" row actions act on, so
   * a `scoring_failed` row no longer depends on a force submit having happened
   * in the same page session. OPTIONAL on the web mirror only (a payload from
   * a server without the API half still parses); the API contract requires it.
   */
  result_document_id: teacherDocumentIdSchema.nullable().optional(),
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

/* ── Bookings · C-TS-5 PATCH · C-TS-6 cancel · C-TS-7 start ─────────────── */

/** One booking (or booked sitting now running) a student is already in during the window. */
export const testSessionClashSchema = z.strictObject({
  sitting_document_id: teacherDocumentIdSchema,
  phase: sittingPhaseSchema.extract(['scheduled', 'open', 'running']),
  form: testSessionFormSchema.nullable(),
  opens_at: z.iso.datetime(),
  closes_at: z.iso.datetime(),
  student_document_ids: z.array(teacherDocumentIdSchema).min(1),
});

/** 409 `details` for a window clash (the design's "Booked into test A at 09:15"). */
export const testSessionClashDetailsSchema = z.strictObject({
  busy_student_document_ids: z.array(teacherDocumentIdSchema).min(1),
  clashes: z.array(testSessionClashSchema),
});

/** A booking: `phase: 'scheduled'`, no code, no `opened_at`. */
export const testSessionBookingSchema = z.strictObject({
  sitting_document_id: teacherDocumentIdSchema,
  code: z.null(),
  class: teacherClassRefSchema,
  variant: testVariantSchema,
  form: testSessionFormSchema,
  status: z.enum(['open']),
  phase: z.enum(['scheduled']),
  opened_at: z.null(),
  window: testSessionBookedWindowSchema,
  settings: sittingSettingsSchema.nullable(),
  member_student_ids: sittingMembersSchema,
  expected: teacherCountSchema,
});

/** C-TS-1 201: the started sitting, or with `window` the booking. */
export const createTestSessionResultSchema = z.union([
  createTestSessionResponseSchema,
  testSessionBookingSchema,
]);

/** C-TS-5 PATCH body; `student_document_ids: null` is the whole class again. */
export const updateTestSessionBodySchema = z
  .strictObject({
    window: testSessionWindowSchema.optional(),
    form_document_id: teacherDocumentIdSchema.optional(),
    student_document_ids: testSessionStudentIdsSchema.nullable().optional(),
    settings: sittingSettingsPatchSchema.optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: 'send at least one of window, form_document_id, student_document_ids, settings',
  });

export const cancelTestSessionResponseSchema = z.strictObject({
  sitting_document_id: teacherDocumentIdSchema,
  status: z.enum(['closed']),
  phase: z.enum(['cancelled']),
  closed_at: z.iso.datetime(),
});

/** C-TS-7: starting a booking answers C-TS-1's started sitting. */
export const startTestSessionResponseSchema = createTestSessionResponseSchema;

/** 409 `details` once the sitting is no longer a booking. */
export const testSessionNotScheduledDetailsSchema = z.strictObject({
  phase: sittingPhaseSchema,
});

/* ── C-SIT-ACTIVITY · GET+POST /api/sittings/:documentId/activity (teacher 13) ── */

/**
 * Client mirror of the api contract's sitting-activity schemas
 * (schooltest-api/src/contracts/teacher-sessions.ts). The read is a service
 * projection over the audit ledger — `detail` never reaches the wire — and
 * `total` counts the WHOLE trail while `entries` truncates to `limit`
 * (default 8, max 50): the panel's "last 8 of N" note renders from exactly
 * these two fields.
 */
export const sittingActivityLimitDefault = 8;
export const sittingActivityLimitMax = 50;

export const sittingActivityEntrySchema = z.strictObject({
  occurred_at: z.iso.datetime(),
  action: z.string().max(120),
  actor_label: z.string().min(1),
  kind: z.enum(['info', 'warn']),
});
export type SittingActivityEntry = z.infer<typeof sittingActivityEntrySchema>;

export const sittingActivityFeedSchema = z.strictObject({
  entries: z.array(sittingActivityEntrySchema),
  total: z.number().int().nonnegative(),
});
export type SittingActivityFeed = z.infer<typeof sittingActivityFeedSchema>;

/** The ONE write a teacher can type (Log an incident). `actor` is never in the body. */
export const sittingActivityAppendSchema = z.strictObject({
  note: z.string().trim().min(1).max(120),
  kind: z.enum(['info', 'warn']),
});
export type SittingActivityAppend = z.infer<typeof sittingActivityAppendSchema>;
