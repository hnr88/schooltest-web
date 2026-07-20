'use client';

import { useTranslations } from 'next-intl';

import { Alert, Button, Skeleton } from '@/modules/design-system';
import { SearchPreferenceFields } from '@/modules/settings/components/SearchPreferenceFields';
import { useSearchPreferenceForm } from '@/modules/settings/hooks/use-search-preference-form';

export function SearchPreferencesForm() {
  const t = useTranslations('Settings');
  const { form, onSubmit, isError, isLoading, isSaving, refetch } = useSearchPreferenceForm();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4" aria-hidden="true">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert
        variant="error"
        title={t('searchPreferencesLoadErrorTitle')}
        action={
          <Button type="button" variant="outline" className="h-11 px-4" onClick={() => refetch()}>
            {t('retry')}
          </Button>
        }
      >
        {t('searchPreferencesLoadErrorDescription')}
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <SearchPreferenceFields form={form} />
      <div className="flex justify-end">
        <Button type="submit" className="h-11 px-4" loading={isSaving}>
          {isSaving ? t('savingSearchPreferences') : t('saveSearchPreferences')}
        </Button>
      </div>
    </form>
  );
}
