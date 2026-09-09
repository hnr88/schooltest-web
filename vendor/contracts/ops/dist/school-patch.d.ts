/**
 * OPS-014 — C-OPS-PORTAL-004 PATCH /api/schools/{documentId} (backlog task 10,
 * the versioned school EDIT behind the same profile contract as the create).
 *
 * Rules the module pins, from 10-school-form.md and contracts.openapi.json:
 *  - The body is a PARTIAL: omitted means unchanged, null clears a nullable
 *    field, `minProperties: 1` makes an empty patch a 400, and `name` (and the
 *    legacy `plan`) can never be null.
 *  - LIFECYCLE KEYS ARE REJECTED at the boundary: `account_status`,
 *    `onboarding_status` and `portal_status` move through task 12's lifecycle
 *    services (suspend/activate/archive), never through the profile form.
 *  - Versioned edits carry `If-Match` quoting the `updatedAt` the operator's
    * page actually loaded (parseResourceVersion/resourceVersionMatches from the
 *    school-suspend contract — ONE version rule, shared). Stale is 412 with
 *    the draft intact; no client-generated timestamps.
 *  - The response is the SAME SchoolWriteResult the create returns, with
 *    `onboarding_delivery: not_requested` for a pure edit.
 */
import { z } from 'zod';
import { type OpsOperation } from './core';
import { SCHOOL_SUSPEND_CODES, formatResourceVersion, parseResourceVersion, resourceVersionMatches } from './school-suspend';
export { SCHOOL_SUSPEND_CODES, formatResourceVersion, parseResourceVersion, resourceVersionMatches };
export declare const PATCH_REJECTED_LIFECYCLE_KEYS: readonly ["account_status", "onboarding_status", "portal_status"];
export type PatchRejectedLifecycleKey = (typeof PATCH_REJECTED_LIFECYCLE_KEYS)[number];
export declare const SCHOOL_PATCH_IF_MATCH_REQUIRED: "IF_MATCH_REQUIRED";
export declare const SCHOOL_PATCH_IF_MATCH_STALE: "IF_MATCH_STALE";
/** The partial profile body. Omitted = unchanged; null clears a nullable field. */
export declare const schoolPatchSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    suburb: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    state: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        VIC: "VIC";
        NSW: "NSW";
        QLD: "QLD";
        SA: "SA";
        WA: "WA";
        TAS: "TAS";
        ACT: "ACT";
        NT: "NT";
    }>>>;
    sector: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        government: "government";
        "non-government": "non-government";
        catholic: "catholic";
    }>>>;
    postcode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    schoolType: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        combined: "combined";
        primary: "primary";
        secondary: "secondary";
    }>>>;
    contact_email: z.ZodOptional<z.ZodNullable<z.ZodPipe<z.ZodString, z.ZodEmail>>>;
    contact_first_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    contact_last_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    plan: z.ZodOptional<z.ZodEnum<{
        trial: "trial";
        full_license: "full_license";
    }>>;
    portal_plan: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        pilot: "pilot";
        standard: "standard";
        enterprise: "enterprise";
    }>>>;
    contact_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strict>;
export type SchoolPatch = z.infer<typeof schoolPatchSchema>;
/** A lifecycle key arriving through the form patch is an explicit 409-boundary rejection. */
export declare function patchLifecycleKeys(input: Record<string, unknown>): PatchRejectedLifecycleKey[];
/** The response body: the SAME shape the create returns, with a pure edit's
 * delivery state pinned to 'not_requested' (the delivery OBJECT keeps its
 * full shape — the web renders the failed-delivery partial from it). */
