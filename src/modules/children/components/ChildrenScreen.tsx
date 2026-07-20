'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Alert, Button, Skeleton } from '@/modules/design-system';
import { ChildrenEmptyState } from '@/modules/children/components/ChildrenEmptyState';
import { ChildrenTable } from '@/modules/children/components/ChildrenTable';
import { ChildrenToolbar } from '@/modules/children/components/ChildrenToolbar';
import { useChildrenList } from '@/modules/children/hooks/use-children-list';

// C-UI-MYCHILDREN — the My children list page (Pattern B): header (h1 + count pill
// + "Add student" → wizard), toolbar (search + showing + include-archived), and
// the table with loading/error/empty states. D-UI-2 entrance on the content block.
export function ChildrenScreen() {
  const t = useTranslations('Children');
  const tCommon = useTranslations('Common');
  const {
    rows,
    totalCount,
    visibleCount,
    includeArchived,
    setIncludeArchived,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useChildrenList();

  return (
    <main className="flex flex-1 flex-col gap-6 px-8 py-7 duration-300 ease-out animate-in slide-in-from-bottom-2 motion-reduce:animate-none">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold text-foreground">{t('heading')}</h1>
          <span className="rounded-full bg-muted px-2 py-0.5 text-caption font-semibold text-muted-foreground">
            {totalCount}
          </span>
        </div>
        <Button href="/dashboard/children/new">
          <Plus aria-hidden="true" className="size-4" />
          {t('addStudent')}
        </Button>
      </header>

      {isLoading ? (
        <div className="flex flex-col gap-2" aria-hidden="true">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : isError ? (
        <Alert
          variant="error"
          title={t('errorTitle')}
          action={
            <Button type="button" variant="outline" size="sm" loading={isFetching} onClick={() => refetch()}>
              {t('retry')}
            </Button>
          }
        >
          {tCommon('errorDescription')}
        </Alert>
      ) : totalCount === 0 ? (
        <ChildrenEmptyState />
      ) : (
        <>
          <ChildrenToolbar
            visibleCount={visibleCount}
            totalCount={totalCount}
            includeArchived={includeArchived}
            onIncludeArchivedChange={setIncludeArchived}
          />
          <ChildrenTable rows={rows} />
        </>
      )}
    </main>
  );
}
