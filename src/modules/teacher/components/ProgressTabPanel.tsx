'use client';

import { LineChart } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { EmptyState } from '@/modules/design-system';
import { ProgressAcaraSection } from '@/modules/teacher/components/ProgressAcaraSection';
import { ProgressWatchList } from '@/modules/teacher/components/ProgressWatchList';
import { TeacherExportPanel } from '@/modules/teacher/components/TeacherExportPanel';
import { needsSupport, topGains } from '@/modules/results/lib/class-analytics';
import { resultViewsOf } from '@/modules/results/lib/class-aggregation';
import type { RosterRow } from '@/modules/results/types/roster.types';
import type { ProgressTabPanelProps } from '@/modules/teacher/types/class-analytics.types';

// The Progress tab (task 34, dashboard §3/D2). Everything renders from the ONE
// Screen A roster payload — the panel issues no read, so switching tabs never
// re-requests. Top reliable gains (delta desc, delta_reliable, max 5), needs
// support (reliable declines first, then lowest score, max 5), the ACARA phase
// spread over the WHOLE roster, and the class progress chart's honest
// placeholder: per-class history is not served by the roster read, and a fake
// chart is worse than a stated gap.
function ProgressTabPanel({ rows, classDocumentId }: ProgressTabPanelProps) {
  const t = useTranslations('Teacher.results.progress');
  const tExport = useTranslations('Teacher.results.export');
  const views = resultViewsOf(rows);

  // The pure layers return SCORED views in order; the wrapper carries the name.
  const rowByStudent = new Map(rows.map((row) => [row.student.document_id, row]));
  const asRows = (picked: typeof views): RosterRow[] =>
    picked.flatMap((view) => {
      const row = rowByStudent.get(view.student_document_id);
      return row ? [row] : [];
    });

  const gains = asRows(topGains(views));
  const support = asRows(needsSupport(views));

  return (
    <div data-slot="class-progress" data-status={views.length === 0 ? 'empty' : 'ready'} className="flex flex-col gap-6">
      {views.length === 0 ? (
        <EmptyState
          icon={LineChart}
          tone="brand"
          title={t('emptyTitle')}
          description={t('emptyDescription')}
        />
      ) : (
        <>
          <ProgressWatchList variant="gains" rows={gains} />
          <ProgressWatchList variant="support" rows={support} />
          <ProgressAcaraSection rows={rows} />

          {/*
            DEFERRED, stated as a gap: the class progress chart needs per-class
            history, which the roster read deliberately omits. A placeholder that
            names the missing input is honest; a fabricated chart is not.
          */}
          <div
            data-slot="progress-chart-placeholder"
            aria-labelledby="progress-chart-heading"
            className="flex flex-col items-center gap-2 rounded-card border border-dashed border-border bg-surface-inset px-6 py-8 text-center"
          >
            <LineChart aria-hidden="true" className="size-6 text-muted-foreground" />
            <h2 id="progress-chart-heading" className="text-body font-semibold text-foreground">
              {t('chartDeferredTitle')}
            </h2>
            <p className="max-w-prose text-meta text-balance text-muted-foreground">
              {t('chartDeferredDescription')}
            </p>
          </div>

          <TeacherExportPanel
            request={{ kind: 'progress', classDocumentId }}
            headingId="class-progress-export-heading"
            title={tExport('progressTitle')}
            description={tExport('progressDescription')}
            buttonLabel={tExport('progressButton')}
            footnote={tExport('progressFootnote')}
          />
        </>
      )}
    </div>
  );
}

export { ProgressTabPanel };
