'use client';

import type { UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import {
  NOTIFICATION_CATEGORY_TOGGLES,
  NOTIFICATION_CHANNEL_TOGGLES,
} from '@/modules/notifications/constants/notification-preferences.constants';
import { NotificationPreferenceToggleGroup } from '@/modules/notifications/components/NotificationPreferenceToggleGroup';
import type { NotificationPreferenceFormValues } from '@/modules/notifications/types/notification-preference.types';

function NotificationPreferenceFields({
  form,
}: {
  form: UseFormReturn<NotificationPreferenceFormValues>;
}) {
  const t = useTranslations('Settings');

  return (
    <div className="flex flex-col">
      <NotificationPreferenceToggleGroup
        title={t('notificationPreferences.deliveryTitle')}
        items={NOTIFICATION_CHANNEL_TOGGLES}
        form={form}
      />
      <NotificationPreferenceToggleGroup
        title={t('notificationPreferences.categoriesTitle')}
        items={NOTIFICATION_CATEGORY_TOGGLES}
        form={form}
        divided
      />
    </div>
  );
}

export { NotificationPreferenceFields };
