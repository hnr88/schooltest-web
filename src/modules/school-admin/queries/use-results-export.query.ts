'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';

export const RESULTS_EXPORT_QUERY_KEY = ['school-admin', 'results-export'] as const;

// C-RPT-05 (task 78, mvp spec 4.3): the school-level results export for
// sharing upward (exec, HOD). The query is LAZY (enabled: false) - the
// ResultsExportButton drives it with refetch() on click, so the CSV is only
// ever pulled on demand. The server gates the route (school_admin | ops), so
// a forbidden caller rejects here and the button shows its error state.
async function fetchResultsExportCsv(): Promise<string> {
  const res = await strapi.get<string>('/api/schools/me/results-export', {
    params: { format: 'csv' },
    responseType: 'text',
  });
  return res.data;
}

export function useResultsExportQuery() {
  return useQuery({
    queryKey: RESULTS_EXPORT_QUERY_KEY,
    queryFn: fetchResultsExportCsv,
    enabled: false,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
}
