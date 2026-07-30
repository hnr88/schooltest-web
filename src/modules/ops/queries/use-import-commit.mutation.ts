'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import type { ImportStudentsInput } from '@/modules/ops/queries/use-import-preview.mutation';
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
