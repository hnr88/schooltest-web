'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { getPaginationRange } from '@/modules/search-shared/lib/pagination-range';
import type { SearchPaginationProps } from '@/modules/search-shared/types/search-shared.types';

// The DRAWN pager button stays at the canonical 36px square; the 44px pointer target
// comes from the ::after expansion. The 6px inset exactly meets the 12px sibling gap,
// so the boxes tile to 48x48 with no overlap stealing a neighbour's hits — an
// expansion WIDER than the gap makes the later sibling swallow its neighbour's edge.
const pageButtonBase =
  'relative inline-flex size-9 items-center justify-center rounded-md text-meta font-medium transition-colors duration-200 ease-out-expo after:absolute after:-inset-1.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100';

const stepButton = 'border border-input bg-card text-body hover:bg-muted';

function SearchPagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
}: SearchPaginationProps) {
  const t = useTranslations('Search');
  if (pageCount <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const tokens = getPaginationRange(page, pageCount);

  return (
    <nav
      aria-label={t('paginationLabel')}
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3"
    >
      <p className="text-meta text-body">{t('showing', { from, to, total })}</p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={t('prevPage')}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={cn(pageButtonBase, stepButton)}
        >
          <ChevronLeft aria-hidden="true" className="size-3.5" />
        </button>
        {tokens.map((token, index) =>
          token === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              aria-hidden="true"
              className="px-1 text-slate-400 select-none"
            >
              …
            </span>
          ) : (
            <button
              key={token}
              type="button"
              aria-label={t('goToPage', { page: token })}
              aria-current={token === page ? 'page' : undefined}
              onClick={() => onPageChange(token)}
              className={cn(
                pageButtonBase,
                token === page ? 'bg-primary font-semibold text-primary-foreground' : stepButton,
              )}
            >
              {token}
            </button>
          ),
        )}
        <button
          type="button"
          aria-label={t('nextPage')}
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          className={cn(pageButtonBase, stepButton)}
        >
          <ChevronRight aria-hidden="true" className="size-3.5" />
        </button>
      </div>
    </nav>
  );
}

export { SearchPagination };
