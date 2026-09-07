'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  AuditLogsOperation,
  RestContractViolation,
  auditLogsResponseSchema,
  type AuditLogsResponse,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';

// C-OPSA-01 — the ops audit ledger read for the Audit console.
//
// Every control is a SERVER parameter: `action` and `target` are the route's
// case-insensitive contains filters, `actor` is an exact documentId, `from`/`to`
// bound `createdAt`, and `page`/`pageSize` are the server's own pagination. The
// client never filters a loaded page and calls it a filter — the totals in
// `meta.pagination` are whole-scope, which is what makes the pager honest.
//
// NOTE the deliberate absence of `opsPortalVersioned`: sending
// X-Ops-Portal-Version: 1 selects the SANITIZED school-scoped activity
// projection of this same route (see use-school-activity.query.ts). The console
// needs the full ops-only ledger, so the header is omitted on purpose.
export interface AuditLogFilters {
  action?: string;
  target?: string;
  actor?: string;
  from?: string;
  to?: string;
}

export interface AuditLogsArgs extends AuditLogFilters {
  page: number;
  pageSize: number;
}

export function auditLogsQueryKey(args: AuditLogsArgs) {
  return ['ops', 'audit-logs', args] as const;
}

/** Empty controls are OMITTED, never sent as `?action=` — that is a 400 risk. */
function toParams(args: AuditLogsArgs): Record<string, string | number> {
  const params: Record<string, string | number> = { page: args.page, pageSize: args.pageSize };
  for (const key of ['action', 'target', 'actor', 'from', 'to'] as const) {
    const value = args[key]?.trim();
    if (value) params[key] = value;
  }
  return params;
}

async function fetchAuditLogs(args: AuditLogsArgs, signal: AbortSignal): Promise<AuditLogsResponse> {
  const res = await strapi.get<unknown>(AuditLogsOperation.path, { params: toParams(args), signal });
  const parsed = auditLogsResponseSchema.safeParse(res.data);
  if (!parsed.success) throw new RestContractViolation(parsed.error.issues);
  return parsed.data;
}

export function useAuditLogsQuery(args: AuditLogsArgs, enabled: boolean) {
  return useQuery({
    queryKey: auditLogsQueryKey(args),
    queryFn: ({ signal }) => fetchAuditLogs(args, signal),
    enabled,
    // Keeps the previous page on screen while the next one loads, so paging and
    // filtering never flash an empty table.
    placeholderData: keepPreviousData,
    staleTime: 0,
    retry: false,
  });
}
