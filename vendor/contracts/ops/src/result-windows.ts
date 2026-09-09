/**
 * D-WIN — assessment windows beside the legacy school form window (backlog
 * task 01).
 *
 * The decisions pin the facts the flows in tasks 28 (result windows) and 20
 * (assign teacher / test window) must implement; this module pins the WIRE:
 *  - A window belongs to one school, carries a title, an IANA timezone, an
 *    opens/closes interval, one-to-four forms each bound to a skill, the
 *    selected classes and an IMMUTABLE cohort snapshot (persisted at
 *    creation; later roster moves never rewrite a window's cohort).
 *  - New sittings link a window nullable; old sittings and the current
 *    school form-window row keep their existing path — the window never
 *    replaces the legacy single school form window.
 *  - Status is complete | in_progress | scheduled | cancelled, derived from
 *    official sessions with invalidated attempts excluded; `average_cefr` is
 *    null unless a validated band mapping supports aggregation — CEFR labels
 *    are never averaged numerically.
 *  - Reopen is allowed only within seven calendar days of the close (the
 *    constant below is the decision, the flow task enforces it).
 */
import { z } from 'zod';

import { dataEnvelope, documentIdSchema, type OpsOperation } from './core';
import { opsStudentsPaginationSchema } from './students-list';

/** Seven calendar days, D-WIN — a reopen is possible only inside this window. */
export const ASSESSMENT_WINDOW_REOPEN_DAYS = 7;

/** Row status as the results table renders it (task 28 derives, never stores). */
export const windowStatusSchema = z.enum(['complete', 'in_progress', 'scheduled', 'cancelled']);
export type WindowStatus = z.infer<typeof windowStatusSchema>;

export const OPS_WINDOW_TITLE_MAX = 255;
export const OPS_WINDOW_TIMEZONE_MAX = 100;
export const OPS_WINDOW_CLASSES_MAX = 200;
export const OPS_WINDOW_FORMS_MAX = 4;
const COUNT_MAX = 2_147_483_647;

const timestampSchema = z.iso.datetime({ offset: true });

/** One skill -> active form binding. Duplicate skills reject at the boundary. */
export const opsWindowFormBindingSchema = z.strictObject({
  skill: z.enum(['reading', 'listening', 'speaking', 'writing']),
  form_documentId: documentIdSchema,
});
export type OpsWindowFormBinding = z.infer<typeof opsWindowFormBindingSchema>;

/** POST /api/ops/schools/{documentId}/result-windows — strict create body. */
export const assessmentWindowCreateBodySchema = z.strictObject({
  title: z.string().trim().min(1).max(OPS_WINDOW_TITLE_MAX),
  class_documentIds: z.array(documentIdSchema).min(1).max(OPS_WINDOW_CLASSES_MAX),
  forms: z.array(opsWindowFormBindingSchema).min(1).max(OPS_WINDOW_FORMS_MAX),
  opens_at: timestampSchema,
  closes_at: timestampSchema,
  timezone: z.string().min(1).max(OPS_WINDOW_TIMEZONE_MAX),
});
export type AssessmentWindowCreateBody = z.infer<typeof assessmentWindowCreateBodySchema>;

/**
 * Cross-field rule, checked here so the server error is deterministic:
 * `opens_at < closes_at`. The Zod refine gives every caller the same 400.
 */
export function validateWindowInterval(body: AssessmentWindowCreateBody): boolean {
  return Date.parse(body.opens_at) < Date.parse(body.closes_at);
}

/** GET row — historical and scheduled windows (ResultWindow). */
export const opsResultWindowRowSchema = z.strictObject({
  documentId: documentIdSchema,
  title: z.string().min(1).max(OPS_WINDOW_TITLE_MAX),
  status: windowStatusSchema,
  opens_at: timestampSchema,
  closes_at: timestampSchema,
  eligible: z.number().int().min(0).max(COUNT_MAX),
  sat: z.number().int().min(0).max(COUNT_MAX),
  /** Null unless a validated band mapping supports aggregation. */
  average_cefr: z.string().max(10).nullable(),
  average_percentage: z.number().min(0).max(100).nullable(),
  updatedAt: timestampSchema,
});
export type OpsResultWindowRow = z.infer<typeof opsResultWindowRowSchema>;

