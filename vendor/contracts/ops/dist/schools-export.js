"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolsExportOperation = exports.schoolsExportResponseSchema = exports.SCHOOL_SUSPENDED_ACCOUNT_STATUS = exports.SCHOOL_ARCHIVED_ACCOUNT_STATUS = exports.schoolsExportQuerySchema = exports.schoolsExportSelectionSchema = exports.SCHOOLS_EXPORT_DEFAULT_SORT = exports.schoolsExportSortSchema = exports.SCHOOLS_EXPORT_COLUMNS = exports.SCHOOLS_EXPORT_CONTENT_TYPE = exports.SCHOOLS_EXPORT_PATH = exports.SCHOOLS_EXPORT_MAX_SELECTION = exports.SCHOOLS_EXPORT_PAGE_SIZE = void 0;
exports.derivePortalSchoolStatus = derivePortalSchoolStatus;
exports.resolvePortalStatus = resolvePortalStatus;
exports.resolvePortalPlan = resolvePortalPlan;
exports.derivePortalSchoolPlan = derivePortalSchoolPlan;
exports.portalPlanIsUnderivable = portalPlanIsUnderivable;
exports.schoolsExportFilename = schoolsExportFilename;
exports.schoolsExportSearchParams = schoolsExportSearchParams;
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
const zod_1 = require("zod");
const core_1 = require("./core");
const school_create_1 = require("./school-create");
const QUERY_MAX = 120;
const FILENAME_STEM = 'schools';
/** Rows per streamed chunk — the existing export's page size, unchanged. */
exports.SCHOOLS_EXPORT_PAGE_SIZE = 200;
/** Upper bound on an explicit selection, so one request cannot become a scan. */
exports.SCHOOLS_EXPORT_MAX_SELECTION = 200;
exports.SCHOOLS_EXPORT_PATH = '/api/ops/schools/export.csv';
exports.SCHOOLS_EXPORT_CONTENT_TYPE = 'text/csv; charset=utf-8';
/** The existing column list and order. Extending it is a contract change. */
exports.SCHOOLS_EXPORT_COLUMNS = [
    'documentId', 'name', 'suburb', 'state', 'postcode', 'sector',
    'account_status', 'onboarding_status', 'createdAt',
];
/**
 * Orderings the directory offers. `student_count` and `last_active_at` are
 * COMPUTED (a live count, and the most recent result recorded for the school's
 * students) — they are not stored columns, and a school with neither sorts
 * last rather than being dropped.
 */
exports.schoolsExportSortSchema = zod_1.z.enum([
    'name:asc', 'student_count:desc', 'createdAt:desc', 'last_active_at:desc',
]);
exports.SCHOOLS_EXPORT_DEFAULT_SORT = 'name:asc';
/**
 * An explicit selection: at least one id, at most 200, every id distinct.
 * `.min(1)` is the rule that keeps "nothing selected" from meaning "everything".
 */
exports.schoolsExportSelectionSchema = zod_1.z
    .array(core_1.documentIdSchema)
    .min(1)
    .max(exports.SCHOOLS_EXPORT_MAX_SELECTION)
    .refine((ids) => new Set(ids).size === ids.length, {
    message: 'documentIds must not repeat an id',
});
/**
 * Strict: a misspelt filter is a 400, never an ignored key that would hand back
 * a broader export than the operator asked for.
 */
exports.schoolsExportQuerySchema = zod_1.z.strictObject({
    q: zod_1.z.string().trim().min(1).max(QUERY_MAX).optional(),
    status: school_create_1.portalStatusSchema.optional(),
    onboarding: core_1.onboardingStatusSchema.optional(),
    state: school_create_1.australianStateSchema.optional(),
    sector: school_create_1.sectorSchema.optional(),
    plan: school_create_1.portalPlanSchema.optional(),
    sort: exports.schoolsExportSortSchema.optional(),
    documentIds: exports.schoolsExportSelectionSchema.optional(),
});
/** The legacy `account_status` values that carry Archived and Suspended. */
exports.SCHOOL_ARCHIVED_ACCOUNT_STATUS = 'closed';
exports.SCHOOL_SUSPENDED_ACCOUNT_STATUS = 'suspended';
/**
 * decisions.md portal-status precedence, evaluated top down. A row is Pending
 * setup while it is not yet a live active school OR its onboarding never
 * completed; only then does the tier decide Trial vs Active.
 */
function derivePortalSchoolStatus(row) {
    if (row.account_status === exports.SCHOOL_ARCHIVED_ACCOUNT_STATUS)
        return 'archived';
    if (row.account_status === exports.SCHOOL_SUSPENDED_ACCOUNT_STATUS)
        return 'suspended';
    if (row.account_status !== 'active' || row.onboarding_status !== 'complete') {
        return 'pending_setup';
    }
    return row.plan === 'trial' ? 'trial' : 'active';
}
function resolvePortalStatus(row) {
    if (row.archived_at)
        return 'archived';
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
function resolvePortalPlan(row) {
    const stored = row.portal_plan;
    if (stored === 'standard' || stored === 'enterprise')
        return stored;
    return derivePortalSchoolPlan(row.plan ?? null);
}
/**
 * Tier compatibility policy: Pilot ⇢ trial, Standard/Enterprise ⇢ full_license.
 * Only `pilot` and `standard` are DERIVABLE — `enterprise` requires a stored
 * portal tier, which no row carries yet, so it is never invented here.
 */
function derivePortalSchoolPlan(plan) {
    return plan === 'trial' ? 'pilot' : 'standard';
}
/** True when no legacy row can satisfy the requested tier (see above). */
function portalPlanIsUnderivable(plan) {
    return plan === 'enterprise';
}
/**
 * A safe, scope-specific attachment filename: ASCII, lowercase, no quotes,
 * spaces or path separators, so it can neither break `Content-Disposition` nor
 * escape a download directory. No operator-supplied text reaches it.
 */
function schoolsExportFilename(query) {
    // The selection SIZE is deliberately absent: a selection also intersects with
    // the filters, so "selected-5" on a file holding 3 rows would read as a count.
    if ((query.documentIds?.length ?? 0) > 0)
        return `${FILENAME_STEM}-selected.csv`;
    const filtered = query.q !== undefined ||
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
function schoolsExportSearchParams(query) {
    const params = new URLSearchParams();
    if (query.q !== undefined)
        params.append('q', query.q);
    if (query.status !== undefined)
        params.append('status', query.status);
    if (query.onboarding !== undefined)
        params.append('onboarding', query.onboarding);
    if (query.state !== undefined)
        params.append('state', query.state);
    if (query.sector !== undefined)
        params.append('sector', query.sector);
    if (query.plan !== undefined)
        params.append('plan', query.plan);
    if (query.sort !== undefined)
        params.append('sort', query.sort);
    for (const documentId of query.documentIds ?? [])
        params.append('documentIds', documentId);
    return params;
}
/** The 200 body is the CSV document itself, not a JSON envelope. */
exports.schoolsExportResponseSchema = zod_1.z.string().min(1);
exports.SchoolsExportOperation = Object.freeze({
    contractId: 'C-OPS-PORTAL-009',
    method: 'GET',
    path: exports.SCHOOLS_EXPORT_PATH,
    request: exports.schoolsExportQuerySchema,
    response: exports.schoolsExportResponseSchema,
    success: 200,
    errors: [400, 401, 403, 404, 429, 500],
});
