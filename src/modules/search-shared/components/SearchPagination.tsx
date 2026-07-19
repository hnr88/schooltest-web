'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { getPaginationRange } from '@/modules/search-shared/lib/pagination-range';
import type { SearchPaginationProps } from '@/modules/search-shared/types/search-shared.types';

const pageButtonBase =
  'inline-flex size-8 items-center justify-center rounded-md text-caption font-medium transition-colors duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100';

const stepButton = 'border border-input bg-card text-slate-600 hover:bg-muted';

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
      className="flex items-center justify-between gap-4 px-5 py-3.5"
    >
      <p className="text-caption text-muted-foreground">{t('showing', { from, to, total })}</p>
      <div className="flex items-center gap-1.5">
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
