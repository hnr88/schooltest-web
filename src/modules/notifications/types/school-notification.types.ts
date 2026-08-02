import type { z } from 'zod';

import type {
  schoolNotificationListParamsSchema,
  schoolNotificationListResponseSchema,
  schoolNotificationSchema,
} from '@/modules/notifications/schemas/school-notification.schema';

export type SchoolNotification = z.infer<typeof schoolNotificationSchema>;
export type SchoolNotificationListParams = z.infer<typeof schoolNotificationListParamsSchema>;
export type SchoolNotificationListResponse = z.infer<typeof schoolNotificationListResponseSchema>;
