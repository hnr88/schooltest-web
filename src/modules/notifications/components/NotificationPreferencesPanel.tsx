'use client';

import { useTranslations } from 'next-intl';

import { Alert, Button, SkeletonCard } from '@/modules/design-system';
import { NotificationPreferencesForm } from '@/modules/notifications/components/NotificationPreferencesForm';
import { PortalPanel } from '@/modules/notifications/components/PortalPanel';
import { PushSubscriptionControl } from '@/modules/notifications/components/PushSubscriptionControl';
import { useNotificationPreferenceForm } from '@/modules/notifications/hooks/use-notification-preference-form';

function NotificationPreferencesPanel() {
  const t = useTranslations('Settings');
  const { form, onSubmit, preferences, isError, isLoading, isSaving, refetch } =
    useNotificationPreferenceForm();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5.5">
        <SkeletonCard rows={2} className="rounded-card border-0" />
        <SkeletonCard rows={7} className="rounded-card border-0" />
        <SkeletonCard rows={3} className="rounded-card border-0" />
      </div>
    );
  }

  // The preference query and the push registration are independent surfaces. A failed
  // preference load must not swallow the device control: it keeps its real status and
  // stays disabled when it cannot act.
  if (isError) {
    return (
      <div className="flex flex-col gap-5.5">
        <PushSubscriptionControl />
        <PortalPanel
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
                className="min-h-11 rounded-full px-4"
                onClick={() => refetch()}
              >
                {t('retry')}
              </Button>
            }
          >
            {t('notificationPreferences.loadErrorDescription')}
          </Alert>
        </PortalPanel>
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
