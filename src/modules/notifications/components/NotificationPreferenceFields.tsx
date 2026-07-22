'use client';

import type { UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import {
  NOTIFICATION_CATEGORY_TOGGLES,
  NOTIFICATION_CHANNEL_TOGGLES,
} from '@/modules/notifications/constants/notification-preferences.constants';
import { NotificationPreferenceLockedGroup } from '@/modules/notifications/components/NotificationPreferenceLockedGroup';
import { NotificationPreferenceToggleGroup } from '@/modules/notifications/components/NotificationPreferenceToggleGroup';
import type {
  NotificationPreference,
  NotificationPreferenceFormValues,
} from '@/modules/notifications/types/notification-preference.types';

// Three labelled row stacks on shared hairlines — the canonical Notifications
// card rhythm (§36): one card, rows divided by a #F1F5F9 rule, last row bare.
function NotificationPreferenceFields({
  form,
  preferences,
}: {
  form: UseFormReturn<NotificationPreferenceFormValues>;
  preferences: NotificationPreference | undefined;
}) {
  const t = useTranslations('Settings');

  return (
    <div className="flex flex-col gap-5">
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
    </div>
  );
}

export { NotificationPreferenceFields };
