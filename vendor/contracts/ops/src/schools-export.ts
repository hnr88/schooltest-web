/**
 * OPS-019 — C-OPS-PORTAL-009 GET /api/ops/schools/export.csv
 *
 * ONE definition of "which schools does this download contain", imported by the
 * server that resolves the scope and by schooltest-web's typed client that asks
 * for it, so a filtered screen and its CSV can never disagree about the rows.
 *
 * Three decisions this file encodes, because each is easy to reimplement
 * differently on the two sides:
 *
 *  - SELECTION IS NEVER "EVERYTHING". `documentIds` is a repeated query
 *    parameter (`style: form, explode: true`). Present-but-empty is a 400, not
 *    export-all — the point of the operation is that a five-row selection
 *    cannot silently become every tenant. Duplicates are a 400 too, so a UI bug
 *    that double-adds a row is reported instead of quietly de-duplicated.
 *
 *  - PORTAL STATUS/PLAN ARE DERIVED, NOT STORED. No `portal_status` /
 *    `portal_plan` column exists yet, so the filters map onto the stored
 *    `account_status`/`onboarding_status`/`plan` triple through the documented
 *    precedence and tier policy (decisions.md). Every school lands in exactly
 *    one bucket, so no record disappears from a filter. `enterprise` is never
 *    DERIVED from a legacy row, so filtering on it matches nothing rather than
 *    quietly returning every full-licence school.
 *
 *  - THE COLUMN LIST IS FROZEN. `SCHOOLS_EXPORT_COLUMNS` is the existing
 *    export's column order, unchanged: scoping the rows must not reshape the
 *    file that downstream spreadsheets already parse.
 *
 * This module reads ./index's and ./school-create's exports, so src/index.ts
 * must re-export it AFTER both (the rest-boundary CJS-cycle pattern).
 */
import { z } from 'zod';

import { documentIdSchema, onboardingStatusSchema, type AccountStatus, type OpsOperation } from './core';
import {
  australianStateSchema,
  portalPlanSchema,
  portalStatusSchema,
  sectorSchema,
  type PortalPlan,
  type PortalStatus,
  type SchoolPlan,
} from './school-create';

const QUERY_MAX = 120;
const FILENAME_STEM = 'schools';

/** Rows per streamed chunk — the existing export's page size, unchanged. */
export const SCHOOLS_EXPORT_PAGE_SIZE = 200;

/** Upper bound on an explicit selection, so one request cannot become a scan. */
export const SCHOOLS_EXPORT_MAX_SELECTION = 200;

export const SCHOOLS_EXPORT_PATH = '/api/ops/schools/export.csv';

export const SCHOOLS_EXPORT_CONTENT_TYPE = 'text/csv; charset=utf-8';

/** The existing column list and order. Extending it is a contract change. */
export const SCHOOLS_EXPORT_COLUMNS = [
  'documentId', 'name', 'suburb', 'state', 'postcode', 'sector',
  'account_status', 'onboarding_status', 'createdAt',
] as const;
export type SchoolsExportColumn = (typeof SCHOOLS_EXPORT_COLUMNS)[number];

/**
 * Orderings the directory offers. `student_count` and `last_active_at` are
 * COMPUTED (a live count, and the most recent result recorded for the school's
 * students) — they are not stored columns, and a school with neither sorts
 * last rather than being dropped.
 */
export const schoolsExportSortSchema = z.enum([
  'name:asc', 'student_count:desc', 'createdAt:desc', 'last_active_at:desc',
]);
export type SchoolsExportSort = z.infer<typeof schoolsExportSortSchema>;

export const SCHOOLS_EXPORT_DEFAULT_SORT: SchoolsExportSort = 'name:asc';

/**
 * An explicit selection: at least one id, at most 200, every id distinct.
 * `.min(1)` is the rule that keeps "nothing selected" from meaning "everything".
 */
export const schoolsExportSelectionSchema = z
  .array(documentIdSchema)
  .min(1)
  .max(SCHOOLS_EXPORT_MAX_SELECTION)
  .refine((ids) => new Set(ids).size === ids.length, {
    message: 'documentIds must not repeat an id',
  });

/**
 * Strict: a misspelt filter is a 400, never an ignored key that would hand back
 * a broader export than the operator asked for.
 */
export const schoolsExportQuerySchema = z.strictObject({
  q: z.string().trim().min(1).max(QUERY_MAX).optional(),
  status: portalStatusSchema.optional(),
  onboarding: onboardingStatusSchema.optional(),
  state: australianStateSchema.optional(),
  sector: sectorSchema.optional(),
  plan: portalPlanSchema.optional(),
  sort: schoolsExportSortSchema.optional(),
  documentIds: schoolsExportSelectionSchema.optional(),
});
export type SchoolsExportQuery = z.infer<typeof schoolsExportQuerySchema>;

/** The stored triple the portal status/plan are derived from. */
export interface SchoolLifecycleRow {
  readonly account_status: AccountStatus | string | null;
  readonly onboarding_status: string | null;
  readonly plan: SchoolPlan | string | null;
}

/** The legacy `account_status` values that carry Archived and Suspended. */
export const SCHOOL_ARCHIVED_ACCOUNT_STATUS = 'closed';
export const SCHOOL_SUSPENDED_ACCOUNT_STATUS = 'suspended';

