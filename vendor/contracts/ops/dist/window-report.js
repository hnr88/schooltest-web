"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowPdfOperation = exports.WindowReportOperation = exports.emptyReportBody = exports.windowReportResponseSchema = exports.windowReportQuerySchema = exports.windowReportSchema = exports.reportPaginationSchema = exports.reportResultRowSchema = exports.REPORT_PAGE_SIZE_MAX = exports.REPORT_PAGE_SIZE_DEFAULT = exports.REPORT_PAGE_MAX = void 0;
exports.windowReportPath = windowReportPath;
/**
 * C-OPS-PORTAL-055/056 — the window report and its PDF export (backlog task
 * 29). ONE contract for both consumers: the JSON report the ops UI renders and
 * the PDF the export controller draws through pdfkit.
 *
 * IDENTITY: the report is a DERIVED view of one window, not a stored entity —
 * its `documentId` IS the window's documentId, and the pair
 * `school_documentId` + `window_documentId` is what the caller authorized.
 * `generated_at` is the server instant the derivation ran.
 *
 * Whole-window totals (`eligible`, `sat`, `excluded_invalidated`) are computed
 * ONCE per generation from the shared official-attempt derivation
 * (api/form-window/lib/window-official-results) and are INDEPENDENT of row
 * pagination: paginating `results` must never change a total. Pending scores
 * live in `pending` — a student who has not scored is never presented as zero.
 */
const zod_1 = require("zod");
const COUNT_MAX = 2147483647;
exports.REPORT_PAGE_MAX = 100000;
exports.REPORT_PAGE_SIZE_DEFAULT = 25;
exports.REPORT_PAGE_SIZE_MAX = 200;
const timestampSchema = zod_1.z.iso.datetime({ offset: true });
exports.reportResultRowSchema = zod_1.z.strictObject({
    student_documentId: zod_1.z.string().min(1),
    result_documentId: zod_1.z.string().min(1),
    cefr_level: zod_1.z.string().max(10).nullable(),
    /** Null means the score is PENDING — it is never presented as zero. */
    percentage: zod_1.z.number().min(0).max(100).nullable(),
});
exports.reportPaginationSchema = zod_1.z.strictObject({
    page: zod_1.z.number().int().min(1).max(exports.REPORT_PAGE_MAX),
    pageSize: zod_1.z.number().int().min(1).max(exports.REPORT_PAGE_SIZE_MAX),
    pageCount: zod_1.z.number().int().min(0).max(COUNT_MAX),
    total: zod_1.z.number().int().min(0).max(COUNT_MAX),
});
exports.windowReportSchema = zod_1.z.strictObject({
    /** The report belongs to its window — the window's documentId. */
    documentId: zod_1.z.string().min(1),
    school_documentId: zod_1.z.string().min(1),
    window_documentId: zod_1.z.string().min(1),
    generated_at: timestampSchema,
    eligible: zod_1.z.number().int().min(0).max(COUNT_MAX),
    sat: zod_1.z.number().int().min(0).max(COUNT_MAX),
    results: zod_1.z.array(exports.reportResultRowSchema).max(exports.REPORT_PAGE_SIZE_MAX),
    excluded_invalidated: zod_1.z.number().int().min(0).max(COUNT_MAX),
    pagination: exports.reportPaginationSchema,
});
exports.windowReportQuerySchema = zod_1.z.strictObject({
    page: zod_1.z.number().int().min(1).max(exports.REPORT_PAGE_MAX).optional(),
    pageSize: zod_1.z.number().int().min(1).max(exports.REPORT_PAGE_SIZE_MAX).optional(),
});
exports.windowReportResponseSchema = zod_1.z.strictObject({ data: exports.windowReportSchema });
/** The PDF and the report take no body; unknown keys are rejected, not dropped. */
exports.emptyReportBody = zod_1.z.strictObject({});
function windowReportPath(schoolDocumentId, windowDocumentId, query = {}) {
    const pairs = [];
    if (query.page !== undefined)
        pairs.push(['page', String(query.page)]);
    if (query.pageSize !== undefined)
        pairs.push(['pageSize', String(query.pageSize)]);
    const search = pairs.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    const base = `/api/ops/schools/${encodeURIComponent(schoolDocumentId)}/result-windows/${encodeURIComponent(windowDocumentId)}/report`;
    return search === '' ? base : `${base}?${search}`;
}
/** C-OPS-PORTAL-055 — GET /api/ops/schools/{documentId}/result-windows/{windowDocumentId}/report */
exports.WindowReportOperation = Object.freeze({
    contractId: 'C-OPS-PORTAL-055',
    method: 'GET',
    path: '/api/ops/schools/{documentId}/result-windows/{windowDocumentId}/report',
    request: exports.windowReportQuerySchema,
    response: exports.windowReportResponseSchema,
    success: 200,
    errors: [400, 401, 403, 404, 429, 500],
});
/** C-OPS-PORTAL-056 — GET .../report.pdf (200 = the PDF bytes; never a 2xx JSON). */
exports.WindowPdfOperation = Object.freeze({
    contractId: 'C-OPS-PORTAL-056',
    method: 'GET',
    path: '/api/ops/schools/{documentId}/result-windows/{windowDocumentId}/report.pdf',
    request: exports.emptyReportBody,
    // The response is a BINARY attachment, not the JSON envelope — the
    // operation pins method/path/statuses only; the body streams raw.
    response: exports.emptyReportBody,
    success: 200,
    errors: [400, 401, 403, 404, 429, 500],
});
