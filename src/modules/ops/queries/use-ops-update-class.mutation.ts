'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { opsClassDetailQueryKey } from '@/modules/ops/queries/use-ops-class-detail.query';

// Ops edit-assign on one class (C-8 update, IS_OPS — the ops-only core class
// router). Strapi v5 REST updates take a `data` wrapper and address relations
// by documentId; both are verified against the running API (task 015). Adding a
// field here is additive: the class entity only records what the body sends.
export interface OpsUpdateClassInput {
  classDocumentId: string;
  name: string;
  yearBand?: string | null;
  teacher: string | null;
}

async function updateOpsClass(input: OpsUpdateClassInput): Promise<unknown> {
  // `data.teacher` is set unconditionally (documentId, or null to clear the
  // relation); `year_band` is only sent when a value is provided, so an edit
  // that leaves it untouched never strips it from the entity.
  const data: Record<string, unknown> = { name: input.name, teacher: input.teacher };
  if (input.yearBand) data.year_band = input.yearBand;
  const res = await strapi.put(`/api/classes/${input.classDocumentId}`, { data });
  return res.data;
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
