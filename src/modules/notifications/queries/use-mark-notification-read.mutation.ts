'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { strapi } from '@/lib/axios/strapi';
import { NOTIFICATIONS_QUERY_KEY } from '@/modules/notifications/queries/use-notifications.query';
import { notificationReadResponseSchema } from '@/modules/notifications/schemas/notification.schema';
import type { NotificationReadResponse } from '@/modules/notifications/types/notification.types';

const notificationDocumentIdSchema = z.string().min(1);

async function markNotificationRead(documentId: string): Promise<NotificationReadResponse['data']> {
  const response = await strapi.put(
    `/api/notifications/${notificationDocumentIdSchema.parse(documentId)}/read`,
  );

  return notificationReadResponseSchema.parse(response.data).data;
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
  });
}
