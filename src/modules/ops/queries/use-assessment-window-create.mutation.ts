'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  assessmentWindowCreateBodySchema,
  assessmentWindowCreateResponseSchema,
  type AssessmentWindowCreateBody,
  type OpsResultWindowRow,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';
import { resultWindowsQueryKey } from '@/modules/ops/queries/use-result-windows.query';

/**
 * C-OPS-PORTAL-073 — POST /api/ops/schools/{documentId}/result-windows
 * (task 28, D-WIN). The body is validated against the shared create schema
 * BEFORE the request, so the dialog cannot ship a payload the server would
 * 400 for shape reasons; the server keeps its own guards (409 overlap/locked,
 * 404 scope). A rejected create changes nothing on the server — the list
 * cache does not need invalidating on error because no partial assignment
 * exists to reconcile.
 */
async function createAssessmentWindow(input: {
  schoolDocumentId: string;
  body: AssessmentWindowCreateBody;
}): Promise<OpsResultWindowRow> {
  // Validate the SAME schema the server enforces, so a misbuilt dialog state
  // fails here with the contract's message before any request leaves.
  const body = assessmentWindowCreateBodySchema.parse(input.body);
  const res = await strapi.post<unknown>(
    `/api/ops/schools/${input.schoolDocumentId}/result-windows`,
    body,
    { opsPortalVersioned: true }
  );
  // `{ data: <window> }` — the envelope every portal write returns.
  return assessmentWindowCreateResponseSchema.parse(res.data).data;
}

export function useAssessmentWindowCreateMutation(schoolDocumentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAssessmentWindow,
    onSuccess: async () => {
      // The list is derived server-side (status, sat/eligible) — every page of
      // it changes when a window is created, so the whole key family resets.
      await queryClient.invalidateQueries({
        queryKey: ['ops', 'schools', schoolDocumentId, 'result-windows'],
      });
    },
  });
}
