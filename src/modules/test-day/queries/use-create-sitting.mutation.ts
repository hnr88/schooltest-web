'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { CLASS_SITTINGS_QUERY_KEY } from '@/modules/test-day/constants/queries.constants';
import { classSittingSchema } from '@/modules/test-day/schemas/test-day.schema';
import type { ClassSitting } from '@/modules/test-day/types/test-day.types';

// POST /api/sittings (teacher create): the server forces status open + null
// code and resolves the form itself (D-10 — the teacher never picks one).
async function createSittingRequest(classDocumentId: string): Promise<ClassSitting> {
  const res = await strapi.post<StrapiSingleResponse<unknown>>('/api/sittings', {
    data: { class_document_id: classDocumentId, mode: 'progress', skill: 'reading' },
  });
  return classSittingSchema.parse(res.data.data);
}

export function useCreateSittingMutation(classDocumentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => createSittingRequest(classDocumentId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: CLASS_SITTINGS_QUERY_KEY }),
  });
}
