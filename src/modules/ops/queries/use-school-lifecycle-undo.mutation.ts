'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  schoolLifecycleUndoResultSchema,
  type SchoolLifecycleUndoResult,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';
import { schoolVersionQueryKey } from '@/modules/ops/queries/use-school-version.query';

export interface SchoolLifecycleUndoInput {
  schoolDocumentId: string;
  actionDocumentId: string;
  version: string;
}

export async function undoSchoolLifecycleAction({
  schoolDocumentId,
  actionDocumentId,
  version,
}: SchoolLifecycleUndoInput): Promise<SchoolLifecycleUndoResult> {
  const response = await strapi.post<{ data: unknown }>(
    `/api/ops/schools/${schoolDocumentId}/lifecycle-actions/${actionDocumentId}/undo`,
    {},
    { opsPortalVersioned: true, headers: { 'If-Match': version } },
  );
  return schoolLifecycleUndoResultSchema.parse(response.data.data);
}

/** C-OPS-PORTAL-018 — the toast's Undo action, with server-owned expiry. */
export function useSchoolLifecycleUndoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: undoSchoolLifecycleAction,
    onSuccess: async (_result, { schoolDocumentId }) => {
      await queryClient.invalidateQueries({ queryKey: schoolVersionQueryKey(schoolDocumentId) });
      await queryClient.invalidateQueries({ queryKey: ['ops', 'schools'] });
    },
  });
}
