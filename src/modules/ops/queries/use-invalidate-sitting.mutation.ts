'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { invalidateResultSchema } from '@/modules/ops/schemas/recovery.schema';

// C-OPS-02 (task 69): closes the sitting, terminates in-flight sessions and
// stamps every session invalidated_at (excluded from official reporting).
async function invalidateSitting(sittingDocumentId: string): Promise<void> {
  const res = await strapi.post<{ data: unknown }>(
    `/api/ops/sittings/${sittingDocumentId}/invalidate`,
  );
  invalidateResultSchema.parse(res.data.data);
}

export function useInvalidateSittingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: invalidateSitting,
    // The sitting closes and the monitor states flip to submitted.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ops'] }),
  });
}
