'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { classProgressResponseSchema } from '@/modules/teacher/schemas/teacher-progress.schema';
import type { ClassProgressResponse } from '@/modules/teacher/types/teacher-progress.types';

// C-TR-4: GET /api/teacher/classes/:documentId/progress answers a BARE object.
// `available: false` IS the empty state — the portal renders the placeholder off
// that flag and off `cohort`'s real counts, never off an array it found empty.
// Every aggregate already counts only students who completed BOTH tests.
async function fetchClassProgress(documentId: string): Promise<ClassProgressResponse> {
  const response = await strapi.get(`/api/teacher/classes/${documentId}/progress`);
  return classProgressResponseSchema.parse(response.data);
}

export function useClassProgressQuery(documentId: string, enabled = true) {
  return useQuery({
    queryKey: ['teacher', 'class-progress', documentId],
    queryFn: () => fetchClassProgress(documentId),
    enabled: enabled && Boolean(documentId),
    staleTime: 0,
    retry: false,
  });
}
