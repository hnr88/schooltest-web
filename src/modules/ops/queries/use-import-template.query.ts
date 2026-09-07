'use client';

import { useQuery } from '@tanstack/react-query';

import { IMPORT_TEMPLATE_FALLBACK_FILENAME } from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';
import { saveCsvDownload } from '@/modules/school-admin';

// C-OPS-PORTAL-046 (OPS-056): the student-import CSV template comes from the
// SERVER, so the download, the upload help and the parser share one column
// vocabulary. `opsPortalVersioned` sends X-Ops-Portal-Version: 1, which selects
// the pictured portal columns; an unversioned caller (a legacy client, never
// this one) still receives the six-column email-based template.
//
// The query is LAZY (enabled: false) — the panel drives it with refetch() on
// click, exactly like the school results export, so nothing is fetched until
// an operator asks for the file.

/** `attachment; filename="x.csv"` -> `x.csv`; null when the header is unreadable. */
function attachmentFilename(disposition: unknown): string | null {
  if (typeof disposition !== 'string') return null;
  const match = /filename="([^"]+)"/.exec(disposition);
  return match ? match[1] : null;
}

async function fetchImportTemplate(
  schoolDocumentId: string,
  classDocumentId: string | undefined,
): Promise<{ csv: string; filename: string }> {
  const res = await strapi.get<string>(
    `/api/ops/schools/${schoolDocumentId}/import-students/template.csv`,
    {
      params: classDocumentId ? { class_documentId: classDocumentId } : undefined,
      responseType: 'text',
      opsPortalVersioned: true,
    }
  );
  return {
    csv: res.data,
    // The server owns the scope-specific name; the shared fallback only applies
    // when Content-Disposition is not readable by the browser.
    filename: attachmentFilename(res.headers['content-disposition']) ?? IMPORT_TEMPLATE_FALLBACK_FILENAME,
  };
}

export function useImportTemplateQuery(schoolDocumentId: string, classDocumentId?: string) {
  return useQuery({
    queryKey: ['ops', 'import-template', schoolDocumentId, classDocumentId ?? null],
    queryFn: () => fetchImportTemplate(schoolDocumentId, classDocumentId),
    enabled: false,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
}

/**
 * Fetch-then-save, so the panel keeps no download logic of its own. A failed
 * request saves NOTHING: a non-2xx body is the JSON error envelope and must
 * never be written to disk as a `.csv`.
 */
export function useImportTemplateDownload(schoolDocumentId: string, classDocumentId?: string) {
  const query = useImportTemplateQuery(schoolDocumentId, classDocumentId);
  return {
    downloading: query.isFetching,
    failed: query.isError,
    download: async (): Promise<boolean> => {
      const result = await query.refetch();
      if (!result.data) return false;
      saveCsvDownload(result.data.csv, result.data.filename);
      return true;
    },
  };
}
