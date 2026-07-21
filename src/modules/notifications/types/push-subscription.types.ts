import type { z } from 'zod';

import type {
  pushSubscriptionRequestSchema,
  pushSubscriptionResponseSchema,
  pushUnsubscribeRequestSchema,
  pushUnsubscribeResponseSchema,
  pushVapidConfigResponseSchema,
} from '@/modules/notifications/schemas/push-subscription.schema';

export type PushSubscriptionRequest = z.infer<typeof pushSubscriptionRequestSchema>;
export type PushSubscriptionResponse = z.infer<typeof pushSubscriptionResponseSchema>;
export type PushUnsubscribeRequest = z.infer<typeof pushUnsubscribeRequestSchema>;
export type PushUnsubscribeResponse = z.infer<typeof pushUnsubscribeResponseSchema>;
export type PushVapidConfigResponse = z.infer<typeof pushVapidConfigResponseSchema>;

export type BrowserPushStatus =
  | 'checking'
  | 'ready'
  | 'subscribed'
  | 'unsupported'
  | 'permission-denied'
  | 'not-configured'
  | 'error';
