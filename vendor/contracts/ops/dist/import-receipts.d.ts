/**
 * D-UNDO — import receipt, cancellation and guarded undo (backlog task 01).
 *
 * The HTML's Cancel and Undo import controls must reflect actual server state
 * (decisions.md D-UNDO), so the receipt — not a toast — is the source of truth:
 *  - The receipt is SMALL: created IDs, the request digest, progress and the
 *    cancellation/commit state. NO generic background-job platform; the
 *    import runs inside the request and the receipt records what happened.
 *  - Cancellation succeeds only if it WINS against commit; otherwise the
 *    caller gets the completed outcome and can offer the guarded Undo.
 *  - Undo stays open 60 seconds after commit (same window as the school
 *    suspend rule) and succeeds ATOMICALLY only while every newly created
 *    record is still untouched.
 *  - Network loss has no status and cannot establish rollback (D-ERROR): an
 *    interrupted commit is reconciled through the receipt keyed by the
 *    request key, never by guessing from the client.
 */
import { z } from 'zod';
import { type OpsOperation } from './core';
/** Undo stays open for 60 seconds after the write, matching school-suspend. */
export declare const IMPORT_UNDO_WINDOW_SECONDS = 60;
/** requestKey bounds, shared with the path parameters of all three routes. */
export declare const IMPORT_REQUEST_KEY_MIN = 16;
export declare const IMPORT_REQUEST_KEY_MAX = 128;
/** One rejected CSV row: the spreadsheet row number (2..1001, header is row 1). */
export declare const opsImportRejectSchema: z.ZodObject<{
    row: z.ZodNumber;
    reason: z.ZodString;
}, z.core.$strict>;
export type OpsImportReject = z.infer<typeof opsImportRejectSchema>;
/** The commit outcome a receipt embeds once the write has a final state. */
export declare const opsImportCommitResultSchema: z.ZodObject<{
    created: z.ZodNumber;
    skipped: z.ZodNumber;
    rejected: z.ZodArray<z.ZodObject<{
        row: z.ZodNumber;
        reason: z.ZodString;
    }, z.core.$strict>>;
    import_documentId: z.ZodString;
}, z.core.$strict>;
export type OpsImportCommit = z.infer<typeof opsImportCommitResultSchema>;
/** Receipt state machine: processing -> completed | failed | cancelled; undone. */
export declare const importReceiptStateSchema: z.ZodEnum<{
    failed: "failed";
    processing: "processing";
    completed: "completed";
    cancelled: "cancelled";
    undone: "undone";
}>;
export type ImportReceiptState = z.infer<typeof importReceiptStateSchema>;
/** GET /api/ops/schools/{documentId}/import-students/receipts/{requestKey} — 200 body. */
export declare const opsImportReceiptSchema: z.ZodObject<{
    request_key: z.ZodString;
    state: z.ZodEnum<{
        failed: "failed";
        processing: "processing";
        completed: "completed";
        cancelled: "cancelled";
        undone: "undone";
    }>;
    result: z.ZodNullable<z.ZodObject<{
        created: z.ZodNumber;
        skipped: z.ZodNumber;
        rejected: z.ZodArray<z.ZodObject<{
            row: z.ZodNumber;
            reason: z.ZodString;
        }, z.core.$strict>>;
        import_documentId: z.ZodString;
    }, z.core.$strict>>;
    undo_available: z.ZodBoolean;
    processed_rows: z.ZodNumber;
    total_rows: z.ZodNumber;
    committed_at: z.ZodNullable<z.ZodISODateTime>;
    undo_expires_at: z.ZodNullable<z.ZodISODateTime>;
}, z.core.$strict>;
export type OpsImportReceipt = z.infer<typeof opsImportReceiptSchema>;
export declare const opsImportReceiptResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        request_key: z.ZodString;
        state: z.ZodEnum<{
            failed: "failed";
            processing: "processing";
            completed: "completed";
            cancelled: "cancelled";
            undone: "undone";
        }>;
        result: z.ZodNullable<z.ZodObject<{
            created: z.ZodNumber;
            skipped: z.ZodNumber;
            rejected: z.ZodArray<z.ZodObject<{
                row: z.ZodNumber;
                reason: z.ZodString;
            }, z.core.$strict>>;
            import_documentId: z.ZodString;
        }, z.core.$strict>>;
        undo_available: z.ZodBoolean;
        processed_rows: z.ZodNumber;
        total_rows: z.ZodNumber;
        committed_at: z.ZodNullable<z.ZodISODateTime>;
        undo_expires_at: z.ZodNullable<z.ZodISODateTime>;
    }, z.core.$strict>;
}, z.core.$strict>;
export type OpsImportReceiptResponse = z.infer<typeof opsImportReceiptResponseSchema>;
/** POST .../receipts/{requestKey}/cancel — 200 body: the race outcome, verbatim. */
export declare const opsImportCancelResultSchema: z.ZodObject<{
    request_key: z.ZodString;
    state: z.ZodEnum<{
        completed: "completed";
        cancelled: "cancelled";
    }>;
    result: z.ZodNullable<z.ZodObject<{
        created: z.ZodNumber;
        skipped: z.ZodNumber;
        rejected: z.ZodArray<z.ZodObject<{
            row: z.ZodNumber;
            reason: z.ZodString;
        }, z.core.$strict>>;
        import_documentId: z.ZodString;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type OpsImportCancelResult = z.infer<typeof opsImportCancelResultSchema>;
export declare const opsImportCancelResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        request_key: z.ZodString;
        state: z.ZodEnum<{
            completed: "completed";
            cancelled: "cancelled";
        }>;
        result: z.ZodNullable<z.ZodObject<{
            created: z.ZodNumber;
            skipped: z.ZodNumber;
            rejected: z.ZodArray<z.ZodObject<{
                row: z.ZodNumber;
                reason: z.ZodString;
            }, z.core.$strict>>;
            import_documentId: z.ZodString;
        }, z.core.$strict>>;
    }, z.core.$strict>;
}, z.core.$strict>;
/** POST .../import-students/{importDocumentId}/undo — 200 body. */
export declare const opsImportUndoResultSchema: z.ZodObject<{
    import_documentId: z.ZodString;
    removed: z.ZodNumber;
    undone: z.ZodLiteral<true>;
}, z.core.$strict>;
export type OpsImportUndoResult = z.infer<typeof opsImportUndoResultSchema>;
export declare const opsImportUndoResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        import_documentId: z.ZodString;
        removed: z.ZodNumber;
        undone: z.ZodLiteral<true>;
    }, z.core.$strict>;
}, z.core.$strict>;
export declare function importReceiptPath(schoolDocumentId: string, requestKey: string): string;
export declare function importCancelPath(schoolDocumentId: string, requestKey: string): string;
export declare function importUndoPath(schoolDocumentId: string, importDocumentId: string): string;
export declare const importReceiptBodySchema: z.ZodObject<{}, z.core.$strict>;
export declare const importCancelBodySchema: z.ZodObject<{}, z.core.$strict>;
export declare const importUndoBodySchema: z.ZodObject<{}, z.core.$strict>;
/** C-OPS-PORTAL-049 — GET /api/ops/schools/{documentId}/import-students/receipts/{requestKey} */
export declare const ImportReceiptOperation: OpsOperation<typeof importReceiptBodySchema, typeof opsImportReceiptResponseSchema>;
/** C-OPS-PORTAL-072 — POST /api/ops/schools/{documentId}/import-students/receipts/{requestKey}/cancel */
export declare const ImportCancelOperation: OpsOperation<typeof importCancelBodySchema, typeof opsImportCancelResponseSchema>;
/** C-OPS-PORTAL-050 — POST /api/ops/schools/{documentId}/import-students/{importDocumentId}/undo */
export declare const ImportUndoOperation: OpsOperation<typeof importUndoBodySchema, typeof opsImportUndoResponseSchema>;
