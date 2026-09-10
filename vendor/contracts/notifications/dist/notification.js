"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationMarkAllSchema = exports.notificationMarkReadSchema = exports.schoolNotificationRowSchema = exports.notificationListParamsSchema = exports.notificationUnreadCountSchema = exports.notificationListWireSchema = exports.notificationListSchema = exports.notificationPaginationSchema = exports.notificationRowWireSchema = exports.notificationRowSchema = void 0;
const zod_1 = require("zod");
const event_types_1 = require("./event-types");
const str = zod_1.z.string().min(1);
const iso = zod_1.z.iso.datetime();
const nonNegativeInt = zod_1.z.number().int().min(0);
/**
 * C-NOTIF-LIST row — `GET /api/notifications`. Ten keys, exactly: the service's
 * explicit whitelist map drops the numeric `id` the Document Service always
 * returns, and `user` / `data` / the channel flags were never selected.
 *
 * Authored ONCE and parameterised on the event-type schema, so the strict and
 * lenient variants below cannot drift in their other nine keys. That is the
 * whole point — the previous three hand-copies differed only in this one field
 * and nobody could tell at a glance whether anything else had moved too.
 */
const notificationRowShape = (eventType) => zod_1.z.strictObject({
    documentId: str,
    eventType,
    category: event_types_1.notificationCategorySchema,
    title: zod_1.z.string(),
    body: zod_1.z.string().nullable(),
    priority: event_types_1.notificationPrioritySchema,
    readAt: iso.nullable(),
    linkUrl: zod_1.z.string().nullable(),
    createdAt: iso,
    updatedAt: iso,
});
/** Taxonomy-authoritative: use server-side and in the parity spec. */
exports.notificationRowSchema = notificationRowShape(event_types_1.notificationEventTypeSchema);
/**
 * Client parse boundary: identical in every key EXCEPT that an unrecognised
 * event type is carried rather than rejected. See `event-types.ts` for why a
 * closed enum here is a bug, not extra safety.
 */
exports.notificationRowWireSchema = notificationRowShape(event_types_1.notificationEventTypeWireSchema);
/** Inline pagination block — `page >= 1`, `pageSize` clamped to 100, computed `pageCount`. */
exports.notificationPaginationSchema = zod_1.z.strictObject({
    page: zod_1.z.number().int().min(1),
    pageSize: zod_1.z.number().int().min(1),
    pageCount: nonNegativeInt,
    total: nonNegativeInt,
});
const listEnvelope = (row) => zod_1.z.strictObject({
    data: zod_1.z.array(row),
    meta: zod_1.z.strictObject({
        pagination: exports.notificationPaginationSchema,
        unreadCount: nonNegativeInt,
    }),
});
/**
 * C-NOTIF-LIST envelope — `{ data, meta: { pagination, unreadCount } }`, where
 * `unreadCount` is the caller's TOTAL `readAt`-null count regardless of the
 * `read` / `category` / `eventType` / `q` filters applied to the page.
 */
exports.notificationListSchema = listEnvelope(exports.notificationRowSchema);
exports.notificationListWireSchema = listEnvelope(exports.notificationRowWireSchema);
/** C-NOTIF-UNREAD-COUNT — `GET /api/notifications/unread-count`: the badge poll. */
exports.notificationUnreadCountSchema = zod_1.z.strictObject({
    data: zod_1.z.strictObject({ count: nonNegativeInt }),
});
/**
 * The read surface's query params. Row 09 added `q` and `sort` so the parent
 * feed could page on the SERVER without losing the search and date sort it
 * already shipped client-side.
 */
exports.notificationListParamsSchema = zod_1.z.strictObject({
    page: zod_1.z.number().int().min(1),
    pageSize: zod_1.z.number().int().min(1).max(100),
    read: zod_1.z.boolean().optional(),
    category: event_types_1.notificationCategorySchema.optional(),
    eventType: zod_1.z.string().min(1).optional(),
    q: zod_1.z.string().min(1).optional(),
    sort: zod_1.z.enum(['date:asc', 'date:desc']).optional(),
});
/**
 * C-NOT-01 — the staff feed's SEVEN-key projection of the same rows
 * (`GET /api/schools/me/notifications`). A lossy re-projection, not a different
 * stream: row 08 proved both endpoints read through one shared reader and
 * differ only here.
 */
exports.schoolNotificationRowSchema = zod_1.z.strictObject({
    documentId: str,
    type: event_types_1.notificationEventTypeWireSchema,
    title: zod_1.z.string(),
    body: zod_1.z.string().nullable(),
    link: zod_1.z.string().nullable(),
    read: zod_1.z.boolean(),
    createdAt: iso,
});
/**
 * C-NOTIF-READ — `PUT /api/notifications/{documentId}/read`: idempotent, so an
 * already-read row answers its ORIGINAL `readAt`.
 */
exports.notificationMarkReadSchema = zod_1.z.strictObject({
    data: zod_1.z.strictObject({ documentId: str, readAt: iso }),
});
/** C-NOTIF-READ-ALL — `POST /api/notifications/read-all`: bounded batch <= 100; 0 unread => `{ updated: 0 }`. */
exports.notificationMarkAllSchema = zod_1.z.strictObject({
    data: zod_1.z.strictObject({ updated: nonNegativeInt }),
});
