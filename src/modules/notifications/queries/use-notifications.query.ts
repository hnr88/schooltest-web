'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  notificationListParamsSchema,
  notificationListResponseSchema,
} from '@/modules/notifications/schemas/notification.schema';
import type {
  NotificationListParams,
  NotificationListResponse,
} from '@/modules/notifications/types/notification.types';
import { NOTIFICATIONS_QUERY_KEY } from '@/modules/notifications/constants/queries.constants';

async function fetchNotifications(params: NotificationListParams): Promise<NotificationListResponse> {
  const validated = notificationListParamsSchema.parse(params);
  const response = await strapi.get('/api/notifications', { params: validated });

  return notificationListResponseSchema.parse(response.data);
}

export function useNotificationsQuery(params: NotificationListParams) {
  const validated = notificationListParamsSchema.parse(params);

  return useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, 'list', validated],
    queryFn: () => fetchNotifications(validated),
    staleTime: 0,
    retry: false,
  });
}
