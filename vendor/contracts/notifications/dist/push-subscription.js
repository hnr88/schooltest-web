"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushUnsubscribeResultSchema = exports.pushSubscriptionResponseSchema = exports.pushSubscriptionRowSchema = exports.pushVapidPublicKeyResponseSchema = exports.pushUnsubscribeSchema = exports.pushSubscribeSchema = exports.PUSH_ENDPOINT_MAX = void 0;
const zod_1 = require("zod");
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
exports.PUSH_ENDPOINT_MAX = 255;
const pushEndpointSchema = zod_1.z
    .string()
    .trim()
    .min(1)
    .max(exports.PUSH_ENDPOINT_MAX, {
    message: `endpoint must be at most ${exports.PUSH_ENDPOINT_MAX} characters (the storage column limit)`,
});
const pushKeysSchema = zod_1.z.strictObject({
    p256dh: zod_1.z.string().trim().min(1).max(255),
    auth: zod_1.z.string().trim().min(1).max(255),
});
/** POST body — strict top-level and strict `keys`: an unknown key is a 400. */
exports.pushSubscribeSchema = zod_1.z.strictObject({
    endpoint: pushEndpointSchema,
    keys: pushKeysSchema,
    /** Epoch-ms | null (usually null). Absent is valid — older browsers omit it. */
    expirationTime: zod_1.z.number().int().nonnegative().max(8640000000000000).nullable().optional(),
    /** Optional: the controller falls back to the request `user-agent` header. */
    userAgent: zod_1.z.string().trim().min(1).max(1000).optional(),
});
/** DELETE body — just the endpoint to remove (owner-scoped in the service). */
exports.pushUnsubscribeSchema = zod_1.z.strictObject({
    endpoint: pushEndpointSchema,
});
/** `GET /push-subscriptions/vapid-public-key` — null when the server has no VAPID key configured. */
exports.pushVapidPublicKeyResponseSchema = zod_1.z.strictObject({
    data: zod_1.z.strictObject({
        publicKey: zod_1.z.string().min(1).nullable(),
    }),
});
/** POST response — the stored row's `documentId` and the endpoint as stored. */
exports.pushSubscriptionRowSchema = zod_1.z.strictObject({
    documentId: zod_1.z.string().min(1),
    endpoint: pushEndpointSchema,
});
/**
 * The POST envelope as the controller answers it: `ctx.body = { data: row }`
 * (`controllers/push-subscription.ts`, status 200 — an upsert, not a 201).
 */
exports.pushSubscriptionResponseSchema = zod_1.z.strictObject({
    data: exports.pushSubscriptionRowSchema,
});
/** DELETE response — idempotent per owner: 0 when there was nothing to remove. */
exports.pushUnsubscribeResultSchema = zod_1.z.strictObject({
    data: zod_1.z.strictObject({
        deleted: zod_1.z.union([zod_1.z.literal(0), zod_1.z.literal(1)]),
    }),
});
