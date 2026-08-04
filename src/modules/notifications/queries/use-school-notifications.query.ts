'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { NOTIFICATIONS_QUERY_KEY } from '@/modules/notifications/constants/queries.constants';
import {
  schoolNotificationListParamsSchema,
  schoolNotificationListResponseSchema,
} from '@/modules/notifications/schemas/school-notification.schema';
import type {
  SchoolNotificationListParams,
  SchoolNotificationListResponse,
} from '@/modules/notifications/types/school-notification.types';
import { SCHOOL_NOTIFICATIONS_QUERY_KEY } from '@/modules/notifications/constants/queries.constants';

async function fetchSchoolNotifications(
  params: SchoolNotificationListParams,
): Promise<SchoolNotificationListResponse> {
  const validated = schoolNotificationListParamsSchema.parse(params);
  const response = await strapi.get('/api/schools/me/notifications', { params: validated });

  return schoolNotificationListResponseSchema.parse(response.data);
}

// C-NOT-01 (task 113): the caller's own school notification feed. The server
// scopes rows to the caller's JWT (teacher | school_admin), so the key needs
// no user id - the same "me" convention as use-teach-home.query.ts.
export function useSchoolNotificationsQuery(params: SchoolNotificationListParams) {
  const validated = schoolNotificationListParamsSchema.parse(params);

  return useQuery({
    queryKey: [...SCHOOL_NOTIFICATIONS_QUERY_KEY, validated],
    queryFn: () => fetchSchoolNotifications(validated),
    staleTime: 0,
    retry: false,
  });
}
