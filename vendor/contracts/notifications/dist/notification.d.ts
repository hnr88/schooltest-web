import { z } from 'zod';
/** Taxonomy-authoritative: use server-side and in the parity spec. */
export declare const notificationRowSchema: z.ZodObject<{
    documentId: z.ZodString;
    eventType: z.ZodTypeAny<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
    category: z.ZodEnum<{
        account: "account";
        security: "security";
        children: "children";
        testActivity: "testActivity";
        testResults: "testResults";
    }>;
    title: z.ZodString;
    body: z.ZodNullable<z.ZodString>;
    priority: z.ZodEnum<{
        high: "high";
        medium: "medium";
        low: "low";
    }>;
    readAt: z.ZodNullable<z.ZodISODateTime>;
    linkUrl: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
}, z.core.$strict>;
export type NotificationRow = z.infer<typeof notificationRowSchema>;
/**
 * Client parse boundary: identical in every key EXCEPT that an unrecognised
 * event type is carried rather than rejected. See `event-types.ts` for why a
 * closed enum here is a bug, not extra safety.
 */
export declare const notificationRowWireSchema: z.ZodObject<{
    documentId: z.ZodString;
    eventType: z.ZodTypeAny<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
    category: z.ZodEnum<{
        account: "account";
        security: "security";
        children: "children";
        testActivity: "testActivity";
        testResults: "testResults";
    }>;
    title: z.ZodString;
    body: z.ZodNullable<z.ZodString>;
    priority: z.ZodEnum<{
        high: "high";
        medium: "medium";
        low: "low";
    }>;
    readAt: z.ZodNullable<z.ZodISODateTime>;
    linkUrl: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
}, z.core.$strict>;
export type NotificationRowWire = z.infer<typeof notificationRowWireSchema>;
/** Inline pagination block — `page >= 1`, `pageSize` clamped to 100, computed `pageCount`. */
export declare const notificationPaginationSchema: z.ZodObject<{
    page: z.ZodNumber;
    pageSize: z.ZodNumber;
    pageCount: z.ZodNumber;
    total: z.ZodNumber;
}, z.core.$strict>;
/**
 * C-NOTIF-LIST envelope — `{ data, meta: { pagination, unreadCount } }`, where
 * `unreadCount` is the caller's TOTAL `readAt`-null count regardless of the
 * `read` / `category` / `eventType` / `q` filters applied to the page.
 */
export declare const notificationListSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodTypeAny<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>>;
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
export type NotificationListEnvelope = z.infer<typeof notificationListSchema>;
export declare const notificationListWireSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodTypeAny<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>>;
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
/** C-NOTIF-UNREAD-COUNT — `GET /api/notifications/unread-count`: the badge poll. */
export declare const notificationUnreadCountSchema: z.ZodObject<{
    data: z.ZodObject<{
        count: z.ZodNumber;
    }, z.core.$strict>;
}, z.core.$strict>;
/**
 * The read surface's query params. Row 09 added `q` and `sort` so the parent
 * feed could page on the SERVER without losing the search and date sort it
 * already shipped client-side.
 */
export declare const notificationListParamsSchema: z.ZodObject<{
    page: z.ZodNumber;
    pageSize: z.ZodNumber;
    read: z.ZodOptional<z.ZodBoolean>;
    category: z.ZodOptional<z.ZodEnum<{
        account: "account";
        security: "security";
        children: "children";
        testActivity: "testActivity";
        testResults: "testResults";
    }>>;
    eventType: z.ZodOptional<z.ZodString>;
    q: z.ZodOptional<z.ZodString>;
    sort: z.ZodOptional<z.ZodEnum<{
        "date:asc": "date:asc";
        "date:desc": "date:desc";
    }>>;
}, z.core.$strict>;
/**
 * C-NOT-01 — the staff feed's SEVEN-key projection of the same rows
 * (`GET /api/schools/me/notifications`). A lossy re-projection, not a different
 * stream: row 08 proved both endpoints read through one shared reader and
 * differ only here.
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
/**
 * C-NOTIF-READ — `PUT /api/notifications/{documentId}/read`: idempotent, so an
 * already-read row answers its ORIGINAL `readAt`.
 */
export declare const notificationMarkReadSchema: z.ZodObject<{
    data: z.ZodObject<{
        documentId: z.ZodString;
        readAt: z.ZodISODateTime;
    }, z.core.$strict>;
}, z.core.$strict>;
/** C-NOTIF-READ-ALL — `POST /api/notifications/read-all`: bounded batch <= 100; 0 unread => `{ updated: 0 }`. */
export declare const notificationMarkAllSchema: z.ZodObject<{
    data: z.ZodObject<{
        updated: z.ZodNumber;
    }, z.core.$strict>;
}, z.core.$strict>;
