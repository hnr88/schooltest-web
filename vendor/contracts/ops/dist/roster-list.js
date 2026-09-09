"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rosterAddBodySchema = exports.RosterListOperation = exports.rosterListResponseSchema = exports.rosterListQuerySchema = exports.OPS_ROSTER_QUERY_MAX = exports.OPS_ROSTER_PAGE_SIZE_MAX = exports.OPS_ROSTER_PAGE_SIZE_DEFAULT = exports.OPS_ROSTER_PAGE_MAX = void 0;
exports.rosterListQueryString = rosterListQueryString;
exports.rosterListPath = rosterListPath;
/**
 * C-OPS-PORTAL-037 — GET /api/ops/schools/{schoolDocumentId}/classes/{classDocumentId}/students
 * (the paginated roster read, backlog task 01).
 *
 * The five task areas agree this contract exists to break a dependency cycle:
 * backlog task 19 (class form) consumes the paginated roster, task 25 (roster)
 * implements it and task 20 (assign teacher) needs the class detail it feeds —
 * so the WIRE SHAPE is settled here before any of the three start.
 *
 * It is the q/page/pageSize -> data + meta.pagination shape the task-04
 * directory kit consumes, with the exact bounds the server enforces in
 * schooltest-api/src/api/ops/lib/ops-pagination.ts: page defaults to 1,
 * pageSize to 25, pageSize caps at 200, q caps at 120 characters, and an
 * out-of-range value is a 400 — NEVER a silent clamp.
 *
 * The row IS the Students-tab row (./students-list), so the roster table and
 * the students table cannot drift; only the class filter is absent here,
 * because the path already pins one class of the school.
 */
const zod_1 = require("zod");
const core_1 = require("./core");
const students_list_1 = require("./students-list");
exports.OPS_ROSTER_PAGE_MAX = 100000;
exports.OPS_ROSTER_PAGE_SIZE_DEFAULT = 25;
exports.OPS_ROSTER_PAGE_SIZE_MAX = 200;
exports.OPS_ROSTER_QUERY_MAX = 120;
exports.rosterListQuerySchema = zod_1.z.strictObject({
    page: zod_1.z.number().int().min(1).max(exports.OPS_ROSTER_PAGE_MAX).optional(),
    pageSize: zod_1.z.number().int().min(1).max(exports.OPS_ROSTER_PAGE_SIZE_MAX).optional(),
    q: zod_1.z.string().max(exports.OPS_ROSTER_QUERY_MAX).optional(),
    status: students_list_1.opsStudentStatusSchema.optional(),
});
exports.rosterListResponseSchema = zod_1.z.strictObject({
    data: zod_1.z.array(students_list_1.opsStudentRowSchema).max(exports.OPS_ROSTER_PAGE_SIZE_MAX),
    meta: zod_1.z.strictObject({ pagination: students_list_1.opsStudentsPaginationSchema }),
});
function rosterListQueryString(query) {
    const pairs = [];
    if (query.page !== undefined)
        pairs.push(['page', String(query.page)]);
    if (query.pageSize !== undefined)
        pairs.push(['pageSize', String(query.pageSize)]);
    if (query.q !== undefined && query.q !== '')
        pairs.push(['q', query.q]);
    if (query.status !== undefined)
        pairs.push(['status', query.status]);
    return pairs
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
}
function rosterListPath(schoolDocumentId, classDocumentId, query = {}) {
    const search = rosterListQueryString(query);
    const base = `/api/ops/schools/${encodeURIComponent(schoolDocumentId)}/classes/${encodeURIComponent(classDocumentId)}/students`;
    return search === '' ? base : `${base}?${search}`;
}
/** C-OPS-PORTAL-037 — GET /api/ops/schools/{documentId}/classes/{classDocumentId}/students */
exports.RosterListOperation = Object.freeze({
    contractId: 'C-OPS-PORTAL-037',
    method: 'GET',
    path: '/api/ops/schools/{documentId}/classes/{classDocumentId}/students',
    request: exports.rosterListQuerySchema,
    response: exports.rosterListResponseSchema,
    success: 200,
    errors: [400, 401, 403, 404, 429, 500],
});
/**
 * C-OPS-PORTAL-038 — POST /api/ops/schools/{documentId}/classes/{classDocumentId}/roster/students
 * already has its server-side implementation (class/lib/class-ops-roster.actions.ts).
 * Its typed request is re-declared here so the paginated read and the write of the
 * same surface share one import; the body is exactly the one OpenAPI field — the
 * students already exist, so placement is the class-student-assignment logic's
 * job and the wire carries only their documentIds.
 */
exports.rosterAddBodySchema = zod_1.z.strictObject({
    student_documentIds: zod_1.z.array(core_1.documentIdSchema).min(1).max(200),
});
