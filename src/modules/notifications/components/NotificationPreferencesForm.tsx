'use client';

import { useTranslations } from 'next-intl';

import { Alert, Button, Skeleton } from '@/modules/design-system';
import { NotificationPreferenceFields } from '@/modules/notifications/components/NotificationPreferenceFields';
import { useNotificationPreferenceForm } from '@/modules/notifications/hooks/use-notification-preference-form';

function NotificationPreferencesForm() {
  const t = useTranslations('Settings');
  const { form, onSubmit, isError, isLoading, isSaving, refetch } = useNotificationPreferenceForm();

  if (isLoading) {
    return (
      <div aria-hidden="true" className="flex flex-col gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert
        variant="error"
        title={t('notificationPreferences.loadErrorTitle')}
        action={
          <Button
            type="button"
            variant="outline"
            className="min-h-11 px-4"
            onClick={() => refetch()}
          >
            {t('retry')}
          </Button>
        }
      >
        {t('notificationPreferences.loadErrorDescription')}
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <NotificationPreferenceFields form={form} />
      <div className="flex justify-end">
        <Button type="submit" className="min-h-11 px-4" loading={isSaving}>
          {isSaving ? t('notificationPreferences.saving') : t('notificationPreferences.save')}
        </Button>
      </div>
    </form>
  );
}

export { NotificationPreferencesForm };
