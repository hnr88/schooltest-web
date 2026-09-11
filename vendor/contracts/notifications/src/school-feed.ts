import { z } from 'zod';

import { notificationEventTypeWireSchema } from './event-types';

const str = z.string().min(1);
const iso = z.iso.datetime();
const nonNegativeInt = z.number().int().min(0);

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
export const schoolNotificationRowSchema = z.strictObject({
  documentId: str,
  type: notificationEventTypeWireSchema,
  title: z.string(),
  body: z.string().nullable(),
  link: z.string().nullable(),
  read: z.boolean(),
  createdAt: iso,
});
export type SchoolNotificationRow = z.infer<typeof schoolNotificationRowSchema>;

/** The school feed's query params — paging only; no read/category filters. */
export const schoolNotificationListParamsSchema = z.strictObject({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
});

/** C-NOT-01 envelope — same pagination block + unread badge as the parent feed. */
export const schoolNotificationListSchema = z.strictObject({
  data: z.array(schoolNotificationRowSchema),
  meta: z.strictObject({
    pagination: z.strictObject({
      page: z.number().int().min(1),
      pageSize: z.number().int().min(1),
      pageCount: nonNegativeInt,
      total: nonNegativeInt,
    }),
    unreadCount: nonNegativeInt,
  }),
});
export type SchoolNotificationListEnvelope = z.infer<typeof schoolNotificationListSchema>;
