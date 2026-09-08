'use client';

import { useQuery } from '@tanstack/react-query';
import {
  OPS_RESPONSES_CSV_FALLBACK_FILENAME,
  OPS_RESPONSES_CSV_PATH,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';
import { RESPONSES_CSV_QUERY_KEY } from '@/modules/ops/constants/queries.constants';
import type { OpsResponsesCsvFile } from '@/modules/ops/types/inspection.types';

/**
 * Ledger row 11b — C-OPS-04b GET /api/ops/responses.csv?session_documentId=,
 * ops only. The raw item-level export of ONE session for offline R work.
 *
 * Shaped exactly like the schools export (`use-schools-export.query.ts`), for
 * the same reasons:
 *  - `responseType: 'text'` keeps the CSV a string, so a non-2xx JSON body is
 *    surfaced as an error by the shared interceptor and is never saved as a
 *    file (the server 400s a missing `session_documentId`);
 *  - the filename comes from the response `Content-Disposition`
 *    (`responses-<sessionId>.csv`) and is NEVER invented client-side — the
 *    constant is a fallback for a proxy that strips the header;
 *  - `enabled: false` + `refetch()` on click: the export is pulled by an
 *    operator action, never on render, and nothing is cached
 *    (`staleTime`/`gcTime` 0) so a changed session id cannot hand back the
 *    previous session's file.
 */
async function fetchResponsesCsv(sessionDocumentId: string): Promise<OpsResponsesCsvFile> {
  const res = await strapi.get<string>(OPS_RESPONSES_CSV_PATH, {
    params: { session_documentId: sessionDocumentId },
    responseType: 'text',
  });
  const header = res.headers['content-disposition'] as string | undefined;
  const match = header?.match(/filename="([^"]+)"/);
  return {
    filename: match?.[1] ?? OPS_RESPONSES_CSV_FALLBACK_FILENAME,
    csv: res.data,
  };
}

export function useResponsesCsvQuery(sessionDocumentId: string) {
  return useQuery({
    queryKey: [...RESPONSES_CSV_QUERY_KEY, sessionDocumentId],
    queryFn: () => fetchResponsesCsv(sessionDocumentId),
    enabled: false,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
}
