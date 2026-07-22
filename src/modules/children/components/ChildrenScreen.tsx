'use client';

import { useTranslations } from 'next-intl';

import { Alert, Button } from '@/modules/design-system';
import { ChildrenEmptyState } from '@/modules/children/components/ChildrenEmptyState';
import { ChildrenRoster } from '@/modules/children/components/ChildrenRoster';
import { ChildrenRosterSkeleton } from '@/modules/children/components/ChildrenRosterSkeleton';
import { ChildrenRosterSummary } from '@/modules/children/components/ChildrenRosterSummary';
import { ChildrenToolbar } from '@/modules/children/components/ChildrenToolbar';
import { useChildrenList } from '@/modules/children/hooks/use-children-list';
import { useRosterPagination } from '@/modules/children/hooks/use-roster-pagination';

// C-UI-MYCHILDREN — the roster panel screen. Canonical list rhythm: 24/32 page
// padding and a 16px section gap, tighter than the dashboard's 28/32 and 24.
export function ChildrenScreen() {
  const t = useTranslations('Children');
  const tCommon = useTranslations('Common');
  const {
    rows,
    totalCount,
    allProfileCount,
    activeCount,
    archivedCount,
    hasAnyChildren,
    includeArchived,
    setIncludeArchived,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useChildrenList();
  const pagination = useRosterPagination(rows);

  return (
    <main
      data-surface="children-roster"
      className="flex flex-1 animate-in flex-col gap-4 px-4 py-6 duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none sm:px-6 lg:px-8"
    >
      <ChildrenRosterSummary
        activeCount={activeCount}
        archivedCount={archivedCount}
        totalCount={allProfileCount}
      />

      {isLoading ? (
        <ChildrenRosterSkeleton />
      ) : isError ? (
        <Alert
          variant="error"
          title={t('errorTitle')}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 px-4"
              loading={isFetching}
              onClick={() => refetch()}
            >
              {t('retry')}
            </Button>
          }
        >
          {tCommon('errorDescription')}
        </Alert>
      ) : !hasAnyChildren ? (
        <ChildrenEmptyState />
      ) : (
        <>
          <ChildrenToolbar
            from={pagination.from}
            to={pagination.to}
            totalCount={totalCount}
            includeArchived={includeArchived}
            onIncludeArchivedChange={setIncludeArchived}
          />
          <ChildrenRoster pagination={pagination} />
        </>
      )}
    </main>
  );
}
