"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiTokenRevokeOperation = exports.ApiTokensOperation = exports.AuditLogsOperation = exports.emptyRevokeBodySchema = exports.apiTokenRevokeResponseSchema = exports.apiTokensResponseSchema = exports.apiTokenRowSchema = exports.auditLogsResponseSchema = exports.auditLogsQuerySchema = exports.auditLogRowSchema = exports.auditActorSchema = exports.auditPaginationSchema = exports.AUDIT_PAGE_SIZE_DEFAULT = exports.AUDIT_PAGE_SIZE_MAX = exports.AUDIT_PAGE_SIZE_MIN = exports.AUDIT_PAGE_MAX = exports.AUDIT_PAGE_MIN = void 0;
exports.apiTokenRevokePath = apiTokenRevokePath;
/**
 * C-OPSA-01/02 — the ops Audit console: `GET /api/ops/audit-logs` (the
 * UNVERSIONED ledger projection), `GET /api/ops/security/api-tokens` and
 * `POST /api/ops/security/api-tokens/:id/revoke`.
 *
 * These mirror the REAL server shapes in
 * `schooltest-api/src/api/ops/services/audit.ts`:
 *  - the ledger row is the raw audit row (`detail` included) — this is the
 *    ops-only legacy projection, NOT the sanitized school-scoped `activity`
 *    view in `./school-activity`, which is the SAME route read with
 *    `X-Ops-Portal-Version: 1`. Both exist on purpose; do not merge them.
 *  - `detail` stays `unknown`: it is free-form JSON that can carry an email or
 *    a CSV row, so it is typed as opaque and the console never renders it.
 *  - the token row NEVER carries `accessKey`. The server projects it away
 *    because an ops screen showing a token secret is a credential-disclosure
 *    bug; this schema refuses to model it so a drift that adds it back fails
 *    the contract instead of painting a secret on screen.
 *  - revoke is a HARD DELETE server-side and is therefore irreversible.
 *
 * The ledger serves NO sort parameter — the server orders `id desc` (newest
 * first) and that is the only order. A sort control would need an API change.
 */
const zod_1 = require("zod");
const core_1 = require("./core");
const ACTION_MAX = 100;
const TARGET_MAX = 255;
const EMAIL_MAX = 255;
const TOKEN_NAME_MAX = 255;
const TOKEN_TYPE_MAX = 50;
const TOKEN_DESCRIPTION_MAX = 255;
exports.AUDIT_PAGE_MIN = 1;
exports.AUDIT_PAGE_MAX = 100000;
exports.AUDIT_PAGE_SIZE_MIN = 1;
exports.AUDIT_PAGE_SIZE_MAX = 200;
exports.AUDIT_PAGE_SIZE_DEFAULT = 25;
const timestampSchema = zod_1.z.iso.datetime({ offset: true });
exports.auditPaginationSchema = zod_1.z.strictObject({
    page: zod_1.z.number().int().min(exports.AUDIT_PAGE_MIN).max(exports.AUDIT_PAGE_MAX),
    pageSize: zod_1.z.number().int().min(exports.AUDIT_PAGE_SIZE_MIN).max(exports.AUDIT_PAGE_SIZE_MAX),
    pageCount: zod_1.z.number().int().min(0),
    total: zod_1.z.number().int().min(0),
});
/** The acting staff member on a ledger row, by the server's own projection. */
exports.auditActorSchema = zod_1.z.strictObject({
    documentId: core_1.documentIdSchema,
    email: zod_1.z.string().max(EMAIL_MAX).nullable(),
});
exports.auditLogRowSchema = zod_1.z.strictObject({
    /**
     * Strapi's `db.query` returns the numeric primary key alongside the
     * explicit `select`, so the wire row carries `id` even though the service
     * does not ask for it. Verified against the live route — modelling it is
     * what keeps this a strict schema instead of a passthrough.
     */
    id: zod_1.z.number().int().positive(),
    documentId: core_1.documentIdSchema,
    action: zod_1.z.string().min(1).max(ACTION_MAX),
    target: zod_1.z.string().max(TARGET_MAX).nullable(),
    /** Free-form JSON. Opaque on purpose — never rendered. */
    detail: zod_1.z.unknown(),
    createdAt: timestampSchema,
    actor: exports.auditActorSchema.nullable(),
});
/**
 * Every filter is applied SERVER-side: `action` and `target` are
 * case-insensitive contains, `actor` is an exact documentId, and `from`/`to`
 * bound `createdAt`. There is deliberately no free-text `q` and no `sort` —
 * the route serves neither.
 */
