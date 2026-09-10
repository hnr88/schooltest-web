'use client';

import { z } from 'zod';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';

/**
 * C-OPSS-08 — POST /api/ops/schools/{documentId}/recalculate-seats. No
 * contract record covers this route in this backlog, so the shape is parsed
 * against the LIVE server response (curled against 127.0.0.1:5500, task 13
 * proof) rather than any `@schooltest/ops-contracts` schema: the school's
 * active-student count re-read against its stored entitlement, returned as
 * `{ seats_used, seats_total, seats_remaining }`. A school with no
 * entitlement row answers 404, surfaced to the caller as a rejected mutation.
 */
const opsSeatRecalculationResultSchema = z.strictObject({
  seats_used: z.number(),
  seats_total: z.number(),
  seats_remaining: z.number(),
});

export type OpsSeatRecalculationResult = z.infer<typeof opsSeatRecalculationResultSchema>;

async function recalculateSeats(schoolDocumentId: string): Promise<OpsSeatRecalculationResult> {
  const res = await strapi.post<{ data: unknown }>(
    `/api/ops/schools/${schoolDocumentId}/recalculate-seats`,
    {},
  );
  return opsSeatRecalculationResultSchema.parse(res.data.data);
}

export function useRecalculateSeatsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: recalculateSeats,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ops', 'schools'] });
    },
  });
}
