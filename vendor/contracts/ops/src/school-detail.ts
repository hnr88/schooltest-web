/**
 * C-OPS-PORTAL-002 — GET /api/ops/schools/{documentId} (OPS-012), the single
 * school read behind the portal detail page.
 *
 * WHY IT EXISTS: OpsSchoolDetail currently calls the whole directory and finds
 * the documentId in memory, so a deep link pays for every school in the tenant
 * and a school outside the first page simply renders "not found". This is the
 * dedicated read.
 *
 * HONEST-SHAPE NOTE: the schema declares ONLY fields backed by a real column.
 * The portal lifecycle columns (portal_plan, portal_status, trial_ends_at,
 * retention_until, suspended_at, billing_status, contact_name, phone) LANDED
 * with OPS-002/OPS-013/OPS-017 and are now read from the row and emitted. They
 * are declared nullable here even though contracts.openapi.json declares
 * portal_plan/portal_status/billing_status non-nullable — see GAP-02-BACKFILL.
 * ONE column still does not exist (owner_documentId); it is recorded as a GAP
 * and never invented. `archived_at` landed with task 08 and `last_active_at`
 * with OPS-005, so both are read from the row and emitted.
 */
import { z } from 'zod';

import {
  accountStatusSchema,
  dataEnvelope,
  documentIdSchema,
  onboardingStatusSchema,
  type OpsOperation,
} from './core';
// The domain enums are canonically owned by ./school-create (resolved by the
// integrator after several modules declared value-identical copies). They are
// IMPORTED, never re-declared and never re-exported from here: a second export
// of the same name is exactly the TS2308 barrel conflict that resolution fixed.
import {
  australianStateSchema,
  billingStatusSchema,
  portalPlanSchema,
  portalStatusSchema,
  schoolPlanSchema,
  schoolTypeSchema,
  sectorSchema,
} from './school-create';

/**
 * GAP register for this operation. Each entry names the missing column and the
 * task that lands it, so nobody re-derives a value from an unrelated field.
 *
 * GAP-02-C  last_active_at   -> DISCHARGED by OPS-005. The column exists and
 *                               the real value is served. NULL now means
 *                               "never active" (rendered "Never"), not
 *                               "no column".
 * GAP-02-D  archived_at      -> DISCHARGED. The note was STALE, not the column
 *                               (X-07): `schools/schema.json` has declared
 *                               `archived_at: datetime` since task 08.
 * GAP-02-J  owner_documentId -> OPS-014 ownership migration; "Make owner" is a
 *                               required action whose backing column does not
 *                               exist yet, so the field is withheld rather than
 *                               reported as "no owner", which would be a lie
 *                               about a legacy school that has one.
 *
 * GAP-02-BACKFILL — a DATA gap, not a column gap. OPS-002/OPS-017 added
 * portal_plan, portal_status and billing_status with no schema default and no
 * backfill migration, so every row created before them reads NULL. The declared
 * contract types are non-nullable. This module emits the STORED value and
 * widens the type to nullable rather than substituting a default, because
 * choosing one would be inventing a lifecycle status. The fix belongs to the
 * column owners: a backfill migration, or a contract amendment making the three
 * nullable. Consumers must handle null until then.
 */
export const SCHOOL_DETAIL_GAPS = Object.freeze([
  // EMPTY, and deliberately so. archived_at and owner_documentId left with
  // task 08; last_active_at left with OPS-005. Every field this operation
  // declares is now backed by a real column.
  //
  // Emptying this is LOAD-BEARING, not tidying: the conformance spec asserts
  // that a gap the contract still DECLARES must be served as a literal null
  // (`school-detail.spec.ts:117`). Leaving `last_active_at` here would demand
  // null forever and fail the moment the column carries a value — the spec is
  // written so that landing a column moves the field between categories with
  // no edit there.
] as const);
export type SchoolDetailGap = (typeof SCHOOL_DETAIL_GAPS)[number];

