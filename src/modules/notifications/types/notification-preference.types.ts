import type { z } from 'zod';

import type {
  notificationDigestFrequencySchema,
  notificationPreferenceFormSchema,
  notificationPreferenceSchema,
} from '@/modules/notifications/schemas/notification-preference.schema';

export type NotificationPreference = z.infer<typeof notificationPreferenceSchema>;
export type NotificationPreferenceFormValues = z.infer<typeof notificationPreferenceFormSchema>;
export type NotificationDigestFrequency = z.infer<typeof notificationDigestFrequencySchema>;

export type NotificationPreferenceToggleField =
  'emailEnabled' | 'inAppEnabled' | 'children' | 'testActivity' | 'testResults';

export interface NotificationPreferenceToggleConfig {
  field: NotificationPreferenceToggleField;
  titleKey: string;
  descriptionKey: string;
}
