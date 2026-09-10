"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationPreferenceUpdateSchema = exports.notificationPreferenceResponseSchema = exports.notificationPreferenceSchema = exports.notificationLockedFlagsSchema = exports.notificationCategoryFlagsSchema = exports.notificationEventPreferencesSchema = exports.notificationChannelsSchema = exports.notificationDigestFrequencySchema = void 0;
const zod_1 = require("zod");
const event_types_1 = require("./event-types");
/**
 * C-PREF-GET / C-PREF-UPDATE — `/api/notification-preferences/me`.
 *
 * Row 02 (D-05): this shape had NO Zod anywhere. It was documented in markdown
 * on two boards, with `mvp/desktop-app/contracts/notifications.md` recording
 * "no Zod, and none is added" — while both clients wrote it by hand.
 *
 * Composed from named parts rather than one flat object so row 04's per-event
 * map sits BESIDE the channels and the digest instead of being spliced into a
 * literal that three files would then re-copy.
 */
exports.notificationDigestFrequencySchema = zod_1.z.enum(['immediate', 'daily', 'weekly', 'off']);
/** The global master per transport. Per-event says WHETHER; these say HOW. */
exports.notificationChannelsSchema = zod_1.z.object({
    emailEnabled: zod_1.z.boolean(),
    smsEnabled: zod_1.z.boolean(),
    inAppEnabled: zod_1.z.boolean(),
    pushEnabled: zod_1.z.boolean(),
});
/**
 * Row 04 (D-01) — the per-event map. Only suppressible events appear;
 * account/security carry no key and cannot be switched off in any layer.
 */
exports.notificationEventPreferencesSchema = zod_1.z.object(Object.fromEntries(event_types_1.SUPPRESSIBLE_EVENT_KEYS.map((k) => [k, zod_1.z.boolean()])));
/**
 * The DERIVED bulk control. Each category is recomputed server-side as the AND
 * over its events and is written by nothing else (row 04's one-authority rule),
 * so a client that submits both would be a second writer racing for one column.
 */
exports.notificationCategoryFlagsSchema = zod_1.z.object({
    children: zod_1.z.boolean(),
    testActivity: zod_1.z.boolean(),
    testResults: zod_1.z.boolean(),
});
/** Locked on, in every layer. */
exports.notificationLockedFlagsSchema = zod_1.z.object({
    account: zod_1.z.boolean(),
    security: zod_1.z.boolean(),
});
/** What the server returns. `eventPreferences` is null for an un-swept row. */
exports.notificationPreferenceSchema = exports.notificationChannelsSchema
    .merge(exports.notificationCategoryFlagsSchema)
    .merge(exports.notificationLockedFlagsSchema)
    .extend({
    documentId: zod_1.z.string().min(1),
    digestFrequency: exports.notificationDigestFrequencySchema,
    eventPreferences: zod_1.z.record(zod_1.z.string(), zod_1.z.boolean()).nullable(),
    createdAt: zod_1.z.iso.datetime(),
    updatedAt: zod_1.z.iso.datetime(),
});
exports.notificationPreferenceResponseSchema = zod_1.z.strictObject({
    data: exports.notificationPreferenceSchema,
});
/**
 * The PUT body. A NON-STRICT partial, deliberately: the server IGNORES unknown
 * keys and answers 200, so a strict schema here would turn a working request
 * into a 400 the API never raises. Every field optional — the handler applies
 * only what it is sent.
 */
exports.notificationPreferenceUpdateSchema = exports.notificationChannelsSchema
    .merge(exports.notificationCategoryFlagsSchema)
    .extend({
    digestFrequency: exports.notificationDigestFrequencySchema,
    eventPreferences: exports.notificationEventPreferencesSchema.partial(),
})
    .partial();
