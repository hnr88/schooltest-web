'use client';

import { useTranslations } from 'next-intl';

import type { TeachHomeDiagnosticSummary } from '@/modules/teach/types/teach-home.types';

import type { DiagnosticSummaryPanelProps } from '@/modules/teach/types/components.types';

// Teach home diagnostic summary (task 83, mvp-updates §4.9 states table): a
// compact per-class digest of the Test A diagnostic - how many sat, the
// latest form, and the share of reading areas mastered (whole percent).
// Friendly reading-area language only: no attribute names, no psychometric
// jargon. When diagnostic is null the unpopulated "diagnostic data coming"
// state renders from the same tree.
export function DiagnosticSummaryPanel({ diagnostic }: DiagnosticSummaryPanelProps) {
  const t = useTranslations('Teach.home.panels');

  return (
    <section
      data-slot="diagnostic-summary"
      aria-label={t('diagnostic.title')}
      className="flex flex-col gap-2 rounded-lg border border-border bg-background px-3 py-2"
    >
      <h3 className="text-sm font-semibold text-foreground">{t('diagnostic.title')}</h3>
      {diagnostic ? (
        <dl className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-xs text-body">{t('diagnostic.satLabel')}</dt>
            <dd className="text-sm font-medium text-foreground">
              {t('diagnostic.satValue', {
                sat: diagnostic.sat_count,
                roster: diagnostic.roster_count,
              })}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-xs text-body">{t('diagnostic.latestFormLabel')}</dt>
            <dd className="text-sm font-medium text-foreground">
              {diagnostic.latest_form ?? t('diagnostic.latestFormMissing')}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-xs text-body">{t('diagnostic.masteredLabel')}</dt>
            <dd className="text-sm font-medium text-foreground">
              {t('diagnostic.masteredValue', { pct: Math.round(diagnostic.mastered_pct) })}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="text-xs text-muted-foreground">{t('diagnostic.empty')}</p>
      )}
    </section>
  );
}
