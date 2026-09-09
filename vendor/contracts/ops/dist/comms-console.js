"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommsPushBroadcastOperation = exports.CommsBulkEmailOperation = exports.CommsEmailLogOperation = exports.CommsTemplatesOperation = exports.COMMS_PUSH_BROADCAST_PATH = exports.COMMS_BULK_EMAIL_PATH = exports.COMMS_EMAIL_LOG_PATH = exports.COMMS_TEMPLATES_PATH = exports.pushBroadcastResponseSchema = exports.pushBroadcastResultSchema = exports.pushBroadcastBodySchema = exports.bulkEmailResponseSchema = exports.bulkEmailResultSchema = exports.bulkEmailBodySchema = exports.commsTemplatesResponseSchema = exports.commsTemplateRowSchema = exports.emailLogResponseSchema = exports.emailLogQuerySchema = exports.emailLogRowSchema = exports.commsPaginationSchema = exports.bulkAudienceSchema = exports.BULK_AUDIENCES = exports.COMMS_PAGE_SIZE_DEFAULT = exports.COMMS_PAGE_SIZE_MAX = exports.COMMS_PAGE_SIZE_MIN = exports.COMMS_PAGE_MAX = exports.COMMS_PAGE_MIN = exports.COMMS_PUSH_BODY_MAX = exports.COMMS_PUSH_TITLE_MAX = exports.COMMS_EMAIL_BODY_MAX = exports.COMMS_SUBJECT_MAX = exports.COMMS_AUDIENCE_MAX = void 0;
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
const zod_1 = require("zod");
const EMAIL_MAX = 255;
const KIND_MAX = 255;
const TEMPLATE_KEY_MAX = 100;
const TEMPLATE_TEXT_MAX = 255;
/** The controller's own `requireText` ceilings, field for field. */
exports.COMMS_AUDIENCE_MAX = 120;
exports.COMMS_SUBJECT_MAX = 200;
exports.COMMS_EMAIL_BODY_MAX = 20000;
exports.COMMS_PUSH_TITLE_MAX = 120;
exports.COMMS_PUSH_BODY_MAX = 500;
exports.COMMS_PAGE_MIN = 1;
exports.COMMS_PAGE_MAX = 100000;
exports.COMMS_PAGE_SIZE_MIN = 1;
exports.COMMS_PAGE_SIZE_MAX = 200;
exports.COMMS_PAGE_SIZE_DEFAULT = 25;
/**
 * The audiences the service resolves to a real `where` clause. `school:<documentId>`
 * is also accepted; anything else is a 400 naming this list, so the console
 * offers exactly these and never free-types an audience.
 */
exports.BULK_AUDIENCES = ['all', 'ops', 'school_admins', 'teachers', 'parents'];
exports.bulkAudienceSchema = zod_1.z.enum(exports.BULK_AUDIENCES);
const timestampSchema = zod_1.z.iso.datetime({ offset: true });
exports.commsPaginationSchema = zod_1.z.strictObject({
    page: zod_1.z.number().int().min(exports.COMMS_PAGE_MIN).max(exports.COMMS_PAGE_MAX),
    pageSize: zod_1.z.number().int().min(exports.COMMS_PAGE_SIZE_MIN).max(exports.COMMS_PAGE_SIZE_MAX),
    pageCount: zod_1.z.number().int().min(0),
    total: zod_1.z.number().int().min(0),
});
/**
 * One issuance-ledger row. `kind` and `email` are NULLABLE because the
 * underlying columns are (`auth_email_requests.kind`/`.email` both permit
 * null); the app always writes them, but the contract mirrors the column
 * rather than the happy path, and the table renders a dash for a null.
 */
exports.emailLogRowSchema = zod_1.z.strictObject({
    kind: zod_1.z.string().max(KIND_MAX).nullable(),
    email: zod_1.z.string().max(EMAIL_MAX).nullable(),
    createdAt: timestampSchema,
});
exports.emailLogQuerySchema = zod_1.z.strictObject({
    page: zod_1.z.number().int().min(exports.COMMS_PAGE_MIN).max(exports.COMMS_PAGE_MAX).optional(),
    pageSize: zod_1.z.number().int().min(exports.COMMS_PAGE_SIZE_MIN).max(exports.COMMS_PAGE_SIZE_MAX).optional(),
});
exports.emailLogResponseSchema = zod_1.z.strictObject({
    data: zod_1.z.array(exports.emailLogRowSchema).max(exports.COMMS_PAGE_SIZE_MAX),
    meta: zod_1.z.strictObject({ pagination: exports.commsPaginationSchema }),
});
/**
 * A notification event from EVENT_META. `subject` is the key with underscores
 * swapped for spaces and `description` is a rendered sentence — both are
 * server-composed display strings, which is why neither is an enum.
 */
