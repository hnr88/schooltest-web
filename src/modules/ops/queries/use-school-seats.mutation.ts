'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  opsSchoolEntitlementSchema,
  schoolEntitlementQueryKey,
  type OpsSchoolEntitlement,
} from '@/modules/ops/queries/use-school-entitlement.query';

/**
 * C-ENT-02 — PUT /api/schools/{documentId}/entitlement, sending ONLY
 * `seats_total`. Every key of that body is optional and unmentioned keys are
 * left alone, so this write cannot disturb the plan code, the renewal date or
 * the per-type allowance totals the same endpoint also owns.
 *
 * The response is the post-write entitlement view, so the panel renders the
 * number the SERVER holds rather than the one that was typed.
 */
async function setSeats(input: {
  schoolDocumentId: string;
  seatsTotal: number;
}): Promise<OpsSchoolEntitlement> {
  const res = await strapi.put<{ data: unknown }>(
    `/api/schools/${input.schoolDocumentId}/entitlement`,
    { seats_total: input.seatsTotal },
  );
  return opsSchoolEntitlementSchema.parse(res.data.data);
}

export function useSchoolSeatsMutation(schoolDocumentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (seatsTotal: number) => setSeats({ schoolDocumentId, seatsTotal }),
    onSuccess: (view) => {
      queryClient.setQueryData(schoolEntitlementQueryKey(schoolDocumentId), view);
      // The school row carries counts the seat cap governs; let the directory
      // and the detail re-read rather than second-guessing which cards moved.
      void queryClient.invalidateQueries({ queryKey: ['ops', 'schools'] });
    },
  });
}
