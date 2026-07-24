'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { Eyebrow, StatusPill } from '@/modules/design-system';
import { EvidenceSummary } from '@/modules/report/components/EvidenceSummary';
import { getDisplayLabelState, splitDisplayLabel } from '@/modules/report/lib/display-label';
import { getResultStatusTone } from '@/modules/report/lib/report-status';
import type { AttributeEvidence } from '@/modules/report/types/attribute.types';
import type { ResultView } from '@/modules/report/types/report.types';

// E11-01 — the primary teacher-facing claim: the Crosswalk `display_label`
// (Doc 2a s.9), shown as the ladder rung plus its jaggedness qualifiers. Both
// halves are SERVER-derived; this only pulls the composed string apart so the
// qualifier reads as a qualifier instead of disappearing into the label.
export function DisplayLabelPanel({
  result,
  evidence,
}: {
  result: ResultView;
  evidence: AttributeEvidence | null;
}) {
  const t = useTranslations('Report');
  const format = useFormatter();
  const state = getDisplayLabelState(result);
  const parts = result.display_label ? splitDisplayLabel(result.display_label) : null;
  const absentKey = state === 'pending' ? 'displayLabelPending' : 'displayLabelNotApplicable';

  return (
    <section
      data-slot="report-display-label"
      aria-labelledby="report-display-label-title"
      className="flex animate-in flex-col gap-4 rounded-card bg-card px-6 py-6 shadow-sm duration-300 ease-out-expo fade-in slide-in-from-bottom-2 motion-reduce:animate-none sm:px-7.5"
    >
      <Eyebrow>{t('displayLabelEyebrow')}</Eyebrow>

      {parts !== null ? (
        <div className="flex flex-col gap-3">
          <h1
            id="report-display-label-title"
            data-slot="report-display-label-value"
            className="text-portal-heading font-bold text-balance text-foreground"
          >
            {parts.label}
          </h1>
          {parts.qualifiers.length > 0 ? (
            <ul data-slot="report-jaggedness-qualifiers" className="flex flex-wrap gap-2">
              {parts.qualifiers.map((qualifier) => (
                <li key={qualifier}>
                  <StatusPill tone="warning">{qualifier}</StatusPill>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <h1
            id="report-display-label-title"
            data-slot="report-display-label-absent"
            data-state={state}
            className="text-portal-heading font-bold text-balance text-muted-foreground"
          >
            {t(absentKey)}
          </h1>
          <p className="text-body-md text-muted-foreground">{t(`${absentKey}Description`)}</p>
        </div>
      )}

      {evidence !== null ? <EvidenceSummary evidence={evidence} /> : null}

      <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-divider pt-4 text-body-md">
        <div className="flex items-center gap-2">
          <dt className="text-caption text-muted-foreground">{t('skillLabel')}</dt>
          <dd className="font-semibold text-foreground">
            {result.skill ? t(`skills.${result.skill}`) : t('skillCombined')}
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="text-caption text-muted-foreground">{t('publishedLabel')}</dt>
          <dd className="font-semibold text-foreground">
            {result.published_at
              ? format.dateTime(new Date(result.published_at), { dateStyle: 'medium' })
              : t('notPublished')}
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="text-caption text-muted-foreground">{t('statusLabel')}</dt>
          <dd>
            <StatusPill tone={getResultStatusTone(result.status)}>
              {t(`resultStatus.${result.status}`)}
            </StatusPill>
          </dd>
        </div>
      </dl>

      <p className="text-caption text-muted-foreground">{t('displayLabelSource')}</p>
    </section>
  );
}