exports.commsTemplateRowSchema = zod_1.z.strictObject({
    key: zod_1.z.string().min(1).max(TEMPLATE_KEY_MAX),
    subject: zod_1.z.string().min(1).max(TEMPLATE_TEXT_MAX),
    description: zod_1.z.string().min(1).max(TEMPLATE_TEXT_MAX),
});
exports.commsTemplatesResponseSchema = zod_1.z.strictObject({
    data: zod_1.z.array(exports.commsTemplateRowSchema),
});
/** `dryRun` omitted means TRUE at the server. The client always sends it. */
exports.bulkEmailBodySchema = zod_1.z.strictObject({
    audience: zod_1.z.string().min(1).max(exports.COMMS_AUDIENCE_MAX),
    subject: zod_1.z.string().min(1).max(exports.COMMS_SUBJECT_MAX),
    body: zod_1.z.string().min(1).max(exports.COMMS_EMAIL_BODY_MAX),
    dryRun: zod_1.z.boolean().optional(),
});
/**
 * `recipients` is the TRUE blast radius (addresses resolved from the audience),
 * reported on a dry run too. A per-recipient failure is counted in `failed`,
 * never swallowed — so a partial send is visible as sent + failed.
 */
exports.bulkEmailResultSchema = zod_1.z.strictObject({
    audience: zod_1.z.string().min(1).max(exports.COMMS_AUDIENCE_MAX),
    recipients: zod_1.z.number().int().min(0),
    sent: zod_1.z.number().int().min(0),
    failed: zod_1.z.number().int().min(0),
    dryRun: zod_1.z.boolean(),
});
exports.bulkEmailResponseSchema = zod_1.z.strictObject({ data: exports.bulkEmailResultSchema });
exports.pushBroadcastBodySchema = zod_1.z.strictObject({
    audience: zod_1.z.string().min(1).max(exports.COMMS_AUDIENCE_MAX),
    title: zod_1.z.string().min(1).max(exports.COMMS_PUSH_TITLE_MAX),
    body: zod_1.z.string().min(1).max(exports.COMMS_PUSH_BODY_MAX),
    dryRun: zod_1.z.boolean().optional(),
});
/**
 * Push counts SUBSCRIPTIONS, not users: the audience resolves to users and the
 * server counts their registered push subscriptions, so the preview number is
 * devices reachable — deliberately a different number from the email
 * `recipients`, and the console must not label them the same.
 */
exports.pushBroadcastResultSchema = zod_1.z.strictObject({
    subscriptions: zod_1.z.number().int().min(0),
    sent: zod_1.z.number().int().min(0),
    failed: zod_1.z.number().int().min(0),
    dryRun: zod_1.z.boolean(),
});
exports.pushBroadcastResponseSchema = zod_1.z.strictObject({ data: exports.pushBroadcastResultSchema });
exports.COMMS_TEMPLATES_PATH = '/api/ops/comms/templates';
exports.COMMS_EMAIL_LOG_PATH = '/api/ops/comms/email-log';
exports.COMMS_BULK_EMAIL_PATH = '/api/ops/comms/bulk-email';
exports.COMMS_PUSH_BROADCAST_PATH = '/api/ops/comms/push-broadcast';
const emptyQuerySchema = zod_1.z.strictObject({});
exports.CommsTemplatesOperation = Object.freeze({
    contractId: 'C-OPSM-05',
    method: 'GET',
    path: exports.COMMS_TEMPLATES_PATH,
    request: emptyQuerySchema,
    response: exports.commsTemplatesResponseSchema,
    success: 200,
    errors: [401, 403, 429, 500],
});
exports.CommsEmailLogOperation = Object.freeze({
    contractId: 'C-OPSM-03',
    method: 'GET',
    path: exports.COMMS_EMAIL_LOG_PATH,
    request: exports.emailLogQuerySchema,
    response: exports.emailLogResponseSchema,
    success: 200,
    errors: [400, 401, 403, 429, 500],
});
exports.CommsBulkEmailOperation = Object.freeze({
    contractId: 'C-OPSM-01',
    method: 'POST',
    path: exports.COMMS_BULK_EMAIL_PATH,
    request: exports.bulkEmailBodySchema,
    response: exports.bulkEmailResponseSchema,
    success: 200,
    errors: [400, 401, 403, 429, 500],
});
exports.CommsPushBroadcastOperation = Object.freeze({
    contractId: 'C-OPSM-04',
    method: 'POST',
    path: exports.COMMS_PUSH_BROADCAST_PATH,
    request: exports.pushBroadcastBodySchema,
    response: exports.pushBroadcastResponseSchema,
    success: 200,
    errors: [400, 401, 403, 429, 500],
});
