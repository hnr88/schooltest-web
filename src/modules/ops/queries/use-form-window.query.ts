'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { strapi, type StrapiCollectionResponse } from '@/lib/axios/strapi';
import { formWindowSchema, type FormWindow } from '@/modules/ops/schemas/form-window.schema';

export function formWindowQueryKey(schoolDocumentId: string) {
  return ['ops', 'form-window', schoolDocumentId] as const;
}

// C-WIN-01 read side (task 68): one window row per school, read through the
// form-window core find (task 61's storage - no new GET endpoint).
async function fetchFormWindow(schoolDocumentId: string): Promise<FormWindow | null> {
  const res = await strapi.get<StrapiCollectionResponse<unknown>>('/api/form-windows', {
    params: {
      'filters[school][documentId][$eq]': schoolDocumentId,
      'populate[form][fields][0]': 'form_code',
      'fields[0]': 'opens_at',
      'fields[1]': 'closes_at',
    },
  });
  const rows = z.array(formWindowSchema).parse(res.data.data);
  return rows[0] ?? null;
}

export function useFormWindowQuery(schoolDocumentId: string, enabled: boolean) {
  return useQuery({
    queryKey: formWindowQueryKey(schoolDocumentId),
    queryFn: () => fetchFormWindow(schoolDocumentId),
    enabled,
    retry: false,
    staleTime: 30 * 1000,
  });
}
