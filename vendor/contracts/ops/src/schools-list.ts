/**
 * C-OPS-PORTAL-001 — GET /api/ops/schools (OPS-011), the versioned school
 * directory. Unversioned callers keep the legacy C-OPS-01 shape exactly
 * (9 fields, meta:{}, name-ascending, no filters); everything here applies
 * only when the request carries X-Ops-Portal-Version: 1.
 *
 * HONEST-SHAPE NOTE: the schema declares ONLY fields backed by real data.
 * portal_status, portal_plan and status_counts joined it additively with
 * backlog task 07, once the school columns landed. last_active_at,
 * trial_ends_at, retention_until, billing_status and contact_name remain
 * GAPs and are still never invented here.
 */
import { z } from 'zod';

import {
  accountStatusSchema,
  dataEnvelope,
  documentIdSchema,
  onboardingStatusSchema,
  type OpsOperation,
} from './core';

export const australianStateSchema = z.enum(['VIC', 'NSW', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT']);
export type AustralianState = z.infer<typeof australianStateSchema>;

export const sectorSchema = z.enum(['government', 'non-government', 'catholic']);
export type Sector = z.infer<typeof sectorSchema>;

/** GAP-11 (column portal_plan -> OPS-002): declared, not yet served or filterable. */
export const portalPlanSchema = z.enum(['pilot', 'standard', 'enterprise']);
export type PortalPlan = z.infer<typeof portalPlanSchema>;

/** GAP-12 (derived portal_status needs portal_plan/OPS-002 + archived_at/OPS-005). */
export const portalStatusSchema = z.enum(['active', 'trial', 'pending_setup', 'suspended', 'archived']);
export type PortalStatus = z.infer<typeof portalStatusSchema>;

/**
 * The four sorts the design's dropdown offers (`Ops Portal.dc.html:104`):
 * Name A-Z, Most students, Recently active, Newest. GAP-15 is DISCHARGED —
 * `last_active_at` is a real column (OPS-005), so the designed
 * `last_active_at:desc` sort is served rather than withheld.
 *
 * Added as a fourth ENUM MEMBER, so every previously valid `sort` value stays
 * valid and a caller that omits `sort` is unaffected.
 */
export const schoolsListSortSchema = z.enum([
  'name:asc',
  'student_count:desc',
  'createdAt:desc',
  'last_active_at:desc',
]);
export type SchoolsListSort = z.infer<typeof schoolsListSortSchema>;

export const schoolsListQuerySchema = z.strictObject({
  page: z.number().int().min(1).max(100_000).optional(),
  pageSize: z.number().int().min(1).max(200).optional(),
  q: z.string().trim().max(120).optional(),
  state: australianStateSchema.optional(),
  sector: sectorSchema.optional(),
  onboarding: onboardingStatusSchema.optional(),
  /** Portal lifecycle filter. Independent of the legacy `account_status`. */
  status: portalStatusSchema.optional(),
  /** Portal commercial tier filter. Independent of the legacy `plan` column. */
  plan: portalPlanSchema.optional(),
  sort: schoolsListSortSchema.optional(),
});
export type SchoolsListQuery = z.infer<typeof schoolsListQuerySchema>;

export const schoolsListPaginationSchema = z.strictObject({
  page: z.number().int().min(1).max(100_000),
  pageSize: z.number().int().min(1).max(200),
  pageCount: z.number().int().min(0),
  total: z.number().int().min(0),
});
export type SchoolsListPagination = z.infer<typeof schoolsListPaginationSchema>;

export const schoolsListRowSchema = z.strictObject({
  documentId: documentIdSchema,
  name: z.string().max(255).nullable(),
  account_status: accountStatusSchema.nullable(),
  onboarding_status: onboardingStatusSchema.nullable(),
  /** The stored product tier (trial | full_license) — the LEGACY plan column. */
  plan: z.enum(['trial', 'full_license']).nullable(),
  /** Portal lifecycle. Added beside `account_status`, never replacing it. */
  portal_status: portalStatusSchema,
  /** Portal commercial tier. Added beside `plan`, never replacing it. */
  portal_plan: portalPlanSchema,
  /** Legacy C-OPS-01 staff count: teacher + school_admin accounts. UNCHANGED. */
  teacher_count: z.number().int().min(0),
  /** Teacher-role accounts only — the count the directory displays. */
  portal_teacher_count: z.number().int().min(0),
  /** school_admin-role accounts only — split out of the legacy staff count. */
  admin_count: z.number().int().min(0),
  class_count: z.number().int().min(0),
  student_count: z.number().int().min(0),
  results_count: z.number().int().min(0),
  suburb: z.string().max(100).nullable(),
  state: australianStateSchema.nullable(),
  sector: sectorSchema.nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string(),
  /**
   * Last known activity instant (OPS-005). An ISO instant, never a formatted
   * string: D-09 puts relative formatting ("2h ago") in the client, so the
   * server stays locale-free. NULL is a real, rendered value — the design maps
   * it to "Never" (`Ops Portal.dc.html:1496`) — and never means "unknown".
   */
  last_active_at: z.iso.datetime().nullable(),
  /** Resolved from the school's coverImage media relation; null when unset. */
  cover_image_url: z.string().nullable(),
});
export type SchoolsListRow = z.infer<typeof schoolsListRowSchema>;

/**
 * The pill bar's counts. They apply q/state/sector/plan/onboarding but NOT
 * `status`, so selecting a pill never changes the other pills' numbers, and
 * they cover the WHOLE filtered dataset rather than the loaded page.
 */
export const schoolsListStatusCountsSchema = z.strictObject({
  all: z.number().int().min(0),
  active: z.number().int().min(0),
  trial: z.number().int().min(0),
  pending_setup: z.number().int().min(0),
  suspended: z.number().int().min(0),
  archived: z.number().int().min(0),
});
export type SchoolsListStatusCounts = z.infer<typeof schoolsListStatusCountsSchema>;

export const schoolsListResponseSchema = z.object({
  data: z.array(schoolsListRowSchema),
  meta: z.object({
    pagination: schoolsListPaginationSchema,
    status_counts: schoolsListStatusCountsSchema,
  }),
});
export type SchoolsListResponse = z.infer<typeof schoolsListResponseSchema>;

const schoolsListDataSchema = dataEnvelope(z.array(schoolsListRowSchema));

export const SchoolsListOperation: OpsOperation<
  typeof schoolsListQuerySchema,
  typeof schoolsListDataSchema
> = Object.freeze({
  contractId: 'C-OPS-PORTAL-001',
  method: 'GET',
  path: '/api/ops/schools',
  request: schoolsListQuerySchema,
  response: schoolsListDataSchema,
  success: 200,
  errors: [400, 401, 403, 404, 429, 500],
});
