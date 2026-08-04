'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Link } from '@/i18n/navigation';
import { useAuthStore } from '@/modules/auth';
import { useSchoolClassesQuery } from '@/modules/classes';
import { Alert, Button, Skeleton } from '@/modules/design-system';
import { ChildrenFilterBar } from '@/modules/school-children/components/ChildrenFilterBar';
import { ChildrenPagination } from '@/modules/school-children/components/ChildrenPagination';
import { ChildrenTable } from '@/modules/school-children/components/ChildrenTable';
import { SchoolChildEditDialog } from '@/modules/school-children/components/SchoolChildEditDialog';
import { useChildrenFilters } from '@/modules/school-children/hooks/use-children-filters';
import { useSchoolChildrenQuery } from '@/modules/school-children/queries/use-school-children.query';
import type { SchoolChild } from '@/modules/school-children/types/school-children.types';

// School admin Children screen (task 30, st-mvp-pivot): the C-CHD-01 roster
// with status/class/name filters and pagination, add via the /new page
// (C-CHD-02), edit (C-CHD-03) and archive (C-CHD-04) from the row actions.
export function SchoolChildrenScreen() {
  const t = useTranslations('SchoolChildren');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const enabled = hydrated && Boolean(token);
  const filters = useChildrenFilters();
  const childrenQuery = useSchoolChildrenQuery(filters.query, enabled);
  const classesQuery = useSchoolClassesQuery(enabled);
  const [editTarget, setEditTarget] = useState<SchoolChild | null>(null);

  const isPending = !enabled || childrenQuery.isPending;

  return (
    <main
      data-slot="school-children"
      data-surface="school-admin-children"
      className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
          <p className="text-sm text-body">{t('description')}</p>
        </div>
        <Button size="lg" render={<Link href="/dashboard/school/children/new" />}>
          <Plus className="size-4" aria-hidden />
          {t('addButton')}
        </Button>
      </div>
      <ChildrenFilterBar
        search={filters.search}
        status={filters.query.status}
        classId={filters.query.classId}
        classes={classesQuery.data ?? []}
        onSearch={filters.setSearch}
        onStatus={filters.selectStatus}
        onClass={filters.selectClass}
      />
      {isPending ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : childrenQuery.isError ? (
        <Alert
          variant="error"
          title={t('errorTitle')}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={childrenQuery.isFetching}
              onClick={() => void childrenQuery.refetch()}
            >
              {t('retry')}
            </Button>
          }
        >
          {t('errorDescription')}
        </Alert>
      ) : (
        <>
          <ChildrenTable
            rows={childrenQuery.data?.rows ?? []}
            filtered={filters.filtered}
            onEdit={setEditTarget}
          />
          {childrenQuery.data ? (
            <ChildrenPagination
              pagination={childrenQuery.data.pagination}
              onPage={filters.setPage}
            />
          ) : null}
        </>
      )}
      {editTarget ? (
        <SchoolChildEditDialog
          child={editTarget}
          classes={classesQuery.data ?? []}
          onClose={() => setEditTarget(null)}
        />
      ) : null}
    </main>
  );
}
