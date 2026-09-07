'use client';

/**
 * The Audit ledger's control state, URL-backed (the ops directory kit's rule:
 * the URL is the store, so a filtered view is shareable and survives a reload).
 *
 * The kit's own `useOpsDirectoryState` is deliberately NOT reused here: it
 * models `q` + enumerated filter selects + a `sort` param, and this route
 * serves none of those — it takes free-text CONTAINS filters, a date range, and
 * orders `id desc` with no sort parameter at all. Forcing the kit would have
 * meant inventing API params. The kit's pager and empty/error states ARE reused.
 */
import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { usePathname } from '@/i18n/navigation';
import { AUDIT_PAGE_SIZE_DEFAULT, AUDIT_PAGE_SIZE_MAX } from '@schooltest/ops-contracts';

import type { AuditLogsArgs } from '@/modules/ops/queries/use-audit-logs.query';

/** The free-text controls the route accepts, in render order. */
export const AUDIT_TEXT_FILTERS = ['action', 'target'] as const;
export type AuditTextFilter = (typeof AUDIT_TEXT_FILTERS)[number];

export type AuditFilterValues = Partial<Record<AuditTextFilter, string>>;

export interface AuditLogControls {
  args: AuditLogsArgs;
  /**
   * Applies EVERY filter in one write. A per-key setter cannot be used from a
   * form submit: two calls in one tick both read the same pre-update values, so
   * the second silently clobbers the first (the `action` filter never reached
   * the server). One atomic write is the fix.
   */
  setFilters: (values: AuditFilterValues) => void;
  setPage: (page: number) => void;
  clear: () => void;
  hasActiveFilters: boolean;
}

function readInt(raw: string | null, fallback: number, min: number, max: number): number {
  const value = Number(raw);
  if (!raw || !Number.isInteger(value) || value < min || value > max) return fallback;
  return value;
}

export function useAuditLogControls(): AuditLogControls {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const action = searchParams.get('action')?.trim() ?? '';
  const target = searchParams.get('target')?.trim() ?? '';
  const page = readInt(searchParams.get('page'), 1, 1, 100_000);
  // pageSize is a server parameter too, so a deep link can widen the page.
  const pageSize = readInt(
    searchParams.get('pageSize'),
    AUDIT_PAGE_SIZE_DEFAULT,
    1,
    AUDIT_PAGE_SIZE_MAX,
  );

  const write = useCallback(
    (next: { action: string; target: string; page: number; pageSize: number }) => {
      const params = new URLSearchParams();
      if (next.action) params.set('action', next.action);
      if (next.target) params.set('target', next.target);
      if (next.page > 1) params.set('page', String(next.page));
      if (next.pageSize !== AUDIT_PAGE_SIZE_DEFAULT) params.set('pageSize', String(next.pageSize));
      const qs = params.toString();
      // replace, not push: filtering is not navigation history.
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  const setFilters = useCallback(
    (values: AuditFilterValues) => {
      // Any result-set change belongs to page 1.
      write({
        action: (values.action ?? action).trim(),
        target: (values.target ?? target).trim(),
        page: 1,
        pageSize,
      });
    },
    [action, target, pageSize, write],
  );

  const setPage = useCallback(
    (next: number) => write({ action, target, page: next, pageSize }),
    [action, target, pageSize, write],
  );

  const clear = useCallback(
    () => write({ action: '', target: '', page: 1, pageSize }),
    [pageSize, write],
  );

  const args = useMemo<AuditLogsArgs>(
    () => ({ action, target, page, pageSize }),
    [action, target, page, pageSize],
  );

  return { args, setFilters, setPage, clear, hasActiveFilters: Boolean(action || target) };
}
