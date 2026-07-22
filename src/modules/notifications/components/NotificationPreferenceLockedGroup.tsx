'use client';

import { ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { BorderedCallout } from '@/modules/design-system';
import { PortalPanel } from '@/modules/notifications/components/PortalPanel';
import { PortalToggleRow } from '@/modules/notifications/components/PortalToggleRow';
import { NOTIFICATION_LOCKED_CATEGORIES } from '@/modules/notifications/constants/notification-preferences.constants';
import type { NotificationPreference } from '@/modules/notifications/types/notification-preference.types';

const NOTE_ID = 'notification-locked-note';

// Always-on rows stay rendered, checked and disabled — they mirror server state and
// never enter the form or the PUT payload. One callout carries the explanation for
// the whole group and every row points aria-describedby at it.
function NotificationPreferenceLockedGroup({
  preferences,
}: {
  preferences: NotificationPreference | undefined;
}) {
  const t = useTranslations('Settings');

  return (
    <PortalPanel
      id="notification-locked"
      title={t('notificationPreferences.lockedTitle')}
      description={t('notificationPreferences.alwaysOnTitle')}
    >
      <div className="flex flex-col">
        {NOTIFICATION_LOCKED_CATEGORIES.map((item) => (
          <PortalToggleRow
            key={item.field}
            title={t(item.titleKey)}
            description={t(item.descriptionKey)}
            describedById={NOTE_ID}
            checked={preferences?.[item.field] ?? true}
            disabled
            onCheckedChange={() => undefined}
          />
        ))}
      </div>
      {/* The id rides on a wrapper because BorderedCallout takes no id — the
          describedby target only has to be the element that CONTAINS the text. */}
      <div id={NOTE_ID} className="mt-4">
        <BorderedCallout icon={ShieldCheck}>
          {t('notificationPreferences.alwaysOnDescription')}
        </BorderedCallout>
      </div>
    </PortalPanel>
  );
}

export { NotificationPreferenceLockedGroup };
