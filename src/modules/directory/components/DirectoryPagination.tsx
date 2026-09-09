'use client';

/**
 * Task 02 — the directory pager. Every number comes from the server's
 * `meta.pagination` (whole-scope totals, never the loaded page) and pageCount
 * is the server's, so an empty result simply renders nothing instead of a
 * "page 1 of 0" contradiction.
 */
import { Button } from '@/modules/design-system';

import type { DirectoryLabels, DirectoryMeta } from '../types/directory.types';

interface DirectoryPaginationProps {
  meta: DirectoryMeta;
  onPageChange: (page: number) => void;
  labels: DirectoryLabels;
}

export function DirectoryPagination({ meta, onPageChange, labels }: DirectoryPaginationProps) {
  if (meta.total === 0 || meta.pageCount === 0) return null;

  return (
    <nav
      aria-label={labels.paginationLabel}
      data-slot="directory-pagination"
      className="flex items-center justify-end gap-3"
    >
      <p className="text-sm text-muted-foreground" role="status">
        {labels.pageCount({ page: meta.page, pageCount: meta.pageCount, total: meta.total })}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={meta.page <= 1}
        onClick={() => onPageChange(meta.page - 1)}
      >
        {labels.previous}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={meta.page >= meta.pageCount}
        onClick={() => onPageChange(meta.page + 1)}
      >
        {labels.next}
      </Button>
    </nav>
  );
}
