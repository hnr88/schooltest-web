/**
 * OPS-062 — C-OPS-PORTAL-052 `GET /api/form-windows`.
 *
 * ONE portable definition of the school form-window READ, imported by the
 * Strapi projection, the typed web client and both HTTP suites so the shape
 * cannot drift between them.
 *
 * Two properties this module exists to guarantee, both named by the task:
 *  - ZERO rows means "no window". It is never an error and never an empty row.
 *  - MORE THAN ONE row for one school is an INTEGRITY error, never silently
 *    `rows[0]`: the storage rule is one window per school (replace semantics),
 *    so two rows mean no window is authoritative and the UI must say so.
 * A third, from the same storage reality: a window whose `school` or `form`
 * relation is gone (deleted form, cleared relation) is INCOMPLETE — reported,
 * not rendered as if a form were live.
 */
import { z } from 'zod';
import { type OpsOperation } from './core';
/** Contract bounds for the core pagination this operation accepts. */
export declare const FORM_WINDOW_READ_MAX_PAGE_SIZE = 200;
export declare const FORM_WINDOW_READ_DEFAULT_PAGE_SIZE = 25;
export declare const FORM_WINDOW_READ_PATH = "/api/form-windows";
export declare const formWindowSchoolRefSchema: z.ZodPreprocess<z.ZodObject<{
    documentId: z.ZodString;
}, z.core.$strict>>;
export declare const formWindowFormRefSchema: z.ZodPreprocess<z.ZodObject<{
    documentId: z.ZodString;
    form_code: z.ZodString;
}, z.core.$strict>>;
/** The contracted Window: both relations present, exactly five keys. */
export declare const formWindowRowSchema: z.ZodPreprocess<z.ZodObject<{
    documentId: z.ZodString;
    school: z.ZodPreprocess<z.ZodObject<{
        documentId: z.ZodString;
    }, z.core.$strict>>;
    form: z.ZodPreprocess<z.ZodObject<{
        documentId: z.ZodString;
        form_code: z.ZodString;
    }, z.core.$strict>>;
    opens_at: z.ZodString;
    closes_at: z.ZodString;
}, z.core.$strict>>;
export type FormWindowRow = z.infer<typeof formWindowRowSchema>;
/**
 * The same row as it can actually arrive. A relation that was deleted comes
 * back as `null`, and a parser that refused it would turn a recoverable data
 * problem into an unreadable screen; `resolveSchoolFormWindow` classifies it.
 */
export declare const formWindowWireRowSchema: z.ZodPreprocess<z.ZodObject<{
    documentId: z.ZodString;
    school: z.ZodNullable<z.ZodPreprocess<z.ZodObject<{
        documentId: z.ZodString;
    }, z.core.$strict>>>;
    form: z.ZodNullable<z.ZodPreprocess<z.ZodObject<{
        documentId: z.ZodString;
        form_code: z.ZodString;
    }, z.core.$strict>>>;
    opens_at: z.ZodString;
    closes_at: z.ZodString;
}, z.core.$strict>>;
export type FormWindowWireRow = z.infer<typeof formWindowWireRowSchema>;
export declare const formWindowPaginationSchema: z.ZodObject<{
    page: z.ZodNumber;
    pageSize: z.ZodNumber;
    pageCount: z.ZodNumber;
    total: z.ZodNumber;
}, z.core.$strict>;
export type FormWindowPagination = z.infer<typeof formWindowPaginationSchema>;
/** 200 body: the page of rows plus the core list metadata, both preserved. */
export declare const formWindowListSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodPreprocess<z.ZodObject<{
        documentId: z.ZodString;
        school: z.ZodNullable<z.ZodPreprocess<z.ZodObject<{
            documentId: z.ZodString;
        }, z.core.$strict>>>;
        form: z.ZodNullable<z.ZodPreprocess<z.ZodObject<{
            documentId: z.ZodString;
            form_code: z.ZodString;
        }, z.core.$strict>>>;
        opens_at: z.ZodString;
        closes_at: z.ZodString;
    }, z.core.$strict>>>;
    meta: z.ZodObject<{
        pagination: z.ZodObject<{
            page: z.ZodNumber;
            pageSize: z.ZodNumber;
            pageCount: z.ZodNumber;
            total: z.ZodNumber;
        }, z.core.$strict>;
    }, z.core.$strict>;
}, z.core.$strict>;
export type FormWindowList = z.infer<typeof formWindowListSchema>;
/** GET carries no body; an empty object is the only valid payload. */
export declare const formWindowReadBodySchema: z.ZodObject<{}, z.core.$strict>;
/**
 * The EXACT query a portal read sends: the school filter the operation is
 * scoped by, the explicit school/form population, and bounded core pagination.
 * Built here so the client, the server assertions and the suites cannot
 * disagree about a single bracket.
 */
export declare function formWindowReadParams(schoolDocumentId: string): Record<string, string | number>;
/**
 * What the school's rows mean. `conflict` and `incomplete` exist so a caller
 * physically cannot express "just take the first row": the union has no member
 * that hands back a window when the data does not support one.
 */
export type FormWindowResolution = {
    readonly kind: 'none';
} | {
    readonly kind: 'one';
    readonly window: FormWindowRow;
} | {
    readonly kind: 'incomplete';
    readonly documentId: string;
} | {
    readonly kind: 'conflict';
    readonly documentIds: readonly string[];
};
export declare function resolveSchoolFormWindow(rows: readonly FormWindowWireRow[]): FormWindowResolution;
/** C-OPS-PORTAL-052 — GET /api/form-windows */
export declare const FormWindowReadOperation: OpsOperation<typeof formWindowReadBodySchema, typeof formWindowListSchema>;
