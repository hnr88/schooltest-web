'use client';

import { useTranslations } from 'next-intl';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/design-system';
import { NotificationPreferencesForm } from '@/modules/notifications/components/NotificationPreferencesForm';

function NotificationPreferencesPanel() {
  const t = useTranslations('Settings');

  return (
    <section aria-labelledby="settings-notifications-title">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle
            id="settings-notifications-title"
            role="heading"
            aria-level={2}
            className="font-semibold"
          >
            {t('notificationPreferences.title')}
          </CardTitle>
          <CardDescription>{t('notificationPreferences.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationPreferencesForm />
        </CardContent>
      </Card>
    </section>
  );
}

export { NotificationPreferencesPanel };
