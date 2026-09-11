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
export declare const PUSH_ENDPOINT_MAX = 255;
/** POST body — strict top-level and strict `keys`: an unknown key is a 400. */
export declare const pushSubscribeSchema: z.ZodObject<{
    endpoint: z.ZodString;
    keys: z.ZodObject<{
        p256dh: z.ZodString;
        auth: z.ZodString;
    }, z.core.$strict>;
    expirationTime: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    userAgent: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type PushSubscribeInput = z.infer<typeof pushSubscribeSchema>;
/** DELETE body — just the endpoint to remove (owner-scoped in the service). */
export declare const pushUnsubscribeSchema: z.ZodObject<{
    endpoint: z.ZodString;
}, z.core.$strict>;
export type PushUnsubscribeInput = z.infer<typeof pushUnsubscribeSchema>;
/** `GET /push-subscriptions/vapid-public-key` — null when the server has no VAPID key configured. */
export declare const pushVapidPublicKeyResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        publicKey: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>;
}, z.core.$strict>;
export type PushVapidPublicKeyResponse = z.infer<typeof pushVapidPublicKeyResponseSchema>;
/** POST response — the stored row's `documentId` and the endpoint as stored. */
export declare const pushSubscriptionRowSchema: z.ZodObject<{
    documentId: z.ZodString;
    endpoint: z.ZodString;
}, z.core.$strict>;
export type PushSubscriptionRow = z.infer<typeof pushSubscriptionRowSchema>;
/**
 * The POST envelope as the controller answers it: `ctx.body = { data: row }`
 * (`controllers/push-subscription.ts`, status 200 — an upsert, not a 201).
 */
export declare const pushSubscriptionResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        documentId: z.ZodString;
        endpoint: z.ZodString;
    }, z.core.$strict>;
}, z.core.$strict>;
export type PushSubscriptionResponse = z.infer<typeof pushSubscriptionResponseSchema>;
/** DELETE response — idempotent per owner: 0 when there was nothing to remove. */
export declare const pushUnsubscribeResultSchema: z.ZodObject<{
    data: z.ZodObject<{
        deleted: z.ZodUnion<readonly [z.ZodLiteral<0>, z.ZodLiteral<1>]>;
    }, z.core.$strict>;
}, z.core.$strict>;
export type PushUnsubscribeResult = z.infer<typeof pushUnsubscribeResultSchema>;
