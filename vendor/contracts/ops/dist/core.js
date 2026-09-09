"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingSendOperation = exports.OnboardingReadOperation = exports.schoolInvitationStateSchema = exports.revokeInvitationResultSchema = exports.onboardingLinkResultSchema = exports.onboardingContactSchema = exports.emptyInvitationBodySchema = exports.onboardingInviteBodySchema = exports.opsPortalVersionSchema = exports.OPS_PORTAL_VERSION = exports.OPS_PORTAL_VERSION_HEADER = exports.invitationEnvelope = exports.errorEnvelopeSchema = exports.fieldIssueSchema = exports.onboardingStatusSchema = exports.accountStatusSchema = exports.documentIdSchema = void 0;
exports.isErrorEnvelopeForStatus = isErrorEnvelopeForStatus;
exports.dataEnvelope = dataEnvelope;
/**
 * @schooltest/ops-contracts — OPS-006.
 *
 * ONE portable contract source imported by BOTH schooltest-api and
 * schooltest-web, so a request/response shape cannot drift between them.
 * Pure TypeScript + Zod: nothing here may import Strapi, Next, node:fs or any
 * other server-only module, because this file is bundled into the browser.
 *
 * Every object is STRICT: a key the contract never promised fails the parse
 * rather than being silently accepted on the way in or leaked on the way out.
 *
 * The plan OpenAPI (mvp/tasks/ops/contracts.openapi.json) is reviewed DESIGN
 * INPUT, not proof of deployed behaviour — its own info.description says so.
 * Each endpoint owner implements its runtime schema, server and web consumer in
 * the same task and re-exports the symbol from here.
 */
const zod_1 = require("zod");
/* ------------------------------------------------------------------ *
 * Primitives shared by every operation
 * ------------------------------------------------------------------ */
const DOCUMENT_ID_MAX = 64;
const NAME_MAX = 100;
const EMAIL_MAX = 255;
const ERROR_NAME_MAX = 100;
const ERROR_MESSAGE_MAX = 1000;
const ERROR_CODE_MAX = 100;
const FIELD_PATH_MAX = 255;
const FIELD_MESSAGE_MAX = 600;
const FIELD_ISSUE_MAX = 100;
/** Strapi v5 identity. Never the legacy numeric id. */
exports.documentIdSchema = zod_1.z
    .string()
    .min(1)
    .max(DOCUMENT_ID_MAX)
    .regex(/^[A-Za-z0-9_-]+$/);
exports.accountStatusSchema = zod_1.z.enum([
    'prospect',
    'invited',
    'invoiced',
    'active',
    'suspended',
    'closed',
]);
exports.onboardingStatusSchema = zod_1.z.enum([
    'not_started',
    'link_sent',
    'in_progress',
    'submitted',
    'complete',
]);
/* ------------------------------------------------------------------ *
 * Error envelope — identical for every operation.
 * `error.status` MUST equal the HTTP status (contract-rules.md).
 * ------------------------------------------------------------------ */
exports.fieldIssueSchema = zod_1.z.strictObject({
    path: zod_1.z.string().min(1).max(FIELD_PATH_MAX),
    message: zod_1.z.string().min(1).max(FIELD_MESSAGE_MAX),
});
exports.errorEnvelopeSchema = zod_1.z.strictObject({
    data: zod_1.z.null(),
    error: zod_1.z.strictObject({
        status: zod_1.z.number().int().min(400).max(599),
        name: zod_1.z.string().min(1).max(ERROR_NAME_MAX),
        message: zod_1.z.string().min(1).max(ERROR_MESSAGE_MAX),
        details: zod_1.z.object({
            code: zod_1.z.string().min(1).max(ERROR_CODE_MAX).optional(),
            errors: zod_1.z.array(exports.fieldIssueSchema).max(FIELD_ISSUE_MAX).optional(),
        }),
    }),
});
/**
 * Guards the rule the whole error contract rests on: the body's own status
 * field agrees with the HTTP status the transport reported.
 */
function isErrorEnvelopeForStatus(value, httpStatus) {
    const parsed = exports.errorEnvelopeSchema.safeParse(value);
    return parsed.success && parsed.data.error.status === httpStatus;
}
/* ------------------------------------------------------------------ *
 * Success envelope — `{ data: <body> }`, the shape every operation returns.
 * ------------------------------------------------------------------ */
function dataEnvelope(inner) {
    return zod_1.z.strictObject({ data: inner });
}
/** Alias kept so the existing onboarding call sites read unchanged. */
exports.invitationEnvelope = dataEnvelope;
/* ------------------------------------------------------------------ *
 * Portal version negotiation (D-COMPAT).
 * A caller that omits the header keeps the legacy contract untouched; the
 * header conveys NO permission of any kind.
 * ------------------------------------------------------------------ */
