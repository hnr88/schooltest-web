/**
 * C-OPSM-01/03/04/05 — the ops Comms console: `POST /api/ops/comms/bulk-email`,
 * `GET /api/ops/comms/email-log`, `POST /api/ops/comms/push-broadcast` and
 * `GET /api/ops/comms/templates`.
 *
 * Every shape here was READ OFF THE LIVE ROUTES (curl against 127.0.0.1:5500)
 * and cross-checked against `schooltest-api/src/api/ops/{controllers,services}/comms.ts`.
 * The three that are easy to get wrong:
 *
 *  - `dryRun` DEFAULTS TO TRUE server-side (`body.dryRun !== false`). A dry run
 *    reports the true recipient count and sends nothing, which is what makes a
 *    recipient preview possible without a fan-out. `dryRun: false` is the only
 *    thing that puts mail on the wire, so the client must send it explicitly and
 *    only behind a confirmation.
 *  - the email log is the REAL auth-email issuance ledger
 *    (`api::auth-email-request`), not a sent-mail log. Its row carries exactly
 *    `kind`, `email`, `createdAt` — verified on the wire with throwaway rows.
 *    `token_hash` lives on the same table and is a CREDENTIAL; the service
 *    projects it away and this schema refuses to model it, so a drift that
 *    leaks it fails the contract instead of painting a secret on screen.
 *    Note the CONTRAST with `./audit-console`: that row does carry a numeric
 *    `id`, this one does NOT — the observed projections genuinely differ, so
 *    neither schema can be copied onto the other.
 *  - `templates` is the REAL notification event registry (EVENT_META), so the
 *    "templates" are event keys, not editable mail templates. There is no
 *    create/update route; the console lists them read-only.
 *
 * Ordering is the server's (`id desc`, newest first) and there is no sort
 * parameter — a sort control would need an API change.
 *
 * The pagination schema is declared locally, matching what `classes-list`,
 * `students-list`, `staff-users`, `teachers-list`, `audit-console`,
 * `form-window-read` and `window-report` each already do. That per-module
 * duplication is the house pattern (see the integrator note in ./index), not a
 * new one introduced here.
 */
import { z } from 'zod';
import type { OpsOperation } from './core';
/** The controller's own `requireText` ceilings, field for field. */
export declare const COMMS_AUDIENCE_MAX = 120;
export declare const COMMS_SUBJECT_MAX = 200;
export declare const COMMS_EMAIL_BODY_MAX = 20000;
export declare const COMMS_PUSH_TITLE_MAX = 120;
export declare const COMMS_PUSH_BODY_MAX = 500;
export declare const COMMS_PAGE_MIN = 1;
export declare const COMMS_PAGE_MAX = 100000;
export declare const COMMS_PAGE_SIZE_MIN = 1;
export declare const COMMS_PAGE_SIZE_MAX = 200;
export declare const COMMS_PAGE_SIZE_DEFAULT = 25;
/**
 * The audiences the service resolves to a real `where` clause. `school:<documentId>`
 * is also accepted; anything else is a 400 naming this list, so the console
 * offers exactly these and never free-types an audience.
 */
export declare const BULK_AUDIENCES: readonly ["all", "ops", "school_admins", "teachers", "parents"];
export type BulkAudience = (typeof BULK_AUDIENCES)[number];
export declare const bulkAudienceSchema: z.ZodEnum<{
    ops: "ops";
    teachers: "teachers";
    all: "all";
    school_admins: "school_admins";
    parents: "parents";
}>;
export declare const commsPaginationSchema: z.ZodObject<{
    page: z.ZodNumber;
    pageSize: z.ZodNumber;
    pageCount: z.ZodNumber;
    total: z.ZodNumber;
}, z.core.$strict>;
export type CommsPagination = z.infer<typeof commsPaginationSchema>;
/**
 * One issuance-ledger row. `kind` and `email` are NULLABLE because the
 * underlying columns are (`auth_email_requests.kind`/`.email` both permit
 * null); the app always writes them, but the contract mirrors the column
 * rather than the happy path, and the table renders a dash for a null.
 */
