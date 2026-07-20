'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { SEARCH_PREFERENCE_DEFAULTS } from '@/modules/settings/constants/settings.constants';
import { toSearchPreferenceFormValues } from '@/modules/settings/lib/search-preferences';
import { useSearchPreferencesQuery } from '@/modules/settings/queries/use-search-preferences.query';
import { useUpdateSearchPreferencesMutation } from '@/modules/settings/queries/use-update-search-preferences.mutation';
import { searchPreferenceFormSchema } from '@/modules/settings/schemas/search-preferences.schema';
import type { SearchPreferenceFormValues } from '@/modules/settings/types/settings.types';

export function useSearchPreferenceForm() {
  const t = useTranslations('Settings');
  const query = useSearchPreferencesQuery();
  const update = useUpdateSearchPreferencesMutation();
  const form = useForm<SearchPreferenceFormValues>({
    resolver: zodResolver(searchPreferenceFormSchema),
    defaultValues: SEARCH_PREFERENCE_DEFAULTS,
  });

  useEffect(() => {
    if (query.data) form.reset(toSearchPreferenceFormValues(query.data));
  }, [form, query.data]);

  const onSubmit = form.handleSubmit((values) => {
    update.mutate(values, {
      onSuccess: (preferences) => {
        form.reset(toSearchPreferenceFormValues(preferences));
        toast.success(t('searchPreferencesSaved'));
      },
      onError: () => toast.error(t('searchPreferencesError')),
    });
  });

  return {
    form,
    onSubmit,
    isLoading: query.isLoading,
    isError: query.isError,
    isSaving: update.isPending,
    refetch: query.refetch,
  };
}
