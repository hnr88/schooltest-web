'use client';

import { useMutation } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  importPreviewSchema,
  type ImportPreview,
} from '@/modules/ops/schemas/import.schema';

export interface ImportStudentsInput {
  schoolDocumentId: string;
  csv: string;
}

// C-IMP-01: validate the csv against the school's classes, emails and the
// picklists - nothing is written. The route is ops-only (global::is-ops + the
// ops grant), so a wrong-role token answers 403 and no client-side filter is
// needed.
async function previewImport(input: ImportStudentsInput): Promise<ImportPreview> {
  const res = await strapi.post<{ data: unknown }>(
    `/api/ops/schools/${input.schoolDocumentId}/import-students/preview`,
    { csv: input.csv },
  );
  return importPreviewSchema.parse(res.data.data);
}

export function useImportPreviewMutation() {
  return useMutation({ mutationFn: previewImport });
}
