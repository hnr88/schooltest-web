import { z } from 'zod';

// TEACHER DASHBOARD — client mirror of the server contract, field for field
// (.qa/CONTRACTS.md "Vocabulary", C-TD-1, C-TD-2; schooltest-api/src/contracts/
// teacher.ts). Every response object is STRICT: an unexpected or missing key
// throws at the Axios boundary so contract drift surfaces as an error state,
// never as a half-rendered teacher surface. Field-for-field parity with the
// server module is asserted mechanically, not by eye — see
// tests/e2e/teacher-contract-parity.spec.ts.

const str = z.string().min(1);

/** Strapi v5 public identifier — 24 chars, never the numeric `id`. */
export const teacherDocumentIdSchema = z
  .string()
  .regex(/^[a-z0-9]{24}$/i, 'must be a Strapi document id');
export const teacherCountSchema = z.number().int().nonnegative();

/** 3.10 `reading_attribute` — the app's own subskill codes, R1 decoding … R7 critical. */
export const readingAttributeSchema = z.enum(['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7']);

/**
 * Teacher-view band, DERIVED SERVER-SIDE from `prob` + `Config.teacher_mastery_bands`.
 * The portal renders this wire value and re-thresholds nothing.
 */
export const masteryBandSchema = z.enum(['mastered', 'approaching', 'not_yet', 'not_assessed']);

/**
 * Per-student live tile state on the C-TS3/C-SIT-02 monitoring grids — ONE
 * vocabulary of eight. `scoring_failed` (Lane E's terminal result state) is
 * the OPERATOR signal: a student whose result exhausted its R retries must
 * never read as merely "submitted". teacher/12 adds `absent` (C-SIT-06's
 * mark-absent) and `paused` (the room is paused; the pause writer is task
 * 17's). The server derives them; this enum only accepts them — the web
 * tolerates payloads from before the API emits a state, never the reverse.
 */
export const monitorStateSchema = z.enum([
  'not_joined',
  'joined',
  'in_progress',
  'submitted',
  'stalled',
  'scoring_failed',
  'absent',
  'paused',
]);

/**
 * D-07 answer-arrival recency on a monitor tile — a server derivation over
 * the newest `api::response.response` against two `Config` thresholds, never
 * a link probe. Nullable exactly as the API contract declares it: `null` on
 * the three terminal states (`not_joined`, `submitted`, `scoring_failed`).
 */
export const connectionStateSchema = z.enum(['online', 'weak', 'offline']).nullable();

/** The A/B parallel reading diagnostic pair (DECISIONS.md A2). */
export const testVariantSchema = z.enum(['A', 'B']);

/** Per-student, per-variant cell state on the C-TR-1 students table. */
export const testProgressStateSchema = z.enum(['done', 'stalled', 'in_progress', 'not_started']);

/** `Config.teacher_mastery_bands`, echoed by C-TR-2 — read, never applied here. */
export const teacherMasteryBandsSchema = z.strictObject({
  mastered_cut: z.number().min(0).max(1),
  approaching_cut: z.number().min(0).max(1),
});

/** A1 overall score: `round(mean(prob) * 100)`; `null` when nothing is assessed. */
export const teacherScoreSchema = z.number().int().min(0).max(100).nullable();

export const testCompletionSchema = z.strictObject({
  completed: teacherCountSchema,
  total: teacherCountSchema,
});

export const teacherClassRefSchema = z.strictObject({
  document_id: teacherDocumentIdSchema,
  name: str,
});

/** Roster identity on every teacher surface — `display_name` is `"Given F."`. */
export const teacherStudentRefSchema = z.strictObject({
  student_document_id: teacherDocumentIdSchema,
  display_name: str,
});

/**
 * `attribute` + its display `name`. The name arrives from the ACTIVE reading
 * Crosswalk's `attribute_descriptors` — there is no client-side codebook and no
 * fallback to the bare code.
 */
export const namedAttributeSchema = z.strictObject({
  attribute: readingAttributeSchema,
  name: str,
});

