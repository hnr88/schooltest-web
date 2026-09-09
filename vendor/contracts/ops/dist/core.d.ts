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
/** Strapi v5 identity. Never the legacy numeric id. */
export declare const documentIdSchema: z.ZodString;
export type DocumentId = z.infer<typeof documentIdSchema>;
export declare const accountStatusSchema: z.ZodEnum<{
    prospect: "prospect";
    invited: "invited";
    invoiced: "invoiced";
    active: "active";
    suspended: "suspended";
    closed: "closed";
}>;
export type AccountStatus = z.infer<typeof accountStatusSchema>;
export declare const onboardingStatusSchema: z.ZodEnum<{
    not_started: "not_started";
    link_sent: "link_sent";
    in_progress: "in_progress";
    submitted: "submitted";
    complete: "complete";
}>;
export type OnboardingStatus = z.infer<typeof onboardingStatusSchema>;
export declare const fieldIssueSchema: z.ZodObject<{
    path: z.ZodString;
    message: z.ZodString;
}, z.core.$strict>;
export type FieldIssue = z.infer<typeof fieldIssueSchema>;
export declare const errorEnvelopeSchema: z.ZodObject<{
    data: z.ZodNull;
    error: z.ZodObject<{
        status: z.ZodNumber;
        name: z.ZodString;
        message: z.ZodString;
        details: z.ZodObject<{
            code: z.ZodOptional<z.ZodString>;
            errors: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                message: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strip>;
    }, z.core.$strict>;
}, z.core.$strict>;
export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;
/**
 * Guards the rule the whole error contract rests on: the body's own status
 * field agrees with the HTTP status the transport reported.
 */
export declare function isErrorEnvelopeForStatus(value: unknown, httpStatus: number): boolean;
export declare function dataEnvelope<T extends z.ZodType>(inner: T): z.ZodObject<{
    data: T;
}, z.core.$strict>;
/** Alias kept so the existing onboarding call sites read unchanged. */
export declare const invitationEnvelope: typeof dataEnvelope;
export declare const OPS_PORTAL_VERSION_HEADER = "X-Ops-Portal-Version";
export declare const OPS_PORTAL_VERSION = "1";
export declare const opsPortalVersionSchema: z.ZodLiteral<"1">;
/**
 * C-SCH-04 (v2) request body — the Onboard School modal: First name, Last name,
 * Email address, all required. Strict, so a caller cannot smuggle
 * `account_status`, `token` or `school` through this route.
 */
export declare const onboardingInviteBodySchema: z.ZodObject<{
    first_name: z.ZodString;
    last_name: z.ZodString;
    contact_email: z.ZodPipe<z.ZodString, z.ZodEmail>;
}, z.core.$strict>;
export type OnboardingInviteBody = z.infer<typeof onboardingInviteBodySchema>;
/** C-SCH-05 / C-SCH-06 take no body — an empty object is the only valid payload. */
export declare const emptyInvitationBodySchema: z.ZodObject<{}, z.core.$strict>;
/** The stored primary admin contact, echoed on every link response. */
export declare const onboardingContactSchema: z.ZodObject<{
    first_name: z.ZodString;
    last_name: z.ZodString;
    email: z.ZodString;
}, z.core.$strict>;
export type OnboardingInvitationContact = z.infer<typeof onboardingContactSchema>;
/**
 * C-SCH-04 (v2) 201 / C-SCH-05 200 body. `expires_at` is ALWAYS null: the MVP
 * magic link is valid until it is used or revoked (D-39). The key is kept so the
 * shape does not silently change, and typed `null` so a reintroduced expiry
 * fails the parse instead of passing unnoticed.
 */
export declare const onboardingLinkResultSchema: z.ZodObject<{
    token: z.ZodString;
    url: z.ZodString;
    expires_at: z.ZodNull;
    contact: z.ZodObject<{
        first_name: z.ZodString;
        last_name: z.ZodString;
        email: z.ZodString;
    }, z.core.$strict>;
}, z.core.$strict>;
export type OnboardingLinkResult = z.infer<typeof onboardingLinkResultSchema>;
/**
 * C-SCH-06 200 body. `revoked_links` can legitimately be 0: revoke is gated on
 * the school's `onboarding_status`, not on a row count, so a school whose only
 * link already lapsed on the clock can still be reset to Prospect / Not started.
 */
export declare const revokeInvitationResultSchema: z.ZodObject<{
    documentId: z.ZodString;
    revoked_links: z.ZodNumber;
    account_status: z.ZodLiteral<"prospect">;
    onboarding_status: z.ZodLiteral<"not_started">;
}, z.core.$strict>;
export type RevokeInvitationResult = z.infer<typeof revokeInvitationResultSchema>;
/** C-SCH-07 200 body — exactly six keys, nothing else (no numeric id, no token). */
export declare const schoolInvitationStateSchema: z.ZodObject<{
    documentId: z.ZodString;
    account_status: z.ZodNullable<z.ZodString>;
    onboarding_status: z.ZodNullable<z.ZodString>;
    contact_first_name: z.ZodNullable<z.ZodString>;
    contact_last_name: z.ZodNullable<z.ZodString>;
    contact_email: z.ZodNullable<z.ZodString>;
}, z.core.$strict>;
export type SchoolInvitationState = z.infer<typeof schoolInvitationStateSchema>;
export interface OpsOperation<Req extends z.ZodType, Res extends z.ZodType> {
    readonly contractId: string;
    readonly method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    readonly path: string;
    readonly request: Req;
    readonly response: Res;
    readonly success: number;
    readonly errors: readonly number[];
}
/** C-OPS-PORTAL-011 — GET /api/schools/{documentId}/onboarding-invitation */
export declare const OnboardingReadOperation: OpsOperation<z.ZodObject<{}, z.core.$strict>, z.ZodObject<{
    data: z.ZodObject<{
        documentId: z.ZodString;
        account_status: z.ZodNullable<z.ZodString>;
        onboarding_status: z.ZodNullable<z.ZodString>;
        contact_first_name: z.ZodNullable<z.ZodString>;
        contact_last_name: z.ZodNullable<z.ZodString>;
        contact_email: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>;
}, z.core.$strict>>;
/** C-OPS-PORTAL-012 — POST /api/schools/{documentId}/onboarding-link */
export declare const OnboardingSendOperation: OpsOperation<z.ZodObject<{
    first_name: z.ZodString;
    last_name: z.ZodString;
    contact_email: z.ZodPipe<z.ZodString, z.ZodEmail>;
}, z.core.$strict>, z.ZodObject<{
    data: z.ZodObject<{
        token: z.ZodString;
        url: z.ZodString;
        expires_at: z.ZodNull;
        contact: z.ZodObject<{
            first_name: z.ZodString;
            last_name: z.ZodString;
            email: z.ZodString;
        }, z.core.$strict>;
    }, z.core.$strict>;
}, z.core.$strict>>;
