'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi, type StrapiCollectionResponse } from '@/lib/axios/strapi';

export function formLockQueryKey(formDocumentId: string) {
  return ['ops', 'form-lock', formDocumentId] as const;
}

// C-WIN-02 read side (task 68): a form is locked when any session on it has
// reached a submitted/ended state - the same rule the task-61 service enforces,
// read here through the session core find (ops holds the SESSION read grant).
async function fetchFormLocked(formDocumentId: string): Promise<boolean> {
  const res = await strapi.get<StrapiCollectionResponse<unknown>>('/api/sessions', {
    params: {
      'filters[form][documentId][$eq]': formDocumentId,
      'filters[status][$in][0]': 'complete',
      'filters[status][$in][1]': 'terminated',
      'fields[0]': 'status',
      'pagination[pageSize]': 1,
    },
  });
  return (res.data.meta.pagination?.total ?? 0) > 0;
}

export function useFormLockQuery(formDocumentId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: formLockQueryKey(formDocumentId ?? ''),
    queryFn: () => fetchFormLocked(formDocumentId ?? ''),
    enabled: enabled && Boolean(formDocumentId),
    retry: false,
    staleTime: 30 * 1000,
  });
}
