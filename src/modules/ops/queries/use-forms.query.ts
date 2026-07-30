'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { strapi, type StrapiCollectionResponse } from '@/lib/axios/strapi';
import { opsFormSchema, type OpsForm } from '@/modules/ops/schemas/form-window.schema';

export const OPS_FORMS_QUERY_KEY = ['ops', 'forms'] as const;

// Form picker source (C-WIN-01, task 68): the core GET /api/forms list - a
// core route, not a new endpoint. Phase 1 serves only active reading forms
// (the task-61 window rule refuses anything else), so the picker filters to
// exactly that set server-side.
async function fetchOpsForms(): Promise<OpsForm[]> {
  const res = await strapi.get<StrapiCollectionResponse<unknown>>('/api/forms', {
    params: {
      'filters[skill][$eq]': 'reading',
      'filters[active][$eq]': 'true',
      'fields[0]': 'form_code',
      'fields[1]': 'skill',
      'fields[2]': 'mode',
      'fields[3]': 'year_band',
      'fields[4]': 'active',
      'pagination[pageSize]': 100,
      'sort[0]': 'form_code:asc',
    },
  });
  return z.array(opsFormSchema).parse(res.data.data);
}

export function useFormsQuery(enabled: boolean) {
  return useQuery({
    queryKey: OPS_FORMS_QUERY_KEY,
    queryFn: fetchOpsForms,
    enabled,
    retry: false,
    staleTime: 60 * 1000,
  });
}
