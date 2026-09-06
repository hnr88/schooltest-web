'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { strapi } from '@/lib/axios/strapi';
import { opsClassDetailQueryKey } from '@/modules/ops/queries/use-ops-class-detail.query';

/** Thrown on 412: the class moved under the form — the DRAFT is intact; refresh and reapply. */
export class OpsClassEditStaleError extends Error {
  readonly currentUpdatedAt: string | null;

  constructor(currentUpdatedAt: string | null) {
    super('this class changed after the edit began — refresh and reapply the draft');
    this.name = 'OpsClassEditStaleError';
    this.currentUpdatedAt = currentUpdatedAt;
  }
}

export interface OpsUpdateClassInput {
  classDocumentId: string;
  schoolDocumentId: string;
  /** The class `updatedAt` the form was opened with — sent as If-Match. */
  classUpdatedAt: string | null;
  name: string;
  /**
   * The key is ALWAYS sent: a string sets the band, an explicit null CLEARS it.
   * Omission would mean "leave untouched", which is a different thing here.
   */
  yearBand: string | null;
}

async function updateOpsClass(input: OpsUpdateClassInput): Promise<unknown> {
  try {
    // Task 19 tightened edit: name + year_band ONLY, on the class-anchored ops
    // route. The teacher relation is deliberately ABSENT — assignment is the
    // assign-teacher route (task 20), so saving name/year can never overwrite
    // a teacher changed elsewhere. If-Match turns a stale form into a 412
    // instead of a silent clobber.
    const res = await strapi.patch(
      `/api/ops/schools/${input.schoolDocumentId}/classes/${input.classDocumentId}`,
      { data: { name: input.name, year_band: input.yearBand } },
      { headers: input.classUpdatedAt ? { 'If-Match': input.classUpdatedAt } : {} },
    );
    return res.data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 412) {
      const details = (
        error.response.data as {
          error?: { details?: { currentUpdatedAt?: string | null } };
        }
      )?.error?.details;
      throw new OpsClassEditStaleError(details?.currentUpdatedAt ?? null);
    }
    throw error;
  }
}

export function useOpsUpdateClassMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOpsClass,
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({
        queryKey: opsClassDetailQueryKey(input.classDocumentId),
      });
    },
  });
}

export interface OpsAssignTeacherInput {
  classDocumentId: string;
  schoolDocumentId: string;
}

/**
 * Task 20 — the class-assignment write (POST /ops/classes/:documentId/
 * assign-teacher). The SUBMITTED list is the whole assignment: one documentId
 * to assign, an empty array to UNASSIGN deliberately. The server answers
 * meta.changed=false when the same teacher was re-selected — surfaced to the
 * caller so the UI never celebrates a no-op.
 */
export function useOpsAssignTeacherMutation(classDocumentId: string, schoolDocumentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (teacherDocumentIds: string[]): Promise<{ changed: boolean }> => {
      const res = await strapi.post(`/api/ops/classes/${classDocumentId}/assign-teacher`, {
        teacher_documentIds: teacherDocumentIds,
      });
      const changed = (res.data as { meta?: { changed?: boolean } })?.meta?.changed !== false;
      return { changed };
    },
    onSuccess: async () => {
      // A changed assignment moves class + roster + BOTH teachers' counts.
      await queryClient.invalidateQueries({ queryKey: ['ops', 'schools', schoolDocumentId] });
      await queryClient.invalidateQueries({ queryKey: opsClassDetailQueryKey(classDocumentId) });
    },
  });
}

/**
 * Task 20 — the per-class named test window (PUT /ops/schools/:schoolDocumentId/
 * classes/:classDocumentId/window). `windowDocumentId: null` means "No window
 * yet"; a non-null choice requires an eligible teacher, which the API enforces.
 */
export function useOpsAssignClassWindowMutation(
  classDocumentId: string,
  schoolDocumentId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (windowDocumentId: string | null): Promise<unknown> => {
      const res = await strapi.put(
        `/api/ops/schools/${schoolDocumentId}/classes/${classDocumentId}/window`,
        { window_documentId: windowDocumentId },
      );
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ops', 'schools', schoolDocumentId] });
      await queryClient.invalidateQueries({ queryKey: opsClassDetailQueryKey(classDocumentId) });
    },
  });
}
