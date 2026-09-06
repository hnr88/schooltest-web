'use client';

import { isAxiosError } from 'axios';
import { useQuery } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { opsClassDetailSchema, type OpsClassDetail } from '@/modules/ops/schemas/ops-class-detail.schema';

// The ops class inner page reads ONE class with its roster, teacher and school
// through the ops-only core class router (C-8 findOne, IS_OPS). The plain
// entity has no populate, so the relations are requested explicitly by query
// string; sanitizeOutput keeps the picked fields. A 404 (unknown class or a
// class ops cannot see) is the screen's not-found state and resolves to null;
// every other failure rethrows so the error branch shows, never a silent empty
// page (the C-CLS-05 discipline).
export function opsClassDetailQueryKey(classDocumentId: string) {
  return ['ops', 'classes', classDocumentId] as const;
}

async function fetchOpsClassDetail(classDocumentId: string): Promise<OpsClassDetail | null> {
  try {
    const res = await strapi.get<StrapiSingleResponse<unknown>>(
      `/api/classes/${classDocumentId}?populate[students]=true&populate[teacher]=true&populate[school]=true&populate[test_window]=true`,
    );
    return opsClassDetailSchema.parse(res.data.data);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
}

export function useOpsClassDetailQuery(classDocumentId: string, enabled: boolean) {
  return useQuery({
    queryKey: opsClassDetailQueryKey(classDocumentId),
    queryFn: () => fetchOpsClassDetail(classDocumentId),
    enabled: enabled && Boolean(classDocumentId),
    staleTime: 0,
    retry: false,
  });
}
