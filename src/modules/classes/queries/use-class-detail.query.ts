'use client';

import { isAxiosError } from 'axios';
import { useQuery } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { classDetailSchema } from '@/modules/classes/schemas/class-detail.schema';
import type { ClassDetail } from '@/modules/classes/types/class-detail.types';
import { CLASS_DETAIL_QUERY_KEY } from '@/modules/classes/constants/queries.constants';

// C-CLS-05: one class's detail — header identity, the summary-card figures and
// the roster with each student's Test A / Test B result. A 404 (unknown class,
// or a class outside the caller's school) is the screen's not-found state and
// resolves to null; every OTHER failure rethrows so the error state shows
// rather than a silent empty page. The key nests under CLASSES_QUERY_KEY, so
// the class mutations' prefix invalidation refreshes this read after a save.
async function fetchClassDetail(documentId: string): Promise<ClassDetail | null> {
  try {
    const res = await strapi.get<StrapiSingleResponse<unknown>>(
      `/api/schools/me/classes/${documentId}`,
    );
    return classDetailSchema.parse(res.data.data);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
}

export function useClassDetailQuery(documentId: string, enabled: boolean) {
  return useQuery({
    queryKey: [...CLASS_DETAIL_QUERY_KEY, documentId],
    queryFn: () => fetchClassDetail(documentId),
    enabled,
  });
}
