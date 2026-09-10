'use client';

import type { UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import {
  NOTIFICATION_CHANNEL_TOGGLES,
  NOTIFICATION_EVENT_TOGGLES,
} from '@/modules/notifications/constants/notification-preferences.constants';
import { NotificationPreferenceEventGroup } from '@/modules/notifications/components/NotificationPreferenceEventGroup';
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
      <NotificationPreferenceEventGroup
        title={t('notificationPreferences.eventsTitle')}
        items={NOTIFICATION_EVENT_TOGGLES}
        form={form}
        divided
      />
    </div>
  );
}

export { NotificationPreferenceFields };
