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
