"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schoolNotificationListSchema = exports.schoolNotificationListParamsSchema = exports.schoolNotificationRowSchema = void 0;
const zod_1 = require("zod");
const event_types_1 = require("./event-types");
const str = zod_1.z.string().min(1);
const iso = zod_1.z.iso.datetime();
const nonNegativeInt = zod_1.z.number().int().min(0);
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
exports.schoolNotificationRowSchema = zod_1.z.strictObject({
    documentId: str,
    type: event_types_1.notificationEventTypeWireSchema,
    title: zod_1.z.string(),
    body: zod_1.z.string().nullable(),
    link: zod_1.z.string().nullable(),
    read: zod_1.z.boolean(),
    createdAt: iso,
});
/** The school feed's query params — paging only; no read/category filters. */
exports.schoolNotificationListParamsSchema = zod_1.z.strictObject({
    page: zod_1.z.number().int().min(1),
    pageSize: zod_1.z.number().int().min(1).max(100),
});
/** C-NOT-01 envelope — same pagination block + unread badge as the parent feed. */
exports.schoolNotificationListSchema = zod_1.z.strictObject({
    data: zod_1.z.array(exports.schoolNotificationRowSchema),
    meta: zod_1.z.strictObject({
        pagination: zod_1.z.strictObject({
            page: zod_1.z.number().int().min(1),
            pageSize: zod_1.z.number().int().min(1),
            pageCount: nonNegativeInt,
            total: nonNegativeInt,
        }),
        unreadCount: nonNegativeInt,
    }),
});
