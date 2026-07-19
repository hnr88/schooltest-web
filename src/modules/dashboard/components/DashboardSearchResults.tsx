'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import type { Student } from '@/modules/dashboard/types/student.types';

export const DASHBOARD_SEARCH_LISTBOX_ID = 'dashboard-search-listbox';
export const dashboardSearchOptionId = (index: number) => `dashboard-search-option-${index}`;

interface DashboardSearchResultsProps {
  isLoading: boolean;
  isError: boolean;
  results: Student[];
  activeIndex: number;
  onSelect: (documentId: string) => void;
}

// The dropdown panel DashboardSearch renders below its input — split out to
// keep DashboardSearch itself under the module's component line cap.
export function DashboardSearchResults({
  isLoading,
  isError,
  results,
  activeIndex,
  onSelect,
}: DashboardSearchResultsProps) {
  const t = useTranslations('Dashboard');
  const tCommon = useTranslations('Common');

  return (
    <div
      data-slot="dashboard-search-panel"
      className="absolute z-50 mt-2 w-full rounded-xl border border-border bg-popover p-1.5 text-sm text-popover-foreground shadow-lg duration-200 ease-out animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 motion-reduce:animate-none"
    >
      {isLoading ? (
        <div className="flex flex-col gap-1" aria-hidden="true">
          <div className="h-9 animate-pulse rounded-md bg-muted" />
          <div className="h-9 animate-pulse rounded-md bg-muted" />
        </div>
      ) : isError ? (
        <p className="px-2.5 py-2 text-muted-foreground">{tCommon('error')}</p>
      ) : (
        <div id={DASHBOARD_SEARCH_LISTBOX_ID} role="listbox" aria-label={t('searchPlaceholder')}>
          {results.length === 0 ? (
            <div
              role="option"
              aria-disabled="true"
              aria-selected={false}
              className="flex flex-col gap-0.5 px-2.5 py-3 text-center"
            >
              <span className="font-medium text-foreground">{t('noResultsTitle')}</span>
              <span className="text-muted-foreground">{t('noResultsSubtitle')}</span>
            </div>
          ) : (
            results.map((student, index) => (
              <div
                key={student.documentId}
                id={dashboardSearchOptionId(index)}
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onSelect(student.documentId)}
                className={cn(
                  'flex cursor-pointer flex-col gap-0.5 rounded-md px-2.5 py-2 font-medium transition-colors duration-150 ease-out hover:bg-muted motion-reduce:transition-none',
                  index === activeIndex && 'bg-muted',
                )}
              >
                <span>
                  {student.given_name} {student.family_name}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  {[
                    student.year_level ? t('yearLevelOption', { level: student.year_level }) : null,
                    student.email,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
