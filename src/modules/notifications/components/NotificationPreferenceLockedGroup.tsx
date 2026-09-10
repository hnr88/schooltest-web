'use client';

import { ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { BorderedCallout } from '@/modules/design-system';
import { PortalPanel } from '@/modules/notifications/components/PortalPanel';
import { PortalToggleRow } from '@/modules/notifications/components/PortalToggleRow';
import { NOTIFICATION_LOCKED_CATEGORIES } from '@/modules/notifications/constants/notification-preferences.constants';
import type { NotificationPreference } from '@/modules/notifications/types/notification-preference.types';
import { NOTE_ID } from '@/modules/notifications/constants/components.constants';

// Always-on rows stay rendered, checked and disabled — they mirror server state and
// never enter the form or the PUT payload. One callout carries the explanation for
// the whole group and every row points aria-describedby at it.
// P-08 — these switches ASSERT, they do not mirror. They used to render
// `preferences?.[field] ?? true`, so a row with `account:false` (writable in
// the Strapi admin even though the API whitelist excludes it) would have drawn
// an OFF switch directly under a heading promising it cannot be switched off.
// The server treats account/security as non-suppressible unconditionally
// (dispatch.ts NON_SUPPRESSIBLE), so `true` is the truth, not a guess.
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
            checked={true /* P-08 */}
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
