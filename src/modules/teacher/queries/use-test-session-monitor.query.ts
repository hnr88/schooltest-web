'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { testSessionMonitorResponseSchema } from '@/modules/teacher/schemas/teacher-session.schema';
import type { TestSessionMonitorResponse } from '@/modules/teacher/types/teacher-session.types';

// C-TS-3: GET /api/teacher/test-sessions/:documentId/monitor answers a BARE
// object. Every tile state, the stall flag and `stall_threshold_minutes` itself
// are derived server-side from real session/response rows — the portal derives
// no state from a clock and re-thresholds nothing. 403 (foreign sitting) and
// 404 (unknown) are final answers, hence `retry: false`.
async function fetchTestSessionMonitor(documentId: string): Promise<TestSessionMonitorResponse> {
  const response = await strapi.get(`/api/teacher/test-sessions/${documentId}/monitor`);
  return testSessionMonitorResponseSchema.parse(response.data);
}

export function useTestSessionMonitorQuery(documentId: string, enabled = true) {
  return useQuery({
    queryKey: ['teacher', 'test-session-monitor', documentId],
    queryFn: () => fetchTestSessionMonitor(documentId),
    enabled: enabled && Boolean(documentId),
    staleTime: 0,
    retry: false,
  });
}
