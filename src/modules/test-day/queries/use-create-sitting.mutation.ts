'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { CLASS_SITTINGS_QUERY_KEY } from '@/modules/test-day/constants/queries.constants';
import { classSittingSchema } from '@/modules/test-day/schemas/test-day.schema';
import type { ClassSitting } from '@/modules/test-day/types/test-day.types';

// POST /api/sittings (teacher create): the one-click legacy surface still
// chooses automatically, but D-32 requires it to send the exact form resolved
// from C-TD-2. A valid board code must never lead to an unjoinable sitting.
async function createSittingRequest(
  classDocumentId: string,
  formDocumentId: string,
): Promise<ClassSitting> {
  const res = await strapi.post<StrapiSingleResponse<unknown>>('/api/sittings', {
    data: {
      class_document_id: classDocumentId,
      mode: 'progress',
      skill: 'reading',
      form_document_id: formDocumentId,
    },
  });
  return classSittingSchema.parse(res.data.data);
}

export function useCreateSittingMutation(classDocumentId: string, formDocumentId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!formDocumentId) throw new Error('No active reading diagnostic is available');
      return createSittingRequest(classDocumentId, formDocumentId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLASS_SITTINGS_QUERY_KEY }),
  });
}
