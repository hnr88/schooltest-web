'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import type { ImportStudentsInput } from '@/modules/ops/types/queries.types';
import {
  opsImportCommitResultSchema,
  type OpsImportCommit,
} from '@schooltest/ops-contracts';

import {
  importCommitResultSchema,
  type ImportCommitResult,
} from '@/modules/ops/schemas/import.schema';

// C-IMP-02: re-sends the SAME csv - the server re-validates it from scratch
// (the preview is never trusted), then creates the create-rows as active
// students with school + class linked, seat-gated, add-only on email.
async function commitImport(input: ImportStudentsInput): Promise<ImportCommitResult> {
  const res = await strapi.post<{ data: unknown }>(
    `/api/ops/schools/${input.schoolDocumentId}/import-students/commit`,
    { csv: input.csv },
  );
  return importCommitResultSchema.parse(res.data.data);
}

export function useImportCommitMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: commitImport,
    // The school's student_count on C-OPS-01 changes with every commit.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ops', 'schools'] }),
  });
}

export interface PortalImportCommitInput {
  schoolDocumentId: string;
  csv: string;
  classDocumentId: string;
  /** The client's own key, kept across retries so a replay never double-writes. */
  requestKey: string;
}

/**
 * The VERSIONED commit.
 *
 * `Idempotency-Key` is the CLIENT's, generated once per attempt and reused on
 * every retry: that is what makes a retry after a dropped connection resolve to
 * the original outcome instead of a second import, and it is the same key the
 * receipt is read back by. The result shape comes from the shared contract, so
 * client and server cannot disagree about it.
 */
async function commitPortalImport(input: PortalImportCommitInput): Promise<OpsImportCommit> {
  const res = await strapi.post<{ data: unknown }>(
    `/api/ops/schools/${input.schoolDocumentId}/import-students/commit`,
    { csv: input.csv, class_documentId: input.classDocumentId },
    { opsPortalVersioned: true, headers: { 'Idempotency-Key': input.requestKey } },
  );
  return opsImportCommitResultSchema.parse(res.data.data);
}

export function usePortalImportCommitMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: commitPortalImport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ops', 'schools'] }),
  });
}
