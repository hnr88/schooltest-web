'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';

import type { SchoolPlanInput } from '@/modules/ops/types/queries.types';

// C-SCH-03 (ops only): assign the school's product tier. The spec makes the
// full licence "assigned by Ops (not self-serve)", so this PATCH behind
// global::is-ops is the ONLY write path - a wrong-role token answers 403.
async function patchSchoolPlan(input: SchoolPlanInput): Promise<void> {
  await strapi.patch(`/api/schools/${input.schoolDocumentId}`, { plan: input.plan });
}

export function useSchoolPlanMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patchSchoolPlan,
    // The detail page and the schools table read the plan off the same C-OPS-01
    // row, so both re-read it from the server rather than from what the client
    // hoped it sent.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ops', 'schools'] }),
  });
}
