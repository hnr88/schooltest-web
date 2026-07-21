'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { pushVapidConfigResponseSchema } from '@/modules/notifications/schemas/push-subscription.schema';

export const VAPID_PUBLIC_KEY_QUERY_KEY = ['push-subscriptions', 'vapid-public-key'] as const;

async function fetchVapidPublicKey(): Promise<string | null> {
  const response = await strapi.get('/api/push-subscriptions/vapid-public-key');
  return pushVapidConfigResponseSchema.parse(response.data).data.publicKey;
}

export function useVapidPublicKeyQuery() {
  return useQuery({
    queryKey: VAPID_PUBLIC_KEY_QUERY_KEY,
    queryFn: fetchVapidPublicKey,
    staleTime: 0,
    retry: false,
  });
}
