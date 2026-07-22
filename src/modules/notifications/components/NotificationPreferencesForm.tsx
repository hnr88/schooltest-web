'use client';

import type { FormEventHandler } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import { Alert, Button } from '@/modules/design-system';
import { NotificationCard } from '@/modules/notifications/components/NotificationCard';
import { NotificationDigestField } from '@/modules/notifications/components/NotificationDigestField';
import { NotificationPreferenceFields } from '@/modules/notifications/components/NotificationPreferenceFields';
import { PushSubscriptionControl } from '@/modules/notifications/components/PushSubscriptionControl';
import type {
  NotificationPreference,
  NotificationPreferenceFormValues,
} from '@/modules/notifications/types/notification-preference.types';

// Canonical "Parent settings" composition: two equal columns at a 20px gutter,
// top-aligned, cards stacked in the right one. Splitting the surface this way
// keeps every §36 toggle row near the canonical ~490px measure instead of
// stretching one card across the full content width.
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
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <NotificationCard
          id="settings-notifications"
          title={t('notificationPreferences.title')}
          description={t('notificationPreferences.description')}
        >
          <NotificationPreferenceFields form={form} preferences={preferences} />
        </NotificationCard>
        <div className="flex flex-col gap-5">
          <PushSubscriptionControl />
          <NotificationCard className="flex flex-col gap-4">
            <NotificationDigestField form={form} />
            <Alert variant="info" title={t('notificationPreferences.alwaysOnTitle')}>
              {t('notificationPreferences.alwaysOnDescription')}
            </Alert>
          </NotificationCard>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" className="min-h-11 px-4" loading={isSaving}>
          {isSaving ? t('notificationPreferences.saving') : t('notificationPreferences.save')}
        </Button>
      </div>
    </form>
  );
}

export { NotificationPreferencesForm };
