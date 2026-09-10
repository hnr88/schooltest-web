/**
 * C-OPS-PORTAL-001 — GET /api/ops/schools (OPS-011), the versioned school
 * directory. Unversioned callers keep the legacy C-OPS-01 shape exactly
 * (9 fields, meta:{}, name-ascending, no filters); everything here applies
 * only when the request carries X-Ops-Portal-Version: 1.
 *
 * HONEST-SHAPE NOTE: the schema declares ONLY fields backed by real data.
 * portal_status, portal_plan and status_counts joined it additively with
 * backlog task 07, once the school columns landed. last_active_at,
 * trial_ends_at, retention_until, billing_status and contact_name remain
 * GAPs and are still never invented here.
 */
import { z } from 'zod';
import { type OpsOperation } from './core';
export declare const australianStateSchema: z.ZodEnum<{
    VIC: "VIC";
    NSW: "NSW";
    QLD: "QLD";
    SA: "SA";
    WA: "WA";
    TAS: "TAS";
    ACT: "ACT";
    NT: "NT";
}>;
export type AustralianState = z.infer<typeof australianStateSchema>;
export declare const sectorSchema: z.ZodEnum<{
    government: "government";
    "non-government": "non-government";
    catholic: "catholic";
}>;
export type Sector = z.infer<typeof sectorSchema>;
/** GAP-11 (column portal_plan -> OPS-002): declared, not yet served or filterable. */
export declare const portalPlanSchema: z.ZodEnum<{
    pilot: "pilot";
    standard: "standard";
    enterprise: "enterprise";
}>;
export type PortalPlan = z.infer<typeof portalPlanSchema>;
/** GAP-12 (derived portal_status needs portal_plan/OPS-002 + archived_at/OPS-005). */
export declare const portalStatusSchema: z.ZodEnum<{
    active: "active";
    suspended: "suspended";
    pending_setup: "pending_setup";
    archived: "archived";
    trial: "trial";
}>;
export type PortalStatus = z.infer<typeof portalStatusSchema>;
/**
 * The four sorts the design's dropdown offers (`Ops Portal.dc.html:104`):
 * Name A-Z, Most students, Recently active, Newest. GAP-15 is DISCHARGED —
 * `last_active_at` is a real column (OPS-005), so the designed
 * `last_active_at:desc` sort is served rather than withheld.
 *
 * Added as a fourth ENUM MEMBER, so every previously valid `sort` value stays
 * valid and a caller that omits `sort` is unaffected.
 */
