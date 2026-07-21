import type { z } from 'zod';

import type {
  notificationCategorySchema,
  notificationListParamsSchema,
  notificationListResponseSchema,
  notificationPrioritySchema,
  notificationReadAllResponseSchema,
  notificationReadResponseSchema,
  notificationSchema,
} from '@/modules/notifications/schemas/notification.schema';

export type Notification = z.infer<typeof notificationSchema>;
export type NotificationCategory = z.infer<typeof notificationCategorySchema>;
export type NotificationPriority = z.infer<typeof notificationPrioritySchema>;
export type NotificationListParams = z.infer<typeof notificationListParamsSchema>;
export type NotificationListResponse = z.infer<typeof notificationListResponseSchema>;
export type NotificationReadResponse = z.infer<typeof notificationReadResponseSchema>;
export type NotificationReadAllResponse = z.infer<typeof notificationReadAllResponseSchema>;
