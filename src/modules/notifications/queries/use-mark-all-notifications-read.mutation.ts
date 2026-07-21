'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { NOTIFICATIONS_QUERY_KEY } from '@/modules/notifications/queries/use-notifications.query';
import { notificationReadAllResponseSchema } from '@/modules/notifications/schemas/notification.schema';
import type { NotificationReadAllResponse } from '@/modules/notifications/types/notification.types';

async function markAllNotificationsRead(): Promise<NotificationReadAllResponse['data']> {
  const response = await strapi.post('/api/notifications/read-all');

  return notificationReadAllResponseSchema.parse(response.data).data;
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
  });
}
