'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { searchPreferenceResponseSchema } from '@/modules/settings/schemas/search-preferences.schema';
import type { SearchPreference } from '@/modules/settings/types/settings.types';

export const SEARCH_PREFERENCES_QUERY_KEY = ['settings', 'search-preferences'] as const;

async function fetchSearchPreferences(): Promise<SearchPreference> {
  const response = await strapi.get('/api/search-preferences/me');
  return searchPreferenceResponseSchema.parse(response.data).data;
}

export function useSearchPreferencesQuery() {
  return useQuery({
    queryKey: SEARCH_PREFERENCES_QUERY_KEY,
    queryFn: fetchSearchPreferences,
    staleTime: 0,
    retry: false,
  });
}
