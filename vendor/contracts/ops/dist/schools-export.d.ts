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
import { type AccountStatus, type OpsOperation } from './core';
import { type PortalPlan, type PortalStatus, type SchoolPlan } from './school-create';
/** Rows per streamed chunk — the existing export's page size, unchanged. */
export declare const SCHOOLS_EXPORT_PAGE_SIZE = 200;
/** Upper bound on an explicit selection, so one request cannot become a scan. */
export declare const SCHOOLS_EXPORT_MAX_SELECTION = 200;
export declare const SCHOOLS_EXPORT_PATH = "/api/ops/schools/export.csv";
export declare const SCHOOLS_EXPORT_CONTENT_TYPE = "text/csv; charset=utf-8";
/** The existing column list and order. Extending it is a contract change. */
export declare const SCHOOLS_EXPORT_COLUMNS: readonly ["documentId", "name", "suburb", "state", "postcode", "sector", "account_status", "onboarding_status", "createdAt"];
export type SchoolsExportColumn = (typeof SCHOOLS_EXPORT_COLUMNS)[number];
/**
 * Orderings the directory offers. `student_count` and `last_active_at` are
 * COMPUTED (a live count, and the most recent result recorded for the school's
 * students) — they are not stored columns, and a school with neither sorts
 * last rather than being dropped.
 */
export declare const schoolsExportSortSchema: z.ZodEnum<{
    "name:asc": "name:asc";
    "student_count:desc": "student_count:desc";
    "createdAt:desc": "createdAt:desc";
    "last_active_at:desc": "last_active_at:desc";
}>;
export type SchoolsExportSort = z.infer<typeof schoolsExportSortSchema>;
export declare const SCHOOLS_EXPORT_DEFAULT_SORT: SchoolsExportSort;
/**
 * An explicit selection: at least one id, at most 200, every id distinct.
 * `.min(1)` is the rule that keeps "nothing selected" from meaning "everything".
 */
export declare const schoolsExportSelectionSchema: z.ZodArray<z.ZodString>;
/**
 * Strict: a misspelt filter is a 400, never an ignored key that would hand back
 * a broader export than the operator asked for.
 */
export declare const schoolsExportQuerySchema: z.ZodObject<{
    q: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        active: "active";
        suspended: "suspended";
        pending_setup: "pending_setup";
        archived: "archived";
        trial: "trial";
    }>>;
    onboarding: z.ZodOptional<z.ZodEnum<{
        not_started: "not_started";
        link_sent: "link_sent";
        in_progress: "in_progress";
        submitted: "submitted";
        complete: "complete";
    }>>;
    state: z.ZodOptional<z.ZodEnum<{
        VIC: "VIC";
        NSW: "NSW";
        QLD: "QLD";
        SA: "SA";
        WA: "WA";
        TAS: "TAS";
        ACT: "ACT";
        NT: "NT";
    }>>;
    sector: z.ZodOptional<z.ZodEnum<{
        government: "government";
        "non-government": "non-government";
        catholic: "catholic";
    }>>;
    plan: z.ZodOptional<z.ZodEnum<{
        pilot: "pilot";
        standard: "standard";
        enterprise: "enterprise";
    }>>;
    sort: z.ZodOptional<z.ZodEnum<{
        "name:asc": "name:asc";
        "student_count:desc": "student_count:desc";
        "createdAt:desc": "createdAt:desc";
        "last_active_at:desc": "last_active_at:desc";
    }>>;
    documentIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strict>;
export type SchoolsExportQuery = z.infer<typeof schoolsExportQuerySchema>;
/** The stored triple the portal status/plan are derived from. */
export interface SchoolLifecycleRow {
    readonly account_status: AccountStatus | string | null;
    readonly onboarding_status: string | null;
    readonly plan: SchoolPlan | string | null;
}
/** The legacy `account_status` values that carry Archived and Suspended. */
export declare const SCHOOL_ARCHIVED_ACCOUNT_STATUS = "closed";
export declare const SCHOOL_SUSPENDED_ACCOUNT_STATUS = "suspended";
/**
 * decisions.md portal-status precedence, evaluated top down. A row is Pending
 * setup while it is not yet a live active school OR its onboarding never
 * completed; only then does the tier decide Trial vs Active.
 */
export declare function derivePortalSchoolStatus(row: SchoolLifecycleRow): PortalStatus;
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
export declare function resolvePortalStatus(row: PortalLifecycleRow): PortalStatus;
/**
 * Tier resolution — the mirror image, and deliberately asymmetric.
 *
 * Here the STORED column DOES win when it says 'standard' or 'enterprise',
 * because the backfill only ever writes 'pilot': those two values can only
 * have been set deliberately, and 'enterprise' is not derivable from any
 * legacy column at all. A stored 'pilot' is ambiguous, so the legacy plan
 * decides it.
 */
export declare function resolvePortalPlan(row: PortalLifecycleRow): PortalPlan;
/**
 * Tier compatibility policy: Pilot ⇢ trial, Standard/Enterprise ⇢ full_license.
 * Only `pilot` and `standard` are DERIVABLE — `enterprise` requires a stored
 * portal tier, which no row carries yet, so it is never invented here.
 */
export declare function derivePortalSchoolPlan(plan: SchoolPlan | string | null): PortalPlan;
/** True when no legacy row can satisfy the requested tier (see above). */
export declare function portalPlanIsUnderivable(plan: PortalPlan): boolean;
/**
 * A safe, scope-specific attachment filename: ASCII, lowercase, no quotes,
 * spaces or path separators, so it can neither break `Content-Disposition` nor
 * escape a download directory. No operator-supplied text reaches it.
 */
export declare function schoolsExportFilename(query: SchoolsExportQuery): string;
/**
 * The query as the client sends it: scalars once, `documentIds` repeated
 * (`documentIds=a&documentIds=b`). Undefined keys are omitted entirely so an
 * unfiltered download is byte-for-byte the legacy request.
 */
export declare function schoolsExportSearchParams(query: SchoolsExportQuery): URLSearchParams;
/** The 200 body is the CSV document itself, not a JSON envelope. */
export declare const schoolsExportResponseSchema: z.ZodString;
export declare const SchoolsExportOperation: OpsOperation<typeof schoolsExportQuerySchema, typeof schoolsExportResponseSchema>;
