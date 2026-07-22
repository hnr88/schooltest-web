import { NOTIFICATION_DIGEST_SELECTABLE_FREQUENCIES } from '@/modules/notifications/constants/notification-preferences.constants';
import type {
  NotificationDigestFrequency,
  NotificationPreference,
  NotificationPreferenceFormValues,
} from '@/modules/notifications/types/notification-preference.types';

export function isSelectableDigestFrequency(value: NotificationDigestFrequency): boolean {
  return (NOTIFICATION_DIGEST_SELECTABLE_FREQUENCIES as readonly string[]).includes(value);
}

export function toNotificationPreferenceFormValues(
  preferences: NotificationPreference,
): NotificationPreferenceFormValues {
  return {
    emailEnabled: preferences.emailEnabled,
    smsEnabled: preferences.smsEnabled,
    inAppEnabled: preferences.inAppEnabled,
    pushEnabled: preferences.pushEnabled,
    children: preferences.children,
    testActivity: preferences.testActivity,
    testResults: preferences.testResults,
    digestFrequency: preferences.digestFrequency,
  };
}
