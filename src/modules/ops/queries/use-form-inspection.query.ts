'use client';

import { useQuery } from '@tanstack/react-query';
import {
  formInspectionPath,
  formInspectionSchema,
  type FormInspection,
} from '@schooltest/ops-contracts';

import { parseDataEnvelope, strapi } from '@/lib/axios/strapi';
import { formInspectionQueryKey } from '@/modules/ops/constants/queries.constants';

/**
 * Ledger row 11a — C-OPS-04a GET /api/ops/forms/:documentId/inspection, ops only.
 *
 * The form's composition as the server reports it: every item with its task
 * type, stage, Q-matrix attribute vector and CORRECT KEY, the anchor item
 * codes, and the C-WIN-02 lock flag. This is the only surface in the product
 * that serves keys, which is why the route carries `global::is-ops` (anon 403,
 * teacher 403, ops 200 — measured live) and why this hook is opened by an
 * explicit operator action rather than fetched with the page.
 */
async function fetchFormInspection(
  formDocumentId: string,
  signal: AbortSignal,
): Promise<FormInspection> {
  const res = await strapi.get<unknown>(formInspectionPath(formDocumentId), { signal });
  return parseDataEnvelope(formInspectionSchema, res.data);
}

export function useFormInspectionQuery(formDocumentId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: formInspectionQueryKey(formDocumentId ?? ''),
    queryFn: ({ signal }) => fetchFormInspection(formDocumentId ?? '', signal),
    enabled: enabled && Boolean(formDocumentId),
    retry: false,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}
