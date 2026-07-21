import { z } from 'zod';

import { NOTIFICATION_DIGEST_FREQUENCIES } from '@/modules/notifications/constants/notification-preferences.constants';

export const notificationDigestFrequencySchema = z.enum(NOTIFICATION_DIGEST_FREQUENCIES);

export const notificationPreferenceFormSchema = z.strictObject({
  emailEnabled: z.boolean(),
  inAppEnabled: z.boolean(),
  children: z.boolean(),
  testActivity: z.boolean(),
  testResults: z.boolean(),
  digestFrequency: notificationDigestFrequencySchema,
});

export const notificationPreferenceSchema = notificationPreferenceFormSchema.extend({
  documentId: z.string().min(1),
  smsEnabled: z.boolean(),
  pushEnabled: z.boolean(),
  account: z.boolean(),
  security: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const notificationPreferenceResponseSchema = z.strictObject({
  data: notificationPreferenceSchema,
});
