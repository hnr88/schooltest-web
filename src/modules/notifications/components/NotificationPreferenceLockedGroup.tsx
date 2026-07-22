'use client';

import { useTranslations } from 'next-intl';

import {
  NOTIFICATION_LOCKED_CATEGORIES,
  NOTIFICATION_SECTION_LABEL_CLASS,
} from '@/modules/notifications/constants/notification-preferences.constants';
import { NotificationPreferenceToggle } from '@/modules/notifications/components/NotificationPreferenceToggle';
import type { NotificationPreference } from '@/modules/notifications/types/notification-preference.types';

// Always-on rows stay rendered, checked and disabled — they mirror server state
// and never enter the form or the PUT payload.
function NotificationPreferenceLockedGroup({
  preferences,
}: {
  preferences: NotificationPreference | undefined;
}) {
  const t = useTranslations('Settings');

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className={NOTIFICATION_SECTION_LABEL_CLASS}>
        {t('notificationPreferences.lockedTitle')}
      </legend>
      <div className="flex flex-col">
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
