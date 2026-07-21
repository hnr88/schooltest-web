'use client';

import { useMutation } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  pushUnsubscribeRequestSchema,
  pushUnsubscribeResponseSchema,
} from '@/modules/notifications/schemas/push-subscription.schema';
import type {
  PushUnsubscribeRequest,
  PushUnsubscribeResponse,
} from '@/modules/notifications/types/push-subscription.types';

async function unsubscribePush(
  subscription: PushUnsubscribeRequest,
): Promise<PushUnsubscribeResponse['data']> {
  const response = await strapi.delete('/api/push-subscriptions', {
    data: pushUnsubscribeRequestSchema.parse(subscription),
  });
  return pushUnsubscribeResponseSchema.parse(response.data).data;
}

export function useUnsubscribePushMutation() {
  return useMutation({ mutationFn: unsubscribePush });
}
