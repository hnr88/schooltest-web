'use client';

import type { UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import { Alert } from '@/modules/design-system';
import {
  NOTIFICATION_CATEGORY_TOGGLES,
  NOTIFICATION_CHANNEL_TOGGLES,
} from '@/modules/notifications/constants/notification-preferences.constants';
import { NotificationDigestField } from '@/modules/notifications/components/NotificationDigestField';
import { NotificationPreferenceLockedGroup } from '@/modules/notifications/components/NotificationPreferenceLockedGroup';
import { NotificationPreferenceToggleGroup } from '@/modules/notifications/components/NotificationPreferenceToggleGroup';
import type {
  NotificationPreference,
  NotificationPreferenceFormValues,
} from '@/modules/notifications/types/notification-preference.types';

function NotificationPreferenceFields({
  form,
  preferences,
}: {
  form: UseFormReturn<NotificationPreferenceFormValues>;
  preferences: NotificationPreference | undefined;
}) {
  const t = useTranslations('Settings');

  return (
    <div className="flex flex-col gap-6">
      <NotificationPreferenceToggleGroup
        id="notification-delivery"
        title={t('notificationPreferences.deliveryTitle')}
        items={NOTIFICATION_CHANNEL_TOGGLES}
        form={form}
      />
      <NotificationPreferenceToggleGroup
        id="notification-category"
        title={t('notificationPreferences.categoriesTitle')}
        items={NOTIFICATION_CATEGORY_TOGGLES}
        form={form}
      />
      <NotificationPreferenceLockedGroup preferences={preferences} />
      <div className="grid gap-4 lg:grid-cols-2">
        <NotificationDigestField form={form} />
        <Alert variant="info" title={t('notificationPreferences.alwaysOnTitle')}>
          {t('notificationPreferences.alwaysOnDescription')}
        </Alert>
      </div>
    </div>
  );
}

export { NotificationPreferenceFields };
