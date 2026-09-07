'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { Eyebrow } from '@/modules/design-system';
import { ParentSubskillList } from '@/modules/report/components/ParentSubskillList';
import type { FamilyPreviewView } from '@/modules/report/lib/parent-view-model';
import type { ParentReportView as ParentReportViewModel } from '@/modules/report/types/report-view.types';

/**
 * E11-10/E11-14 — the family-facing rendering of the SAME result. TRANSITIONAL
 * (task 35, standing early-run deviation): the component carries TWO arms over
 * a union prop.
 *
 * - The LEGACY arm renders the v1 view model and is what the live
 *   TeacherReportScreen (task 36's file, not ours) still passes — it keeps that
 *   screen green mid-flight and is deleted when the consumer re-points.
 * - The FAMILY arm renders the task-35 allow-list view model
 *   (`buildFamilyPreview` over the v2 ResultView): score, phase, strengths,
 *   next steps. Its input is the constructed model, so no audit field reaches
 *   the family DOM even by accident.
 *
 * NEW-COPY NOTE (deliberate debt, recorded on tasks 30/32): the score, phase,
 * strengths and next-steps labels are spec-pinned English (dashboard §5); the
 * localization pass keys them with the rest.
 */
export function ParentReportView({ view }: { view: ParentReportViewModel | FamilyPreviewView }) {
  if (!('headline' in view)) {
    return <FamilyPreviewArm view={view} />;
  }
  return <LegacyArm view={view} />;
}

function LegacyArm({ view }: { view: ParentReportViewModel }) {
  const t = useTranslations('Report');
  const format = useFormatter();
  const absentKey =
    view.headline.state === 'pending' ? 'parentHeadlinePending' : 'parentHeadlineNotApplicable';

  return (
    <div data-slot="report-parent-view" data-arm="legacy" className="flex flex-col gap-6">
      <section
        data-slot="report-parent-headline"
        aria-labelledby="report-parent-headline-title"
        className="flex animate-in flex-col gap-4 rounded-card bg-card px-6 py-6 shadow-sm duration-300 ease-out-expo fade-in slide-in-from-bottom-2 motion-reduce:animate-none sm:px-7.5"
      >
        <Eyebrow>{t('parentEyebrow')}</Eyebrow>

        {view.headline.state === 'derived' ? (
          <h1
            id="report-parent-headline-title"
            data-slot="report-parent-headline-value"
            className="text-portal-heading font-bold text-balance text-foreground"
          >
            {view.headline.label}
          </h1>
        ) : (
          <div className="flex flex-col gap-2">
            <h1
              id="report-parent-headline-title"
              data-slot="report-parent-headline-absent"
              data-state={view.headline.state}
              className="text-portal-heading font-bold text-balance text-muted-foreground"
            >
              {t(absentKey)}
            </h1>
            <p className="text-body-md text-muted-foreground">{t(`${absentKey}Description`)}</p>
          </div>
        )}

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

function FamilyPreviewArm({ view }: { view: FamilyPreviewView }) {
  const t = useTranslations('Report');
  const format = useFormatter();

  return (
    <div data-slot="report-parent-view" data-arm="family" className="flex flex-col gap-6">
      <section
        data-slot="report-family-preview"
        aria-label="Family reading summary"
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
          {view.phase.label !== null ? (
            <span
              data-slot="report-parent-phase"
              className="rounded-full bg-primary-soft px-3 py-0.5 text-caption font-semibold text-primary-ink"
            >
              ACARA phase: {view.phase.label}
            </span>
          ) : null}
        </div>

        {view.strengths.length > 0 ? (
          <div data-slot="report-family-strengths" className="flex flex-col gap-1.5">
            <p className="text-caption font-bold uppercase tracking-wide text-muted-foreground">Strengths</p>
            <ul className="flex flex-col gap-1">
              {view.strengths.map((strength) => (
                <li
                  key={strength.skill}
                  data-slot="report-family-strength"
                  data-skill={strength.skill}
                  className="text-body-md"
                >
                  {strength.line}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {view.nextSteps.length > 0 ? (
          <div data-slot="report-family-next-steps" className="flex flex-col gap-1.5">
            <p className="text-caption font-bold uppercase tracking-wide text-muted-foreground">Next steps</p>
            <ul className="flex flex-col gap-1">
              {view.nextSteps.map((step) => (
                <li key={step.line} data-slot="report-family-next-step" className="text-body-md">
                  {step.line}
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
