'use client';

import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { useAuthStore } from '@/modules/auth';
import { Alert, Button, Skeleton } from '@/modules/design-system';
import { StudentRecordPanel } from '@/modules/school-students/components/StudentRecordPanel';
import { studentDisplayName } from '@/modules/school-students/hooks/use-student-row-actions';
import { useSchoolStudentQuery } from '@/modules/school-students/queries/use-school-student.query';
import { RecordCrumb } from '@/modules/shell';
import { BACK_CLASSES } from '@/modules/school-students/constants/components.constants';

import type { SchoolStudentDetailScreenProps } from '@/modules/school-students/types/components.types';

// Spec §4 "each row ... navigates to an individual student detail view": the
// C-CHD-06 read of one student of the caller's own school. The pending, error
// and not-found states are the neighbouring screens' exactly — skeleton,
// error Alert with a retry, and the plain not-found Alert the class detail
// shows when a documentId belongs to no class of this school.
export function SchoolStudentDetailScreen({ documentId }: SchoolStudentDetailScreenProps) {
  const t = useTranslations('SchoolStudents');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const enabled = hydrated && Boolean(token);
  const studentQuery = useSchoolStudentQuery(documentId, enabled);

  const isPending = !enabled || studentQuery.isPending;
  const student = studentQuery.data ?? null;
  const name = student === null ? '' : studentDisplayName(student);
  const heading = name === '' ? t('detail.unnamed') : name;

  return (
    <main
      data-slot="school-student-detail"
      data-surface="school-admin-student-detail"
      className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <Link href="/dashboard/school/students" className={BACK_CLASSES}>
        <ArrowLeft className="size-4" aria-hidden />
        {t('form.back')}
      </Link>
      {isPending ? (
        <div className="flex max-w-2xl flex-col gap-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : studentQuery.isError ? (
        <Alert
          variant="error"
          title={t('errorTitle')}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={studentQuery.isFetching}
              onClick={() => void studentQuery.refetch()}
            >
              {t('retry')}
            </Button>
          }
        >
          {t('errorDescription')}
        </Alert>
      ) : student === null ? (
        <Alert variant="error" title={t('detail.notFoundTitle')}>
          {t('detail.notFoundDescription')}
        </Alert>
      ) : (
        <>
          <RecordCrumb label={heading} />
          <h1 className="text-2xl font-semibold text-foreground">{heading}</h1>
          <StudentRecordPanel student={student} />
        </>
      )}
    </main>
  );
}
