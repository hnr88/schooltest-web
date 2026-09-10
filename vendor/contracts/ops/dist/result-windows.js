"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassWindowAssignOperation = exports.AssessmentWindowCreateOperation = exports.assessmentWindowCreateResponseSchema = exports.ResultWindowsOperation = exports.opsWindowActionResponseSchema = exports.opsWindowShareResponseSchema = exports.opsWindowShareResultSchema = exports.classWindowAssignResponseSchema = exports.classWindowAssignResultSchema = exports.classWindowAssignBodySchema = exports.opsResultWindowsResponseSchema = exports.opsResultWindowsQuerySchema = exports.opsResultWindowRowSchema = exports.assessmentWindowCreateBodySchema = exports.opsWindowFormBindingSchema = exports.OPS_WINDOW_FORMS_MAX = exports.OPS_WINDOW_CLASSES_MAX = exports.OPS_WINDOW_TIMEZONE_MAX = exports.OPS_WINDOW_TITLE_MAX = exports.windowStatusSchema = exports.ASSESSMENT_WINDOW_REOPEN_DAYS = void 0;
exports.validateWindowInterval = validateWindowInterval;
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
const zod_1 = require("zod");
const core_1 = require("./core");
const students_list_1 = require("./students-list");
/** Seven calendar days, D-WIN — a reopen is possible only inside this window. */
exports.ASSESSMENT_WINDOW_REOPEN_DAYS = 7;
/** Row status as the results table renders it (task 28 derives, never stores). */
exports.windowStatusSchema = zod_1.z.enum(['complete', 'in_progress', 'scheduled', 'cancelled']);
exports.OPS_WINDOW_TITLE_MAX = 255;
exports.OPS_WINDOW_TIMEZONE_MAX = 100;
exports.OPS_WINDOW_CLASSES_MAX = 200;
exports.OPS_WINDOW_FORMS_MAX = 4;
const COUNT_MAX = 2147483647;
const timestampSchema = zod_1.z.iso.datetime({ offset: true });
/** One skill -> active form binding. Duplicate skills reject at the boundary. */
exports.opsWindowFormBindingSchema = zod_1.z.strictObject({
    skill: zod_1.z.enum(['reading', 'listening', 'speaking', 'writing']),
    form_documentId: core_1.documentIdSchema,
});
/** POST /api/ops/schools/{documentId}/result-windows — strict create body. */
exports.assessmentWindowCreateBodySchema = zod_1.z.strictObject({
    title: zod_1.z.string().trim().min(1).max(exports.OPS_WINDOW_TITLE_MAX),
    class_documentIds: zod_1.z.array(core_1.documentIdSchema).min(1).max(exports.OPS_WINDOW_CLASSES_MAX),
    forms: zod_1.z.array(exports.opsWindowFormBindingSchema).min(1).max(exports.OPS_WINDOW_FORMS_MAX),
    opens_at: timestampSchema,
    closes_at: timestampSchema,
    timezone: zod_1.z.string().min(1).max(exports.OPS_WINDOW_TIMEZONE_MAX),
});
/**
 * Cross-field rule, checked here so the server error is deterministic:
 * `opens_at < closes_at`. The Zod refine gives every caller the same 400.
 */
