'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { DashboardSearch } from '@/modules/dashboard';

interface ChildrenToolbarProps {
  visibleCount: number;
  totalCount: number;
  includeArchived: boolean;
  onIncludeArchivedChange: (value: boolean) => void;
}

// C-UI-MYCHILDREN toolbar: the existing debounced student search (reused as a
// name filter via the shared store), an "Include archived" toggle chip, and the
// right-aligned "Showing a–b of N" readout.
export function ChildrenToolbar({
  visibleCount,
  totalCount,
  includeArchived,
  onIncludeArchivedChange,
}: ChildrenToolbarProps) {
  const t = useTranslations('Children');
  const from = visibleCount === 0 ? 0 : 1;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <DashboardSearch />
        <button
          type="button"
          aria-pressed={includeArchived}
          onClick={() => onIncludeArchivedChange(!includeArchived)}
          className={cn(
            'rounded-full border px-3.5 py-1.5 text-caption font-medium transition-colors duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none',
            includeArchived
              ? 'border-transparent bg-primary text-primary-foreground'
              : 'border-input bg-card text-muted-foreground hover:bg-muted',
          )}
        >
          {t('includeArchived')}
        </button>
      </div>
      <p className="text-sm text-muted-foreground">
        {t('showing', { from, to: visibleCount, total: totalCount })}
      </p>
    </div>
  );
}
