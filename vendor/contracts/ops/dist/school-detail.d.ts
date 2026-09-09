/**
 * C-OPS-PORTAL-002 — GET /api/ops/schools/{documentId} (OPS-012), the single
 * school read behind the portal detail page.
 *
 * WHY IT EXISTS: OpsSchoolDetail currently calls the whole directory and finds
 * the documentId in memory, so a deep link pays for every school in the tenant
 * and a school outside the first page simply renders "not found". This is the
 * dedicated read.
 *
 * HONEST-SHAPE NOTE: the schema declares ONLY fields backed by a real column.
 * The portal lifecycle columns (portal_plan, portal_status, trial_ends_at,
 * retention_until, suspended_at, billing_status, contact_name, phone) LANDED
 * with OPS-002/OPS-013/OPS-017 and are now read from the row and emitted. They
 * are declared nullable here even though contracts.openapi.json declares
 * portal_plan/portal_status/billing_status non-nullable — see GAP-02-BACKFILL.
 * Three columns still do not exist (last_active_at, archived_at,
 * owner_documentId); they are recorded as GAPs and never invented.
 */
import { z } from 'zod';
import { type OpsOperation } from './core';
/**
 * GAP register for this operation. Each entry names the missing column and the
 * task that lands it, so nobody re-derives a value from an unrelated field.
 *
 * GAP-02-C  last_active_at   -> OPS-005  (declared, always null — AC-2)
 * GAP-02-D  archived_at      -> OPS-005  (withheld; see below)
 * GAP-02-J  owner_documentId -> OPS-014 ownership migration; "Make owner" is a
 *                               required action whose backing column does not
 *                               exist yet, so the field is withheld rather than
 *                               reported as "no owner", which would be a lie
 *                               about a legacy school that has one.
 *
 * GAP-02-BACKFILL — a DATA gap, not a column gap. OPS-002/OPS-017 added
 * portal_plan, portal_status and billing_status with no schema default and no
 * backfill migration, so every row created before them reads NULL. The declared
 * contract types are non-nullable. This module emits the STORED value and
 * widens the type to nullable rather than substituting a default, because
 * choosing one would be inventing a lifecycle status. The fix belongs to the
 * column owners: a backfill migration, or a contract amendment making the three
 * nullable. Consumers must handle null until then.
 */
