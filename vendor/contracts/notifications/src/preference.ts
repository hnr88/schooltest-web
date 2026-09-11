import { z } from 'zod';

import { SUPPRESSIBLE_EVENT_KEYS } from './event-types';

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

export const notificationDigestFrequencySchema = z.enum(['immediate', 'daily', 'weekly', 'off']);
export type NotificationDigestFrequency = z.infer<typeof notificationDigestFrequencySchema>;

/** The global master per transport. Per-event says WHETHER; these say HOW. */
export const notificationChannelsSchema = z.object({
  emailEnabled: z.boolean(),
  smsEnabled: z.boolean(),
  inAppEnabled: z.boolean(),
  pushEnabled: z.boolean(),
});

/**
 * Row 04 (D-01) — the per-event map. Only suppressible events appear;
 * account/security carry no key and cannot be switched off in any layer.
 */
export const notificationEventPreferencesSchema = z.object(
  Object.fromEntries(SUPPRESSIBLE_EVENT_KEYS.map((k) => [k, z.boolean()])) as Record<
    (typeof SUPPRESSIBLE_EVENT_KEYS)[number],
    z.ZodBoolean
  >,
);

/**
 * The DERIVED bulk control. Each category is recomputed server-side as the AND
 * over its events and is written by nothing else (row 04's one-authority rule),
 * so a client that submits both would be a second writer racing for one column.
 */
export const notificationCategoryFlagsSchema = z.object({
  children: z.boolean(),
  testActivity: z.boolean(),
  testResults: z.boolean(),
});

/** Locked on, in every layer. */
export const notificationLockedFlagsSchema = z.object({
  account: z.boolean(),
  security: z.boolean(),
});

/** What the server returns. `eventPreferences` is null for an un-swept row. */
export const notificationPreferenceSchema = notificationChannelsSchema
  .merge(notificationCategoryFlagsSchema)
  .merge(notificationLockedFlagsSchema)
  .extend({
    documentId: z.string().min(1),
    digestFrequency: notificationDigestFrequencySchema,
    eventPreferences: z.record(z.string(), z.boolean()).nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  });
export type NotificationPreference = z.infer<typeof notificationPreferenceSchema>;

export const notificationPreferenceResponseSchema = z.strictObject({
  data: notificationPreferenceSchema,
});

/**
 * The PUT body. A NON-STRICT partial, deliberately: the server IGNORES unknown
 * keys and answers 200, so a strict schema here would turn a working request
 * into a 400 the API never raises. Every field optional — the handler applies
 * only what it is sent.
 */
export const notificationPreferenceUpdateSchema = notificationChannelsSchema
  .merge(notificationCategoryFlagsSchema)
  .extend({
    digestFrequency: notificationDigestFrequencySchema,
    eventPreferences: notificationEventPreferencesSchema.partial(),
  })
  .partial();
export type NotificationPreferenceUpdate = z.infer<typeof notificationPreferenceUpdateSchema>;
