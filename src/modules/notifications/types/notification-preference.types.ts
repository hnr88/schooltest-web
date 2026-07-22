import type { z } from 'zod';

import type {
  notificationDigestFrequencySchema,
  notificationPreferenceFormSchema,
  notificationPreferenceSchema,
} from '@/modules/notifications/schemas/notification-preference.schema';

export type NotificationPreference = z.infer<typeof notificationPreferenceSchema>;
export type NotificationPreferenceFormValues = z.infer<typeof notificationPreferenceFormSchema>;
export type NotificationDigestFrequency = z.infer<typeof notificationDigestFrequencySchema>;

export type NotificationPreferenceToggleField = {
  [K in keyof NotificationPreferenceFormValues]: NotificationPreferenceFormValues[K] extends boolean
    ? K
    : never;
}[keyof NotificationPreferenceFormValues];

export type NotificationPreferenceLockedField = 'account' | 'security';

export interface NotificationPreferenceToggleConfig {
  field: NotificationPreferenceToggleField;
  titleKey: string;
  descriptionKey: string;
  helperKey?: string;
}

export interface NotificationPreferenceLockedConfig {
  field: NotificationPreferenceLockedField;
  titleKey: string;
  descriptionKey: string;
}
