'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { notificationPreferenceResponseSchema } from '@/modules/notifications/schemas/notification-preference.schema';
import type { NotificationPreference } from '@/modules/notifications/types/notification-preference.types';
import { NOTIFICATION_PREFERENCES_QUERY_KEY } from '@/modules/notifications/constants/queries.constants';

async function fetchNotificationPreferences(): Promise<NotificationPreference> {
  const response = await strapi.get('/api/notification-preferences/me');
  return notificationPreferenceResponseSchema.parse(response.data).data;
}

export function useNotificationPreferencesQuery() {
  return useQuery({
    queryKey: NOTIFICATION_PREFERENCES_QUERY_KEY,
    queryFn: fetchNotificationPreferences,
    staleTime: 0,
    retry: false,
  });
}