export declare const emailLogRowSchema: z.ZodObject<{
    kind: z.ZodNullable<z.ZodString>;
    email: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodISODateTime;
}, z.core.$strict>;
export type EmailLogRow = z.infer<typeof emailLogRowSchema>;
export declare const emailLogQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    pageSize: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
export type EmailLogQuery = z.infer<typeof emailLogQuerySchema>;
export declare const emailLogResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        kind: z.ZodNullable<z.ZodString>;
        email: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodISODateTime;
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
export type EmailLogResponse = z.infer<typeof emailLogResponseSchema>;
/**
 * A notification event from EVENT_META. `subject` is the key with underscores
 * swapped for spaces and `description` is a rendered sentence — both are
 * server-composed display strings, which is why neither is an enum.
 */
export declare const commsTemplateRowSchema: z.ZodObject<{
    key: z.ZodString;
    subject: z.ZodString;
    description: z.ZodString;
}, z.core.$strict>;
export type CommsTemplateRow = z.infer<typeof commsTemplateRowSchema>;
export declare const commsTemplatesResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        key: z.ZodString;
        subject: z.ZodString;
        description: z.ZodString;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type CommsTemplatesResponse = z.infer<typeof commsTemplatesResponseSchema>;
/** `dryRun` omitted means TRUE at the server. The client always sends it. */
export declare const bulkEmailBodySchema: z.ZodObject<{
    audience: z.ZodString;
    subject: z.ZodString;
    body: z.ZodString;
    dryRun: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strict>;
export type BulkEmailBody = z.infer<typeof bulkEmailBodySchema>;
/**
 * `recipients` is the TRUE blast radius (addresses resolved from the audience),
 * reported on a dry run too. A per-recipient failure is counted in `failed`,
 * never swallowed — so a partial send is visible as sent + failed.
 */
export declare const bulkEmailResultSchema: z.ZodObject<{
    audience: z.ZodString;
    recipients: z.ZodNumber;
    sent: z.ZodNumber;
    failed: z.ZodNumber;
    dryRun: z.ZodBoolean;
}, z.core.$strict>;
export type BulkEmailResult = z.infer<typeof bulkEmailResultSchema>;
export declare const bulkEmailResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        audience: z.ZodString;
        recipients: z.ZodNumber;
        sent: z.ZodNumber;
        failed: z.ZodNumber;
        dryRun: z.ZodBoolean;
    }, z.core.$strict>;
}, z.core.$strict>;
export type BulkEmailResponse = z.infer<typeof bulkEmailResponseSchema>;
export declare const pushBroadcastBodySchema: z.ZodObject<{
    audience: z.ZodString;
    title: z.ZodString;
    body: z.ZodString;
    dryRun: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strict>;
export type PushBroadcastBody = z.infer<typeof pushBroadcastBodySchema>;
/**
 * Push counts SUBSCRIPTIONS, not users: the audience resolves to users and the
 * server counts their registered push subscriptions, so the preview number is
 * devices reachable — deliberately a different number from the email
 * `recipients`, and the console must not label them the same.
 */
export declare const pushBroadcastResultSchema: z.ZodObject<{
    subscriptions: z.ZodNumber;
    sent: z.ZodNumber;
    failed: z.ZodNumber;
    dryRun: z.ZodBoolean;
}, z.core.$strict>;
export type PushBroadcastResult = z.infer<typeof pushBroadcastResultSchema>;
export declare const pushBroadcastResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        subscriptions: z.ZodNumber;
        sent: z.ZodNumber;
        failed: z.ZodNumber;
        dryRun: z.ZodBoolean;
    }, z.core.$strict>;
}, z.core.$strict>;
export type PushBroadcastResponse = z.infer<typeof pushBroadcastResponseSchema>;
export declare const COMMS_TEMPLATES_PATH = "/api/ops/comms/templates";
export declare const COMMS_EMAIL_LOG_PATH = "/api/ops/comms/email-log";
export declare const COMMS_BULK_EMAIL_PATH = "/api/ops/comms/bulk-email";
export declare const COMMS_PUSH_BROADCAST_PATH = "/api/ops/comms/push-broadcast";
declare const emptyQuerySchema: z.ZodObject<{}, z.core.$strict>;
export declare const CommsTemplatesOperation: OpsOperation<typeof emptyQuerySchema, typeof commsTemplatesResponseSchema>;
export declare const CommsEmailLogOperation: OpsOperation<typeof emailLogQuerySchema, typeof emailLogResponseSchema>;
export declare const CommsBulkEmailOperation: OpsOperation<typeof bulkEmailBodySchema, typeof bulkEmailResponseSchema>;
export declare const CommsPushBroadcastOperation: OpsOperation<typeof pushBroadcastBodySchema, typeof pushBroadcastResponseSchema>;
export {};