export declare const schoolPatchResultSchema: z.ZodObject<{
    documentId: z.ZodString;
    name: z.ZodString;
    suburb: z.ZodNullable<z.ZodString>;
    state: z.ZodNullable<z.ZodEnum<{
        VIC: "VIC";
        NSW: "NSW";
        QLD: "QLD";
        SA: "SA";
        WA: "WA";
        TAS: "TAS";
        ACT: "ACT";
        NT: "NT";
    }>>;
    sector: z.ZodNullable<z.ZodEnum<{
        government: "government";
        "non-government": "non-government";
        catholic: "catholic";
    }>>;
    postcode: z.ZodNullable<z.ZodString>;
    schoolType: z.ZodNullable<z.ZodEnum<{
        combined: "combined";
        primary: "primary";
        secondary: "secondary";
    }>>;
    contact_email: z.ZodNullable<z.ZodPipe<z.ZodString, z.ZodEmail>>;
    contact_first_name: z.ZodNullable<z.ZodString>;
    contact_last_name: z.ZodNullable<z.ZodString>;
    phone: z.ZodNullable<z.ZodString>;
    account_status: z.ZodEnum<{
        prospect: "prospect";
        invited: "invited";
        invoiced: "invoiced";
        active: "active";
        suspended: "suspended";
        closed: "closed";
    }>;
    onboarding_status: z.ZodEnum<{
        not_started: "not_started";
        link_sent: "link_sent";
        in_progress: "in_progress";
        submitted: "submitted";
        complete: "complete";
    }>;
    plan: z.ZodEnum<{
        trial: "trial";
        full_license: "full_license";
    }>;
    createdAt: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
    portal_plan: z.ZodEnum<{
        pilot: "pilot";
        standard: "standard";
        enterprise: "enterprise";
    }>;
    portal_status: z.ZodEnum<{
        active: "active";
        suspended: "suspended";
        pending_setup: "pending_setup";
        archived: "archived";
        trial: "trial";
    }>;
    trial_ends_at: z.ZodNullable<z.ZodISODateTime>;
    retention_until: z.ZodNullable<z.ZodISODateTime>;
    billing_status: z.ZodEnum<{
        active: "active";
        not_started: "not_started";
        stopped: "stopped";
    }>;
    contact_name: z.ZodNullable<z.ZodString>;
    portal_teacher_count: z.ZodNumber;
    suspended_at: z.ZodNullable<z.ZodISODateTime>;
    onboarding_delivery: z.ZodObject<{
        invitation_documentId: z.ZodNullable<z.ZodString>;
        error: z.ZodNullable<z.ZodObject<{
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
        }, z.core.$strict>>;
        state: z.ZodLiteral<"not_requested">;
    }, z.core.$strict>;
}, z.core.$strict>;
export type SchoolPatchResult = z.infer<typeof schoolPatchResultSchema>;
export declare const schoolPatchResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        documentId: z.ZodString;
        name: z.ZodString;
        suburb: z.ZodNullable<z.ZodString>;
        state: z.ZodNullable<z.ZodEnum<{
            VIC: "VIC";
            NSW: "NSW";
            QLD: "QLD";
            SA: "SA";
            WA: "WA";
            TAS: "TAS";
            ACT: "ACT";
            NT: "NT";
        }>>;
        sector: z.ZodNullable<z.ZodEnum<{
            government: "government";
            "non-government": "non-government";
            catholic: "catholic";
        }>>;
        postcode: z.ZodNullable<z.ZodString>;
        schoolType: z.ZodNullable<z.ZodEnum<{
            combined: "combined";
            primary: "primary";
            secondary: "secondary";
        }>>;
        contact_email: z.ZodNullable<z.ZodPipe<z.ZodString, z.ZodEmail>>;
        contact_first_name: z.ZodNullable<z.ZodString>;
        contact_last_name: z.ZodNullable<z.ZodString>;
        phone: z.ZodNullable<z.ZodString>;
        account_status: z.ZodEnum<{
            prospect: "prospect";
            invited: "invited";
            invoiced: "invoiced";
            active: "active";
            suspended: "suspended";
            closed: "closed";
        }>;
        onboarding_status: z.ZodEnum<{
            not_started: "not_started";
            link_sent: "link_sent";
            in_progress: "in_progress";
            submitted: "submitted";
            complete: "complete";
        }>;
        plan: z.ZodEnum<{
            trial: "trial";
            full_license: "full_license";
        }>;
        createdAt: z.ZodISODateTime;
        updatedAt: z.ZodISODateTime;
        portal_plan: z.ZodEnum<{
            pilot: "pilot";
            standard: "standard";
            enterprise: "enterprise";
        }>;
        portal_status: z.ZodEnum<{
            active: "active";
            suspended: "suspended";
            pending_setup: "pending_setup";
            archived: "archived";
            trial: "trial";
        }>;
        trial_ends_at: z.ZodNullable<z.ZodISODateTime>;
        retention_until: z.ZodNullable<z.ZodISODateTime>;
        billing_status: z.ZodEnum<{
            active: "active";
            not_started: "not_started";
            stopped: "stopped";
        }>;
        contact_name: z.ZodNullable<z.ZodString>;
        portal_teacher_count: z.ZodNumber;
        suspended_at: z.ZodNullable<z.ZodISODateTime>;
        onboarding_delivery: z.ZodObject<{
            invitation_documentId: z.ZodNullable<z.ZodString>;
            error: z.ZodNullable<z.ZodObject<{
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
            }, z.core.$strict>>;
            state: z.ZodLiteral<"not_requested">;
        }, z.core.$strict>;
    }, z.core.$strict>;
}, z.core.$strict>;
export type SchoolPatchResponse = z.infer<typeof schoolPatchResponseSchema>;
/** Single place that builds the URL, so no call site hand-concatenates it. */
export declare function schoolPatchPath(schoolDocumentId: string): string;
/** C-OPS-PORTAL-004 — PATCH /api/schools/{documentId} (versioned, If-Match). */
export declare const SchoolPatchOperation: OpsOperation<typeof schoolPatchSchema, typeof schoolPatchResponseSchema>;
