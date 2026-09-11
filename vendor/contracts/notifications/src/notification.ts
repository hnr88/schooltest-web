import { z } from 'zod';

import {
  notificationCategorySchema,
  notificationEventTypeSchema,
  notificationEventTypeWireSchema,
  notificationPrioritySchema,
} from './event-types';
const str = z.string().min(1);
const iso = z.iso.datetime();
const nonNegativeInt = z.number().int().min(0);

/**
 * C-NOTIF-LIST row — `GET /api/notifications`. Ten keys, exactly: the service's
 * explicit whitelist map drops the numeric `id` the Document Service always
 * returns, and `user` / `data` / the channel flags were never selected.
 *
 * Authored ONCE and parameterised on the event-type schema, so the strict and
 * lenient variants below cannot drift in their other nine keys. That is the
 * whole point — the previous three hand-copies differed only in this one field
 * and nobody could tell at a glance whether anything else had moved too.
 *
 * The parameter is generic (NOT `z.ZodTypeAny`): a type-any parameter infers
 * the row's `eventType` OUTPUT as `unknown` in the emitted .d.ts, and what that
 * key infers is the entire strict/lenient distinction.
 */
const notificationRowShape = <S extends z.ZodType>(eventType: S) =>
  z.strictObject({
    documentId: str,
    eventType,
    category: notificationCategorySchema,
    title: z.string(),
    body: z.string().nullable(),
    priority: notificationPrioritySchema,
    readAt: iso.nullable(),
    linkUrl: z.string().nullable(),
    createdAt: iso,
    updatedAt: iso,
  });

/** Taxonomy-authoritative: use server-side and in the parity spec. */
export const notificationRowSchema = notificationRowShape(notificationEventTypeSchema);
export type NotificationRow = z.infer<typeof notificationRowSchema>;

/**
 * Client parse boundary: identical in every key EXCEPT that an unrecognised
 * event type is carried rather than rejected. See `event-types.ts` for why a
 * closed enum here is a bug, not extra safety.
 */
export const notificationRowWireSchema = notificationRowShape(notificationEventTypeWireSchema);
export type NotificationRowWire = z.infer<typeof notificationRowWireSchema>;

/** Inline pagination block — `page >= 1`, `pageSize` clamped to 100, computed `pageCount`. */
export const notificationPaginationSchema = z.strictObject({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  pageCount: nonNegativeInt,
  total: nonNegativeInt,
});

const listEnvelope = <S extends z.ZodType>(row: S) =>
  z.strictObject({
    data: z.array(row),
    meta: z.strictObject({
      pagination: notificationPaginationSchema,
      unreadCount: nonNegativeInt,
    }),
  });

/**
 * C-NOTIF-LIST envelope — `{ data, meta: { pagination, unreadCount } }`, where
 * `unreadCount` is the caller's TOTAL `readAt`-null count regardless of the
 * `read` / `category` / `eventType` / `q` filters applied to the page.
 */
export const notificationListSchema = listEnvelope(notificationRowSchema);
export type NotificationListEnvelope = z.infer<typeof notificationListSchema>;

export const notificationListWireSchema = listEnvelope(notificationRowWireSchema);

/** C-NOTIF-UNREAD-COUNT — `GET /api/notifications/unread-count`: the badge poll. */
export const notificationUnreadCountSchema = z.strictObject({
  data: z.strictObject({ count: nonNegativeInt }),
});

/**
 * The read surface's query params. Row 09 added `q` and `sort` so the parent
 * feed could page on the SERVER without losing the search and date sort it
 * already shipped client-side.
 */
export const notificationListParamsSchema = z.strictObject({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
  read: z.boolean().optional(),
  category: notificationCategorySchema.optional(),
  eventType: z.string().min(1).optional(),
  q: z.string().min(1).optional(),
  sort: z.enum(['date:asc', 'date:desc']).optional(),
});

/**
 * C-NOT-01 — the school-staff feed's projection lives in `./school-feed`, so
 * the parent feed's row and the staff projection sit beside each other in the
 * package and neither copy can drift (row 08: one reader, two projections).
 */

/** C-NOTIF-READ — `PUT /api/notifications/{documentId}/read`: idempotent, so an
 * already-read row answers its ORIGINAL `readAt`. */
export const notificationMarkReadSchema = z.strictObject({
  data: z.strictObject({ documentId: str, readAt: iso }),
});

/** C-NOTIF-READ-ALL — `POST /api/notifications/read-all`: bounded batch <= 100; 0 unread => `{ updated: 0 }`. */
export const notificationMarkAllSchema = z.strictObject({
  data: z.strictObject({ updated: nonNegativeInt }),
});
