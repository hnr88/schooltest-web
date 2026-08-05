'use client';

import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { useAuthStore } from '@/modules/auth';
import { ClassAssignmentPanel } from '@/modules/classes/components/ClassAssignmentPanel';
import { isYearBand } from '@/modules/classes/constants/year-bands.constants';
import { useClassDetailQuery } from '@/modules/classes/queries/use-class-detail.query';
import { Alert, Button, Skeleton, Tag } from '@/modules/design-system';
import { useSchoolStudentsQuery } from '@/modules/school-students';
import { RecordCrumb } from '@/modules/shell';
import { useTeachersQuery } from '@/modules/teachers';

import type { ClassDetailScreenProps } from '@/modules/classes/types/components.types';

// School admin class detail (task 31, st-mvp-pivot): one class's teachers and
// students with pickers saved through C-CLS-03. The panel mounts only once
// every source query has resolved, so its working state always starts from
// fresh server data. The student picker lists active students; the roster
// query (any status, filtered to this class) seeds the checked state so
// archived members survive the PATCH replace semantics.
export function ClassDetailScreen({ documentId }: ClassDetailScreenProps) {
  const t = useTranslations('Classes.detail');
  const tb = useTranslations('Classes.yearBands');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const enabled = hydrated && Boolean(token);

  const detailQuery = useClassDetailQuery(documentId, enabled);
  const teachersQuery = useTeachersQuery(enabled);
  const activeStudentsQuery = useSchoolStudentsQuery(
    { status: 'active', classId: 'all', q: '', page: 1, pageSize: 100 },
    enabled,
  );
  const membersQuery = useSchoolStudentsQuery(
    { status: 'all', classId: documentId, q: '', page: 1, pageSize: 100 },
    enabled,
  );

  const isPending =
    !enabled ||
    detailQuery.isPending ||
    teachersQuery.isPending ||
    activeStudentsQuery.isPending ||
    membersQuery.isPending;
  const isError =
    detailQuery.isError ||
    teachersQuery.isError ||
    activeStudentsQuery.isError ||
    membersQuery.isError;
  const schoolClass = detailQuery.data ?? null;
  const band = schoolClass?.year_band ?? null;
  const bandLabel = band === null ? null : isYearBand(band) ? tb(band) : band;

  return (
    <main
      data-slot="school-class-detail"
      data-surface="school-admin-class-detail"
      className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <Link
        href="/dashboard/school/classes"
        className="inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-semibold text-primary transition-colors duration-150 hover:text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t('backLink')}
      </Link>
      {isPending ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
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
              loading={detailQuery.isFetching}
              onClick={() => void detailQuery.refetch()}
            >
              {t('retry')}
            </Button>
          }
        >
          {t('errorDescription')}
        </Alert>
      ) : schoolClass === null ? (
        <Alert variant="error" title={t('notFoundTitle')}>
          {t('notFoundDescription')}
        </Alert>
      ) : (
        <>
          <RecordCrumb label={schoolClass.name} />
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground">{schoolClass.name}</h1>
            {bandLabel !== null ? <Tag label={bandLabel} /> : null}
          </div>
          <ClassAssignmentPanel
            schoolClass={schoolClass}
            members={membersQuery.data?.rows ?? []}
            teachers={teachersQuery.data ?? []}
            activeStudents={activeStudentsQuery.data?.rows ?? []}
          />
        </>
      )}
    </main>
  );
}
