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
import { z } from 'zod';

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
export const documentIdSchema = z
  .string()
  .min(1)
  .max(DOCUMENT_ID_MAX)
  .regex(/^[A-Za-z0-9_-]+$/);
export type DocumentId = z.infer<typeof documentIdSchema>;

export const accountStatusSchema = z.enum([
  'prospect',
  'invited',
  'invoiced',
  'active',
  'suspended',
  'closed',
]);
export type AccountStatus = z.infer<typeof accountStatusSchema>;

export const onboardingStatusSchema = z.enum([
  'not_started',
  'link_sent',
  'in_progress',
  'submitted',
  'complete',
]);
export type OnboardingStatus = z.infer<typeof onboardingStatusSchema>;

/* ------------------------------------------------------------------ *
 * Error envelope — identical for every operation.
 * `error.status` MUST equal the HTTP status (contract-rules.md).
 * ------------------------------------------------------------------ */

export const fieldIssueSchema = z.strictObject({
  path: z.string().min(1).max(FIELD_PATH_MAX),
  message: z.string().min(1).max(FIELD_MESSAGE_MAX),
});
export type FieldIssue = z.infer<typeof fieldIssueSchema>;

export const errorEnvelopeSchema = z.strictObject({
  data: z.null(),
  error: z.strictObject({
    status: z.number().int().min(400).max(599),
    name: z.string().min(1).max(ERROR_NAME_MAX),
    message: z.string().min(1).max(ERROR_MESSAGE_MAX),
    details: z.object({
      code: z.string().min(1).max(ERROR_CODE_MAX).optional(),
      errors: z.array(fieldIssueSchema).max(FIELD_ISSUE_MAX).optional(),
    }),
  }),
});
export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;

/**
 * Guards the rule the whole error contract rests on: the body's own status
 * field agrees with the HTTP status the transport reported.
 */
export function isErrorEnvelopeForStatus(value: unknown, httpStatus: number): boolean {
  const parsed = errorEnvelopeSchema.safeParse(value);
  return parsed.success && parsed.data.error.status === httpStatus;
}

/* ------------------------------------------------------------------ *
 * Success envelope — `{ data: <body> }`, the shape every operation returns.
 * ------------------------------------------------------------------ */

export function dataEnvelope<T extends z.ZodType>(inner: T) {
  return z.strictObject({ data: inner });
}

/** Alias kept so the existing onboarding call sites read unchanged. */
export const invitationEnvelope = dataEnvelope;

/* ------------------------------------------------------------------ *
 * Portal version negotiation (D-COMPAT).
 * A caller that omits the header keeps the legacy contract untouched; the
 * header conveys NO permission of any kind.
 * ------------------------------------------------------------------ */

export const OPS_PORTAL_VERSION_HEADER = 'X-Ops-Portal-Version';
export const OPS_PORTAL_VERSION = '1';
export const opsPortalVersionSchema = z.literal(OPS_PORTAL_VERSION);

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
export const onboardingInviteBodySchema = z.strictObject({
  first_name: z.string().trim().min(1).max(NAME_MAX),
  last_name: z.string().trim().min(1).max(NAME_MAX),
  // Trimmed like the two names, so a padded address is accepted rather than 400'd.
  contact_email: z.string().trim().max(EMAIL_MAX).pipe(z.email()),
});
export type OnboardingInviteBody = z.infer<typeof onboardingInviteBodySchema>;

/** C-SCH-05 / C-SCH-06 take no body — an empty object is the only valid payload. */
export const emptyInvitationBodySchema = z.strictObject({});

/** The stored primary admin contact, echoed on every link response. */
export const onboardingContactSchema = z.strictObject({
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
});
export type OnboardingInvitationContact = z.infer<typeof onboardingContactSchema>;

/**
 * C-SCH-04 (v2) 201 / C-SCH-05 200 body. `expires_at` is ALWAYS null: the MVP
 * magic link is valid until it is used or revoked (D-39). The key is kept so the
 * shape does not silently change, and typed `null` so a reintroduced expiry
 * fails the parse instead of passing unnoticed.
 */
export const onboardingLinkResultSchema = z.strictObject({
  token: z.string().regex(/^[0-9a-f]{64}$/),
  url: z.string(),
  expires_at: z.null(),
  contact: onboardingContactSchema,
});
export type OnboardingLinkResult = z.infer<typeof onboardingLinkResultSchema>;

/**
 * C-SCH-06 200 body. `revoked_links` can legitimately be 0: revoke is gated on
 * the school's `onboarding_status`, not on a row count, so a school whose only
 * link already lapsed on the clock can still be reset to Prospect / Not started.
 */
export const revokeInvitationResultSchema = z.strictObject({
  documentId: z.string(),
  revoked_links: z.number().int().min(0),
  account_status: z.literal('prospect'),
  onboarding_status: z.literal('not_started'),
});
export type RevokeInvitationResult = z.infer<typeof revokeInvitationResultSchema>;

/** C-SCH-07 200 body — exactly six keys, nothing else (no numeric id, no token). */
export const schoolInvitationStateSchema = z.strictObject({
  documentId: z.string(),
  account_status: z.string().nullable(),
  onboarding_status: z.string().nullable(),
  contact_first_name: z.string().nullable(),
  contact_last_name: z.string().nullable(),
  contact_email: z.string().nullable(),
});
export type SchoolInvitationState = z.infer<typeof schoolInvitationStateSchema>;

/* ------------------------------------------------------------------ *
 * Named operations. An operation binds its request and response shapes and its
 * exact status codes together, so a test can assert the whole contract from one
 * symbol instead of restating the codes by hand.
 * ------------------------------------------------------------------ */

export interface OpsOperation<Req extends z.ZodType, Res extends z.ZodType> {
  readonly contractId: string;
  readonly method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly path: string;
  readonly request: Req;
  readonly response: Res;
  readonly success: number;
  readonly errors: readonly number[];
}

function operation<Req extends z.ZodType, Res extends z.ZodType>(
  op: OpsOperation<Req, Res>,
): OpsOperation<Req, Res> {
  return Object.freeze(op);
}

/** C-OPS-PORTAL-011 — GET /api/schools/{documentId}/onboarding-invitation */
export const OnboardingReadOperation = operation({
  contractId: 'C-OPS-PORTAL-011',
  method: 'GET',
  path: '/api/schools/{documentId}/onboarding-invitation',
  request: emptyInvitationBodySchema,
  response: dataEnvelope(schoolInvitationStateSchema),
  success: 200,
  errors: [400, 401, 403, 404, 429, 500],
});

/** C-OPS-PORTAL-012 — POST /api/schools/{documentId}/onboarding-link */
export const OnboardingSendOperation = operation({
  contractId: 'C-OPS-PORTAL-012',
  method: 'POST',
  path: '/api/schools/{documentId}/onboarding-link',
  request: onboardingInviteBodySchema,
  response: dataEnvelope(onboardingLinkResultSchema),
  success: 201,
  errors: [400, 401, 403, 404, 409, 429, 500, 502],
});

// OPS-007 REST boundary — kept last: this module reads this file's earlier
// exports, and the CommonJS build resolves the cycle only when the re-export
// follows them.
