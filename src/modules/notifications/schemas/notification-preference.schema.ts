import { z } from 'zod';

import {
  notificationChannelsSchema,
  notificationDigestFrequencySchema,
  notificationEventPreferencesSchema,
  SUPPRESSIBLE_EVENT_KEYS,
} from '@schooltest/notification-contracts';

/**
 * The preference wire contracts — the PARTS come from
 * `@schooltest/notification-contracts` (mvp/notifications row 02, D-05) so the
 * taxonomy, the channel set and the digest frequencies have one source. The
 * card's FORM shape stays composed here: it is the settings card's own submit
 * body (per-EVENT switches + the global channel masters), a UI concern the
 * package deliberately leaves to the client that renders it (row 05, D-01).
 */

/**
 * The switchable EVENTS, in the order the card renders — the package's
 * suppressible set (account/security carry no key and can never be switched
 * off, so they are absent by construction, not by a runtime check).
 */
export const NOTIFICATION_EVENT_KEYS = SUPPRESSIBLE_EVENT_KEYS;

export { notificationDigestFrequencySchema, notificationEventPreferencesSchema };

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

/**
 * What the server returns for `/api/notification-preferences/me` — the
 * package's row (channels + categories + the locked pair + the per-event map)
 * with this client's names.
 */
export {
  notificationPreferenceResponseSchema,
  notificationPreferenceSchema,
} from '@schooltest/notification-contracts';