function validateWindowInterval(body) {
    return Date.parse(body.opens_at) < Date.parse(body.closes_at);
}
/** GET row — historical and scheduled windows (ResultWindow). */
exports.opsResultWindowRowSchema = zod_1.z.strictObject({
    documentId: core_1.documentIdSchema,
    title: zod_1.z.string().min(1).max(exports.OPS_WINDOW_TITLE_MAX),
    status: exports.windowStatusSchema,
    opens_at: timestampSchema,
    closes_at: timestampSchema,
    eligible: zod_1.z.number().int().min(0).max(COUNT_MAX),
    sat: zod_1.z.number().int().min(0).max(COUNT_MAX),
    /** Null unless a validated band mapping supports aggregation. */
    average_cefr: zod_1.z.string().max(10).nullable(),
    average_percentage: zod_1.z.number().min(0).max(100).nullable(),
    updatedAt: timestampSchema,
});
exports.opsResultWindowsQuerySchema = zod_1.z.strictObject({
    page: zod_1.z.number().int().min(1).max(100000).optional(),
    pageSize: zod_1.z.number().int().min(1).max(200).optional(),
    status: exports.windowStatusSchema.optional(),
});
exports.opsResultWindowsResponseSchema = zod_1.z.strictObject({
    data: zod_1.z.array(exports.opsResultWindowRowSchema).max(200),
    meta: zod_1.z.strictObject({ pagination: students_list_1.opsStudentsPaginationSchema }),
});
/** PUT /api/ops/classes/{documentId}/test-window — assign or clear (null). */
exports.classWindowAssignBodySchema = zod_1.z.strictObject({
    window_documentId: core_1.documentIdSchema.nullable(),
});
exports.classWindowAssignResultSchema = zod_1.z.strictObject({
    class_documentId: core_1.documentIdSchema,
    window_documentId: core_1.documentIdSchema.nullable(),
});
exports.classWindowAssignResponseSchema = (0, core_1.dataEnvelope)(exports.classWindowAssignResultSchema);
/* ------------------------------------------------------------------ *
 * Task 30 — C-OPS-PORTAL-057/058/059: share, cancel and reopen.
 * ------------------------------------------------------------------ */
/** Share outcome — explicit partial-delivery counts, never a full-success claim. */
exports.opsWindowShareResultSchema = zod_1.z.strictObject({
    window_documentId: core_1.documentIdSchema,
    sent: zod_1.z.number().int().min(0).max(COUNT_MAX),
    failed: zod_1.z.number().int().min(0).max(COUNT_MAX),
});
exports.opsWindowShareResponseSchema = (0, core_1.dataEnvelope)(exports.opsWindowShareResultSchema);
exports.opsWindowActionResponseSchema = (0, core_1.dataEnvelope)(exports.opsResultWindowRowSchema);
/* ------------------------------------------------------------------ *
 * The named operations.
 * ------------------------------------------------------------------ */
/** C-OPS-PORTAL-054 — GET /api/ops/schools/{documentId}/result-windows */
exports.ResultWindowsOperation = Object.freeze({
    contractId: 'C-OPS-PORTAL-054',
    method: 'GET',
    path: '/api/ops/schools/{documentId}/result-windows',
    request: exports.opsResultWindowsQuerySchema,
    response: exports.opsResultWindowsResponseSchema,
    success: 200,
    errors: [400, 401, 403, 404, 429, 500],
});
const assessmentWindowCreateResponseSchema = (0, core_1.dataEnvelope)(exports.opsResultWindowRowSchema);
exports.assessmentWindowCreateResponseSchema = assessmentWindowCreateResponseSchema;
/** C-OPS-PORTAL-073 — POST /api/ops/schools/{documentId}/result-windows */
exports.AssessmentWindowCreateOperation = Object.freeze({
    contractId: 'C-OPS-PORTAL-073',
    method: 'POST',
    path: '/api/ops/schools/{documentId}/result-windows',
    request: exports.assessmentWindowCreateBodySchema,
    response: assessmentWindowCreateResponseSchema,
    success: 201,
    errors: [400, 401, 403, 404, 409, 429, 500],
});
/**
 * C-OPS-PORTAL-074 — PUT /api/ops/schools/{documentId}/classes/{classDocumentId}/window
 *
 * Task 22 / D-26 (X-02): the path is CORRECTED here to the route that has
 * always been deployed (`schooltest-api/src/api/class/routes/02-custom-ops-
 * class.ts`, handler `api::class.class.opsAssignClassWindow`). The record
 * previously declared `/api/ops/classes/{documentId}/test-window`, a path
 * nothing has ever served — verified live: the old path answers 405, the
 * corrected one answers 200 (proof/22.md). The route itself is never
 * renamed: `api::class.class.opsAssignClassWindow` is the permission grant
 * and renaming it would drop the grant at boot.
 */
exports.ClassWindowAssignOperation = Object.freeze({
    contractId: 'C-OPS-PORTAL-074',
    method: 'PUT',
    path: '/api/ops/schools/{documentId}/classes/{classDocumentId}/window',
    request: exports.classWindowAssignBodySchema,
    response: exports.classWindowAssignResponseSchema,
    success: 200,
    errors: [400, 401, 403, 404, 409, 429, 500],
});
