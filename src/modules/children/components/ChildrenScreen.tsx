'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Alert, Button, Skeleton } from '@/modules/design-system';
import { ChildrenEmptyState } from '@/modules/children/components/ChildrenEmptyState';
import { ChildrenGrid } from '@/modules/children/components/ChildrenGrid';
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
    hasAnyChildren,
    includeArchived,
    setIncludeArchived,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useChildrenList();

  return (
    <main className="flex flex-1 animate-in flex-col gap-6 px-8 py-7 duration-300 ease-out slide-in-from-bottom-2 motion-reduce:animate-none">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold text-foreground">{t('heading')}</h1>
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-caption font-semibold text-navy-800 dark:bg-blue-950 dark:text-blue-100">
            {totalCount}
          </span>
        </div>
        <Button href="/dashboard/children/new" className="h-11">
          <Plus aria-hidden="true" className="size-4" />
          {t('addStudent')}
        </Button>
      </header>

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
