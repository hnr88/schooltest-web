import type {
  NotificationPreference,
  NotificationPreferenceFormValues,
} from '@/modules/notifications/types/notification-preference.types';

export function toNotificationPreferenceFormValues(
  preferences: NotificationPreference,
): NotificationPreferenceFormValues {
  return {
    emailEnabled: preferences.emailEnabled,
    inAppEnabled: preferences.inAppEnabled,
    children: preferences.children,
    testActivity: preferences.testActivity,
    testResults: preferences.testResults,
    digestFrequency: preferences.digestFrequency,
  };
}
