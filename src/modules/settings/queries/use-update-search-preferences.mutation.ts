'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { SEARCH_PREFERENCES_QUERY_KEY } from '@/modules/settings/queries/use-search-preferences.query';
import {
  searchPreferenceFormSchema,
  searchPreferenceResponseSchema,
} from '@/modules/settings/schemas/search-preferences.schema';
import type {
  SearchPreference,
  SearchPreferenceFormValues,
} from '@/modules/settings/types/settings.types';

async function updateSearchPreferences(
  values: SearchPreferenceFormValues,
): Promise<SearchPreference> {
  const payload = searchPreferenceFormSchema.parse(values);
  const response = await strapi.put('/api/search-preferences/me', payload);
  return searchPreferenceResponseSchema.parse(response.data).data;
}

export function useUpdateSearchPreferencesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSearchPreferences,
    onSuccess: (preferences) => {
      queryClient.setQueryData(SEARCH_PREFERENCES_QUERY_KEY, preferences);
    },
  });
}
