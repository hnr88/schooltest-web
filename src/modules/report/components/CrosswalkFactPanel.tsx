'use client';

import { TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { Eyebrow, InsightCallout } from '@/modules/design-system';
import { EvidenceSummary } from '@/modules/report/components/EvidenceSummary';
import { getCrosswalkFieldState } from '@/modules/report/lib/display-label';
import type { AttributeEvidence } from '@/modules/report/types/attribute.types';
import type { DisplayLabelState, ResultView } from '@/modules/report/types/report.types';

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

// TEACHER MODE ONLY. E11-14/E11-15 forbid every fact in this panel on a parent
// surface, and `ParentReportView` cannot render it: the parent view-model has no
// field to carry any of them.
export function CrosswalkFactPanel({
  result,
  evidence,
}: {
  result: ResultView;
  evidence: AttributeEvidence | null;
}) {
  const t = useTranslations('Report');

  return (
    <section
      data-slot="report-crosswalk-facts"
      aria-label={t('crosswalkEyebrow')}
      className="flex animate-in flex-col gap-4 rounded-card bg-card px-6 py-6 shadow-sm delay-100 duration-300 ease-out-expo fade-in slide-in-from-bottom-2 motion-reduce:animate-none sm:px-7.5"
    >
      <Eyebrow>{t('crosswalkEyebrow')}</Eyebrow>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
        <CrosswalkFact
          label={t('acaraPhaseLabel')}
          state={getCrosswalkFieldState(result, result.acara_phase)}
          value={result.acara_phase}
        />
        <CrosswalkFact
          label={t('cefrBandLabel')}
          state={getCrosswalkFieldState(result, result.cefr_band)}
          value={result.cefr_band === null ? null : t(`cefrBands.${result.cefr_band}`)}
        />
        <CrosswalkFact
          label={t('readinessLabel')}
          state={getCrosswalkFieldState(result, result.readiness)}
          value={result.readiness === null ? null : t(`readinessValues.${result.readiness}`)}
          hint={
            evidence === null ? null : (
              <EvidenceSummary evidence={evidence} className="mt-1 block font-normal" />
            )
          }
        />
        <CrosswalkFact
          label={t('confidenceLabel')}
          state={getCrosswalkFieldState(result, result.low_confidence)}
          value={result.low_confidence === null ? null : t(`confidence.${result.low_confidence}`)}
        />
      </dl>

      {result.low_confidence === true ? (
        <div data-slot="report-low-confidence">
          <InsightCallout icon={TriangleAlert} tone="warning">
            {t('confidenceLowNote')}
          </InsightCallout>
        </div>
      ) : null}

      <p className="text-caption text-muted-foreground">{t('crosswalkSource')}</p>
    </section>
  );
}
