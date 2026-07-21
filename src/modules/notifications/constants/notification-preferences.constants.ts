import type { NotificationPreferenceFormValues } from '@/modules/notifications/types/notification-preference.types';

export const NOTIFICATION_DIGEST_FREQUENCIES = ['immediate', 'daily', 'weekly', 'off'] as const;

export const NOTIFICATION_PREFERENCE_DEFAULTS: NotificationPreferenceFormValues = {
  emailEnabled: true,
  inAppEnabled: true,
  children: true,
  testActivity: true,
  testResults: true,
  digestFrequency: 'immediate',
};
