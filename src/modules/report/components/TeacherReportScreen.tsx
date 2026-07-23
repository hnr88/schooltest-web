'use client';

import { FileSearch, FlaskConical, TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { BorderedCallout, Button, Eyebrow, InsightCallout } from '@/modules/design-system';
import { QueryErrorFallback } from '@/modules/query-errors';
import { DisplayLabelPanel } from '@/modules/report/components/DisplayLabelPanel';
import { ReportSkeleton } from '@/modules/report/components/ReportSkeleton';
import { getCrosswalkFieldState, resolveDisplayLabel } from '@/modules/report/lib/display-label';
import { useResultQuery } from '@/modules/report/queries/use-result.query';
import type { DisplayLabelState } from '@/modules/report/types/report.types';
import { RecordCrumb } from '@/modules/shell';

// E11-02/E11-08 — one crosswalk-derived header fact. `value` is resolved by the
// caller from the real Result and is `null` when the Result carries none;
// `state` says WHICH absence that is, so no fact ever promises a value the
// server will never send.
function CrosswalkFact({
  label,
  state,
  value,
}: {
  label: string;
  state: DisplayLabelState;
  value: string | null;
}) {
  const t = useTranslations('Report');
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd
        data-slot="report-crosswalk-fact"
        data-state={state}
        className={cn(
          'text-body-md transition-colors duration-200 ease-out-expo',
          value === null ? 'text-muted-foreground' : 'font-semibold text-foreground',
        )}
      >
        {value === null
          ? t(state === 'pending' ? 'crosswalkPending' : 'crosswalkNotApplicable')
          : value}
      </dd>
    </div>
  );
}

// E11-01 — the teacher individual report: the route, the guard (mounted by the
// page) and the C-4 read. E11-02 adds the ACARA phase and CEFR band, E11-08 the
// readiness, the receptive confidence flag and the field-test provisional
// banner. The attribute bars, the supplementary strand and the observations are
// separate backlog rows, so they are absent here rather than filled in blind.
export function TeacherReportScreen({ resultDocumentId }: { resultDocumentId: string }) {
  const t = useTranslations('Report');
  const { data, error, isError, isFetching, isLoading, refetch } = useResultQuery(resultDocumentId);

  if (isLoading) return <ReportSkeleton />;

  if (isError || !data) {
    return (
      <main className="flex flex-1 flex-col px-4 py-7 sm:px-6 lg:px-8">
        <div className="w-full max-w-160">
          <QueryErrorFallback
            error={error}
            goneIcon={FileSearch}
            goneTitle={t('reportGoneTitle')}
            goneDescription={t('reportGoneDescription')}
            isRetrying={isFetching}
            onRetry={() => refetch()}
            action={
              <Button
                href="/dashboard/reports"
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

  const displayLabel = resolveDisplayLabel(data);

  return (
    <main
      data-surface="teacher-report"
      className="flex flex-1 animate-in flex-col gap-6 px-4 py-6 duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none sm:px-6 lg:px-8 lg:py-7"
    >
      <RecordCrumb
        label={displayLabel.state === 'derived' ? displayLabel.label : t(displayLabel.absentKey)}
      />

      {data.provisional === 'field_test' ? (
        <div data-slot="report-provisional">
          <BorderedCallout icon={FlaskConical}>{t('provisionalFieldTest')}</BorderedCallout>
        </div>
      ) : null}

      <DisplayLabelPanel result={data} />

      <section
        data-slot="report-crosswalk-facts"
        aria-label={t('crosswalkEyebrow')}
        className="flex animate-in flex-col gap-4 rounded-card bg-card px-6 py-6 shadow-sm delay-100 duration-300 ease-out-expo fade-in slide-in-from-bottom-2 motion-reduce:animate-none sm:px-7.5"
      >
        <Eyebrow>{t('crosswalkEyebrow')}</Eyebrow>

        <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
          <CrosswalkFact
            label={t('acaraPhaseLabel')}
            state={getCrosswalkFieldState(data, data.acara_phase)}
            value={data.acara_phase}
          />
          <CrosswalkFact
            label={t('cefrBandLabel')}
            state={getCrosswalkFieldState(data, data.cefr_band)}
            value={data.cefr_band === null ? null : t(`cefrBands.${data.cefr_band}`)}
          />
          <CrosswalkFact
            label={t('readinessLabel')}
            state={getCrosswalkFieldState(data, data.readiness)}
            value={data.readiness === null ? null : t(`readinessValues.${data.readiness}`)}
          />
          <CrosswalkFact
            label={t('confidenceLabel')}
            state={getCrosswalkFieldState(data, data.low_confidence)}
            value={data.low_confidence === null ? null : t(`confidence.${data.low_confidence}`)}
          />
        </dl>

        {data.low_confidence === true ? (
          <div data-slot="report-low-confidence">
            <InsightCallout icon={TriangleAlert} tone="warning">
              {t('confidenceLowNote')}
            </InsightCallout>
          </div>
        ) : null}

        <p className="text-caption text-muted-foreground">{t('crosswalkSource')}</p>
      </section>
    </main>
  );
}
