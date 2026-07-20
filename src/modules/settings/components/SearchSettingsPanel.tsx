'use client';

import { useTranslations } from 'next-intl';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/design-system';
import { SearchPreferencesForm } from '@/modules/settings/components/SearchPreferencesForm';

export function SearchSettingsPanel() {
  const t = useTranslations('Settings');

  return (
    <section aria-labelledby="settings-search-title">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle id="settings-search-title" className="font-semibold">
            {t('searchPreferencesTitle')}
          </CardTitle>
          <CardDescription>{t('searchPreferencesDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <SearchPreferencesForm />
        </CardContent>
      </Card>
    </section>
  );
}
