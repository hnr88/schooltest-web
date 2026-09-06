'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Users } from 'lucide-react';
import {
  OPS_STUDENTS_PAGE_SIZE_DEFAULT,
  type OpsStudentsListQuery,
} from '@schooltest/ops-contracts';

import { Alert, Button, EmptyState, Skeleton } from '@/modules/design-system';
import { OpsStudentsFilters } from '@/modules/ops/components/OpsStudentsFilters';
import { OpsStudentsTable } from '@/modules/ops/components/OpsStudentsTable';
import { opsStudentClassOptions } from '@/modules/ops/lib/ops-students-list.helpers';
import { useTeachersListQuery } from '@/modules/ops/queries/use-teachers-list.query';
import { useStudentsListQuery } from '@/modules/ops/queries/use-students-list.query';

import type { OpsStudentsTabProps } from '@/modules/ops/types/students-list.types';

// C-OPS-PORTAL-035 (OPS-045) — the ops Students tab. Filtering, ordering and
// totals are all SERVER-side, so the count under the table is the whole
// filtered scope and never the length of the page on screen.
const FIRST_PAGE: OpsStudentsListQuery = {
  page: 1,
  pageSize: OPS_STUDENTS_PAGE_SIZE_DEFAULT,
};

export function OpsStudentsTab({ schoolDocumentId }: OpsStudentsTabProps) {
  const t = useTranslations('Ops.schoolTables');
  const [query, setQuery] = useState<OpsStudentsListQuery>(FIRST_PAGE);
  const [searchInput, setSearchInput] = useState('');
  const students = useStudentsListQuery(schoolDocumentId, query, true);
  const teachers = useTeachersListQuery(schoolDocumentId, { page: 1, pageSize: 200 }, true);

  const pagination = students.data?.meta.pagination ?? null;
  const rows = students.data?.data ?? [];
  const isFiltered =
    query.q !== undefined ||
    query.status !== undefined ||
    query.class !== undefined ||
    query.year_level !== undefined;

  return (
    <div className="flex flex-col gap-3">
      <p className="max-w-2xl text-sm text-body">{t('studentsNote')}</p>

      <OpsStudentsFilters
        query={query}
        onQueryChange={setQuery}
        classOptions={opsStudentClassOptions(teachers.data?.data ?? [])}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onSearchSubmit={() =>
          setQuery({ ...query, page: 1, q: searchInput.trim() === '' ? undefined : searchInput.trim() })
        }
      />

      {students.isPending ? (
        <div className="flex flex-col gap-2" data-testid="ops-students-loading">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : students.isError ? (
        <Alert variant="error" title={t('errorTitle')}>
          {t('errorDescription')}
        </Alert>
      ) : rows.length === 0 ? (
        <div className="rounded-card border border-border bg-card px-6 py-6 shadow-sm">
          <EmptyState
            icon={Users}
            tone="brand"
            title={isFiltered ? t('studentsFilteredEmptyTitle') : t('studentsEmptyTitle')}
            description={
              isFiltered ? t('studentsFilteredEmptyDescription') : t('studentsEmptyDescription')
            }
            className="border-none px-0 py-2"
          />
        </div>
      ) : (
        <OpsStudentsTable rows={rows} />
      )}

      {pagination !== null && !students.isError ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-meta text-body" data-testid="ops-students-total">
            {t('studentsCount', { count: pagination.total })}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-meta text-body">
              {t('paginationSummary', {
                page: pagination.page,
                pageCount: Math.max(pagination.pageCount, 1),
              })}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pagination.page <= 1}
              onClick={() => setQuery({ ...query, page: pagination.page - 1 })}
            >
              {t('paginationPrevious')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pagination.page >= pagination.pageCount}
              onClick={() => setQuery({ ...query, page: pagination.page + 1 })}
            >
              {t('paginationNext')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
