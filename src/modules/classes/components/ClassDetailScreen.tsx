'use client';

import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Link } from '@/i18n/navigation';
import { useAuthStore } from '@/modules/auth';
import { ClassDetailHeader } from '@/modules/classes/components/ClassDetailHeader';
import { ClassImportStudentsDialog } from '@/modules/classes/components/ClassImportStudentsDialog';
import { ClassStudentsEmpty } from '@/modules/classes/components/ClassStudentsEmpty';
import { ClassStudentsTable } from '@/modules/classes/components/ClassStudentsTable';
import { ClassSummaryCards } from '@/modules/classes/components/ClassSummaryCards';
import { EditClassDialog } from '@/modules/classes/components/EditClassDialog';
import { useClassDetailQuery } from '@/modules/classes/queries/use-class-detail.query';
import { Alert, Button, Skeleton } from '@/modules/design-system';
import { RecordCrumb } from '@/modules/shell';

import type { ClassDetailScreenProps } from '@/modules/classes/types/components.types';

// Spec §1 class detail: header, four summary cards and the student roster with
// each student's Test A / Test B result — everything from ONE C-CLS-05 read.
// Teacher assignment lives in the edit modal, so this surface carries no
// checkbox and no save button, and a row click drills into the student.
export function ClassDetailScreen({ documentId }: ClassDetailScreenProps) {
  const t = useTranslations('Classes.detail');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const enabled = hydrated && Boolean(token);
  const detailQuery = useClassDetailQuery(documentId, enabled);
  const [editing, setEditing] = useState(false);
  const [importing, setImporting] = useState(false);

  const isPending = !enabled || detailQuery.isPending;
  const schoolClass = detailQuery.data ?? null;

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
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : detailQuery.isError ? (
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
          <RecordCrumb label={schoolClass.name ?? ''} />
          <ClassDetailHeader
            schoolClass={schoolClass}
            onEdit={() => setEditing(true)}
            onImport={() => setImporting(true)}
          />
          <ClassSummaryCards summary={schoolClass.summary} />
          <section aria-labelledby="class-detail-students-heading" className="flex flex-col gap-3">
            <h2
              id="class-detail-students-heading"
              className="text-lg font-semibold text-foreground"
            >
              {t('studentsTitle')}
            </h2>
            {schoolClass.students.length === 0 ? (
              <ClassStudentsEmpty onImport={() => setImporting(true)} />
            ) : (
              <ClassStudentsTable
                classDocumentId={schoolClass.documentId}
                students={schoolClass.students}
              />
            )}
          </section>
          {editing ? (
            <EditClassDialog schoolClass={schoolClass} onClose={() => setEditing(false)} />
          ) : null}
          {importing ? (
            <ClassImportStudentsDialog
              classDocumentId={schoolClass.documentId}
              className={schoolClass.name ?? ''}
              onClose={() => setImporting(false)}
            />
          ) : null}
        </>
      )}
    </main>
  );
}
