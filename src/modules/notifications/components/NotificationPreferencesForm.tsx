'use client';

import type { FormEventHandler } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';
import { NotificationDigestField } from '@/modules/notifications/components/NotificationDigestField';
import { NotificationPreferenceFields } from '@/modules/notifications/components/NotificationPreferenceFields';
import { NotificationPreferenceLockedGroup } from '@/modules/notifications/components/NotificationPreferenceLockedGroup';
import { PortalPanel } from '@/modules/notifications/components/PortalPanel';
import { PushSubscriptionControl } from '@/modules/notifications/components/PushSubscriptionControl';
import type {
  NotificationPreference,
  NotificationPreferenceFormValues,
} from '@/modules/notifications/types/notification-preference.types';

// Portal settings composition (.qa/design/spec/03 §4.1): stacked full-width cards in
// one 820px column on a 22px rhythm, never a two-column card grid. The whole stack is
// one save, so the primary button sits at the end at align-self:flex-start.
function NotificationPreferencesForm({
  form,
  preferences,
  isSaving,
  onSubmit,
}: {
  form: UseFormReturn<NotificationPreferenceFormValues>;
  preferences: NotificationPreference | undefined;
  isSaving: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
}) {
  const t = useTranslations('Settings');

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5.5">
      <PushSubscriptionControl />
      <PortalPanel
        id="settings-notifications"
        title={t('notificationPreferences.title')}
        description={t('notificationPreferences.description')}
      >
        <NotificationPreferenceFields form={form} />
      </PortalPanel>
      <NotificationDigestField form={form} />
      <NotificationPreferenceLockedGroup preferences={preferences} />
      <Button type="submit" className="min-h-11 self-start rounded-full px-6" loading={isSaving}>
        {isSaving ? t('notificationPreferences.saving') : t('notificationPreferences.save')}
      </Button>
    </form>
  );
}

export { NotificationPreferencesForm };
