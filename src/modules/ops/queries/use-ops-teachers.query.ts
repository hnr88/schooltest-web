'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import type { OpsTeacherRow } from '@/modules/ops/types/ops.types';

// OPS-teacher-details (task 064) — the ops-scoped staff directory. Same row
// shape as C-TCH-01 (the school-admin directory), served cross-school from
// /api/ops/schools/:documentId/teachers (global::is-ops on the API).
export function opsTeachersQueryKey(schoolDocumentId: string) {
  return ['ops', 'schools', schoolDocumentId, 'teachers'] as const;
}

async function fetchOpsTeachers(schoolDocumentId: string): Promise<OpsTeacherRow[]> {
  const res = await strapi.get<{ data: OpsTeacherRow[] }>(
    `/api/ops/schools/${schoolDocumentId}/teachers`,
  );
  return res.data.data;
}

export function useOpsTeachersQuery(schoolDocumentId: string, enabled: boolean) {
  return useQuery({
    queryKey: opsTeachersQueryKey(schoolDocumentId),
    queryFn: () => fetchOpsTeachers(schoolDocumentId),
    enabled,
    retry: false,
    staleTime: 60 * 1000,
  });
}

export interface OpsTeacherPatch {
  first_name?: string;
  last_name?: string;
  email?: string;
}

async function patchOpsTeacher({
  schoolDocumentId,
  teacherDocumentId,
  ...patch
}: OpsTeacherPatch & { schoolDocumentId: string; teacherDocumentId: string }): Promise<OpsTeacherRow> {
  const res = await strapi.patch<{ data: OpsTeacherRow }>(
    `/api/ops/schools/${schoolDocumentId}/teachers/${teacherDocumentId}`,
    patch,
  );
  return res.data.data;
}

/** OPS edit — the exact C-TCH-04 whitelist (API 400s anything else). */
export function useOpsTeacherUpdateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patchOpsTeacher,
    onSuccess: async (_row, input) => {
      await queryClient.invalidateQueries({
        queryKey: opsTeachersQueryKey(input.schoolDocumentId),
      });
    },
  });
}

async function removeOpsTeacher({
  schoolDocumentId,
  teacherDocumentId,
}: {
  schoolDocumentId: string;
  teacherDocumentId: string;
}): Promise<void> {
  await strapi.delete(`/api/ops/schools/${schoolDocumentId}/teachers/${teacherDocumentId}`);
}

/**
 * OPS removal — the C-TCH-03 revocation sequence (block + unlink + drop class
 * links + revoke invitations). Also refreshes the school list cache because
 * the detail page's teacher count card reads from it.
 */
export function useOpsTeacherRemoveMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeOpsTeacher,
    onSuccess: async (_void, input) => {
      await queryClient.invalidateQueries({
        queryKey: opsTeachersQueryKey(input.schoolDocumentId),
      });
      await queryClient.invalidateQueries({ queryKey: ['ops', 'schools'] });
    },
  });
}
