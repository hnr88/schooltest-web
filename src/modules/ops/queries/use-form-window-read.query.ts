'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import {
  formWindowReadParams,
  formWindowWireRowSchema,
  resolveSchoolFormWindow,
  type FormWindowResolution,
} from '@schooltest/ops-contracts';

import { strapi, type StrapiCollectionResponse } from '@/lib/axios/strapi';

/**
 * C-OPS-PORTAL-052 (OPS-062) — the school form-window READ.
 *
 * The query, the row shape and the "what do these rows mean" rule all come from
 * `@schooltest/ops-contracts` (mvp/contracts/ops/src/form-window-read.ts), the
 * same definition the Strapi projection and both HTTP suites use, so the client
 * cannot drift from the server. Nothing about the shape is restated here.
 */
export type FormWindowReadState = FormWindowResolution;

/** Keyed by school documentId: two schools never share a cache entry. */
export function formWindowQueryKey(schoolDocumentId: string) {
  return ['ops', 'form-window', schoolDocumentId] as const;
}

async function fetchFormWindow(
  schoolDocumentId: string,
  signal: AbortSignal,
): Promise<FormWindowReadState> {
  const res = await strapi.get<StrapiCollectionResponse<unknown>>('/api/form-windows', {
    params: formWindowReadParams(schoolDocumentId),
    // D-COMPAT: the portal read declares its contract version. The header
    // selects a wire shape and carries no authority; the server answers a
    // versioned and an unversioned caller identically here.
    opsPortalVersioned: true,
    signal,
  });
  return resolveSchoolFormWindow(z.array(formWindowWireRowSchema).parse(res.data.data));
}

/**
 * The request is bound to the query's own AbortSignal, so navigating away from
 * a school detail cancels its in-flight read instead of letting a stale school's
 * response land after the next one.
 */
export function useFormWindowReadQuery(schoolDocumentId: string, enabled: boolean) {
  return useQuery({
    queryKey: formWindowQueryKey(schoolDocumentId),
    queryFn: ({ signal }) => fetchFormWindow(schoolDocumentId, signal),
    enabled: enabled && schoolDocumentId.length > 0,
    retry: false,
    staleTime: 30 * 1000,
  });
}
