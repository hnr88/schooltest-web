import { z } from 'zod';

// C-NOT-01 school feed row (mission st-mvp-pivot, task 112): the school-staff
// projection of a notification row - type from eventType, link from linkUrl,
// read from readAt != null. Deliberately separate from the parent portal
// schema (C-NOTIF-LIST), which carries category/priority/readAt fields the
// school feed does not expose.
export const schoolNotificationSchema = z.strictObject({
  documentId: z.string().min(1),
  type: z.string().min(1),
  title: z.string().min(1),
  body: z.string().nullable(),
  link: z.string().min(1).nullable(),
  read: z.boolean(),
  createdAt: z.iso.datetime(),
});

export const schoolNotificationListParamsSchema = z.strictObject({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
});

export const schoolNotificationListResponseSchema = z.strictObject({
  data: z.array(schoolNotificationSchema),
  meta: z.strictObject({
    pagination: z.strictObject({
      page: z.number().int().min(1),
      pageSize: z.number().int().min(1).max(100),
      pageCount: z.number().int().min(0),
      total: z.number().int().min(0),
    }),
    unreadCount: z.number().int().min(0),
  }),
});
