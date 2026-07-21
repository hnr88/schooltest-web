import { z } from 'zod';

const pushSubscriptionKeysSchema = z.strictObject({
  p256dh: z.string().trim().min(1).max(255),
  auth: z.string().trim().min(1).max(255),
});

export const pushSubscriptionRequestSchema = z.strictObject({
  endpoint: z.string().trim().min(1).max(2048),
  keys: pushSubscriptionKeysSchema,
  expirationTime: z.number().int().nonnegative().nullable(),
  userAgent: z.string().trim().min(1).max(1000),
});

export const pushUnsubscribeRequestSchema = z.strictObject({
  endpoint: z.string().trim().min(1).max(2048),
});

export const pushVapidConfigResponseSchema = z.strictObject({
  data: z.strictObject({
    publicKey: z.string().min(1).nullable(),
  }),
});

export const pushSubscriptionResponseSchema = z.strictObject({
  data: z.strictObject({
    documentId: z.string().min(1),
    endpoint: z.string().trim().min(1).max(2048),
  }),
});

export const pushUnsubscribeResponseSchema = z.strictObject({
  data: z.strictObject({
    deleted: z.union([z.literal(0), z.literal(1)]),
  }),
});
