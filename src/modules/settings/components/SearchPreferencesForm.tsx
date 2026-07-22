'use client';

import { useTranslations } from 'next-intl';

import { Alert, Button, SkeletonCard } from '@/modules/design-system';
import { SearchPreferenceDetailsFields } from '@/modules/settings/components/SearchPreferenceDetailsFields';
import { SearchPreferenceFeeFields } from '@/modules/settings/components/SearchPreferenceFeeFields';
import { SearchPreferenceFields } from '@/modules/settings/components/SearchPreferenceFields';
import { SettingsPanel } from '@/modules/settings/components/SettingsPanel';
import { PORTAL_GHOST_BUTTON_CLASS } from '@/modules/settings/constants/settings.constants';
import { useSearchPreferenceForm } from '@/modules/settings/hooks/use-search-preference-form';

// Portal settings composition (.qa/design/spec/03 §4.1): stacked full-width
// PortalCards in one 820px column on a 22px rhythm. The whole form is one save, so
// the primary button closes the stack at `align-self:flex-start`.
export function SearchPreferencesForm() {
  const t = useTranslations('Settings');
  const { form, onSubmit, isError, isLoading, isSaving, refetch } = useSearchPreferenceForm();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5.5">
        <SkeletonCard rows={5} className="rounded-card border-0" />
        <SkeletonCard rows={3} className="rounded-card border-0" />
        <SkeletonCard rows={2} className="rounded-card border-0" />
      </div>
    );
  }

  if (isError) {
    return (
      <SettingsPanel
        id="settings-search"
        title={t('searchPreferencesTitle')}
        description={t('searchPreferencesDescription')}
      >
        <Alert
          variant="error"
          title={t('searchPreferencesLoadErrorTitle')}
          action={
            <Button
              type="button"
              variant="outline"
              className={PORTAL_GHOST_BUTTON_CLASS}
              onClick={() => refetch()}
            >
              {t('retry')}
            </Button>
          }
        >
          {t('searchPreferencesLoadErrorDescription')}
        </Alert>
      </SettingsPanel>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5.5">
      <SettingsPanel
        id="settings-search"
        title={t('searchPreferencesTitle')}
        description={t('searchPreferencesDescription')}
      >
        <SearchPreferenceFields form={form} />
      </SettingsPanel>
      <SearchPreferenceDetailsFields form={form} />
      <SearchPreferenceFeeFields form={form} />
      <Button type="submit" className="min-h-11 self-start rounded-full px-6" loading={isSaving}>
        {isSaving ? t('savingSearchPreferences') : t('saveSearchPreferences')}
      </Button>
    </form>
  );
}
