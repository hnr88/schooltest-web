'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { NOTIFICATION_PREFERENCES_QUERY_KEY } from '@/modules/notifications/queries/use-notification-preferences.query';
import {
  notificationPreferenceFormSchema,
  notificationPreferenceResponseSchema,
} from '@/modules/notifications/schemas/notification-preference.schema';
import type {
  NotificationPreference,
  NotificationPreferenceFormValues,
} from '@/modules/notifications/types/notification-preference.types';

async function updateNotificationPreferences(
  values: NotificationPreferenceFormValues,
): Promise<NotificationPreference> {
  const response = await strapi.put(
    '/api/notification-preferences/me',
    notificationPreferenceFormSchema.parse(values),
  );
  return notificationPreferenceResponseSchema.parse(response.data).data;
}

export function useUpdateNotificationPreferencesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: (preferences) => {
      queryClient.setQueryData(NOTIFICATION_PREFERENCES_QUERY_KEY, preferences);
    },
  });
}
