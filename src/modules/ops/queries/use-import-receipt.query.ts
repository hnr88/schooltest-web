'use client';

import { useQuery } from '@tanstack/react-query';

import { opsImportReceiptSchema, type OpsImportReceipt } from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';

export function importReceiptQueryKey(schoolDocumentId: string, requestKey: string) {
  return ['ops', 'import-receipt', schoolDocumentId, requestKey] as const;
}

async function readReceipt(
  schoolDocumentId: string,
  requestKey: string,
): Promise<OpsImportReceipt> {
  const res = await strapi.get<{ data: unknown }>(
    `/api/ops/schools/${schoolDocumentId}/import-students/receipts/${requestKey}`,
    { opsPortalVersioned: true },
  );
  return opsImportReceiptSchema.parse(res.data.data);
}

/**
 * The receipt behind the progress bar and the reconciliation path.
 *
 * `processed_rows` / `total_rows` come from the server's own row, which is why
 * the UI can show a percentage at all — there is no client-side timer to fall
 * back on, and there deliberately is no fallback: a commit whose receipt is not
 * yet readable shows an indeterminate state rather than an invented number.
 *
 * A 404 is NOT an error state to retry away: it means no receipt was recorded,
 * which is not proof that nothing is in flight. `retry: false` keeps that
 * answer visible so the caller can reconcile against it.
 */
export function useImportReceiptQuery(
  schoolDocumentId: string,
  requestKey: string | null,
  poll: boolean,
) {
  return useQuery({
    queryKey: importReceiptQueryKey(schoolDocumentId, requestKey ?? 'none'),
    queryFn: () => readReceipt(schoolDocumentId, requestKey as string),
    enabled: requestKey !== null,
    retry: false,
    refetchInterval: poll ? 1000 : false,
    gcTime: 0,
  });
}
