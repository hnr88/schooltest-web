/**
 * Ledger row 8 (msn-0da39441) — the ops Content console surfaces:
 * `GET /api/ops/content/counts`, `GET /api/ops/content/orphans`,
 * `POST /api/ops/content/orphans/purge`, `POST /api/ops/content/reindex-search`,
 * `GET /api/ops/media/stats`, `POST /api/ops/media/prune`
 * (C-OPSC-01..06, schooltest-api/src/api/ops/routes/08-custom-ops-content.ts).
 *
 * Shapes mirror the live wire byte-for-byte (verified before writing): counts
 * rows are the api:: content-type enumeration; orphans are per-kind reports
 * with a 20-documentId sample; the three maintenance actions ALL honour the
 * `dryRun`-defaults-to-true rule and echo the flag they executed, so the UI
 * can show honestly whether it reported or destroyed.
 */
import { z } from 'zod';
export declare const contentCountRowSchema: z.ZodObject<{
    uid: z.ZodString;
    singularName: z.ZodString;
    displayName: z.ZodString;
    count: z.ZodNumber;
}, z.core.$strip>;
export type ContentCountRow = z.infer<typeof contentCountRowSchema>;
export declare const contentCountsResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        uid: z.ZodString;
        singularName: z.ZodString;
        displayName: z.ZodString;
        count: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type ContentCountsResponse = z.infer<typeof contentCountsResponseSchema>;
export declare const ORPHAN_KINDS: readonly ["students_without_school", "sessions_without_student", "results_without_session", "results_without_student", "invitations_without_school"];
export declare const orphanKindSchema: z.ZodEnum<{
    students_without_school: "students_without_school";
    sessions_without_student: "sessions_without_student";
    results_without_session: "results_without_session";
    results_without_student: "results_without_student";
    invitations_without_school: "invitations_without_school";
}>;
export type OrphanKind = z.infer<typeof orphanKindSchema>;
export declare const orphanKindReportSchema: z.ZodObject<{
    kind: z.ZodEnum<{
        students_without_school: "students_without_school";
        sessions_without_student: "sessions_without_student";
        results_without_session: "results_without_session";
        results_without_student: "results_without_student";
        invitations_without_school: "invitations_without_school";
    }>;
    count: z.ZodNumber;
    sample: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type OrphanKindReport = z.infer<typeof orphanKindReportSchema>;
export declare const contentOrphansResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        kind: z.ZodEnum<{
            students_without_school: "students_without_school";
            sessions_without_student: "sessions_without_student";
            results_without_session: "results_without_session";
            results_without_student: "results_without_student";
            invitations_without_school: "invitations_without_school";
        }>;
        count: z.ZodNumber;
        sample: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type ContentOrphansResponse = z.infer<typeof contentOrphansResponseSchema>;
export declare const orphanPurgeRequestSchema: z.ZodObject<{
    kinds: z.ZodArray<z.ZodEnum<{
        students_without_school: "students_without_school";
        sessions_without_student: "sessions_without_student";
        results_without_session: "results_without_session";
        results_without_student: "results_without_student";
        invitations_without_school: "invitations_without_school";
    }>>;
    dryRun: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type OrphanPurgeRequest = z.infer<typeof orphanPurgeRequestSchema>;
export declare const orphanPurgeResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        purged: z.ZodRecord<z.ZodEnum<{
            students_without_school: "students_without_school";
            sessions_without_student: "sessions_without_student";
            results_without_session: "results_without_session";
            results_without_student: "results_without_student";
            invitations_without_school: "invitations_without_school";
        }>, z.ZodNumber>;
        dryRun: z.ZodBoolean;
    }, z.core.$strip>;
}, z.core.$strip>;
export type OrphanPurgeResponse = z.infer<typeof orphanPurgeResponseSchema>;
export declare const mediaMimeStatsSchema: z.ZodObject<{
    mime: z.ZodString;
    count: z.ZodNumber;
    bytes: z.ZodNumber;
}, z.core.$strip>;
export type MediaMimeStats = z.infer<typeof mediaMimeStatsSchema>;
export declare const mediaStatsSchema: z.ZodObject<{
    files: z.ZodNumber;
    total_bytes: z.ZodNumber;
    by_mime: z.ZodArray<z.ZodObject<{
        mime: z.ZodString;
        count: z.ZodNumber;
        bytes: z.ZodNumber;
    }, z.core.$strip>>;
    unreferenced_count: z.ZodNumber;
}, z.core.$strip>;
export type MediaStats = z.infer<typeof mediaStatsSchema>;
export declare const mediaStatsResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        files: z.ZodNumber;
        total_bytes: z.ZodNumber;
        by_mime: z.ZodArray<z.ZodObject<{
            mime: z.ZodString;
            count: z.ZodNumber;
            bytes: z.ZodNumber;
        }, z.core.$strip>>;
        unreferenced_count: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>;
