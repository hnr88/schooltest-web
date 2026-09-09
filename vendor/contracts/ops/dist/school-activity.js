"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolActivityOperation = exports.schoolActivityResponseSchema = exports.schoolActivityQuerySchema = exports.activityRowSchema = exports.activityActorSchema = exports.schoolActivityPaginationSchema = exports.SCHOOL_ACTIVITY_PAGE_SIZE_MAX = exports.SCHOOL_ACTIVITY_PAGE_SIZE_MIN = exports.SCHOOL_ACTIVITY_PAGE_MAX = exports.SCHOOL_ACTIVITY_PAGE_MIN = void 0;
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
const zod_1 = require("zod");
const core_1 = require("./core");
const ACTION_MAX = 100;
const TARGET_MAX = 255;
const NAME_MAX = 100;
const SUMMARY_MAX = 600;
const QUERY_MAX = 120;
exports.SCHOOL_ACTIVITY_PAGE_MIN = 1;
exports.SCHOOL_ACTIVITY_PAGE_MAX = 100000;
exports.SCHOOL_ACTIVITY_PAGE_SIZE_MIN = 1;
exports.SCHOOL_ACTIVITY_PAGE_SIZE_MAX = 200;
const timestampSchema = zod_1.z.iso.datetime({ offset: true });
exports.schoolActivityPaginationSchema = zod_1.z.strictObject({
    page: zod_1.z.number().int().min(exports.SCHOOL_ACTIVITY_PAGE_MIN).max(exports.SCHOOL_ACTIVITY_PAGE_MAX),
    pageSize: zod_1.z.number().int().min(exports.SCHOOL_ACTIVITY_PAGE_SIZE_MIN).max(exports.SCHOOL_ACTIVITY_PAGE_SIZE_MAX),
    pageCount: zod_1.z.number().int().min(0),
    total: zod_1.z.number().int().min(0),
});
/** The acting staff member, by name reference only — no email, no role. */
exports.activityActorSchema = zod_1.z.strictObject({
    documentId: core_1.documentIdSchema,
    first_name: zod_1.z.string().max(NAME_MAX).nullable(),
    last_name: zod_1.z.string().max(NAME_MAX).nullable(),
});
exports.activityRowSchema = zod_1.z.strictObject({
    documentId: core_1.documentIdSchema,
    action: zod_1.z.string().min(1).max(ACTION_MAX),
    target: zod_1.z.string().min(1).max(TARGET_MAX),
    timestamp: timestampSchema,
    actor: exports.activityActorSchema.nullable(),
    summary: zod_1.z.string().min(1).max(SUMMARY_MAX),
});
exports.schoolActivityQuerySchema = zod_1.z.strictObject({
    page: zod_1.z.number().int().min(exports.SCHOOL_ACTIVITY_PAGE_MIN).max(exports.SCHOOL_ACTIVITY_PAGE_MAX).optional(),
    pageSize: zod_1.z
        .number()
        .int()
        .min(exports.SCHOOL_ACTIVITY_PAGE_SIZE_MIN)
        .max(exports.SCHOOL_ACTIVITY_PAGE_SIZE_MAX)
        .optional(),
    school: core_1.documentIdSchema.optional(),
});
exports.schoolActivityResponseSchema = zod_1.z.strictObject({
    data: zod_1.z.array(exports.activityRowSchema).max(exports.SCHOOL_ACTIVITY_PAGE_SIZE_MAX),
    meta: zod_1.z.strictObject({ pagination: exports.schoolActivityPaginationSchema }),
});
exports.SchoolActivityOperation = Object.freeze({
    contractId: 'C-OPS-PORTAL-010',
    method: 'GET',
    path: '/api/ops/audit-logs',
    request: exports.schoolActivityQuerySchema,
    response: exports.schoolActivityResponseSchema,
    success: 200,
    errors: [400, 401, 403, 404, 429, 500],
});
