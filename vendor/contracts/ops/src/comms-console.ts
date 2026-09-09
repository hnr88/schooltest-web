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

const EMAIL_MAX = 255;
const KIND_MAX = 255;
const TEMPLATE_KEY_MAX = 100;
const TEMPLATE_TEXT_MAX = 255;

/** The controller's own `requireText` ceilings, field for field. */
export const COMMS_AUDIENCE_MAX = 120;
export const COMMS_SUBJECT_MAX = 200;
export const COMMS_EMAIL_BODY_MAX = 20_000;
export const COMMS_PUSH_TITLE_MAX = 120;
export const COMMS_PUSH_BODY_MAX = 500;

export const COMMS_PAGE_MIN = 1;
export const COMMS_PAGE_MAX = 100_000;
export const COMMS_PAGE_SIZE_MIN = 1;
export const COMMS_PAGE_SIZE_MAX = 200;
export const COMMS_PAGE_SIZE_DEFAULT = 25;

/**
 * The audiences the service resolves to a real `where` clause. `school:<documentId>`
 * is also accepted; anything else is a 400 naming this list, so the console
 * offers exactly these and never free-types an audience.
 */
export const BULK_AUDIENCES = ['all', 'ops', 'school_admins', 'teachers', 'parents'] as const;
export type BulkAudience = (typeof BULK_AUDIENCES)[number];
export const bulkAudienceSchema = z.enum(BULK_AUDIENCES);

const timestampSchema = z.iso.datetime({ offset: true });

export const commsPaginationSchema = z.strictObject({
  page: z.number().int().min(COMMS_PAGE_MIN).max(COMMS_PAGE_MAX),
  pageSize: z.number().int().min(COMMS_PAGE_SIZE_MIN).max(COMMS_PAGE_SIZE_MAX),
  pageCount: z.number().int().min(0),
  total: z.number().int().min(0),
});
export type CommsPagination = z.infer<typeof commsPaginationSchema>;

/**
 * One issuance-ledger row. `kind` and `email` are NULLABLE because the
 * underlying columns are (`auth_email_requests.kind`/`.email` both permit
 * null); the app always writes them, but the contract mirrors the column
 * rather than the happy path, and the table renders a dash for a null.
 */
export const emailLogRowSchema = z.strictObject({
  kind: z.string().max(KIND_MAX).nullable(),
  email: z.string().max(EMAIL_MAX).nullable(),
  createdAt: timestampSchema,
});
export type EmailLogRow = z.infer<typeof emailLogRowSchema>;

export const emailLogQuerySchema = z.strictObject({
  page: z.number().int().min(COMMS_PAGE_MIN).max(COMMS_PAGE_MAX).optional(),
  pageSize: z.number().int().min(COMMS_PAGE_SIZE_MIN).max(COMMS_PAGE_SIZE_MAX).optional(),
});
export type EmailLogQuery = z.infer<typeof emailLogQuerySchema>;

export const emailLogResponseSchema = z.strictObject({
  data: z.array(emailLogRowSchema).max(COMMS_PAGE_SIZE_MAX),
  meta: z.strictObject({ pagination: commsPaginationSchema }),
});
export type EmailLogResponse = z.infer<typeof emailLogResponseSchema>;

/**
 * A notification event from EVENT_META. `subject` is the key with underscores
 * swapped for spaces and `description` is a rendered sentence — both are
 * server-composed display strings, which is why neither is an enum.
 */
export const commsTemplateRowSchema = z.strictObject({
  key: z.string().min(1).max(TEMPLATE_KEY_MAX),
  subject: z.string().min(1).max(TEMPLATE_TEXT_MAX),
  description: z.string().min(1).max(TEMPLATE_TEXT_MAX),
});
export type CommsTemplateRow = z.infer<typeof commsTemplateRowSchema>;

export const commsTemplatesResponseSchema = z.strictObject({
  data: z.array(commsTemplateRowSchema),
});
export type CommsTemplatesResponse = z.infer<typeof commsTemplatesResponseSchema>;

/** `dryRun` omitted means TRUE at the server. The client always sends it. */
export const bulkEmailBodySchema = z.strictObject({
  audience: z.string().min(1).max(COMMS_AUDIENCE_MAX),
  subject: z.string().min(1).max(COMMS_SUBJECT_MAX),
  body: z.string().min(1).max(COMMS_EMAIL_BODY_MAX),
  dryRun: z.boolean().optional(),
});
export type BulkEmailBody = z.infer<typeof bulkEmailBodySchema>;

