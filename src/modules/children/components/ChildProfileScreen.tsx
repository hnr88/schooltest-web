'use client';

import { UserRoundX } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button, SkeletonCard } from '@/modules/design-system';
import { QueryErrorFallback } from '@/modules/query-errors';
import { RecordCrumb } from '@/modules/shell';
import { ChildKpiStrip } from '@/modules/children/components/ChildKpiStrip';
import { ChildLevelJourney } from '@/modules/children/components/ChildLevelJourney';
import { ChildProfileHeader } from '@/modules/children/components/ChildProfileHeader';
import { ChildProfileSkeleton } from '@/modules/children/components/ChildProfileSkeleton';
import { ChildRecordPanel } from '@/modules/children/components/ChildRecordPanel';
import { ChildResults } from '@/modules/children/components/ChildResults';
import { ChildSkillBreakdown } from '@/modules/children/components/ChildSkillBreakdown';
import { getChildProfileName } from '@/modules/children/lib/child-profile-display';
import { useChildProgressQuery } from '@/modules/children/queries/use-child-progress.query';
import { useStudentDetailQuery } from '@/modules/children/queries/use-student-detail.query';

interface ChildProfileScreenProps {
  documentId: string;
}

// §B — the portal child detail is ONE vertical stack at a 24px rhythm and carries
// NO tabs (spec 02 §B). Blocks in order: DetailHeader, KpiStrip, the two-up
// Journey/Skills grid, RecentResults, then the enrolment record — which the design
// has no slot for at all, but which is real data the parent owns, so it closes the
// stack instead of hiding behind the tab strip this screen used to ship.
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
              <Button
                href="/dashboard/children"
                variant="outline"
                size="sm"
                className="h-11 rounded-full px-4"
              >
                {t('backToList')}
              </Button>
            }
          />
        </div>
      </main>
    );
  }

  return (
    <main
      data-surface="child-learning-dashboard"
      className="flex flex-1 animate-in flex-col gap-6 px-4 py-6 duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none sm:px-6 lg:px-8 lg:py-7"
    >
      <RecordCrumb label={getChildProfileName(data.student, t('unknownStudent'))} />
      <ChildProfileHeader student={data.student} detail={detailQuery.data} />
      <ChildKpiStrip metrics={data.metrics} />

      <div data-slot="child-progress-panel" className="flex flex-col gap-5">
        <div className="grid grid-cols-portal-two-up gap-5">
          <ChildLevelJourney
            results={data.recentResults}
            officialResultCount={data.metrics.officialResults}
          />
          <ChildSkillBreakdown
            results={data.recentResults}
            officialResultCount={data.metrics.officialResults}
          />
        </div>
        <ChildResults results={data.recentResults} />
      </div>

      {detailQuery.data ? (
        <ChildRecordPanel detail={detailQuery.data} />
      ) : (
        <SkeletonCard rows={4} />
      )}
    </main>
  );
}
