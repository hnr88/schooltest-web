/**
 * OPS-020 — C-OPS-PORTAL-010 `GET /api/ops/audit-logs`.
 *
 * ONE definition of the school-scoped recent-activity read, imported by the
 * Strapi projection, the typed web query and both HTTP suites.
 *
 * The row is a SAFE DISPLAY PROJECTION of an audit-log row, not the ledger
 * row itself: `summary` is built server-side from an allowlist of actions and
 * `detail` keys, so an invitation token, a CSV body or a reset link can never
 * reach the overview card even when the stored detail carries one. `actor` is
 * the acting staff member's name reference — never their email, never a token.
 */
import { z } from 'zod';

import { documentIdSchema, type OpsOperation } from './core';

const ACTION_MAX = 100;
const TARGET_MAX = 255;
const NAME_MAX = 100;
const SUMMARY_MAX = 600;
const QUERY_MAX = 120;

export const SCHOOL_ACTIVITY_PAGE_MIN = 1;
export const SCHOOL_ACTIVITY_PAGE_MAX = 100_000;
export const SCHOOL_ACTIVITY_PAGE_SIZE_MIN = 1;
export const SCHOOL_ACTIVITY_PAGE_SIZE_MAX = 200;

const timestampSchema = z.iso.datetime({ offset: true });

export const schoolActivityPaginationSchema = z.strictObject({
  page: z.number().int().min(SCHOOL_ACTIVITY_PAGE_MIN).max(SCHOOL_ACTIVITY_PAGE_MAX),
  pageSize: z.number().int().min(SCHOOL_ACTIVITY_PAGE_SIZE_MIN).max(SCHOOL_ACTIVITY_PAGE_SIZE_MAX),
  pageCount: z.number().int().min(0),
  total: z.number().int().min(0),
});
export type SchoolActivityPagination = z.infer<typeof schoolActivityPaginationSchema>;

/** The acting staff member, by name reference only — no email, no role. */
export const activityActorSchema = z.strictObject({
  documentId: documentIdSchema,
  first_name: z.string().max(NAME_MAX).nullable(),
  last_name: z.string().max(NAME_MAX).nullable(),
});
export type ActivityActor = z.infer<typeof activityActorSchema>;

export const activityRowSchema = z.strictObject({
  documentId: documentIdSchema,
  action: z.string().min(1).max(ACTION_MAX),
  target: z.string().min(1).max(TARGET_MAX),
  timestamp: timestampSchema,
  actor: activityActorSchema.nullable(),
  summary: z.string().min(1).max(SUMMARY_MAX),
});
export type ActivityRow = z.infer<typeof activityRowSchema>;

export const schoolActivityQuerySchema = z.strictObject({
  page: z.number().int().min(SCHOOL_ACTIVITY_PAGE_MIN).max(SCHOOL_ACTIVITY_PAGE_MAX).optional(),
  pageSize: z
    .number()
    .int()
    .min(SCHOOL_ACTIVITY_PAGE_SIZE_MIN)
    .max(SCHOOL_ACTIVITY_PAGE_SIZE_MAX)
    .optional(),
  school: documentIdSchema.optional(),
});
export type SchoolActivityQuery = z.infer<typeof schoolActivityQuerySchema>;

export const schoolActivityResponseSchema = z.strictObject({
  data: z.array(activityRowSchema).max(SCHOOL_ACTIVITY_PAGE_SIZE_MAX),
  meta: z.strictObject({ pagination: schoolActivityPaginationSchema }),
});
export type SchoolActivityResponse = z.infer<typeof schoolActivityResponseSchema>;

export const SchoolActivityOperation: OpsOperation<
  typeof schoolActivityQuerySchema,
  typeof schoolActivityResponseSchema
> = Object.freeze({
  contractId: 'C-OPS-PORTAL-010',
  method: 'GET',
  path: '/api/ops/audit-logs',
  request: schoolActivityQuerySchema,
  response: schoolActivityResponseSchema,
  success: 200,
  errors: [400, 401, 403, 404, 429, 500],
});
