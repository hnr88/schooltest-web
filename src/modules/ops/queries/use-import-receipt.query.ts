'use client';

import { useEffect, useRef } from 'react';
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
 *
 * The 1s poll only runs while the commit is in flight, so its reads land
 * BEFORE the receipt exists — the commit writes the row inside its own
 * transaction and answers 404 until then. When the commit settles (poll flips
 * false) the receipt is read once more, so Undo availability and the settled
 * numbers come from the stored row, never from a mid-flight 404.
 */
export function useImportReceiptQuery(
  schoolDocumentId: string,
  requestKey: string | null,
  poll: boolean,
) {
  const query = useQuery({
    queryKey: importReceiptQueryKey(schoolDocumentId, requestKey ?? 'none'),
    queryFn: () => readReceipt(schoolDocumentId, requestKey as string),
    enabled: requestKey !== null,
    retry: false,
    refetchInterval: poll ? 1000 : false,
    gcTime: 0,
  });

  const wasPolling = useRef(false);
  const refetch = query.refetch;
  useEffect(() => {
    if (poll) {
      wasPolling.current = true;
      return;
    }
    if (!wasPolling.current) return;
    wasPolling.current = false;
    void refetch();
  }, [poll, refetch]);

  return query;
}

