'use client';

import { useTranslations } from 'next-intl';

import { Alert, Button, Skeleton } from '@/modules/design-system';
import { ChildrenEmptyState } from '@/modules/children/components/ChildrenEmptyState';
import { ChildrenGrid } from '@/modules/children/components/ChildrenGrid';
import { ChildrenRosterSummary } from '@/modules/children/components/ChildrenRosterSummary';
import { ChildrenToolbar } from '@/modules/children/components/ChildrenToolbar';
import { useChildrenList } from '@/modules/children/hooks/use-children-list';

// C-UI-MYCHILDREN — parent-owned child cards with the existing search, archive,
// and edit actions retained. Every card links to C-PARENT-CHILD-PROGRESS detail.
export function ChildrenScreen() {
  const t = useTranslations('Children');
  const tCommon = useTranslations('Common');
  const {
    rows,
    totalCount,
    visibleCount,
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

  return (
    <main
      data-surface="children-roster"
      className="flex flex-1 animate-in flex-col gap-6 px-8 py-7 duration-300 ease-out slide-in-from-bottom-2 motion-reduce:animate-none"
    >
      <ChildrenRosterSummary
        activeCount={activeCount}
        archivedCount={archivedCount}
        totalCount={allProfileCount}
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
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
            visibleCount={visibleCount}
            totalCount={totalCount}
            includeArchived={includeArchived}
            onIncludeArchivedChange={setIncludeArchived}
          />
          <ChildrenGrid rows={rows} />
        </>
      )}
    </main>
  );
}
