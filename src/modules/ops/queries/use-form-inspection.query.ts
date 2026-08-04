'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  formInspectionSchema,
  type FormInspection,
} from '@/modules/ops/schemas/surfaces.schema';
import { FORM_INSPECTION_QUERY_KEY } from '@/modules/ops/constants/queries.constants';

// C-OPS-04 (task 70): the form Q-matrix + key inspection. The route is
// ops-only (global::is-ops + the ops grant); a wrong-role token answers 403.
async function fetchFormInspection(documentId: string): Promise<FormInspection> {
  const res = await strapi.get<{ data: unknown }>(`/api/ops/forms/${documentId}/inspection`);
  return formInspectionSchema.parse(res.data.data);
}

export function useFormInspectionQuery(documentId: string, enabled: boolean) {
  return useQuery({
    queryKey: [...FORM_INSPECTION_QUERY_KEY, documentId],
    queryFn: () => fetchFormInspection(documentId),
    enabled: enabled && documentId !== '',
    retry: false,
    staleTime: 30 * 1000,
  });
}
