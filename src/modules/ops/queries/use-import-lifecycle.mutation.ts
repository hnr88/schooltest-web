'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  opsImportCancelResultSchema,
  opsImportUndoResultSchema,
  type OpsImportCancelResult,
  type OpsImportUndoResult,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';
import { importReceiptQueryKey } from '@/modules/ops/queries/use-import-receipt.query';

export interface ImportCancelInput {
  schoolDocumentId: string;
  requestKey: string;
}

export interface ImportUndoInput {
  schoolDocumentId: string;
  importDocumentId: string;
}

/**
 * Cancel returns the RACE OUTCOME, never an acknowledgement.
 *
 * `cancelled` means the server beat its own commit to the request key and
 * nothing was created; `completed` means the commit won and carries the exact
 * persisted result. The caller renders whichever came back — it never has to
 * decide which happened, and it must never say "no students were added" on its
 * own authority.
 */
async function cancelImport(input: ImportCancelInput): Promise<OpsImportCancelResult> {
  const res = await strapi.post<{ data: unknown }>(
    `/api/ops/schools/${input.schoolDocumentId}/import-students/receipts/${input.requestKey}/cancel`,
    {},
    { opsPortalVersioned: true },
  );
  return opsImportCancelResultSchema.parse(res.data.data);
}

/** Guarded undo. The server owns the 60-second deadline and the eligibility. */
async function undoImport(input: ImportUndoInput): Promise<OpsImportUndoResult> {
  const res = await strapi.post<{ data: unknown }>(
    `/api/ops/schools/${input.schoolDocumentId}/import-students/${input.importDocumentId}/undo`,
    {},
    { opsPortalVersioned: true },
  );
  return opsImportUndoResultSchema.parse(res.data.data);
}

export function useImportCancelMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelImport,
    // Whichever side won, the receipt is now the truth about it.
    onSettled: (_result, _error, input) =>
      queryClient.invalidateQueries({
        queryKey: importReceiptQueryKey(input.schoolDocumentId, input.requestKey),
      }),
  });
}

export function useImportUndoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: undoImport,
    // Removing students moves the school's counts, so the directory refetches.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ops', 'schools'] }),
  });
}