exports.auditLogsQuerySchema = zod_1.z.strictObject({
    actor: core_1.documentIdSchema.optional(),
    action: zod_1.z.string().min(1).max(ACTION_MAX).optional(),
    target: zod_1.z.string().min(1).max(TARGET_MAX).optional(),
    from: timestampSchema.optional(),
    to: timestampSchema.optional(),
    page: zod_1.z.number().int().min(exports.AUDIT_PAGE_MIN).max(exports.AUDIT_PAGE_MAX).optional(),
    pageSize: zod_1.z.number().int().min(exports.AUDIT_PAGE_SIZE_MIN).max(exports.AUDIT_PAGE_SIZE_MAX).optional(),
});
exports.auditLogsResponseSchema = zod_1.z.strictObject({
    data: zod_1.z.array(exports.auditLogRowSchema).max(exports.AUDIT_PAGE_SIZE_MAX),
    meta: zod_1.z.strictObject({ pagination: exports.auditPaginationSchema }),
});
exports.apiTokenRowSchema = zod_1.z.strictObject({
    id: zod_1.z.number().int().positive(),
    name: zod_1.z.string().min(1).max(TOKEN_NAME_MAX),
    description: zod_1.z.string().max(TOKEN_DESCRIPTION_MAX).nullable(),
    type: zod_1.z.string().min(1).max(TOKEN_TYPE_MAX),
    lastUsedAt: timestampSchema.nullable(),
    expiresAt: timestampSchema.nullable(),
    createdAt: timestampSchema.nullable(),
});
exports.apiTokensResponseSchema = zod_1.z.strictObject({ data: zod_1.z.array(exports.apiTokenRowSchema) });
/** Revoke is a hard delete: the row is gone, so the ack is the id and a flag. */
exports.apiTokenRevokeResponseSchema = zod_1.z.strictObject({
    data: zod_1.z.strictObject({ id: zod_1.z.number().int().positive(), revoked: zod_1.z.literal(true) }),
});
exports.emptyRevokeBodySchema = zod_1.z.strictObject({});
exports.AuditLogsOperation = Object.freeze({
    contractId: 'C-OPSA-01',
    method: 'GET',
    path: '/api/ops/audit-logs',
    request: exports.auditLogsQuerySchema,
    response: exports.auditLogsResponseSchema,
    success: 200,
    errors: [400, 401, 403, 429, 500],
});
exports.ApiTokensOperation = Object.freeze({
    contractId: 'C-OPSA-02',
    method: 'GET',
    path: '/api/ops/security/api-tokens',
    request: exports.emptyRevokeBodySchema,
    response: exports.apiTokensResponseSchema,
    success: 200,
    errors: [401, 403, 429, 500],
});
exports.ApiTokenRevokeOperation = Object.freeze({
    contractId: 'C-OPSA-02',
    method: 'POST',
    path: '/api/ops/security/api-tokens/:id/revoke',
    request: exports.emptyRevokeBodySchema,
    response: exports.apiTokenRevokeResponseSchema,
    success: 200,
    errors: [400, 401, 403, 404, 429, 500],
});
/** The route path for one token's revoke. */
function apiTokenRevokePath(id) {
    return `/api/ops/security/api-tokens/${id}/revoke`;
}
