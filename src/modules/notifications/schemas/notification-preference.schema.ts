import { z } from 'zod';

import { NOTIFICATION_DIGEST_FREQUENCIES } from '@/modules/notifications/constants/notification-preferences.constants';

export const notificationDigestFrequencySchema = z.enum(NOTIFICATION_DIGEST_FREQUENCIES);

/**
 * Row 05 (D-01) — the six switchable EVENTS, in the order the card renders.
 * account/security events carry no key and can never be switched off, so they
 * are absent here by construction, not by a runtime check.
 */
export const NOTIFICATION_EVENT_KEYS = [
  'test_results_ready',
  'test_results_updated',
  'session_completed',
  'session_started',
  'student_created',
  'student_email_fix_requested',
] as const;

export const notificationEventPreferencesSchema = z.strictObject(
  Object.fromEntries(NOTIFICATION_EVENT_KEYS.map((k) => [k, z.boolean()])) as Record<
    (typeof NOTIFICATION_EVENT_KEYS)[number],
    z.ZodBoolean
  >,
);

/**
 * What the CARD submits. Row 05: the three category booleans are NOT here any
 * more — the card offers per-EVENT switches, and the server recomputes each
 * category as the AND over its events (one authority, D-01). Sending both
 * would be two writers racing for one column.
 */
export const notificationPreferenceFormSchema = z.strictObject({
  eventPreferences: notificationEventPreferencesSchema,
  emailEnabled: z.boolean(),
  smsEnabled: z.boolean(),
  inAppEnabled: z.boolean(),
  pushEnabled: z.boolean(),
  digestFrequency: notificationDigestFrequencySchema,
});

export const notificationPreferenceSchema = notificationPreferenceFormSchema.extend({
  documentId: z.string().min(1),
  account: z.boolean(),
  security: z.boolean(),
  // Derived server-side from the events; read-only to this client.
  children: z.boolean(),
  testActivity: z.boolean(),
  testResults: z.boolean(),
  // Nullable: a row the back-fill has not reached yet.
  eventPreferences: z.record(z.string(), z.boolean()).nullable().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const notificationPreferenceResponseSchema = z.strictObject({
  data: notificationPreferenceSchema,
});