export const opsResultWindowsQuerySchema = z.strictObject({
  page: z.number().int().min(1).max(100_000).optional(),
  pageSize: z.number().int().min(1).max(200).optional(),
  status: windowStatusSchema.optional(),
});
export type OpsResultWindowsQuery = z.infer<typeof opsResultWindowsQuerySchema>;

export const opsResultWindowsResponseSchema = z.strictObject({
  data: z.array(opsResultWindowRowSchema).max(200),
  meta: z.strictObject({ pagination: opsStudentsPaginationSchema }),
});
export type OpsResultWindowsResponse = z.infer<typeof opsResultWindowsResponseSchema>;

/** PUT /api/ops/classes/{documentId}/test-window — assign or clear (null). */
export const classWindowAssignBodySchema = z.strictObject({
  window_documentId: documentIdSchema.nullable(),
});
export type ClassWindowAssignBody = z.infer<typeof classWindowAssignBodySchema>;

export const classWindowAssignResultSchema = z.strictObject({
  class_documentId: documentIdSchema,
  window_documentId: documentIdSchema.nullable(),
});
export type ClassWindowAssignResult = z.infer<typeof classWindowAssignResultSchema>;

export const classWindowAssignResponseSchema = dataEnvelope(classWindowAssignResultSchema);

/* ------------------------------------------------------------------ *
 * Task 30 — C-OPS-PORTAL-057/058/059: share, cancel and reopen.
 * ------------------------------------------------------------------ */

/** Share outcome — explicit partial-delivery counts, never a full-success claim. */
export const opsWindowShareResultSchema = z.strictObject({
  window_documentId: documentIdSchema,
  sent: z.number().int().min(0).max(COUNT_MAX),
  failed: z.number().int().min(0).max(COUNT_MAX),
});
export type OpsWindowShareResult = z.infer<typeof opsWindowShareResultSchema>;

export const opsWindowShareResponseSchema = dataEnvelope(opsWindowShareResultSchema);
export type OpsWindowShareResponse = z.infer<typeof opsWindowShareResponseSchema>;

export const opsWindowActionResponseSchema = dataEnvelope(opsResultWindowRowSchema);
export type OpsWindowActionResponse = z.infer<typeof opsWindowActionResponseSchema>;

/* ------------------------------------------------------------------ *
 * The named operations.
 * ------------------------------------------------------------------ */

/** C-OPS-PORTAL-054 — GET /api/ops/schools/{documentId}/result-windows */
export const ResultWindowsOperation: OpsOperation<
  typeof opsResultWindowsQuerySchema,
  typeof opsResultWindowsResponseSchema
> = Object.freeze({
  contractId: 'C-OPS-PORTAL-054',
  method: 'GET',
  path: '/api/ops/schools/{documentId}/result-windows',
  request: opsResultWindowsQuerySchema,
  response: opsResultWindowsResponseSchema,
  success: 200,
  errors: [400, 401, 403, 404, 429, 500],
});

const assessmentWindowCreateResponseSchema = dataEnvelope(opsResultWindowRowSchema);
export type AssessmentWindowCreateResponse = z.infer<typeof assessmentWindowCreateResponseSchema>;
export { assessmentWindowCreateResponseSchema };

/** C-OPS-PORTAL-073 — POST /api/ops/schools/{documentId}/result-windows */
export const AssessmentWindowCreateOperation: OpsOperation<
  typeof assessmentWindowCreateBodySchema,
  typeof assessmentWindowCreateResponseSchema
> = Object.freeze({
  contractId: 'C-OPS-PORTAL-073',
  method: 'POST',
  path: '/api/ops/schools/{documentId}/result-windows',
  request: assessmentWindowCreateBodySchema,
  response: assessmentWindowCreateResponseSchema,
  success: 201,
  errors: [400, 401, 403, 404, 409, 429, 500],
});

/** C-OPS-PORTAL-074 — PUT /api/ops/classes/{documentId}/test-window */
export const ClassWindowAssignOperation: OpsOperation<
  typeof classWindowAssignBodySchema,
  typeof classWindowAssignResponseSchema
> = Object.freeze({
  contractId: 'C-OPS-PORTAL-074',
  method: 'PUT',
  path: '/api/ops/classes/{documentId}/test-window',
  request: classWindowAssignBodySchema,
  response: classWindowAssignResponseSchema,
  success: 200,
  errors: [400, 401, 403, 404, 409, 429, 500],
});
