'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  RestContractViolation,
  SchoolActivityOperation,
  schoolActivityResponseSchema,
  type SchoolActivityResponse,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';

// C-OPS-PORTAL-010 (OPS-020) — the school overview's Recent activity card.
// One fetcher for the school-scoped activity read:
//  - the school filter is applied server-side over the whole ledger (the
//    server returns only rows attributable to this school) — the client never
//    scans one page of a global feed and calls it scoped;
//  - the body is parsed through the shared contract, so a drifted shape throws
//    instead of rendering as a silently empty card;
//  - `opsPortalVersioned` adds the wire-shape header only; the bearer token
//    still decides what the caller may see.
export interface SchoolActivityArgs {
  schoolDocumentId: string;
  pageSize?: number;
}

export function schoolActivityQueryKey({ schoolDocumentId, pageSize }: SchoolActivityArgs) {
  return ['ops', 'school-activity', schoolDocumentId, pageSize ?? null] as const;
}

async function fetchSchoolActivity(
  args: SchoolActivityArgs,
  signal: AbortSignal,
): Promise<SchoolActivityResponse> {
  const res = await strapi.get<unknown>(SchoolActivityOperation.path, {
    params: { school: args.schoolDocumentId, pageSize: args.pageSize ?? 5 },
    opsPortalVersioned: true,
    signal,
  });
  const parsed = schoolActivityResponseSchema.safeParse(res.data);
  if (!parsed.success) throw new RestContractViolation(parsed.error.issues);
  return parsed.data;
}

export function useSchoolActivityQuery(args: SchoolActivityArgs, enabled: boolean) {
  return useQuery({
    queryKey: schoolActivityQueryKey(args),
    queryFn: ({ signal }) => fetchSchoolActivity(args, signal),
    enabled: enabled && Boolean(args.schoolDocumentId),
    placeholderData: keepPreviousData,
    staleTime: 0,
    refetchOnMount: 'always',
    retry: false,
  });
}
