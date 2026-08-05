'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useAuthStore } from '@/modules/auth';
import { useSchoolClassesQuery } from '@/modules/classes';
import { Alert, Button, Skeleton } from '@/modules/design-system';
import { SchoolStudentEditDialog } from '@/modules/school-students/components/SchoolStudentEditDialog';
import { StudentImportDialog } from '@/modules/school-students/components/StudentImportDialog';
import { StudentsFilterBar } from '@/modules/school-students/components/StudentsFilterBar';
import { StudentsHeader } from '@/modules/school-students/components/StudentsHeader';
import { StudentsPagination } from '@/modules/school-students/components/StudentsPagination';
import { StudentsTable } from '@/modules/school-students/components/StudentsTable';
import { useStudentsFilters } from '@/modules/school-students/hooks/use-students-filters';
import { useSchoolStudentsQuery } from '@/modules/school-students/queries/use-school-students.query';
import type { SchoolStudent } from '@/modules/school-students/types/school-students.types';
import { ROSTER_COUNT_QUERY } from '@/modules/school-students/constants/queries.constants';

// School admin Students screen (spec §4): the C-CHD-01 roster reshaped to
// Name | Class | First language | Level | Diagnostic. Search, class and level
// all narrow server-side, so the table and its pager always agree. The subtitle
// total comes from its own unfiltered active-only read — it is a school total,
// not a count of what the current filters returned. Import (C-CHD-02 per row)
// sits beside the single-student form.
export function SchoolStudentsScreen() {
  const t = useTranslations('SchoolStudents');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const enabled = hydrated && Boolean(token);
  const filters = useStudentsFilters();
  const studentsQuery = useSchoolStudentsQuery(filters.query, enabled);
  const rosterCountQuery = useSchoolStudentsQuery(ROSTER_COUNT_QUERY, enabled);
  const classesQuery = useSchoolClassesQuery(enabled);
  const [editTarget, setEditTarget] = useState<SchoolStudent | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const classes = classesQuery.data ?? [];
  const isPending = !enabled || studentsQuery.isPending;
  const rows = studentsQuery.data?.rows ?? [];

  return (
    <main
      data-slot="school-students"
      data-surface="school-admin-students"
      className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <StudentsHeader
        studentCount={rosterCountQuery.data?.pagination.total ?? 0}
        classCount={classes.length}
        onImport={() => setImportOpen(true)}
      />
      <StudentsFilterBar
        search={filters.search}
        classId={filters.query.classId}
        level={filters.level}
        classes={classes}
        onSearch={filters.setSearch}
        onClass={filters.selectClass}
        onLevel={filters.selectLevel}
      />
      {isPending ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : studentsQuery.isError ? (
        <Alert
          variant="error"
          title={t('errorTitle')}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={studentsQuery.isFetching}
              onClick={() => void studentsQuery.refetch()}
            >
              {t('retry')}
            </Button>
          }
        >
          {t('errorDescription')}
        </Alert>
      ) : (
        <>
          <StudentsTable rows={rows} filtered={filters.filtered} onOpen={setEditTarget} />
          {studentsQuery.data ? (
            <StudentsPagination
              pagination={studentsQuery.data.pagination}
              onPage={filters.setPage}
            />
          ) : null}
        </>
      )}
      {editTarget ? (
        <SchoolStudentEditDialog
          student={editTarget}
          classes={classes}
          onClose={() => setEditTarget(null)}
        />
      ) : null}
      {importOpen ? (
        <StudentImportDialog classes={classes} onClose={() => setImportOpen(false)} />
      ) : null}
    </main>
  );
}
