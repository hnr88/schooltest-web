import { z } from 'zod';

export const notificationCategorySchema = z.enum([
  'account',
  'security',
  'children',
  'testActivity',
  'testResults',
]);

export const notificationPrioritySchema = z.enum(['high', 'medium', 'low']);

export const notificationSchema = z.strictObject({
  documentId: z.string().min(1),
  eventType: z.string().min(1),
  category: notificationCategorySchema,
  title: z.string().min(1),
  body: z.string().nullable(),
  priority: notificationPrioritySchema,
  readAt: z.iso.datetime().nullable(),
  linkUrl: z.string().min(1).nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const notificationListParamsSchema = z.strictObject({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
  read: z.boolean().optional(),
  category: notificationCategorySchema.optional(),
});

export const notificationListResponseSchema = z.strictObject({
  data: z.array(notificationSchema),
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

export const notificationReadResponseSchema = z.strictObject({
  data: z.strictObject({
    documentId: z.string().min(1),
    readAt: z.iso.datetime(),
  }),
});

export const notificationReadAllResponseSchema = z.strictObject({
  data: z.strictObject({ updated: z.number().int().min(0).max(100) }),
});
