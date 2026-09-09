/**
 * C-OPS-PORTAL-055/056 — the window report and its PDF export (backlog task
 * 29). ONE contract for both consumers: the JSON report the ops UI renders and
 * the PDF the export controller draws through pdfkit.
 *
 * IDENTITY: the report is a DERIVED view of one window, not a stored entity —
 * its `documentId` IS the window's documentId, and the pair
 * `school_documentId` + `window_documentId` is what the caller authorized.
 * `generated_at` is the server instant the derivation ran.
 *
 * Whole-window totals (`eligible`, `sat`, `excluded_invalidated`) are computed
 * ONCE per generation from the shared official-attempt derivation
 * (api/form-window/lib/window-official-results) and are INDEPENDENT of row
 * pagination: paginating `results` must never change a total. Pending scores
 * live in `pending` — a student who has not scored is never presented as zero.
 */
import { z } from 'zod';
import { type OpsOperation } from './core';
export declare const REPORT_PAGE_MAX = 100000;
export declare const REPORT_PAGE_SIZE_DEFAULT = 25;
export declare const REPORT_PAGE_SIZE_MAX = 200;
export declare const reportResultRowSchema: z.ZodObject<{
    student_documentId: z.ZodString;
    result_documentId: z.ZodString;
    cefr_level: z.ZodNullable<z.ZodString>;
    percentage: z.ZodNullable<z.ZodNumber>;
}, z.core.$strict>;
export type ReportResultRow = z.infer<typeof reportResultRowSchema>;
export declare const reportPaginationSchema: z.ZodObject<{
    page: z.ZodNumber;
    pageSize: z.ZodNumber;
    pageCount: z.ZodNumber;
    total: z.ZodNumber;
}, z.core.$strict>;
export declare const windowReportSchema: z.ZodObject<{
    documentId: z.ZodString;
    school_documentId: z.ZodString;
    window_documentId: z.ZodString;
    generated_at: z.ZodISODateTime;
    eligible: z.ZodNumber;
    sat: z.ZodNumber;
    results: z.ZodArray<z.ZodObject<{
        student_documentId: z.ZodString;
        result_documentId: z.ZodString;
        cefr_level: z.ZodNullable<z.ZodString>;
        percentage: z.ZodNullable<z.ZodNumber>;
    }, z.core.$strict>>;
    excluded_invalidated: z.ZodNumber;
    pagination: z.ZodObject<{
        page: z.ZodNumber;
        pageSize: z.ZodNumber;
        pageCount: z.ZodNumber;
        total: z.ZodNumber;
    }, z.core.$strict>;
}, z.core.$strict>;
export type WindowReport = z.infer<typeof windowReportSchema>;
export declare const windowReportQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    pageSize: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
export type WindowReportQuery = z.infer<typeof windowReportQuerySchema>;
export declare const windowReportResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        documentId: z.ZodString;
        school_documentId: z.ZodString;
        window_documentId: z.ZodString;
        generated_at: z.ZodISODateTime;
        eligible: z.ZodNumber;
        sat: z.ZodNumber;
        results: z.ZodArray<z.ZodObject<{
            student_documentId: z.ZodString;
            result_documentId: z.ZodString;
            cefr_level: z.ZodNullable<z.ZodString>;
            percentage: z.ZodNullable<z.ZodNumber>;
        }, z.core.$strict>>;
        excluded_invalidated: z.ZodNumber;
        pagination: z.ZodObject<{
            page: z.ZodNumber;
            pageSize: z.ZodNumber;
            pageCount: z.ZodNumber;
            total: z.ZodNumber;
        }, z.core.$strict>;
    }, z.core.$strict>;
}, z.core.$strict>;
export type WindowReportResponse = z.infer<typeof windowReportResponseSchema>;
/** The PDF and the report take no body; unknown keys are rejected, not dropped. */
export declare const emptyReportBody: z.ZodObject<{}, z.core.$strict>;
export declare function windowReportPath(schoolDocumentId: string, windowDocumentId: string, query?: WindowReportQuery): string;
/** C-OPS-PORTAL-055 — GET /api/ops/schools/{documentId}/result-windows/{windowDocumentId}/report */
export declare const WindowReportOperation: OpsOperation<typeof windowReportQuerySchema, typeof windowReportResponseSchema>;
/** C-OPS-PORTAL-056 — GET .../report.pdf (200 = the PDF bytes; never a 2xx JSON). */
export declare const WindowPdfOperation: OpsOperation<typeof emptyReportBody, typeof emptyReportBody>;
