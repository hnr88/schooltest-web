'use client';

import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { useAuthStore } from '@/modules/auth';
import { StudentTestCard } from '@/modules/classes/components/StudentTestCard';
import { TEST_SLOTS } from '@/modules/classes/constants/subskills.constants';
import { studentDisplayName, testFor } from '@/modules/classes/lib/class-detail.helpers';
import { useClassStudentQuery } from '@/modules/classes/queries/use-class-student.query';
import { Alert, Button, Skeleton } from '@/modules/design-system';
import { RecordCrumb } from '@/modules/shell';
import { StudentDetailSubtitle } from '@/modules/classes/components/StudentDetailSubtitle';

import type { ClassStudentDetailScreenProps } from '@/modules/classes/types/components.types';

// Spec §2 student drill-down: identity + background, then ONE card per COMPLETED
// test. A test that is not completed shows a single muted line and no card.
// Pending / error / not-found states mirror the sibling screens exactly.
export function ClassStudentDetailScreen({
  classDocumentId,
  studentDocumentId,
}: ClassStudentDetailScreenProps) {
  const t = useTranslations('Classes.studentDetail');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const enabled = hydrated && Boolean(token);
  const studentQuery = useClassStudentQuery(classDocumentId, studentDocumentId, enabled);

  const isPending = !enabled || studentQuery.isPending;
  const student = studentQuery.data ?? null;

  return (
    <main
      data-slot="school-class-student-detail"
      data-surface="school-admin-class-student-detail"
      className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <Link
        href={`/dashboard/school/classes/${classDocumentId}`}
        className="inline-flex min-h-11 w-fit items-center gap-1.5 rounded-sm py-2 text-sm font-semibold text-primary transition-colors duration-150 hover:text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {student === null ? t('backLinkFallback') : t('backLink', { name: student.class.name ?? '' })}
      </Link>
      {isPending ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
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
        <Alert variant="error" title={t('notFoundTitle')}>
          {t('notFoundDescription')}
        </Alert>
      ) : (
        <>
          <RecordCrumb label={studentDisplayName(student)} />
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold text-foreground">{studentDisplayName(student)}</h1>
            <StudentDetailSubtitle student={student} />
          </div>
          <div className="flex flex-col gap-4">
            {TEST_SLOTS.map((slot) => {
              const test = testFor(student.tests, slot);
              if (test === null || test.status !== 'completed') {
                return (
                  <p key={slot} className="text-sm text-body">
                    {t('notCompleted', { slot })}
                  </p>
                );
              }
              return <StudentTestCard key={slot} test={test} />;
            })}
          </div>
        </>
      )}
    </main>
  );
}