export const topGapSchema = namedAttributeSchema.extend({ not_yet_count: teacherCountSchema });

/** The `@strapi/utils` typed-error envelope every 4xx on this surface returns. */
export const teacherErrorSchema = z.strictObject({
  data: z.null(),
  error: z.strictObject({
    status: z.number().int(),
    name: str,
    message: str,
    details: z.record(z.string(), z.unknown()),
  }),
});

/**
 * The auth-failure statuses `/api/teacher/**` REALLY returns (.qa/CONTRACTS.md
 * "AUTH-FAILURES", measured on the running Strapi — NOT the textbook 401/403
 * split). A MISSING `Authorization` header authenticates as the Public role and
 * fails the scope check ⇒ 403; a PRESENT but invalid bearer fails JWT
 * verification ⇒ 401. Mirrors `TEACHER_AUTH_FAILURE_STATUS` in
 * schooltest-api/src/contracts/teacher.ts; tests import it rather than hardcode
 * a literal, so a drift in either direction fails an assertion.
 */
export const TEACHER_AUTH_FAILURE_STATUS = {
  missing_authorization_header: 403,
  invalid_bearer_token: 401,
  wrong_role: 403,
  foreign_object: 403,
  unknown_object: 404,
} as const;

/* ── C-TD-1 · GET /api/teacher/dashboard ───────────────────────────────── */

/**
 * The class reading summary on a dashboard card — MIRROR of
 * `dashboardClassReadingSchema` in schooltest-api/src/contracts/teacher.ts.
 * `average` = mean `overall.domain_score` of each roster student's LATEST
 * official complete reading result (null when none); `scored` = how many
 * students contributed; `delta` = mean (latest − earliest this school year) over
 * students with ≥2 such results (null when no student has two). Server-derived:
 * the client renders these numbers and recomputes nothing.
 */
export const dashboardClassReadingSchema = z.strictObject({
  average: z.number().nullable(),
  delta: z.number().nullable(),
  scored: teacherCountSchema,
});

/**
 * The derived class status — MIRROR of `dashboardClassSchema` in
 * schooltest-api/src/contracts/teacher.ts (D-60: a server derivation; the
 * client applies no cut of its own and never re-derives it). `reading` and
 * `year_level` are optional so a response from an API build before they
 * shipped still parses.
 */
export const dashboardClassSchema = z.strictObject({
  class_document_id: teacherDocumentIdSchema,
  name: str,
  year_band: z.string().nullable(),
  student_count: teacherCountSchema,
  test_a: testCompletionSchema,
  test_b: testCompletionSchema,
  top_gap: topGapSchema.nullable(),
  status: z.enum(['sitting_now', 'scheduled', 'no_tests_yet', 'complete']),
  open_session_count: teacherCountSchema,
  reading: dashboardClassReadingSchema.optional(),
  /** The most common `student.year_level` on the active roster; null when none is set. */
  year_level: z.number().int().nullable().optional(),
});

/** The caller's most recently opened `status:'open'` sitting, else `null`. */
export const dashboardLiveSessionSchema = z.strictObject({
  sitting_document_id: teacherDocumentIdSchema,
  code: z.string().nullable(),
  class_name: str,
  test_variant: testVariantSchema.nullable(),
  opened_at: z.iso.datetime().nullable(),
});

export const teacherDashboardResponseSchema = z.strictObject({
  classes: z.array(dashboardClassSchema),
  live_session: dashboardLiveSessionSchema.nullable(),
  /** Every open sitting of every owned class, BESIDE the singular above (additive). */
  live_sessions: z.array(dashboardLiveSessionSchema),
});

/* ── C-TD-2 · GET /api/teacher/tests ───────────────────────────────────── */

/** `label` is composed SERVER-SIDE and rendered verbatim — never built here. */
export const teacherTestSchema = z.strictObject({
  form_document_id: teacherDocumentIdSchema,
  variant: testVariantSchema,
  label: str,
  skill: z.enum(['reading']),
});

export const teacherTestsResponseSchema = z.strictObject({
  tests: z.array(teacherTestSchema),
});