export const schoolDetailSchema = z.strictObject({
  documentId: documentIdSchema,
  name: z.string().max(255).nullable(),

  /* ---- lifecycle: the REAL stored columns ------------------------------ */
  account_status: accountStatusSchema.nullable(),
  onboarding_status: onboardingStatusSchema.nullable(),
  plan: schoolPlanSchema.nullable(),
  /**
   * Portal tier and lifecycle. NOT nullable any more: task 08 resolves both
   * through the shared `resolvePortalPlan`/`resolvePortalStatus`, which always
   * answer — so the detail and the directory row cannot disagree, and a
   * never-backfilled column no longer surfaces as a null the UI must guess at.
   */
  portal_plan: portalPlanSchema,
  portal_status: portalStatusSchema,
  billing_status: billingStatusSchema.nullable(),
  trial_ends_at: z.string().nullable(),
  retention_until: z.string().nullable(),
  suspended_at: z.string().nullable(),
  /** Set when the school was archived; null otherwise. Column exists (OPS-005). */
  archived_at: z.string().nullable(),
  /**
   * The school's single owner (OPS-014). Explicitly nullable: a legacy school
   * predating the ownership migration has none, and inventing one — the primary
   * contact, or the first admin by sort order — is exactly what D-OWN forbids.
   */
  owner_documentId: documentIdSchema.nullable(),

  /* ---- counters -------------------------------------------------------- */
  /** Legacy C-OPS-01 staff count: teacher + school_admin. UNCHANGED semantics. */
  teacher_count: z.number().int().min(0),
  /** Teacher-role accounts only — the number the "Teachers" stat shows. */
  portal_teacher_count: z.number().int().min(0),
  /** school_admin-role accounts only. */
  admin_count: z.number().int().min(0),
  class_count: z.number().int().min(0),
  student_count: z.number().int().min(0),
  /** Backs the "Tests this term" metric, which is also the route to Results. */
  results_count: z.number().int().min(0),

  /* ---- profile --------------------------------------------------------- */
  suburb: z.string().max(100).nullable(),
  state: australianStateSchema.nullable(),
  sector: sectorSchema.nullable(),
  postcode: z.string().max(10).nullable(),
  schoolType: schoolTypeSchema.nullable(),
  contact_email: z.string().max(255).nullable(),
  contact_first_name: z.string().max(100).nullable(),
  contact_last_name: z.string().max(100).nullable(),
  /** Single-field contact name (OPS-013). Independent of first/last, not derived. */
  contact_name: z.string().max(200).nullable(),
  phone: z.string().max(40).nullable(),

  /* ---- timestamps ------------------------------------------------------ */
  createdAt: z.string().nullable(),
  updatedAt: z.string(),
  /**
   * Real column since OPS-005. An ISO instant (D-09 keeps relative formatting
   * client-side); NULL means the school has never been active and renders
   * "Never" (`Ops Portal.dc.html:1496`).
   */
  last_active_at: z.string().nullable(),

  /** Resolved from the coverImage media relation; null when unset. The portal
   *  renders a neutral fallback for null — never a prototype photo (AC-2). */
  cover_image_url: z.string().nullable(),
});
export type SchoolDetail = z.infer<typeof schoolDetailSchema>;

const schoolDetailDataSchema = dataEnvelope(schoolDetailSchema);
export const schoolDetailResponseSchema = schoolDetailDataSchema;
export type SchoolDetailResponse = z.infer<typeof schoolDetailResponseSchema>;

/** The operation takes no query or body — the path documentId is the whole request. */
export const schoolDetailRequestSchema = z.strictObject({});
export type SchoolDetailRequest = z.infer<typeof schoolDetailRequestSchema>;

/** Single place that builds the URL, so no call site hand-concatenates it. */
export function schoolDetailPath(schoolDocumentId: string): string {
  return `/api/ops/schools/${encodeURIComponent(schoolDocumentId)}`;
}

export const SchoolDetailOperation: OpsOperation<
  typeof schoolDetailRequestSchema,
  typeof schoolDetailDataSchema
> = Object.freeze({
  contractId: 'C-OPS-PORTAL-002',
  method: 'GET',
  path: '/api/ops/schools/{documentId}',
  request: schoolDetailRequestSchema,
  response: schoolDetailDataSchema,
  success: 200,
  errors: [400, 401, 403, 404, 429, 500],
});
