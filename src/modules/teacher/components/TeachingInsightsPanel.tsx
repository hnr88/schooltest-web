'use client';

import { BarChart3 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { EmptyState } from '@/modules/design-system';
import { CohortGlanceCard } from '@/modules/teacher/components/CohortGlanceCard';
import { InsightsKpiRow } from '@/modules/teacher/components/InsightsKpiRow';
import { RecentActivityCard } from '@/modules/teacher/components/RecentActivityCard';
import { SubskillMasteryList } from '@/modules/teacher/components/SubskillMasteryList';
import { SuggestedGroupsCard } from '@/modules/teacher/components/SuggestedGroupsCard';
import { SuggestedPairingsCard } from '@/modules/teacher/components/SuggestedPairingsCard';
import { TeacherExportPanel } from '@/modules/teacher/components/TeacherExportPanel';
import { useTeachingInsights } from '@/modules/teacher/hooks/useTeachingInsights';
import type { TeachingInsightsPanelProps } from '@/modules/teacher/types/class-analytics.types';

// Teacher Portal v2 · Teaching insights (`:723–871`): five KPIs, reading mastery, cohort
// at a glance, then pairings and groups — all from the class roster plus the class's
// sittings. A section without real data behind it is left out. "Ask your class"
// (`:744–774`) has no opener in the design and is not built. The AI export panel stays
// below the design's sections until "Reports and data" carries the class export.
// The root carries `leading-[normal]` (P1 round 2 · N13) like every other teacher tab
// panel: `TabsContent`'s `text-sm` otherwise forces a 20px line-height on every line here.
function TeachingInsightsPanel({ rows, classDocumentId }: TeachingInsightsPanelProps) {
  const t = useTranslations('TeacherPortal.insights');
  const tExport = useTranslations('Teacher.results.export');
  const { view, hasResults, latestSittingId } = useTeachingInsights(classDocumentId, rows);
  const hasPairings = view.pairings.skill !== null;
  const hasGroups = view.groups.length > 0;

  return (
    <div
      data-slot="teaching-insights"
      data-status={hasResults ? 'ready' : 'empty'}
      className="flex flex-col gap-[18px] leading-[normal]"
    >
      <div>
        <h2 className="text-[20px] font-semibold text-navy-900">{t('title')}</h2>
        <p className="mt-1.5 text-[13.5px] text-[#6B7280]">{t('subtitle')}</p>
      </div>
      {hasResults ? (
        <>
          <InsightsKpiRow kpis={view.kpis} />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-start gap-[18px]">
            <SubskillMasteryList rows={view.mastery} />
            <div className="flex min-w-0 flex-col gap-[18px]">
              <CohortGlanceCard cohort={view.cohort} />
              {latestSittingId === null ? null : <RecentActivityCard sittingDocumentId={latestSittingId} />}
            </div>
          </div>
          {hasPairings || hasGroups ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-start gap-4">
              {hasPairings ? <SuggestedPairingsCard pairings={view.pairings} /> : null}
              {hasGroups ? <SuggestedGroupsCard groups={view.groups} /> : null}
            </div>
          ) : null}
          <TeacherExportPanel
            request={{ kind: 'insights', classDocumentId }}
            headingId="teaching-insights-export-heading"
            title={tExport('insightsTitle')}
            description={tExport('insightsDescription')}
            buttonLabel={tExport('insightsButton')}
            footnote={tExport('insightsFootnote')}
          />
        </>
      ) : (
        <EmptyState icon={BarChart3} tone="brand" title={t('emptyTitle')} description={t('emptyDescription')} />
      )}
    </div>
  );
}

export { TeachingInsightsPanel };