export type MediaStatsResponse = z.infer<typeof mediaStatsResponseSchema>;
export declare const maintenanceActionRequestSchema: z.ZodObject<{
    dryRun: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type MaintenanceActionRequest = z.infer<typeof maintenanceActionRequestSchema>;
export declare const mediaPruneResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        removed: z.ZodNumber;
        bytes_freed: z.ZodNumber;
        dryRun: z.ZodBoolean;
    }, z.core.$strip>;
}, z.core.$strip>;
export type MediaPruneResponse = z.infer<typeof mediaPruneResponseSchema>;
export declare const contentReindexResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        indexed: z.ZodNumber;
        took_ms: z.ZodNumber;
        missing_slug: z.ZodNumber;
        dryRun: z.ZodBoolean;
    }, z.core.$strip>;
}, z.core.$strip>;
export type ContentReindexResponse = z.infer<typeof contentReindexResponseSchema>;
export declare const ContentCountsOperation: Readonly<{
    contractId: "C-OPSC-01";
    method: "GET";
    path: "/api/ops/content/counts";
    request: z.ZodObject<{
        data: z.ZodObject<{}, z.core.$strip>;
    }, z.core.$strict>;
    response: z.ZodObject<{
        data: z.ZodArray<z.ZodObject<{
            uid: z.ZodString;
            singularName: z.ZodString;
            displayName: z.ZodString;
            count: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    success: 200;
    errors: readonly [400, 401, 403, 404, 429, 500];
}>;
export declare const ContentOrphansOperation: Readonly<{
    contractId: "C-OPSC-02";
    method: "GET";
    path: "/api/ops/content/orphans";
    request: z.ZodObject<{
        data: z.ZodObject<{}, z.core.$strip>;
    }, z.core.$strict>;
    response: z.ZodObject<{
        data: z.ZodArray<z.ZodObject<{
            kind: z.ZodEnum<{
                students_without_school: "students_without_school";
                sessions_without_student: "sessions_without_student";
                results_without_session: "results_without_session";
                results_without_student: "results_without_student";
                invitations_without_school: "invitations_without_school";
            }>;
            count: z.ZodNumber;
            sample: z.ZodArray<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    success: 200;
    errors: readonly [400, 401, 403, 404, 429, 500];
}>;
export declare const OrphanPurgeOperation: Readonly<{
    contractId: "C-OPSC-03";
    method: "POST";
    path: "/api/ops/content/orphans/purge";
    request: z.ZodObject<{
        kinds: z.ZodArray<z.ZodEnum<{
            students_without_school: "students_without_school";
            sessions_without_student: "sessions_without_student";
            results_without_session: "results_without_session";
            results_without_student: "results_without_student";
            invitations_without_school: "invitations_without_school";
        }>>;
        dryRun: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>;
    response: z.ZodObject<{
        data: z.ZodObject<{
            purged: z.ZodRecord<z.ZodEnum<{
                students_without_school: "students_without_school";
                sessions_without_student: "sessions_without_student";
                results_without_session: "results_without_session";
                results_without_student: "results_without_student";
                invitations_without_school: "invitations_without_school";
            }>, z.ZodNumber>;
            dryRun: z.ZodBoolean;
        }, z.core.$strip>;
    }, z.core.$strip>;
    success: 200;
    errors: readonly [400, 401, 403, 404, 429, 500];
}>;
export declare const MediaStatsOperation: Readonly<{
    contractId: "C-OPSC-04";
    method: "GET";
    path: "/api/ops/media/stats";
    request: z.ZodObject<{
        data: z.ZodObject<{}, z.core.$strip>;
    }, z.core.$strict>;
    response: z.ZodObject<{
        data: z.ZodObject<{
            files: z.ZodNumber;
            total_bytes: z.ZodNumber;
            by_mime: z.ZodArray<z.ZodObject<{
                mime: z.ZodString;
                count: z.ZodNumber;
                bytes: z.ZodNumber;
            }, z.core.$strip>>;
            unreferenced_count: z.ZodNumber;
        }, z.core.$strip>;
    }, z.core.$strip>;
    success: 200;
    errors: readonly [400, 401, 403, 404, 429, 500];
}>;
export declare const MediaPruneOperation: Readonly<{
    contractId: "C-OPSC-05";
    method: "POST";
    path: "/api/ops/media/prune";
    request: z.ZodObject<{
        dryRun: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>;
    response: z.ZodObject<{
        data: z.ZodObject<{
            removed: z.ZodNumber;
            bytes_freed: z.ZodNumber;
            dryRun: z.ZodBoolean;
        }, z.core.$strip>;
    }, z.core.$strip>;
    success: 200;
    errors: readonly [400, 401, 403, 404, 429, 500];
}>;
export declare const ContentReindexOperation: Readonly<{
    contractId: "C-OPSC-06";
    method: "POST";
    path: "/api/ops/content/reindex-search";
    request: z.ZodObject<{
        dryRun: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>;
    response: z.ZodObject<{
        data: z.ZodObject<{
            indexed: z.ZodNumber;
            took_ms: z.ZodNumber;
            missing_slug: z.ZodNumber;
            dryRun: z.ZodBoolean;
        }, z.core.$strip>;
    }, z.core.$strip>;
    success: 200;
    errors: readonly [400, 401, 403, 404, 429, 500];
}>;
