'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { Eyebrow } from '@/modules/design-system';
import { ParentSubskillList } from '@/modules/report/components/ParentSubskillList';
import { useAcaraPhaseText } from '@/modules/report/hooks/useAcaraPhaseText';
import { familyPhraseKey, type FamilyPreviewView } from '@/modules/report/lib/parent-view-model';

/**
 * E11-10/E11-14 — the family-facing rendering of the SAME result. The ONLY arm
 * is the family preview over the v2 ResultView (`buildFamilyPreview`): score,
 * phase, strengths, next steps. Its input is the constructed allow-list model,
 * so no audit field reaches the family DOM even by accident.
 */
export function ParentReportView({ view }: { view: FamilyPreviewView }) {
  const t = useTranslations('Report');
  const format = useFormatter();
  const phase = useAcaraPhaseText()(view.phase.label);

  return (
    <div data-slot="report-parent-view" data-arm="family" className="flex flex-col gap-6">
      <section
        data-slot="report-family-preview"
        aria-label={t('parentFamilySummaryAria')}
        className="flex flex-col gap-4 rounded-card bg-card px-6 py-6 shadow-sm sm:px-7.5"
      >
        <Eyebrow>{t('parentEyebrow')}</Eyebrow>

        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <span
            data-slot="report-parent-score"
            className="text-portal-heading font-bold tabular-nums text-foreground"
          >
            {view.overall.score === null ? '—' : `${view.overall.score}%`}
          </span>
          {phase !== null ? (
            <span
              data-slot="report-parent-phase"
              title={t('parentPhaseLabel', { phase })}
              className="max-w-full truncate rounded-full bg-primary-soft px-3 py-0.5 text-caption font-semibold text-primary-ink"
            >
              {t('parentPhaseLabel', { phase })}
            </span>
          ) : null}
        </div>

        {view.strengths.length > 0 ? (
          <div data-slot="report-family-strengths" className="flex flex-col gap-1.5">
            <p className="text-caption font-bold uppercase tracking-wide text-muted-foreground">
              {t('parentStrengthsLabel')}
            </p>
            <ul className="flex flex-col gap-1">
              {view.strengths.map((strength) => (
                <li
                  key={strength.skill}
                  data-slot="report-family-strength"
                  data-skill={strength.skill}
                  className="text-body-md"
                >
                  {t('familyStrengthLine', {
                    skill: t(`attributes.${strength.skill}`),
                    phrase: t(familyPhraseKey(strength)),
                  })}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {view.nextSteps.length > 0 ? (
          <div data-slot="report-family-next-steps" className="flex flex-col gap-1.5">
            <p className="text-caption font-bold uppercase tracking-wide text-muted-foreground">
              {t('parentNextStepsLabel')}
            </p>
            <ul className="flex flex-col gap-1">
              {view.nextSteps.map((step) => (
                <li
                  key={step.kind === 'focus' ? `focus-${step.skill}` : 'practice'}
                  data-slot="report-family-next-step"
                  className="text-body-md"
                >
                  {step.kind === 'practice'
                    ? t('familyPracticeLine')
                    : t('familyFocusLine', {
                        skill: t(`attributes.${step.skill}`),
                        phrase: t(familyPhraseKey(step)),
                      })}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-divider pt-4 text-body-md">
          <div className="flex items-center gap-2">
            <dt className="text-caption text-muted-foreground">{t('skillLabel')}</dt>
            <dd data-slot="report-parent-skill" className="font-semibold text-foreground">
              {view.skill === null ? t('skillCombined') : t(`skills.${view.skill}`)}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="text-caption text-muted-foreground">{t('publishedLabel')}</dt>
            <dd className="font-semibold text-foreground">
              {view.publishedAt === null
                ? t('notPublished')
                : format.dateTime(new Date(view.publishedAt), { dateStyle: 'medium' })}
            </dd>
          </div>
        </dl>

        <p className="text-caption text-muted-foreground">{t('parentReportSource')}</p>
      </section>

      <ParentSubskillList view={view.subskills} />
    </div>
  );
}
