'use client';

import { Archive, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { DashboardSearch } from '@/modules/dashboard';

import type { ChildrenToolbarProps } from '@/modules/children/types/components.types';
import { SEARCH_FIELD } from '@/modules/children/constants/components.constants';

// Canonical list toolbar — search, filter triggers, then the result readout,
// sitting ABOVE the panel (never inside it): the existing debounced student
// search reused as a name filter, plus the "Include archived" filter toggle.
export function ChildrenToolbar({
  from,
  to,
  totalCount,
  includeArchived,
  onIncludeArchivedChange,
}: ChildrenToolbarProps) {
  const t = useTranslations('Children');

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className={SEARCH_FIELD}>
        <DashboardSearch />
      </div>
      <button
        type="button"
        aria-pressed={includeArchived}
        onClick={() => onIncludeArchivedChange(!includeArchived)}
        className={cn(
          // pointer-coarse:min-h-11 only ever answered touch. The drawn chip is
          // 37.6px and a real pointer scan measured exactly that on a mouse, so the
          // ::after (measured from the 35.6px PADDING box, inside the 1px border)
          // carries the target to 47.6 on every pointer type. The chip keeps its
          // canonical 40px-family box.
          'relative inline-flex items-center gap-2 rounded-full border px-4 py-2 text-body-sm font-medium transition duration-200 ease-out-expo after:absolute after:inset-x-0 after:-inset-y-1.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none pointer-coarse:min-h-11',
          includeArchived
            ? 'border-primary bg-blue-50 text-secondary-foreground'
            : 'border-portal-input bg-card text-muted-foreground hover:border-foreground hover:text-foreground',
        )}
      >
        {includeArchived ? (
          <Check aria-hidden="true" className="size-4 text-primary" />
        ) : (
          <Archive aria-hidden="true" className="size-4 text-slate-400" />
        )}
        {t('includeArchived')}
      </button>
      {/* same well/AA rule as the roster lede: #64748B is 4.23:1 on #EEF2F7 */}
      <p className="ml-auto text-meta text-body tabular-nums">
        {t('showing', { from, to, total: totalCount })}
      </p>
    </div>
  );
}
