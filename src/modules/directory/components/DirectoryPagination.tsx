'use client';

/**
 * Task 02 — the directory pager. Every number comes from the server's
 * `meta.pagination` (whole-scope totals, never the loaded page) and pageCount
 * is the server's, so an empty result simply renders nothing instead of a
 * "page 1 of 0" contradiction.
 */
import { Button } from '@/modules/design-system';
import { getPaginationRange } from '@/modules/search-shared/lib/pagination-range';

import type { DirectoryLabels, DirectoryMeta } from '../types/directory.types';

/**
 * school-admin/03 (U-16) — the pager variants of §L-pagination.
 *
 * `steps` is today's markup, unchanged. `numbered` renders the ellipsis window
 * from `getPaginationRange` — the product's ONE pager algorithm, imported from
 * `search-shared/lib/pagination-range.ts` rather than copied, so
 * `search-shared/index.ts`'s re-export and `SearchPagination.tsx` keep working
 * off the same body. `none` renders nothing, for a surface that shows
 * everything it loaded.
 *
 * Declared on this component's OWN props rather than as `DirectoryPaginationDef`
 * in the kit's types file: that file and `DirectoryTable.tsx` (the only renderer)
 * belong to other rows. The two lines that thread `pagination.variant` from a
 * surface through the table are handed off in proof/03.md.
 */
export type DirectoryPaginationVariant = 'steps' | 'numbered' | 'none';

interface DirectoryPaginationProps {
  meta: DirectoryMeta;
  onPageChange: (page: number) => void;
  labels: DirectoryLabels;
  /** §L-pagination. Default `'steps'` — today's behaviour for every consumer. */
  variant?: DirectoryPaginationVariant;
}

export function DirectoryPagination({
  meta,
  onPageChange,
  labels,
  variant = 'steps',
}: DirectoryPaginationProps) {
  if (variant === 'none') return null;
  if (meta.total === 0 || meta.pageCount === 0) return null;

  if (variant === 'numbered') {
    return (
      <nav
        aria-label={labels.paginationLabel}
        data-slot="directory-pagination"
        data-variant="numbered"
        className="flex flex-wrap items-center justify-end gap-3"
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
        {getPaginationRange(meta.page, meta.pageCount).map((token, index) =>
          token === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              aria-hidden="true"
              data-slot="directory-pagination-ellipsis"
              className="select-none px-1 text-muted-foreground"
            >
              …
            </span>
          ) : (
            <Button
              key={token}
              type="button"
              variant={token === meta.page ? 'default' : 'outline'}
              size="sm"
              aria-current={token === meta.page ? 'page' : undefined}
              onClick={() => onPageChange(token)}
            >
              {token}
            </Button>
          ),
        )}
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
