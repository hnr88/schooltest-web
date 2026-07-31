'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { DiagnosticEmptyState } from '@/modules/teach/components/DiagnosticEmptyState';
import { ItemTypeHeatmap } from '@/modules/teach/components/ItemTypeHeatmap';
import { MasteryTable } from '@/modules/teach/components/MasteryTable';
import { StudentMasteryDrilldown } from '@/modules/teach/components/StudentMasteryDrilldown';
import { useClassDiagnosticQuery } from '@/modules/teach/queries/use-class-diagnostic.query';

interface DiagnosticDashboardProps {
  classId: string;
  actions?: ReactNode;
  // Task 78: the school-admin analytics reuses this dashboard verbatim at
  // school scope; the back link defaults to the teacher home it always had.
  backHref?: string;
}

// Teacher diagnostic dashboard (task 75, mvp-updates §4.9): class mastery
// profiles across the seven reading areas with the item-type heat map nested
// underneath as the evidence, plus a one-click drill-down per student. The
// heat map data is class-aggregated per C-RPT-01, so it renders once, nested
// under the class mastery view. ACARA phase is never on the wire and never
// rendered here (mvp spec 4.4). The `actions` slot carries the page-level
// affordances (task 77: the C-RPT-03 markdown export button).
export function DiagnosticDashboard({ classId, actions, backHref = '/dashboard/teach' }: DiagnosticDashboardProps) {
  const t = useTranslations('Teach.diagnostic');
  const query = useClassDiagnosticQuery(classId);
  const [selectedRef, setSelectedRef] = useState<string | null>(null);

  const data = query.data ?? null;
  const selectedRow = data?.mastery.find((row) => row.student_ref === selectedRef) ?? null;
  const populated = data !== null && data.sat_count > 0;

  return (
    <main
      data-slot="teach-diagnostic"
      data-surface="teacher-diagnostic"
      className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Link
            href={backHref}
            className="w-fit text-sm font-semibold text-primary transition-colors duration-150 hover:text-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {t('backLink')}
          </Link>
          <h1 className="text-2xl font-semibold text-foreground">
            {data?.class.name ?? t('title')}
          </h1>
          <p className="max-w-xl text-sm text-body">{t('subtitle')}</p>
          {data ? (
            <p className="text-sm font-medium text-foreground">
              {t('summary', { sat: data.sat_count, roster: data.roster_count })}
              {data.form_code ? ` · ${t('formLabel', { code: data.form_code })}` : ''}
            </p>
          ) : null}
        </div>
        {actions ?? null}
      </div>

      {query.isPending ? (
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      ) : null}
      {query.isError ? (
        <p role="alert" className="text-sm text-danger-ink">
          {t('loadError')}
        </p>
      ) : null}

      {query.isSuccess && data && !populated ? <DiagnosticEmptyState /> : null}

      {populated && data ? (
        <>
          <section className="flex flex-col gap-3" aria-label={t('masteryTitle')}>
            <h2 className="text-lg font-semibold text-foreground">{t('masteryTitle')}</h2>
            <p className="max-w-xl text-sm text-body">{t('masteryDescription')}</p>
            <MasteryTable
              rows={data.mastery}
              selectedRef={selectedRef}
              onSelect={(ref) => setSelectedRef((current) => (current === ref ? null : ref))}
            />
            {selectedRow ? (
              <StudentMasteryDrilldown row={selectedRow} onClose={() => setSelectedRef(null)} />
            ) : null}
            {data.heatmap.length > 0 ? (
              <section
                className="flex flex-col gap-3 rounded-xl border border-border bg-muted/40 px-4 py-4"
                aria-label={t('heatmapTitle')}
              >
                <h3 className="text-base font-semibold text-foreground">{t('heatmapTitle')}</h3>
                <p className="max-w-xl text-sm text-body">{t('heatmapDescription')}</p>
                <ItemTypeHeatmap rows={data.heatmap} />
              </section>
            ) : null}
          </section>
        </>
      ) : null}
    </main>
  );
}
