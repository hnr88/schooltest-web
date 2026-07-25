'use client';

import { useEffect } from 'react';

import { useSearchPreferencesQuery } from '@/modules/settings';
import { useSchoolSearchStore } from '@/modules/school-search/stores/use-school-search-store';

// Applies the saved search preferences (settings > Search tab) to the school
// search EVERY time they change: the first mount of the session AND any later
// save in settings within the same SPA session (the panel copy promises
// "applied every time you open School search"). The store re-seeds only the
// fields the user has not touched since hydration, so an active choice made
// before the preferences response lands is never overwritten.
export function useApplySearchDefaults() {
  const { data } = useSearchPreferencesQuery();

  useEffect(() => {
    if (!data) return;
    useSchoolSearchStore.getState().hydrateDefaults({
      states: data.default_states,
      sortBy: data.default_sort,
      pageSize: data.default_page_size,
    });
  }, [data]);
}
