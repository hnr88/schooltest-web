'use client';

import { BarChart3 } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { EmptyState } from '@/modules/design-system';
import { SubskillMasteryList } from '@/modules/teacher/components/SubskillMasteryList';
import { TeacherExportPanel } from '@/modules/teacher/components/TeacherExportPanel';
import {
  secureCounts,
  vocabStrandMeans,
  weakestFirstAverages,
} from '@/modules/results/lib/class-analytics';
import { resultViewsOf } from '@/modules/results/lib/class-aggregation';
import type { TeachingInsightsPanelProps } from '@/modules/teacher/types/class-analytics.types';

// The Teaching insights tab (task 34, dashboard §3). Everything here is derived
// from the ONE Screen A roster payload — the panel issues no read, so switching
// tabs never re-requests. Subskill averages weakest-first with their exclusions
// stated, "Mastered" counted exactly as the API's `secure` status (never
// recomputed from a score), and the two vocabulary strand means with
// single-strand students excluded from the strand they did not sit.
//
// An all-result-less roster is an honest empty state; a failed read never gets
// here (ClassResultsScreen renders its error branch instead).
function TeachingInsightsPanel({ rows, classDocumentId }: TeachingInsightsPanelProps) {
  const t = useTranslations('Teacher.results.insights');
  const format = useFormatter();
  const tExport = useTranslations('Teacher.results.export');
  const views = resultViewsOf(rows);
  const averages = weakestFirstAverages(views);
  const secure = new Map(secureCounts(views).map((entry) => [entry.skill, entry.secure]));
  const means = vocabStrandMeans(views);

  return (
    <div data-slot="teaching-insights" data-status={views.length === 0 ? 'empty' : 'ready'} className="flex flex-col gap-6">
      {views.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          tone="brand"
          title={t('emptyTitle')}
          description={t('emptyDescription')}
        />
      ) : (
        <>
          <SubskillMasteryList
            averages={averages}
            secure={secure}
            totalStudents={views.length}
          />

          <section
            data-slot="vocab-strand-means"
            aria-labelledby="vocab-strand-heading"
            className="flex flex-col gap-4 rounded-card bg-card px-6 py-6 shadow-sm sm:px-7.5"
          >
            <div className="flex flex-col gap-1">
              <h2 id="vocab-strand-heading" className="text-panel-title font-bold text-foreground">
                {t('strandTitle')}
              </h2>
              <p className="text-meta text-muted-foreground">{t('strandCaption')}</p>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  { strand: 'a2' as const, label: t('strandA2') },
                  { strand: 'b1' as const, label: t('strandB1') },
                ]
              ).map(({ strand, label }) => {
                const mean = means[strand];
                return (
                  <div
                    key={strand}
                    data-slot={`vocab-strand-${strand}`}
                    className="flex min-w-0 flex-col gap-1 rounded-tile bg-surface-inset px-3.5 py-3"
                  >
                    <dt className="text-meta font-semibold tracking-wide text-body uppercase">{label}</dt>
                    <dd className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-stat-sm font-bold text-foreground tabular-nums">
                        {mean.average === null
                          ? t('strandNone')
                          : format.number(mean.average, { maximumFractionDigits: 1 })}
                      </span>
                      <span className="text-meta text-body">
                        {t('strandAssessed', { count: mean.assessed })}
                      </span>
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>

          <TeacherExportPanel
            request={{ kind: 'insights', classDocumentId }}
            headingId="teaching-insights-export-heading"
            title={tExport('insightsTitle')}
            description={tExport('insightsDescription')}
            buttonLabel={tExport('insightsButton')}
            footnote={tExport('insightsFootnote')}
          />
        </>
      )}
    </div>
  );
}

export { TeachingInsightsPanel };
