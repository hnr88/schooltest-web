'use client';

import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';
import { Alert, Button } from '@/modules/design-system';
import { StudentResultScreen } from '@/modules/results/components/StudentResultScreen';
import { useStudentResultQuery } from '@/modules/results/queries/use-student-result.query';
import type { StudentIdentity } from '@/modules/results/components/StudentResultHeader';

/**
 * Task 31's wiring (dashboard §4): the ONE client component that connects the
 * pure Screen C composition to the C-4 read. Task 30 built
 * `StudentResultScreen` to take the already-parsed view so tests render the
 * REAL fixture without a server; this wrapper adds exactly the fetching states
 * and nothing else — pending shows a skeleton, a failed read shows an error
 * with retry, and there is no cached stand-in and no zeroed card in between.
 *
 * IDENTITY is the honest minimum this route can know: the URL carries only the
 * result id, and the v2 view carries no PII (R5) — so the header shows the
 * opaque `student_document_id` until a linking surface (the drill-down, which
 * holds the roster name) passes something richer via navigation state.
 */
export function StudentResultWired({ resultId }: { resultId: string }) {
  const t = useTranslations('Teacher.results.detail');
  const query = useStudentResultQuery(resultId);

  if (query.isPending) {
    return (
      <div role="status" aria-label={t('loading')} className="flex flex-col gap-4">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-24 w-full rounded-card" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    );
  }

  if (query.isError || query.data === undefined) {
    return (
      <Alert
        variant="error"
        title={t('errorTitle')}
        action={
          <Button
            variant="outline"
            size="sm"
            loading={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {t('retry')}
          </Button>
        }
      >
        {t('errorDescription')}
      </Alert>
    );
  }

  const view = query.data;
  const student: StudentIdentity = {
    name: view.student_document_id,
    className: '',
    initials: '',
  };

  return <StudentResultScreen view={view} student={student} />;
}
