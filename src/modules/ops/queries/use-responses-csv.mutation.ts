'use client';

import { useMutation } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';

// C-OPS-04 (task 70): the raw item-level responses.csv export. Fetched as a
// blob through the shared strapi axios instance (never raw fetch in a
// component) and saved via a temporary object URL.
async function downloadResponsesCsv(sessionDocumentId: string): Promise<void> {
  const res = await strapi.get<Blob>('/api/ops/responses.csv', {
    params: { session_documentId: sessionDocumentId },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(res.data);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `responses-${sessionDocumentId}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function useResponsesCsvMutation() {
  return useMutation({ mutationFn: downloadResponsesCsv });
}
