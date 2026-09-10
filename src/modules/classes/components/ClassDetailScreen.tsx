'use client';

import { ArrowLeft, UserPlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Link } from '@/i18n/navigation';
import { useAuthStore } from '@/modules/auth';
import { ClassDetailHeader } from '@/modules/classes/components/ClassDetailHeader';
import { ClassImportStudentsDialog } from '@/modules/classes/components/ClassImportStudentsDialog';
import { ClassStudentsEmpty } from '@/modules/classes/components/ClassStudentsEmpty';
import { ClassStudentsPickerDialog } from '@/modules/classes/components/ClassStudentsPickerDialog';
import { ClassStudentsTable } from '@/modules/classes/components/ClassStudentsTable';
import { ClassSummaryCards } from '@/modules/classes/components/ClassSummaryCards';
import { EditClassDialog } from '@/modules/classes/components/EditClassDialog';
import { useClassStudentRoster } from '@/modules/classes/hooks/use-class-student-roster';
import { useClassDetailQuery } from '@/modules/classes/queries/use-class-detail.query';
import { Alert, Button, Skeleton } from '@/modules/design-system';
import { RecordCrumb } from '@/modules/shell';

import type { ClassDetailScreenProps } from '@/modules/classes/types/components.types';

// Spec §1 class detail: header, four summary cards and the student roster with
// each student's Test A / Test B result — everything from ONE C-CLS-05 read.
// Teachers are assigned through the header chips, students are added and
// removed on the roster, and the surface still carries no checkbox and no save
// button.
export function ClassDetailScreen({ documentId }: ClassDetailScreenProps) {
  const t = useTranslations('Classes.detail');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const enabled = hydrated && Boolean(token);
  const detailQuery = useClassDetailQuery(documentId, enabled);
  const [editing, setEditing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [addingStudents, setAddingStudents] = useState(false);
  const roster = useClassStudentRoster(documentId);

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
        className="inline-flex min-h-11 w-fit items-center gap-1.5 rounded-sm py-2 text-sm font-semibold text-primary transition-colors duration-150 hover:text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2
                id="class-detail-students-heading"
                className="text-lg font-semibold text-foreground"
              >
                {t('studentsTitle')}
              </h2>
              <Button
                type="button"
                variant="secondary"
                disabled={roster.assigning}
                onClick={() => setAddingStudents(true)}
              >
                <UserPlusIcon className="size-4" aria-hidden />
                {t('addStudent')}
              </Button>
            </div>
            {roster.error ? (
              <Alert
                variant="error"
                title={t('rosterErrorTitle')}
                action={
                  <Button type="button" variant="outline" size="sm" onClick={roster.clearError}>
                    {t('dismiss')}
                  </Button>
                }
              >
                {t('rosterErrorDescription')}
              </Alert>
            ) : null}
            {schoolClass.students.length === 0 ? (
              <ClassStudentsEmpty onImport={() => setImporting(true)} />
            ) : (
              <ClassStudentsTable
                classDocumentId={schoolClass.documentId}
                students={schoolClass.students}
                onRemoveStudent={(student) => void roster.remove(student)}
                removingDocumentIds={roster.removingDocumentIds}
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
          {addingStudents ? (
            <ClassStudentsPickerDialog
              classDocumentId={schoolClass.documentId}
              className={schoolClass.name ?? ''}
              roster={schoolClass.students}
              pending={roster.assigning}
              onSubmit={async (students) => roster.assign(students)}
              onClose={() => setAddingStudents(false)}
            />
          ) : null}
        </>
      )}
    </main>
  );
}
