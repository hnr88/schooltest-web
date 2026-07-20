'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { childProgressResponseSchema } from '@/modules/children/schemas/child-progress.schema';
import type { ChildProgress } from '@/modules/children/types/children.types';

async function fetchChildProgress(documentId: string): Promise<ChildProgress> {
  const response = await strapi.get(`/api/my/students/${documentId}/progress`);
  return childProgressResponseSchema.parse(response.data).data;
}

export function useChildProgressQuery(documentId: string) {
  return useQuery({
    queryKey: ['children', 'progress', documentId],
    queryFn: () => fetchChildProgress(documentId),
    enabled: Boolean(documentId),
    staleTime: 0,
    retry: false,
  });
}
