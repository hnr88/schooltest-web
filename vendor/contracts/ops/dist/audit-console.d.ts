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
import { z } from 'zod';
import { type OpsOperation } from './core';
export declare const AUDIT_PAGE_MIN = 1;
export declare const AUDIT_PAGE_MAX = 100000;
export declare const AUDIT_PAGE_SIZE_MIN = 1;
export declare const AUDIT_PAGE_SIZE_MAX = 200;
export declare const AUDIT_PAGE_SIZE_DEFAULT = 25;
export declare const auditPaginationSchema: z.ZodObject<{
    page: z.ZodNumber;
    pageSize: z.ZodNumber;
    pageCount: z.ZodNumber;
    total: z.ZodNumber;
}, z.core.$strict>;
export type AuditPagination = z.infer<typeof auditPaginationSchema>;
/** The acting staff member on a ledger row, by the server's own projection. */
export declare const auditActorSchema: z.ZodObject<{
    documentId: z.ZodString;
    email: z.ZodNullable<z.ZodString>;
}, z.core.$strict>;
export type AuditActor = z.infer<typeof auditActorSchema>;
export declare const auditLogRowSchema: z.ZodObject<{
    id: z.ZodNumber;
    documentId: z.ZodString;
    action: z.ZodString;
    target: z.ZodNullable<z.ZodString>;
    detail: z.ZodUnknown;
    createdAt: z.ZodISODateTime;
    actor: z.ZodNullable<z.ZodObject<{
        documentId: z.ZodString;
        email: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type AuditLogRow = z.infer<typeof auditLogRowSchema>;
/**
 * Every filter is applied SERVER-side: `action` and `target` are
 * case-insensitive contains, `actor` is an exact documentId, and `from`/`to`
 * bound `createdAt`. There is deliberately no free-text `q` and no `sort` —
 * the route serves neither.
 */
export declare const auditLogsQuerySchema: z.ZodObject<{
    actor: z.ZodOptional<z.ZodString>;
    action: z.ZodOptional<z.ZodString>;
    target: z.ZodOptional<z.ZodString>;
    from: z.ZodOptional<z.ZodISODateTime>;
    to: z.ZodOptional<z.ZodISODateTime>;
    page: z.ZodOptional<z.ZodNumber>;
    pageSize: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
export type AuditLogsQuery = z.infer<typeof auditLogsQuerySchema>;
export declare const auditLogsResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        documentId: z.ZodString;
        action: z.ZodString;
        target: z.ZodNullable<z.ZodString>;
        detail: z.ZodUnknown;
        createdAt: z.ZodISODateTime;
        actor: z.ZodNullable<z.ZodObject<{
            documentId: z.ZodString;
            email: z.ZodNullable<z.ZodString>;
        }, z.core.$strict>>;
    }, z.core.$strict>>;
    meta: z.ZodObject<{
        pagination: z.ZodObject<{
            page: z.ZodNumber;
            pageSize: z.ZodNumber;
            pageCount: z.ZodNumber;
            total: z.ZodNumber;
        }, z.core.$strict>;
    }, z.core.$strict>;
}, z.core.$strict>;
export type AuditLogsResponse = z.infer<typeof auditLogsResponseSchema>;
export declare const apiTokenRowSchema: z.ZodObject<{
    id: z.ZodNumber;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    type: z.ZodString;
    lastUsedAt: z.ZodNullable<z.ZodISODateTime>;
    expiresAt: z.ZodNullable<z.ZodISODateTime>;
    createdAt: z.ZodNullable<z.ZodISODateTime>;
}, z.core.$strict>;
export type ApiTokenRow = z.infer<typeof apiTokenRowSchema>;
export declare const apiTokensResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        name: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        type: z.ZodString;
        lastUsedAt: z.ZodNullable<z.ZodISODateTime>;
        expiresAt: z.ZodNullable<z.ZodISODateTime>;
        createdAt: z.ZodNullable<z.ZodISODateTime>;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type ApiTokensResponse = z.infer<typeof apiTokensResponseSchema>;
/** Revoke is a hard delete: the row is gone, so the ack is the id and a flag. */
export declare const apiTokenRevokeResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        id: z.ZodNumber;
        revoked: z.ZodLiteral<true>;
    }, z.core.$strict>;
}, z.core.$strict>;
export type ApiTokenRevokeResponse = z.infer<typeof apiTokenRevokeResponseSchema>;
export declare const emptyRevokeBodySchema: z.ZodObject<{}, z.core.$strict>;
export declare const AuditLogsOperation: OpsOperation<typeof auditLogsQuerySchema, typeof auditLogsResponseSchema>;
export declare const ApiTokensOperation: OpsOperation<typeof emptyRevokeBodySchema, typeof apiTokensResponseSchema>;
export declare const ApiTokenRevokeOperation: OpsOperation<typeof emptyRevokeBodySchema, typeof apiTokenRevokeResponseSchema>;
/** The route path for one token's revoke. */
export declare function apiTokenRevokePath(id: number): string;
