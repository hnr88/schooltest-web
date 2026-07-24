'use client';

import { useEffect, useRef } from 'react';

import { useSearchPreferencesQuery } from '@/modules/settings';
import { useSchoolSearchStore } from '@/modules/school-search/stores/use-school-search-store';

// Applies the saved search preferences (settings > Search tab) to the school
// search ONCE per session: when the pane first mounts and the user has not yet
// chosen any filter. The store itself guards the per-field seeding, so a choice
// made before the preferences response lands is never overwritten.
export function useApplySearchDefaults() {
  const { data } = useSearchPreferencesQuery();
  const requestedRef = useRef(false);

  useEffect(() => {
    if (requestedRef.current || !data) return;
    requestedRef.current = true;
    useSchoolSearchStore.getState().hydrateDefaults({
      states: data.default_states,
      sortBy: data.default_sort,
      pageSize: data.default_page_size,
    });
  }, [data]);
}
