/**
 * OPS-020 — C-OPS-PORTAL-010 `GET /api/ops/audit-logs`.
 *
 * ONE definition of the school-scoped recent-activity read, imported by the
 * Strapi projection, the typed web query and both HTTP suites.
 *
 * The row is a SAFE DISPLAY PROJECTION of an audit-log row, not the ledger
 * row itself: `summary` is built server-side from an allowlist of actions and
 * `detail` keys, so an invitation token, a CSV body or a reset link can never
 * reach the overview card even when the stored detail carries one. `actor` is
 * the acting staff member's name reference — never their email, never a token.
 */
import { z } from 'zod';
import { type OpsOperation } from './core';
export declare const SCHOOL_ACTIVITY_PAGE_MIN = 1;
export declare const SCHOOL_ACTIVITY_PAGE_MAX = 100000;
export declare const SCHOOL_ACTIVITY_PAGE_SIZE_MIN = 1;
export declare const SCHOOL_ACTIVITY_PAGE_SIZE_MAX = 200;
export declare const schoolActivityPaginationSchema: z.ZodObject<{
    page: z.ZodNumber;
    pageSize: z.ZodNumber;
    pageCount: z.ZodNumber;
    total: z.ZodNumber;
}, z.core.$strict>;
export type SchoolActivityPagination = z.infer<typeof schoolActivityPaginationSchema>;
/** The acting staff member, by name reference only — no email, no role. */
export declare const activityActorSchema: z.ZodObject<{
    documentId: z.ZodString;
    first_name: z.ZodNullable<z.ZodString>;
    last_name: z.ZodNullable<z.ZodString>;
}, z.core.$strict>;
export type ActivityActor = z.infer<typeof activityActorSchema>;
export declare const activityRowSchema: z.ZodObject<{
    documentId: z.ZodString;
    action: z.ZodString;
    target: z.ZodString;
    timestamp: z.ZodISODateTime;
    actor: z.ZodNullable<z.ZodObject<{
        documentId: z.ZodString;
        first_name: z.ZodNullable<z.ZodString>;
        last_name: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>>;
    summary: z.ZodString;
}, z.core.$strict>;
export type ActivityRow = z.infer<typeof activityRowSchema>;
export declare const schoolActivityQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    pageSize: z.ZodOptional<z.ZodNumber>;
    school: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type SchoolActivityQuery = z.infer<typeof schoolActivityQuerySchema>;
export declare const schoolActivityResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        documentId: z.ZodString;
        action: z.ZodString;
        target: z.ZodString;
        timestamp: z.ZodISODateTime;
        actor: z.ZodNullable<z.ZodObject<{
            documentId: z.ZodString;
            first_name: z.ZodNullable<z.ZodString>;
            last_name: z.ZodNullable<z.ZodString>;
        }, z.core.$strict>>;
        summary: z.ZodString;
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
export type SchoolActivityResponse = z.infer<typeof schoolActivityResponseSchema>;
export declare const SchoolActivityOperation: OpsOperation<typeof schoolActivityQuerySchema, typeof schoolActivityResponseSchema>;
