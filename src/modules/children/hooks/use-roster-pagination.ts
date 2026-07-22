'use client';

import { useState } from 'react';

import {
  clampPage,
  getPageCount,
  getPageNumbers,
  ROSTER_PAGE_SIZE,
} from '@/modules/children/lib/roster-pagination';
import type { RosterPagination } from '@/modules/children/types/children.types';

// Paginates the rows the roster query already holds (the list read asks for
// pageSize 100 in one request), so the footer counts are the real row counts and
// the pager is functional rather than decorative.
export function useRosterPagination<TRow>(
  rows: TRow[],
  pageSize = ROSTER_PAGE_SIZE,
): RosterPagination<TRow> {
  const [page, setPage] = useState(1);
  const [seenTotal, setSeenTotal] = useState(rows.length);
  const total = rows.length;
  const pageCount = getPageCount(total, pageSize);

  // Adjusting state during render (React's documented alternative to an effect):
  // a filter change can strand the pager past the last page, so a new row count
  // sends it back to the first page before anything is painted.
  if (seenTotal !== total) {
    setSeenTotal(total);
    setPage(1);
  }

  const safePage = clampPage(page, pageCount);
  const visible = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  return {
    page: safePage,
    pageCount,
    pageNumbers: getPageNumbers(safePage, pageCount),
    from: total === 0 ? 0 : (safePage - 1) * pageSize + 1,
    to: (safePage - 1) * pageSize + visible.length,
    total,
    rows: visible,
    setPage,
  };
}
