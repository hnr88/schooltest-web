'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { classInsightsResponseSchema } from '@/modules/teacher/schemas/teacher-result.schema';
import type { ClassInsightsResponse } from '@/modules/teacher/types/teacher-result.types';

// C-TR-3: GET /api/teacher/classes/:documentId/insights answers a BARE object.
// `mastery` is inverted BY CONSTRUCTION server-side (it counts students
// mastered, so a short bar IS the gap) and `groups` are partitioned by each
// student's primary gap with `label`/`hint` from the active crosswalk
// descriptors. The portal groups nobody and writes no teaching note.
async function fetchClassInsights(documentId: string): Promise<ClassInsightsResponse> {
  const response = await strapi.get(`/api/teacher/classes/${documentId}/insights`);
  return classInsightsResponseSchema.parse(response.data);
}

export function useClassInsightsQuery(documentId: string, enabled = true) {
  return useQuery({
    queryKey: ['teacher', 'class-insights', documentId],
    queryFn: () => fetchClassInsights(documentId),
    enabled: enabled && Boolean(documentId),
    staleTime: 0,
    retry: false,
  });
}