export declare const SCHOOL_DETAIL_GAPS: readonly ["last_active_at"];
export type SchoolDetailGap = (typeof SCHOOL_DETAIL_GAPS)[number];
export declare const schoolDetailSchema: z.ZodObject<{
    documentId: z.ZodString;
    name: z.ZodNullable<z.ZodString>;
    account_status: z.ZodNullable<z.ZodEnum<{
        prospect: "prospect";
        invited: "invited";
        invoiced: "invoiced";
        active: "active";
        suspended: "suspended";
        closed: "closed";
    }>>;
    onboarding_status: z.ZodNullable<z.ZodEnum<{
        not_started: "not_started";
        link_sent: "link_sent";
        in_progress: "in_progress";
        submitted: "submitted";
        complete: "complete";
    }>>;
    plan: z.ZodNullable<z.ZodEnum<{
        trial: "trial";
        full_license: "full_license";
    }>>;
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
    billing_status: z.ZodNullable<z.ZodEnum<{
        active: "active";
        not_started: "not_started";
        stopped: "stopped";
    }>>;
    trial_ends_at: z.ZodNullable<z.ZodString>;
    retention_until: z.ZodNullable<z.ZodString>;
    suspended_at: z.ZodNullable<z.ZodString>;
    archived_at: z.ZodNullable<z.ZodString>;
    owner_documentId: z.ZodNullable<z.ZodString>;
    teacher_count: z.ZodNumber;
    portal_teacher_count: z.ZodNumber;
    admin_count: z.ZodNumber;
    class_count: z.ZodNumber;
    student_count: z.ZodNumber;
    results_count: z.ZodNumber;
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
    contact_email: z.ZodNullable<z.ZodString>;
    contact_first_name: z.ZodNullable<z.ZodString>;
    contact_last_name: z.ZodNullable<z.ZodString>;
    contact_name: z.ZodNullable<z.ZodString>;
    phone: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodNullable<z.ZodString>;
    updatedAt: z.ZodString;
    last_active_at: z.ZodNullable<z.ZodString>;
    cover_image_url: z.ZodNullable<z.ZodString>;
}, z.core.$strict>;
export type SchoolDetail = z.infer<typeof schoolDetailSchema>;
declare const schoolDetailDataSchema: z.ZodObject<{
    data: z.ZodObject<{
        documentId: z.ZodString;
        name: z.ZodNullable<z.ZodString>;
        account_status: z.ZodNullable<z.ZodEnum<{
            prospect: "prospect";
            invited: "invited";
            invoiced: "invoiced";
            active: "active";
            suspended: "suspended";
            closed: "closed";
        }>>;
        onboarding_status: z.ZodNullable<z.ZodEnum<{
            not_started: "not_started";
            link_sent: "link_sent";
            in_progress: "in_progress";
            submitted: "submitted";
            complete: "complete";
        }>>;
        plan: z.ZodNullable<z.ZodEnum<{
            trial: "trial";
            full_license: "full_license";
        }>>;
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
        billing_status: z.ZodNullable<z.ZodEnum<{
            active: "active";
            not_started: "not_started";
            stopped: "stopped";
        }>>;
        trial_ends_at: z.ZodNullable<z.ZodString>;
        retention_until: z.ZodNullable<z.ZodString>;
        suspended_at: z.ZodNullable<z.ZodString>;
        archived_at: z.ZodNullable<z.ZodString>;
        owner_documentId: z.ZodNullable<z.ZodString>;
        teacher_count: z.ZodNumber;
        portal_teacher_count: z.ZodNumber;
        admin_count: z.ZodNumber;
        class_count: z.ZodNumber;
        student_count: z.ZodNumber;
        results_count: z.ZodNumber;
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
        contact_email: z.ZodNullable<z.ZodString>;
        contact_first_name: z.ZodNullable<z.ZodString>;
        contact_last_name: z.ZodNullable<z.ZodString>;
        contact_name: z.ZodNullable<z.ZodString>;
        phone: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodNullable<z.ZodString>;
        updatedAt: z.ZodString;
        last_active_at: z.ZodNullable<z.ZodString>;
        cover_image_url: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>;
}, z.core.$strict>;
export declare const schoolDetailResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        documentId: z.ZodString;
        name: z.ZodNullable<z.ZodString>;
        account_status: z.ZodNullable<z.ZodEnum<{
            prospect: "prospect";
            invited: "invited";
            invoiced: "invoiced";
            active: "active";
            suspended: "suspended";
            closed: "closed";
        }>>;
        onboarding_status: z.ZodNullable<z.ZodEnum<{
            not_started: "not_started";
            link_sent: "link_sent";
            in_progress: "in_progress";
            submitted: "submitted";
            complete: "complete";
        }>>;
        plan: z.ZodNullable<z.ZodEnum<{
            trial: "trial";
            full_license: "full_license";
        }>>;
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
        billing_status: z.ZodNullable<z.ZodEnum<{
            active: "active";
            not_started: "not_started";
            stopped: "stopped";
        }>>;
        trial_ends_at: z.ZodNullable<z.ZodString>;
        retention_until: z.ZodNullable<z.ZodString>;
        suspended_at: z.ZodNullable<z.ZodString>;
        archived_at: z.ZodNullable<z.ZodString>;
        owner_documentId: z.ZodNullable<z.ZodString>;
        teacher_count: z.ZodNumber;
        portal_teacher_count: z.ZodNumber;
        admin_count: z.ZodNumber;
        class_count: z.ZodNumber;
        student_count: z.ZodNumber;
        results_count: z.ZodNumber;
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
        contact_email: z.ZodNullable<z.ZodString>;
        contact_first_name: z.ZodNullable<z.ZodString>;
        contact_last_name: z.ZodNullable<z.ZodString>;
        contact_name: z.ZodNullable<z.ZodString>;
        phone: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodNullable<z.ZodString>;
        updatedAt: z.ZodString;
        last_active_at: z.ZodNullable<z.ZodString>;
        cover_image_url: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>;
}, z.core.$strict>;
export type SchoolDetailResponse = z.infer<typeof schoolDetailResponseSchema>;
/** The operation takes no query or body — the path documentId is the whole request. */
export declare const schoolDetailRequestSchema: z.ZodObject<{}, z.core.$strict>;
export type SchoolDetailRequest = z.infer<typeof schoolDetailRequestSchema>;
/** Single place that builds the URL, so no call site hand-concatenates it. */
export declare function schoolDetailPath(schoolDocumentId: string): string;
export declare const SchoolDetailOperation: OpsOperation<typeof schoolDetailRequestSchema, typeof schoolDetailDataSchema>;
export {};
