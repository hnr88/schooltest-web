"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolsListOperation = exports.schoolsListResponseSchema = exports.schoolsListStatusCountsSchema = exports.schoolsListRowSchema = exports.schoolsListPaginationSchema = exports.schoolsListQuerySchema = exports.schoolsListSortSchema = exports.portalStatusSchema = exports.portalPlanSchema = exports.sectorSchema = exports.australianStateSchema = void 0;
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
const zod_1 = require("zod");
const core_1 = require("./core");
exports.australianStateSchema = zod_1.z.enum(['VIC', 'NSW', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT']);
exports.sectorSchema = zod_1.z.enum(['government', 'non-government', 'catholic']);
/** GAP-11 (column portal_plan -> OPS-002): declared, not yet served or filterable. */
exports.portalPlanSchema = zod_1.z.enum(['pilot', 'standard', 'enterprise']);
/** GAP-12 (derived portal_status needs portal_plan/OPS-002 + archived_at/OPS-005). */
exports.portalStatusSchema = zod_1.z.enum(['active', 'trial', 'pending_setup', 'suspended', 'archived']);
/**
 * The four sorts the design's dropdown offers (`Ops Portal.dc.html:104`):
 * Name A-Z, Most students, Recently active, Newest. GAP-15 is DISCHARGED —
 * `last_active_at` is a real column (OPS-005), so the designed
 * `last_active_at:desc` sort is served rather than withheld.
 *
 * Added as a fourth ENUM MEMBER, so every previously valid `sort` value stays
 * valid and a caller that omits `sort` is unaffected.
 */
exports.schoolsListSortSchema = zod_1.z.enum([
    'name:asc',
    'student_count:desc',
    'createdAt:desc',
    'last_active_at:desc',
]);
exports.schoolsListQuerySchema = zod_1.z.strictObject({
    page: zod_1.z.number().int().min(1).max(100000).optional(),
    pageSize: zod_1.z.number().int().min(1).max(200).optional(),
    q: zod_1.z.string().trim().max(120).optional(),
    state: exports.australianStateSchema.optional(),
    sector: exports.sectorSchema.optional(),
    onboarding: core_1.onboardingStatusSchema.optional(),
    /** Portal lifecycle filter. Independent of the legacy `account_status`. */
    status: exports.portalStatusSchema.optional(),
    /** Portal commercial tier filter. Independent of the legacy `plan` column. */
    plan: exports.portalPlanSchema.optional(),
    sort: exports.schoolsListSortSchema.optional(),
});
exports.schoolsListPaginationSchema = zod_1.z.strictObject({
    page: zod_1.z.number().int().min(1).max(100000),
    pageSize: zod_1.z.number().int().min(1).max(200),
    pageCount: zod_1.z.number().int().min(0),
    total: zod_1.z.number().int().min(0),
});
exports.schoolsListRowSchema = zod_1.z.strictObject({
    documentId: core_1.documentIdSchema,
    name: zod_1.z.string().max(255).nullable(),
    account_status: core_1.accountStatusSchema.nullable(),
    onboarding_status: core_1.onboardingStatusSchema.nullable(),
    /** The stored product tier (trial | full_license) — the LEGACY plan column. */
    plan: zod_1.z.enum(['trial', 'full_license']).nullable(),
    /** Portal lifecycle. Added beside `account_status`, never replacing it. */
    portal_status: exports.portalStatusSchema,
    /** Portal commercial tier. Added beside `plan`, never replacing it. */
    portal_plan: exports.portalPlanSchema,
    /** Legacy C-OPS-01 staff count: teacher + school_admin accounts. UNCHANGED. */
    teacher_count: zod_1.z.number().int().min(0),
    /** Teacher-role accounts only — the count the directory displays. */
    portal_teacher_count: zod_1.z.number().int().min(0),
    /** school_admin-role accounts only — split out of the legacy staff count. */
    admin_count: zod_1.z.number().int().min(0),
    class_count: zod_1.z.number().int().min(0),
    student_count: zod_1.z.number().int().min(0),
    results_count: zod_1.z.number().int().min(0),
    suburb: zod_1.z.string().max(100).nullable(),
    state: exports.australianStateSchema.nullable(),
    sector: exports.sectorSchema.nullable(),
    createdAt: zod_1.z.string().nullable(),
    updatedAt: zod_1.z.string(),
    /**
     * Last known activity instant (OPS-005). An ISO instant, never a formatted
     * string: D-09 puts relative formatting ("2h ago") in the client, so the
     * server stays locale-free. NULL is a real, rendered value — the design maps
     * it to "Never" (`Ops Portal.dc.html:1496`) — and never means "unknown".
     */
    last_active_at: zod_1.z.iso.datetime().nullable(),
    /** Resolved from the school's coverImage media relation; null when unset. */
    cover_image_url: zod_1.z.string().nullable(),
});
/**
 * The pill bar's counts. They apply q/state/sector/plan/onboarding but NOT
 * `status`, so selecting a pill never changes the other pills' numbers, and
 * they cover the WHOLE filtered dataset rather than the loaded page.
 */
exports.schoolsListStatusCountsSchema = zod_1.z.strictObject({
    all: zod_1.z.number().int().min(0),
    active: zod_1.z.number().int().min(0),
    trial: zod_1.z.number().int().min(0),
    pending_setup: zod_1.z.number().int().min(0),
    suspended: zod_1.z.number().int().min(0),
    archived: zod_1.z.number().int().min(0),
});
exports.schoolsListResponseSchema = zod_1.z.object({
    data: zod_1.z.array(exports.schoolsListRowSchema),
    meta: zod_1.z.object({
        pagination: exports.schoolsListPaginationSchema,
        status_counts: exports.schoolsListStatusCountsSchema,
    }),
});
const schoolsListDataSchema = (0, core_1.dataEnvelope)(zod_1.z.array(exports.schoolsListRowSchema));
exports.SchoolsListOperation = Object.freeze({
    contractId: 'C-OPS-PORTAL-001',
    method: 'GET',
    path: '/api/ops/schools',
    request: exports.schoolsListQuerySchema,
    response: schoolsListDataSchema,
    success: 200,
    errors: [400, 401, 403, 404, 429, 500],
});
