'use client';

import { useTranslations } from 'next-intl';

import { NOTIFICATION_LOCKED_CATEGORIES } from '@/modules/notifications/constants/notification-preferences.constants';
import { NotificationPreferenceToggle } from '@/modules/notifications/components/NotificationPreferenceToggle';
import type { NotificationPreference } from '@/modules/notifications/types/notification-preference.types';

function NotificationPreferenceLockedGroup({
  preferences,
}: {
  preferences: NotificationPreference | undefined;
}) {
  const t = useTranslations('Settings');

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-semibold text-foreground">
        {t('notificationPreferences.lockedTitle')}
      </legend>
      <div className="grid gap-3 lg:grid-cols-2">
        {NOTIFICATION_LOCKED_CATEGORIES.map((item) => (
          <NotificationPreferenceToggle
            key={item.field}
            id={`notification-locked-${item.field}`}
            title={t(item.titleKey)}
            description={t(item.descriptionKey)}
            helper={t('notificationPreferences.lockedHelper')}
            helperTone="muted"
            checked={preferences?.[item.field] ?? true}
            disabled
            onCheckedChange={() => undefined}
          />
        ))}
      </div>
    </fieldset>
  );
}

export { NotificationPreferenceLockedGroup };
