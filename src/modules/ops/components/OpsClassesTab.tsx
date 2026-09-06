'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap } from 'lucide-react';

import { Alert, Button, EmptyState, Skeleton } from '@/modules/design-system';
import { OpsClassesTable } from '@/modules/ops/components/OpsClassesTable';
import { OpsClassesToolbar } from '@/modules/ops/components/OpsClassesToolbar';
import { useClassesFilter } from '@/modules/ops/hooks/use-classes-filter';
import { useClassesListQuery } from '@/modules/ops/queries/use-classes-list.query';

// OPS-038 — the Classes tab of the ops school detail (C-OPS-PORTAL-028).
// It reads the real list operation, so an UNASSIGNED class appears: the old
// tab derived its rows from the staff directory and could only ever show
// classes that already had a teacher. The ?teacher= deep-link from the staff
// directory narrows the list to one teacher's classes and can be cleared
// without losing the other filters.

export function OpsClassesTab({ schoolDocumentId }: { schoolDocumentId: string }) {
  const t = useTranslations('Ops.classesTab');
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const teacherParam = searchParams.get('teacher');
  const filter = useClassesFilter(teacherParam);
  const classes = useClassesListQuery(schoolDocumentId, filter.query, true);
  const pagination = classes.data?.meta.pagination;

  const clearTeacher = useCallback(() => {
    const query = new URLSearchParams(searchParams.toString());
    query.delete('teacher');
    router.replace(query.size === 0 ? pathname : `${pathname}?${query}`, { scroll: false });
  }, [pathname, router, searchParams]);

  return (
    <div className="flex flex-col gap-3" data-testid="ops-classes-tab">
      <OpsClassesToolbar filter={filter} />

      {classes.isPending ? (
        <div className="flex flex-col gap-2" data-testid="ops-classes-loading">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : classes.isError ? (
        <Alert variant="error" title={t('errorTitle')}>
          {t('errorDescription')}
        </Alert>
      ) : classes.data.data.length === 0 ? (
        <div className="rounded-card border border-border bg-card px-6 py-6 shadow-sm">
          <EmptyState
            icon={GraduationCap}
            tone="brand"
            title={filter.isFiltered ? t('noMatchesTitle') : t('emptyTitle')}
            description={filter.isFiltered ? t('noMatchesDescription') : t('emptyDescription')}
            action={
              teacherParam === null ? undefined : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  data-testid="ops-classes-clear-teacher"
                  onClick={clearTeacher}
                >
                  {t('clearFilter')}
                </Button>
              )
            }
            className="border-none px-0 py-2"
          />
        </div>
      ) : (
        <>
          <OpsClassesTable schoolDocumentId={schoolDocumentId} rows={classes.data.data} />
          {pagination ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-meta text-muted-foreground" data-testid="ops-classes-summary">
                {t('showing', { showing: classes.data.data.length, total: pagination.total })}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  data-testid="ops-classes-prev"
                  disabled={pagination.page <= 1}
                  onClick={() => filter.goToPage(pagination.page - 1)}
                >
                  {t('previousPage')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  data-testid="ops-classes-next"
                  disabled={pagination.page >= pagination.pageCount}
                  onClick={() => filter.goToPage(pagination.page + 1)}
                >
                  {t('nextPage')}
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
