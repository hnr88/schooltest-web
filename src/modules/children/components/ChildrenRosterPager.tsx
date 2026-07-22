'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { IconButton } from '@/modules/design-system';
import type { RosterPagination } from '@/modules/children/types/children.types';

interface ChildrenRosterPagerProps {
  pagination: RosterPagination<unknown>;
}

const PAGE_BUTTON =
  'relative inline-grid size-8 place-items-center rounded-full text-meta font-semibold tabular-nums transition-colors duration-200 ease-out-expo after:absolute after:-inset-1.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none';

// Canonical table footer strip (DS §09, Students screen): page readout on the
// left, 32px prev / numbered / next squares on the right, on the page-tint band
// inside the panel. Each 32px square keeps its canonical VISUAL box and gets a
// 44x44 pointer target from the ::after inset.
export function ChildrenRosterPager({ pagination }: ChildrenRosterPagerProps) {
  const t = useTranslations('Children');
  const { page, pageCount, pageNumbers, setPage } = pagination;

  return (
    <nav
      data-slot="children-roster-pager"
      aria-label={t('pagerLabel')}
      className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-card px-5 py-3 shadow-sm"
    >
      <p className="text-meta text-secondary-foreground tabular-nums">
        {t('pagerPage', { page, pages: pageCount })}
      </p>
      {/* 12px gaps, not the canonical 6px: each 32px square keeps its canonical
          VISUAL box and claims ±6px through its ::after, so two neighbours reach
          44x44 without their pointer targets overlapping. */}
      <div className="flex items-center gap-3">
        <IconButton
          icon={ChevronLeft}
          label={t('pagerPrevious')}
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        />
        {pageNumbers.map((number, index) => (
          <span key={number} className="flex items-center gap-3">
            {index > 0 && number - pageNumbers[index - 1] > 1 ? (
              <span aria-hidden="true" className="px-0.5 text-meta text-muted-foreground">
                …
              </span>
            ) : null}
            <button
              type="button"
              aria-label={t('pagerGoTo', { page: number })}
              aria-current={number === page ? 'page' : undefined}
              onClick={() => setPage(number)}
              className={cn(
                PAGE_BUTTON,
                number === page
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-card text-secondary-foreground hover:bg-muted',
              )}
            >
              {number}
            </button>
          </span>
        ))}
        <IconButton
          icon={ChevronRight}
          label={t('pagerNext')}
          disabled={page >= pageCount}
          onClick={() => setPage(page + 1)}
        />
      </div>
    </nav>
  );
}
