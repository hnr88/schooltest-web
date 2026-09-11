import { z } from 'zod';
/**
 * C-NOT-01 — the school-staff feed (`GET /api/schools/me/notifications`): a
 * SEVEN-key projection of the same rows the parent feed serves — `type` from
 * `eventType`, `link` from `linkUrl`, `read` from `readAt != null` — losing
 * `category` / `priority` / the read timestamps. Row 08 proved both endpoints
 * read through one shared reader and differ only in this projection, so the
 * shape lives here, beside the parent feed's, and neither copy can drift.
 *
 * `type` uses the LENIENT event-type variant: the staff feed renders whatever
 * the server sent, and a client running an older bundle must not reject a whole
 * row over a type it does not recognise yet (see `event-types.ts`).
 */
export declare const schoolNotificationRowSchema: z.ZodObject<{
    documentId: z.ZodString;
    type: z.ZodString;
    title: z.ZodString;
    body: z.ZodNullable<z.ZodString>;
    link: z.ZodNullable<z.ZodString>;
    read: z.ZodBoolean;
    createdAt: z.ZodISODateTime;
}, z.core.$strict>;
export type SchoolNotificationRow = z.infer<typeof schoolNotificationRowSchema>;
/** The school feed's query params — paging only; no read/category filters. */
export declare const schoolNotificationListParamsSchema: z.ZodObject<{
    page: z.ZodNumber;
    pageSize: z.ZodNumber;
}, z.core.$strict>;
/** C-NOT-01 envelope — same pagination block + unread badge as the parent feed. */
export declare const schoolNotificationListSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        documentId: z.ZodString;
        type: z.ZodString;
        title: z.ZodString;
        body: z.ZodNullable<z.ZodString>;
        link: z.ZodNullable<z.ZodString>;
        read: z.ZodBoolean;
        createdAt: z.ZodISODateTime;
    }, z.core.$strict>>;
    meta: z.ZodObject<{
        pagination: z.ZodObject<{
            page: z.ZodNumber;
            pageSize: z.ZodNumber;
            pageCount: z.ZodNumber;
            total: z.ZodNumber;
        }, z.core.$strict>;
        unreadCount: z.ZodNumber;
    }, z.core.$strict>;
}, z.core.$strict>;
export type SchoolNotificationListEnvelope = z.infer<typeof schoolNotificationListSchema>;
