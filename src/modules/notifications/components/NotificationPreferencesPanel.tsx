'use client';

import { useTranslations } from 'next-intl';

import { Alert, Button, Skeleton } from '@/modules/design-system';
import { NotificationCard } from '@/modules/notifications/components/NotificationCard';
import { NotificationPreferencesForm } from '@/modules/notifications/components/NotificationPreferencesForm';
import { PushSubscriptionControl } from '@/modules/notifications/components/PushSubscriptionControl';
import { useNotificationPreferenceForm } from '@/modules/notifications/hooks/use-notification-preference-form';

function NotificationPreferencesPanel() {
  const t = useTranslations('Settings');
  const { form, onSubmit, preferences, isError, isLoading, isSaving, refetch } =
    useNotificationPreferenceForm();

  if (isLoading) {
    return (
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <NotificationCard>
          <div aria-hidden="true" className="flex flex-col gap-4">
            <Skeleton className="h-8 w-52" />
            <Skeleton className="h-64 w-full" />
          </div>
        </NotificationCard>
        <NotificationCard>
          <Skeleton aria-hidden="true" className="h-40 w-full" />
        </NotificationCard>
      </div>
    );
  }

  // The preference query and the push registration are independent surfaces. A
  // failed preference load must not swallow the device control: it keeps its real
  // status and stays disabled when it cannot act, so the feature is never silently
  // absent. Same two-column composition as the loaded state.
  if (isError) {
    return (
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <NotificationCard
          id="settings-notifications"
          title={t('notificationPreferences.title')}
          description={t('notificationPreferences.description')}
        >
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
        </NotificationCard>
        <PushSubscriptionControl />
      </div>
    );
  }

  return (
    <NotificationPreferencesForm
      form={form}
      preferences={preferences}
      isSaving={isSaving}
      onSubmit={onSubmit}
    />
  );
}

export { NotificationPreferencesPanel };