exports.OPS_PORTAL_VERSION_HEADER = 'X-Ops-Portal-Version';
exports.OPS_PORTAL_VERSION = '1';
exports.opsPortalVersionSchema = zod_1.z.literal(exports.OPS_PORTAL_VERSION);
/* ------------------------------------------------------------------ *
 * Onboarding invitation — C-SCH-04/05/06/07, moved here UNCHANGED from
 * schooltest-api/src/contracts/school-onboarding-invitation.ts so both sides
 * import one definition instead of two hand-maintained copies.
 * ------------------------------------------------------------------ */
/**
 * C-SCH-04 (v2) request body — the Onboard School modal: First name, Last name,
 * Email address, all required. Strict, so a caller cannot smuggle
 * `account_status`, `token` or `school` through this route.
 */
exports.onboardingInviteBodySchema = zod_1.z.strictObject({
    first_name: zod_1.z.string().trim().min(1).max(NAME_MAX),
    last_name: zod_1.z.string().trim().min(1).max(NAME_MAX),
    // Trimmed like the two names, so a padded address is accepted rather than 400'd.
    contact_email: zod_1.z.string().trim().max(EMAIL_MAX).pipe(zod_1.z.email()),
});
/** C-SCH-05 / C-SCH-06 take no body — an empty object is the only valid payload. */
exports.emptyInvitationBodySchema = zod_1.z.strictObject({});
/** The stored primary admin contact, echoed on every link response. */
exports.onboardingContactSchema = zod_1.z.strictObject({
    first_name: zod_1.z.string(),
    last_name: zod_1.z.string(),
    email: zod_1.z.string(),
});
/**
 * C-SCH-04 (v2) 201 / C-SCH-05 200 body. `expires_at` is ALWAYS null: the MVP
 * magic link is valid until it is used or revoked (D-39). The key is kept so the
 * shape does not silently change, and typed `null` so a reintroduced expiry
 * fails the parse instead of passing unnoticed.
 */
exports.onboardingLinkResultSchema = zod_1.z.strictObject({
    token: zod_1.z.string().regex(/^[0-9a-f]{64}$/),
    url: zod_1.z.string(),
    expires_at: zod_1.z.null(),
    contact: exports.onboardingContactSchema,
});
/**
 * C-SCH-06 200 body. `revoked_links` can legitimately be 0: revoke is gated on
 * the school's `onboarding_status`, not on a row count, so a school whose only
 * link already lapsed on the clock can still be reset to Prospect / Not started.
 */
exports.revokeInvitationResultSchema = zod_1.z.strictObject({
    documentId: zod_1.z.string(),
    revoked_links: zod_1.z.number().int().min(0),
    account_status: zod_1.z.literal('prospect'),
    onboarding_status: zod_1.z.literal('not_started'),
});
/** C-SCH-07 200 body — exactly six keys, nothing else (no numeric id, no token). */
exports.schoolInvitationStateSchema = zod_1.z.strictObject({
    documentId: zod_1.z.string(),
    account_status: zod_1.z.string().nullable(),
    onboarding_status: zod_1.z.string().nullable(),
    contact_first_name: zod_1.z.string().nullable(),
    contact_last_name: zod_1.z.string().nullable(),
    contact_email: zod_1.z.string().nullable(),
});
function operation(op) {
    return Object.freeze(op);
}
/** C-OPS-PORTAL-011 — GET /api/schools/{documentId}/onboarding-invitation */
exports.OnboardingReadOperation = operation({
    contractId: 'C-OPS-PORTAL-011',
    method: 'GET',
    path: '/api/schools/{documentId}/onboarding-invitation',
    request: exports.emptyInvitationBodySchema,
    response: dataEnvelope(exports.schoolInvitationStateSchema),
    success: 200,
    errors: [400, 401, 403, 404, 429, 500],
});
/** C-OPS-PORTAL-012 — POST /api/schools/{documentId}/onboarding-link */
exports.OnboardingSendOperation = operation({
    contractId: 'C-OPS-PORTAL-012',
    method: 'POST',
    path: '/api/schools/{documentId}/onboarding-link',
    request: exports.onboardingInviteBodySchema,
    response: dataEnvelope(exports.onboardingLinkResultSchema),
    success: 201,
    errors: [400, 401, 403, 404, 409, 429, 500, 502],
});
// OPS-007 REST boundary — kept last: this module reads this file's earlier
// exports, and the CommonJS build resolves the cycle only when the re-export
// follows them.
