'use client';

import { useMutation } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  pushSubscriptionRequestSchema,
  pushSubscriptionResponseSchema,
} from '@/modules/notifications/schemas/push-subscription.schema';
import type {
  PushSubscriptionRequest,
  PushSubscriptionResponse,
} from '@/modules/notifications/types/push-subscription.types';

async function subscribePush(
  subscription: PushSubscriptionRequest,
): Promise<PushSubscriptionResponse['data']> {
  const response = await strapi.post(
    '/api/push-subscriptions',
    pushSubscriptionRequestSchema.parse(subscription),
  );
  return pushSubscriptionResponseSchema.parse(response.data).data;
}

export function useSubscribePushMutation() {
  return useMutation({ mutationFn: subscribePush });
}
