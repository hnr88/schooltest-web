"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormWindowReadOperation = exports.formWindowReadBodySchema = exports.formWindowListSchema = exports.formWindowPaginationSchema = exports.formWindowWireRowSchema = exports.formWindowRowSchema = exports.formWindowFormRefSchema = exports.formWindowSchoolRefSchema = exports.FORM_WINDOW_READ_PATH = exports.FORM_WINDOW_READ_DEFAULT_PAGE_SIZE = exports.FORM_WINDOW_READ_MAX_PAGE_SIZE = void 0;
exports.formWindowReadParams = formWindowReadParams;
exports.resolveSchoolFormWindow = resolveSchoolFormWindow;
/**
 * OPS-062 — C-OPS-PORTAL-052 `GET /api/form-windows`.
 *
 * ONE portable definition of the school form-window READ, imported by the
 * Strapi projection, the typed web client and both HTTP suites so the shape
 * cannot drift between them.
 *
 * Two properties this module exists to guarantee, both named by the task:
 *  - ZERO rows means "no window". It is never an error and never an empty row.
 *  - MORE THAN ONE row for one school is an INTEGRITY error, never silently
 *    `rows[0]`: the storage rule is one window per school (replace semantics),
 *    so two rows mean no window is authoritative and the UI must say so.
 * A third, from the same storage reality: a window whose `school` or `form`
 * relation is gone (deleted form, cleared relation) is INCOMPLETE — reported,
 * not rendered as if a form were live.
 */
const zod_1 = require("zod");
const core_1 = require("./core");
const FORM_CODE_MAX = 255;
const MAX_PAGE = 100000;
const MAX_COUNT = 2147483647;
/** Contract bounds for the core pagination this operation accepts. */
exports.FORM_WINDOW_READ_MAX_PAGE_SIZE = 200;
exports.FORM_WINDOW_READ_DEFAULT_PAGE_SIZE = 25;
exports.FORM_WINDOW_READ_PATH = '/api/form-windows';
/**
 * Strapi's core routes always add the legacy numeric `id` to a row and to every
 * populated relation. The contract identifies documents by `documentId` ALONE,
 * so the transport key is dropped here rather than being tolerated as an
 * unknown key — everything else still has to be exactly what was promised.
 */
function withoutLegacyId(value) {
    if (value === null || typeof value !== 'object' || Array.isArray(value))
        return value;
    const { id: _legacyId, ...rest } = value;
    return rest;
}
const strictRow = (shape) => zod_1.z.preprocess(withoutLegacyId, zod_1.z.strictObject(shape));
const isoDateTime = zod_1.z
    .string()
    .min(1)
    .refine((value) => !Number.isNaN(Date.parse(value)), { message: 'must be an ISO date-time' });
exports.formWindowSchoolRefSchema = strictRow({ documentId: core_1.documentIdSchema });
exports.formWindowFormRefSchema = strictRow({
    documentId: core_1.documentIdSchema,
    form_code: zod_1.z.string().min(1).max(FORM_CODE_MAX),
});
/** The contracted Window: both relations present, exactly five keys. */
exports.formWindowRowSchema = strictRow({
    documentId: core_1.documentIdSchema,
    school: exports.formWindowSchoolRefSchema,
    form: exports.formWindowFormRefSchema,
    opens_at: isoDateTime,
    closes_at: isoDateTime,
});
/**
 * The same row as it can actually arrive. A relation that was deleted comes
 * back as `null`, and a parser that refused it would turn a recoverable data
 * problem into an unreadable screen; `resolveSchoolFormWindow` classifies it.
 */
exports.formWindowWireRowSchema = strictRow({
    documentId: core_1.documentIdSchema,
    school: exports.formWindowSchoolRefSchema.nullable(),
    form: exports.formWindowFormRefSchema.nullable(),
    opens_at: isoDateTime,
    closes_at: isoDateTime,
});
exports.formWindowPaginationSchema = zod_1.z.strictObject({
    page: zod_1.z.number().int().min(1).max(MAX_PAGE),
    pageSize: zod_1.z.number().int().min(1).max(exports.FORM_WINDOW_READ_MAX_PAGE_SIZE),
    pageCount: zod_1.z.number().int().min(0).max(MAX_COUNT),
    total: zod_1.z.number().int().min(0).max(MAX_COUNT),
});
/** 200 body: the page of rows plus the core list metadata, both preserved. */
exports.formWindowListSchema = zod_1.z.strictObject({
    data: zod_1.z.array(exports.formWindowWireRowSchema).max(exports.FORM_WINDOW_READ_MAX_PAGE_SIZE),
    meta: zod_1.z.strictObject({ pagination: exports.formWindowPaginationSchema }),
});
/** GET carries no body; an empty object is the only valid payload. */
exports.formWindowReadBodySchema = zod_1.z.strictObject({});
/**
 * The EXACT query a portal read sends: the school filter the operation is
 * scoped by, the explicit school/form population, and bounded core pagination.
 * Built here so the client, the server assertions and the suites cannot
 * disagree about a single bracket.
 */
function formWindowReadParams(schoolDocumentId) {
    return {
        'filters[school][documentId][$eq]': schoolDocumentId,
        'populate[school][fields][0]': 'documentId',
        'populate[form][fields][0]': 'form_code',
        'pagination[page]': 1,
        'pagination[pageSize]': exports.FORM_WINDOW_READ_DEFAULT_PAGE_SIZE,
    };
}
function resolveSchoolFormWindow(rows) {
    if (rows.length === 0)
        return { kind: 'none' };
    if (rows.length > 1) {
        return { kind: 'conflict', documentIds: rows.map((row) => row.documentId) };
    }
    const row = rows[0];
    if (row.school === null || row.form === null) {
        return { kind: 'incomplete', documentId: row.documentId };
    }
    return {
        kind: 'one',
        window: {
            documentId: row.documentId,
            school: row.school,
            form: row.form,
            opens_at: row.opens_at,
            closes_at: row.closes_at,
        },
    };
}
/** C-OPS-PORTAL-052 — GET /api/form-windows */
exports.FormWindowReadOperation = Object.freeze({
    contractId: 'C-OPS-PORTAL-052',
    method: 'GET',
    path: exports.FORM_WINDOW_READ_PATH,
    request: exports.formWindowReadBodySchema,
    response: exports.formWindowListSchema,
    success: 200,
    errors: [400, 401, 403, 404, 429, 500],
});