/**
 * decisions.md portal-status precedence, evaluated top down. A row is Pending
 * setup while it is not yet a live active school OR its onboarding never
 * completed; only then does the tier decide Trial vs Active.
 */
export function derivePortalSchoolStatus(row: SchoolLifecycleRow): PortalStatus {
  if (row.account_status === SCHOOL_ARCHIVED_ACCOUNT_STATUS) return 'archived';
  if (row.account_status === SCHOOL_SUSPENDED_ACCOUNT_STATUS) return 'suspended';
  if (row.account_status !== 'active' || row.onboarding_status !== 'complete') {
    return 'pending_setup';
  }
  return row.plan === 'trial' ? 'trial' : 'active';
}

/**
 * The ONE portal-lifecycle resolution every ops surface uses.
 *
 * `derivePortalSchoolStatus` above is the decisions.md precedence over the
 * legacy columns. This wraps it with the two facts that precedence predates:
 *
 *  - `archived_at` is checked first. It is the explicit archive signal task 12
 *    writes, and it postdates the precedence rules.
 *  - the STORED `portal_status` is deliberately NOT trusted. Migration
 *    2026.09.05T01.00.00 blanket-wrote 'trial' onto every pre-existing school,
 *    so a closed or suspended legacy row carries a stored value that
 *    contradicts its own lifecycle columns; reading it would label an archived
 *    school "Trial". The lifecycle columns, which task 12 keeps current, win.
 *
 * Both the directory row and the detail page resolve through here, so a school
 * can never carry one status in the list and a different one on its own page.
 */
export interface PortalLifecycleRow extends SchoolLifecycleRow {
  readonly archived_at?: string | Date | null;
  readonly portal_plan?: PortalPlan | string | null;
}

export function resolvePortalStatus(row: PortalLifecycleRow): PortalStatus {
  if (row.archived_at) return 'archived';
  return derivePortalSchoolStatus(row);
}

/**
 * Tier resolution — the mirror image, and deliberately asymmetric.
 *
 * Here the STORED column DOES win when it says 'standard' or 'enterprise',
 * because the backfill only ever writes 'pilot': those two values can only
 * have been set deliberately, and 'enterprise' is not derivable from any
 * legacy column at all. A stored 'pilot' is ambiguous, so the legacy plan
 * decides it.
 */
export function resolvePortalPlan(row: PortalLifecycleRow): PortalPlan {
  const stored = row.portal_plan;
  if (stored === 'standard' || stored === 'enterprise') return stored;
  return derivePortalSchoolPlan(row.plan ?? null);
}

/**
 * Tier compatibility policy: Pilot ⇢ trial, Standard/Enterprise ⇢ full_license.
 * Only `pilot` and `standard` are DERIVABLE — `enterprise` requires a stored
 * portal tier, which no row carries yet, so it is never invented here.
 */
export function derivePortalSchoolPlan(plan: SchoolPlan | string | null): PortalPlan {
  return plan === 'trial' ? 'pilot' : 'standard';
}

/** True when no legacy row can satisfy the requested tier (see above). */
export function portalPlanIsUnderivable(plan: PortalPlan): boolean {
  return plan === 'enterprise';
}

/**
 * A safe, scope-specific attachment filename: ASCII, lowercase, no quotes,
 * spaces or path separators, so it can neither break `Content-Disposition` nor
 * escape a download directory. No operator-supplied text reaches it.
 */
export function schoolsExportFilename(query: SchoolsExportQuery): string {
  // The selection SIZE is deliberately absent: a selection also intersects with
  // the filters, so "selected-5" on a file holding 3 rows would read as a count.
  if ((query.documentIds?.length ?? 0) > 0) return `${FILENAME_STEM}-selected.csv`;
  const filtered =
    query.q !== undefined ||
    query.status !== undefined ||
    query.onboarding !== undefined ||
    query.state !== undefined ||
    query.sector !== undefined ||
    query.plan !== undefined;
  return filtered ? `${FILENAME_STEM}-filtered.csv` : `${FILENAME_STEM}.csv`;
}

/**
 * The query as the client sends it: scalars once, `documentIds` repeated
 * (`documentIds=a&documentIds=b`). Undefined keys are omitted entirely so an
 * unfiltered download is byte-for-byte the legacy request.
 */
export function schoolsExportSearchParams(query: SchoolsExportQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q !== undefined) params.append('q', query.q);
  if (query.status !== undefined) params.append('status', query.status);
  if (query.onboarding !== undefined) params.append('onboarding', query.onboarding);
  if (query.state !== undefined) params.append('state', query.state);
  if (query.sector !== undefined) params.append('sector', query.sector);
  if (query.plan !== undefined) params.append('plan', query.plan);
  if (query.sort !== undefined) params.append('sort', query.sort);
  for (const documentId of query.documentIds ?? []) params.append('documentIds', documentId);
  return params;
}

/** The 200 body is the CSV document itself, not a JSON envelope. */
export const schoolsExportResponseSchema = z.string().min(1);

export const SchoolsExportOperation: OpsOperation<
  typeof schoolsExportQuerySchema,
  typeof schoolsExportResponseSchema
> = Object.freeze({
  contractId: 'C-OPS-PORTAL-009',
  method: 'GET',
  path: SCHOOLS_EXPORT_PATH,
  request: schoolsExportQuerySchema,
  response: schoolsExportResponseSchema,
  success: 200,
  errors: [400, 401, 403, 404, 429, 500],
});