/**
 * `recipients` is the TRUE blast radius (addresses resolved from the audience),
 * reported on a dry run too. A per-recipient failure is counted in `failed`,
 * never swallowed — so a partial send is visible as sent + failed.
 */
export const bulkEmailResultSchema = z.strictObject({
  audience: z.string().min(1).max(COMMS_AUDIENCE_MAX),
  recipients: z.number().int().min(0),
  sent: z.number().int().min(0),
  failed: z.number().int().min(0),
  dryRun: z.boolean(),
});
export type BulkEmailResult = z.infer<typeof bulkEmailResultSchema>;

export const bulkEmailResponseSchema = z.strictObject({ data: bulkEmailResultSchema });
export type BulkEmailResponse = z.infer<typeof bulkEmailResponseSchema>;

export const pushBroadcastBodySchema = z.strictObject({
  audience: z.string().min(1).max(COMMS_AUDIENCE_MAX),
  title: z.string().min(1).max(COMMS_PUSH_TITLE_MAX),
  body: z.string().min(1).max(COMMS_PUSH_BODY_MAX),
  dryRun: z.boolean().optional(),
});
export type PushBroadcastBody = z.infer<typeof pushBroadcastBodySchema>;

/**
 * Push counts SUBSCRIPTIONS, not users: the audience resolves to users and the
 * server counts their registered push subscriptions, so the preview number is
 * devices reachable — deliberately a different number from the email
 * `recipients`, and the console must not label them the same.
 */
export const pushBroadcastResultSchema = z.strictObject({
  subscriptions: z.number().int().min(0),
  sent: z.number().int().min(0),
  failed: z.number().int().min(0),
  dryRun: z.boolean(),
});
export type PushBroadcastResult = z.infer<typeof pushBroadcastResultSchema>;

export const pushBroadcastResponseSchema = z.strictObject({ data: pushBroadcastResultSchema });
export type PushBroadcastResponse = z.infer<typeof pushBroadcastResponseSchema>;

export const COMMS_TEMPLATES_PATH = '/api/ops/comms/templates';
export const COMMS_EMAIL_LOG_PATH = '/api/ops/comms/email-log';
export const COMMS_BULK_EMAIL_PATH = '/api/ops/comms/bulk-email';
export const COMMS_PUSH_BROADCAST_PATH = '/api/ops/comms/push-broadcast';

const emptyQuerySchema = z.strictObject({});

export const CommsTemplatesOperation: OpsOperation<
  typeof emptyQuerySchema,
  typeof commsTemplatesResponseSchema
> = Object.freeze({
  contractId: 'C-OPSM-05',
  method: 'GET',
  path: COMMS_TEMPLATES_PATH,
  request: emptyQuerySchema,
  response: commsTemplatesResponseSchema,
  success: 200,
  errors: [401, 403, 429, 500],
});

export const CommsEmailLogOperation: OpsOperation<
  typeof emailLogQuerySchema,
  typeof emailLogResponseSchema
> = Object.freeze({
  contractId: 'C-OPSM-03',
  method: 'GET',
  path: COMMS_EMAIL_LOG_PATH,
  request: emailLogQuerySchema,
  response: emailLogResponseSchema,
  success: 200,
  errors: [400, 401, 403, 429, 500],
});

export const CommsBulkEmailOperation: OpsOperation<
  typeof bulkEmailBodySchema,
  typeof bulkEmailResponseSchema
> = Object.freeze({
  contractId: 'C-OPSM-01',
  method: 'POST',
  path: COMMS_BULK_EMAIL_PATH,
  request: bulkEmailBodySchema,
  response: bulkEmailResponseSchema,
  success: 200,
  errors: [400, 401, 403, 429, 500],
});

export const CommsPushBroadcastOperation: OpsOperation<
  typeof pushBroadcastBodySchema,
  typeof pushBroadcastResponseSchema
> = Object.freeze({
  contractId: 'C-OPSM-04',
  method: 'POST',
  path: COMMS_PUSH_BROADCAST_PATH,
  request: pushBroadcastBodySchema,
  response: pushBroadcastResponseSchema,
  success: 200,
  errors: [400, 401, 403, 429, 500],
});
