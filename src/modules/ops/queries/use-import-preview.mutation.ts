'use client';

import { useMutation } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  importPreviewSchema,
  portalImportPreviewSchema,
  type ImportPreview,
  type PortalImportPreview,
} from '@/modules/ops/schemas/import.schema';

import type { ImportStudentsInput } from '@/modules/ops/types/queries.types';

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

export interface PortalImportPreviewInput {
  schoolDocumentId: string;
  csv: string;
  classDocumentId: string;
}

/**
 * The VERSIONED preview. The class comes from the picker and rides in the body
 * — it is never a csv column — and the version header selects the portal
 * vocabulary. The legacy hook above is untouched, so an unversioned caller
 * keeps the six-column email template exactly as it was.
 */
async function previewPortalImport(
  input: PortalImportPreviewInput,
): Promise<PortalImportPreview> {
  const res = await strapi.post<{ data: unknown }>(
    `/api/ops/schools/${input.schoolDocumentId}/import-students/preview`,
    { csv: input.csv, class_documentId: input.classDocumentId },
    { opsPortalVersioned: true },
  );
  return portalImportPreviewSchema.parse(res.data.data);
}

export function usePortalImportPreviewMutation() {
  return useMutation({ mutationFn: previewPortalImport });
}
