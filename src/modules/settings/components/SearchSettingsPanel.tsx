'use client';

import { useTranslations } from 'next-intl';

import { SearchPreferencesForm } from '@/modules/settings/components/SearchPreferencesForm';
import { SettingsPanel } from '@/modules/settings/components/SettingsPanel';

export function SearchSettingsPanel() {
  const t = useTranslations('Settings');

  return (
    <SettingsPanel
      id="settings-search"
      title={t('searchPreferencesTitle')}
      description={t('searchPreferencesDescription')}
    >
      <SearchPreferencesForm />
    </SettingsPanel>
  );
}
