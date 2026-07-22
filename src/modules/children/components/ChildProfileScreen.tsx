'use client';

import { UserRoundX } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';
import { QueryErrorFallback } from '@/modules/query-errors';
import { RecordCrumb } from '@/modules/shell';
import { ChildEnrolmentPanel } from '@/modules/children/components/ChildEnrolmentPanel';
import { ChildGuardianPanel } from '@/modules/children/components/ChildGuardianPanel';
import { ChildLearningSummary } from '@/modules/children/components/ChildLearningSummary';
import { ChildMetrics } from '@/modules/children/components/ChildMetrics';
import { ChildProfileHeader } from '@/modules/children/components/ChildProfileHeader';
import { ChildProfileSkeleton } from '@/modules/children/components/ChildProfileSkeleton';
import { ChildResults } from '@/modules/children/components/ChildResults';
import { ChildSkillBreakdown } from '@/modules/children/components/ChildSkillBreakdown';
import { getChildProfileName } from '@/modules/children/lib/child-profile-display';
import { useChildProgressQuery } from '@/modules/children/queries/use-child-progress.query';
import { useStudentDetailQuery } from '@/modules/children/queries/use-student-detail.query';

interface ChildProfileScreenProps {
  documentId: string;
}

// Canonical Child profile (2b) composed against the parent contract: hero, the
// activity snapshot, the §5.3 skill tiles and the §5.5 result timeline in the main
// column, with the gauge and the record panels in the detail rail. The trail lives
// in the topbar (RecordCrumb) — this screen renders no breadcrumb of its own.
export function ChildProfileScreen({ documentId }: ChildProfileScreenProps) {
  const t = useTranslations('Children');
  const { data, error, isError, isFetching, isLoading, refetch } =
    useChildProgressQuery(documentId);
  const detailQuery = useStudentDetailQuery(documentId);

  if (isLoading) {
    return <ChildProfileSkeleton />;
  }

  if (isError || !data) {
    return (
      <main className="flex flex-1 flex-col px-4 py-7 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-160">
          <QueryErrorFallback
            error={error}
            goneIcon={UserRoundX}
            goneTitle={t('profileGoneTitle')}
            goneDescription={t('profileGoneDescription')}
            isRetrying={isFetching}
            onRetry={() => refetch()}
            action={
              <Button href="/dashboard/children" variant="outline" size="sm" className="h-11 px-4">
                {t('backToList')}
              </Button>
            }
          />
        </div>
      </main>
    );
  }

  const detail = detailQuery.data;

  return (
    <main
      data-surface="child-learning-dashboard"
      className="flex flex-1 animate-in flex-col gap-5 px-4 py-6 duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none sm:px-6 lg:px-8 lg:py-7"
    >
      <RecordCrumb label={getChildProfileName(data.student, t('unknownStudent'))} />
      <ChildProfileHeader student={data.student} metrics={data.metrics} detail={detail} />

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <ChildMetrics metrics={data.metrics} className="lg:col-span-2" />
        <ChildLearningSummary metrics={data.metrics} />
      </div>

      <ChildSkillBreakdown
        results={data.recentResults}
        officialResultCount={data.metrics.officialResults}
      />
      <ChildResults results={data.recentResults} />

      {detail ? (
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <ChildEnrolmentPanel detail={detail} />
          <ChildGuardianPanel detail={detail} />
        </div>
      ) : null}
    </main>
  );
}
