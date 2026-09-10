import { NOTIFICATION_EVENTS_BY_CATEGORY } from '@/modules/notifications/constants/notification-preferences.constants';
import type {
  NotificationDigestFrequency,
  NotificationPreference,
  NotificationPreferenceFormValues,
} from '@/modules/notifications/types/notification-preference.types';

export function toNotificationPreferenceFormValues(
  preferences: NotificationPreference,
): NotificationPreferenceFormValues {
  return {
    emailEnabled: preferences.emailEnabled,
    smsEnabled: preferences.smsEnabled,
    inAppEnabled: preferences.inAppEnabled,
    pushEnabled: preferences.pushEnabled,
    digestFrequency: preferences.digestFrequency,
    eventPreferences: toEventSwitches(preferences),
  };
}

/**
 * Seed the six switches. A stored per-event value always wins; a row the
 * back-fill has not reached yet falls back to the CATEGORY the user actually
 * set, never to a blanket default-on — otherwise opening the settings page
 * would silently re-subscribe someone who had opted out.
 */
function toEventSwitches(
  preferences: NotificationPreference,
): NotificationPreferenceFormValues['eventPreferences'] {
  const stored = preferences.eventPreferences ?? {};
  const categories: Record<string, boolean> = {
    children: preferences.children,
    testActivity: preferences.testActivity,
    testResults: preferences.testResults,
  };

  const out: Record<string, boolean> = {};
  for (const category of Object.keys(NOTIFICATION_EVENTS_BY_CATEGORY)) {
    for (const event of NOTIFICATION_EVENTS_BY_CATEGORY[category]) {
      out[event] = typeof stored[event] === 'boolean' ? stored[event] : categories[category];
    }
  }
  return out as NotificationPreferenceFormValues['eventPreferences'];
}
