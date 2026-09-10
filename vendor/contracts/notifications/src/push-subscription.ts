import { z } from 'zod';

/**
 * C-PUSH-SUBSCRIBE / C-PUSH-UNSUBSCRIBE / the VAPID public-key read — the wire
 * shapes for `POST /api/push-subscriptions`, `DELETE /api/push-subscriptions`
 * and `GET /api/push-subscriptions/vapid-public-key` (mvp/notifications row 02,
 * D-05). The body is the browser's `PushSubscription.toJSON()`.
 *
 * C-05 — the endpoint is capped at 255, NOT the 2048 the api contract used to
 * allow. The `push-subscriptions.endpoint` column is `type: "string"`, which is
 * varchar(255), `required` and `unique`
 * (`content-types/push-subscription/schema.json:14-18`): a 2048-char endpoint
 * passed the old Zod and then 500ed on insert. 255 is the honest ceiling; the
 * only changed outcome is 500 → 400. Real FCM endpoints run 150–200 chars, so
 * nothing that works today regresses. If a rejection is ever observed, the
 * follow-up is a column migration, recorded on gap-map C-05 — never a quiet
 * widening here.
 */

/** Error message shared by both endpoint fields, so the 400 names the limit. */
export const PUSH_ENDPOINT_MAX = 255;

const pushEndpointSchema = z
  .string()
  .trim()
  .min(1)
  .max(PUSH_ENDPOINT_MAX, {
    message: `endpoint must be at most ${PUSH_ENDPOINT_MAX} characters (the storage column limit)`,
  });

const pushKeysSchema = z.strictObject({
  p256dh: z.string().trim().min(1).max(255),
  auth: z.string().trim().min(1).max(255),
});

/** POST body — strict top-level and strict `keys`: an unknown key is a 400. */
export const pushSubscribeSchema = z.strictObject({
  endpoint: pushEndpointSchema,
  keys: pushKeysSchema,
  /** Epoch-ms | null (usually null). Absent is valid — older browsers omit it. */
  expirationTime: z.number().int().nonnegative().max(8_640_000_000_000_000).nullable().optional(),
  /** Optional: the controller falls back to the request `user-agent` header. */
  userAgent: z.string().trim().min(1).max(1000).optional(),
});
export type PushSubscribeInput = z.infer<typeof pushSubscribeSchema>;

/** DELETE body — just the endpoint to remove (owner-scoped in the service). */
export const pushUnsubscribeSchema = z.strictObject({
  endpoint: pushEndpointSchema,
});
export type PushUnsubscribeInput = z.infer<typeof pushUnsubscribeSchema>;

/** `GET /push-subscriptions/vapid-public-key` — null when the server has no VAPID key configured. */
export const pushVapidPublicKeyResponseSchema = z.strictObject({
  data: z.strictObject({
    publicKey: z.string().min(1).nullable(),
  }),
});
export type PushVapidPublicKeyResponse = z.infer<typeof pushVapidPublicKeyResponseSchema>;

/** POST response — the stored row's `documentId` and the endpoint as stored. */
export const pushSubscriptionRowSchema = z.strictObject({
  documentId: z.string().min(1),
  endpoint: pushEndpointSchema,
});
export type PushSubscriptionRow = z.infer<typeof pushSubscriptionRowSchema>;

/**
 * The POST envelope as the controller answers it: `ctx.body = { data: row }`
 * (`controllers/push-subscription.ts`, status 200 — an upsert, not a 201).
 */
export const pushSubscriptionResponseSchema = z.strictObject({
  data: pushSubscriptionRowSchema,
});
export type PushSubscriptionResponse = z.infer<typeof pushSubscriptionResponseSchema>;

/** DELETE response — idempotent per owner: 0 when there was nothing to remove. */
export const pushUnsubscribeResultSchema = z.strictObject({
  data: z.strictObject({
    deleted: z.union([z.literal(0), z.literal(1)]),
  }),
});
export type PushUnsubscribeResult = z.infer<typeof pushUnsubscribeResultSchema>;
