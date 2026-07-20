'use client';

import { useTranslations } from 'next-intl';

import { ChangePasswordForm } from '@/modules/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/design-system';

export function AuthSettingsPanel() {
  const t = useTranslations('Settings');

  return (
    <section aria-labelledby="settings-auth-title">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle id="settings-auth-title" className="font-semibold">
            {t('changePasswordTitle')}
          </CardTitle>
          <CardDescription>{t('changePasswordSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </section>
  );
}