export declare const schoolsListSortSchema: z.ZodEnum<{
    "name:asc": "name:asc";
    "student_count:desc": "student_count:desc";
    "createdAt:desc": "createdAt:desc";
    "last_active_at:desc": "last_active_at:desc";
}>;
export type SchoolsListSort = z.infer<typeof schoolsListSortSchema>;
export declare const schoolsListQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    pageSize: z.ZodOptional<z.ZodNumber>;
    q: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodEnum<{
        VIC: "VIC";
        NSW: "NSW";
        QLD: "QLD";
        SA: "SA";
        WA: "WA";
        TAS: "TAS";
        ACT: "ACT";
        NT: "NT";
    }>>;
    sector: z.ZodOptional<z.ZodEnum<{
        government: "government";
        "non-government": "non-government";
        catholic: "catholic";
    }>>;
    onboarding: z.ZodOptional<z.ZodEnum<{
        not_started: "not_started";
        link_sent: "link_sent";
        in_progress: "in_progress";
        submitted: "submitted";
        complete: "complete";
    }>>;
    status: z.ZodOptional<z.ZodEnum<{
        active: "active";
        suspended: "suspended";
        pending_setup: "pending_setup";
        archived: "archived";
        trial: "trial";
    }>>;
    plan: z.ZodOptional<z.ZodEnum<{
        pilot: "pilot";
        standard: "standard";
        enterprise: "enterprise";
    }>>;
    sort: z.ZodOptional<z.ZodEnum<{
        "name:asc": "name:asc";
        "student_count:desc": "student_count:desc";
        "createdAt:desc": "createdAt:desc";
        "last_active_at:desc": "last_active_at:desc";
    }>>;
}, z.core.$strict>;
export type SchoolsListQuery = z.infer<typeof schoolsListQuerySchema>;
export declare const schoolsListPaginationSchema: z.ZodObject<{
    page: z.ZodNumber;
    pageSize: z.ZodNumber;
    pageCount: z.ZodNumber;
    total: z.ZodNumber;
}, z.core.$strict>;
export type SchoolsListPagination = z.infer<typeof schoolsListPaginationSchema>;
export declare const schoolsListRowSchema: z.ZodObject<{
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
    portal_status: z.ZodEnum<{
        active: "active";
        suspended: "suspended";
        pending_setup: "pending_setup";
        archived: "archived";
        trial: "trial";
    }>;
    portal_plan: z.ZodEnum<{
        pilot: "pilot";
        standard: "standard";
        enterprise: "enterprise";
    }>;
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
    createdAt: z.ZodNullable<z.ZodString>;
    updatedAt: z.ZodString;
    last_active_at: z.ZodNullable<z.ZodISODateTime>;
    cover_image_url: z.ZodNullable<z.ZodString>;
}, z.core.$strict>;
export type SchoolsListRow = z.infer<typeof schoolsListRowSchema>;
/**
 * The pill bar's counts. They apply q/state/sector/plan/onboarding but NOT
 * `status`, so selecting a pill never changes the other pills' numbers, and
 * they cover the WHOLE filtered dataset rather than the loaded page.
 */
export declare const schoolsListStatusCountsSchema: z.ZodObject<{
    all: z.ZodNumber;
    active: z.ZodNumber;
    trial: z.ZodNumber;
    pending_setup: z.ZodNumber;
    suspended: z.ZodNumber;
    archived: z.ZodNumber;
}, z.core.$strict>;
export type SchoolsListStatusCounts = z.infer<typeof schoolsListStatusCountsSchema>;
export declare const schoolsListResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
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
        portal_status: z.ZodEnum<{
            active: "active";
            suspended: "suspended";
            pending_setup: "pending_setup";
            archived: "archived";
            trial: "trial";
        }>;
        portal_plan: z.ZodEnum<{
            pilot: "pilot";
            standard: "standard";
            enterprise: "enterprise";
        }>;
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
        createdAt: z.ZodNullable<z.ZodString>;
        updatedAt: z.ZodString;
        last_active_at: z.ZodNullable<z.ZodISODateTime>;
        cover_image_url: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>>;
    meta: z.ZodObject<{
        pagination: z.ZodObject<{
            page: z.ZodNumber;
            pageSize: z.ZodNumber;
            pageCount: z.ZodNumber;
            total: z.ZodNumber;
        }, z.core.$strict>;
        status_counts: z.ZodObject<{
            all: z.ZodNumber;
            active: z.ZodNumber;
            trial: z.ZodNumber;
            pending_setup: z.ZodNumber;
            suspended: z.ZodNumber;
            archived: z.ZodNumber;
        }, z.core.$strict>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type SchoolsListResponse = z.infer<typeof schoolsListResponseSchema>;
declare const schoolsListDataSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
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
        portal_status: z.ZodEnum<{
            active: "active";
            suspended: "suspended";
            pending_setup: "pending_setup";
            archived: "archived";
            trial: "trial";
        }>;
        portal_plan: z.ZodEnum<{
            pilot: "pilot";
            standard: "standard";
            enterprise: "enterprise";
        }>;
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
        createdAt: z.ZodNullable<z.ZodString>;
        updatedAt: z.ZodString;
        last_active_at: z.ZodNullable<z.ZodISODateTime>;
        cover_image_url: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>>;
}, z.core.$strict>;
export declare const SchoolsListOperation: OpsOperation<typeof schoolsListQuerySchema, typeof schoolsListDataSchema>;
export {};
