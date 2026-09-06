'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';

/**
 * Task 29 — C-OPS-PORTAL-056: Download PDF for one assessment window.
 *
 * The response is the BINARY report (application/pdf, Content-Disposition
 * attachment) — checked by content type, never parsed as JSON. A JSON error
 * body arriving where the PDF should be surfaces as a failed download instead
 * of the browser rendering an error page as a .pdf file. The PDF is a READ:
 * no cache invalidation is owed, which is exactly why the mutation has no
 * onSuccess invalidations.
 */
export interface WindowPdfInput {
  schoolDocumentId: string;
  windowDocumentId: string;
}

async function downloadWindowPdf(input: WindowPdfInput): Promise<Blob> {
  const res = await strapi.get<Blob>(
    `/api/ops/schools/${input.schoolDocumentId}/result-windows/${input.windowDocumentId}/report.pdf`,
    { opsPortalVersioned: true, responseType: 'blob' }
  );
  const contentType = String(res.headers?.['content-type'] ?? '');
  if (!contentType.startsWith('application/pdf')) {
    throw new Error(`expected application/pdf, got ${contentType || 'no content-type'}`);
  }
  return new Blob([res.data], { type: 'application/pdf' });
}

export function useWindowPdfDownload() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: downloadWindowPdf,
    // The PDF is a read — nothing to invalidate; the client is kept so the
    // hook signature matches every other ops query hook.
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ops', 'window-pdf-downloads'] });
    },
  });
}
