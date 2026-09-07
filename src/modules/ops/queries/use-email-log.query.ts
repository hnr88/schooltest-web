'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  CommsEmailLogOperation,
  RestContractViolation,
  emailLogResponseSchema,
  type EmailLogResponse,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';
import { COMMS_EMAIL_LOG_QUERY_KEY } from '@/modules/ops/constants/queries.constants';

// C-OPSM-03 — the auth-email ISSUANCE ledger.
//
// Worth being precise about, because the name invites the wrong reading: this
// is not a sent-mail log and carries no delivery outcome. It is the record of
// auth emails the platform issued (password reset, email confirmation), and the
// same row holds a `token_hash` the server projects away.
//
// `page`/`pageSize` are SERVER parameters and `meta.pagination` totals are
// whole-scope, so the pager is honest. The route serves no filter and no sort —
// it orders newest-first — so none is offered rather than faking one over a
// single loaded page.
export interface EmailLogArgs {
  page: number;
  pageSize: number;
}

export function emailLogQueryKey(args: EmailLogArgs) {
  return [...COMMS_EMAIL_LOG_QUERY_KEY, args] as const;
}

async function fetchEmailLog(args: EmailLogArgs, signal: AbortSignal): Promise<EmailLogResponse> {
  const res = await strapi.get<unknown>(CommsEmailLogOperation.path, {
    params: { page: args.page, pageSize: args.pageSize },
    signal,
  });
  const parsed = emailLogResponseSchema.safeParse(res.data);
  if (!parsed.success) throw new RestContractViolation(parsed.error.issues);
  return parsed.data;
}

export function useEmailLogQuery(args: EmailLogArgs, enabled: boolean) {
  return useQuery({
    queryKey: emailLogQueryKey(args),
    queryFn: ({ signal }) => fetchEmailLog(args, signal),
    enabled,
    // Keeps the current page on screen while the next loads, so paging never
    // flashes an empty table.
    placeholderData: keepPreviousData,
    staleTime: 0,
    retry: false,
  });
}
