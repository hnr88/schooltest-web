'use client';

import { FileSearch, FlaskConical, TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { BorderedCallout, Button, Eyebrow, InsightCallout } from '@/modules/design-system';
import { QueryErrorFallback } from '@/modules/query-errors';
import { AttributePanel } from '@/modules/report/components/AttributePanel';
import { DisplayLabelPanel } from '@/modules/report/components/DisplayLabelPanel';
import { ErrorPatternNotes } from '@/modules/report/components/ErrorPatternNotes';
import { EvidenceSummary } from '@/modules/report/components/EvidenceSummary';
import { ObservationList } from '@/modules/report/components/ObservationList';
import { ReportSkeleton } from '@/modules/report/components/ReportSkeleton';
import { SupplementaryStrand } from '@/modules/report/components/SupplementaryStrand';
import { buildAttributePanel } from '@/modules/report/lib/attribute-view-model';
import { getCrosswalkFieldState, resolveDisplayLabel } from '@/modules/report/lib/display-label';
import { buildObservations } from '@/modules/report/lib/observations';
import { buildSupplementaryStrand } from '@/modules/report/lib/supplementary-view-model';
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
  hint,
}: {
  label: string;
  state: DisplayLabelState;
  value: string | null;
  hint?: ReactNode;
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
        {hint}
      </dd>
    </div>
  );
}

// E11-01 — the teacher individual report: the route, the guard (mounted by the
// page) and the C-4 read. E11-02 adds the ACARA phase and CEFR band, E11-08 the
// readiness, the receptive confidence flag and the field-test provisional
// banner, and E11-03/04/09 the attribute bars with their evidence counts.
// E11-05 adds the out-of-model vocabulary strand, E11-06 the teaching observations
// generated from the attribute contrast and E11-07 the C-5 error-pattern notes.
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
  const attributes = buildAttributePanel(data);
  const evidence = attributes.state === 'rows' ? attributes.evidence : null;

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

      <DisplayLabelPanel result={data} evidence={evidence} />

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
            hint={
              evidence === null ? null : (
                <EvidenceSummary evidence={evidence} className="mt-1 block font-normal" />
              )
            }
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

      <AttributePanel view={attributes} />

      <SupplementaryStrand view={buildSupplementaryStrand(data)} />

      <ObservationList view={buildObservations(data)} />

      <ErrorPatternNotes result={data} />
    </main>
  );
}
