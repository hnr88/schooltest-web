'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { Eyebrow } from '@/modules/design-system';
import { ParentSubskillList } from '@/modules/report/components/ParentSubskillList';
import type { ParentReportView as ParentReportViewModel } from '@/modules/report/types/report-view.types';

// E11-10/E11-14 — the family-facing rendering of the SAME result. Its only input
// is the allow-list view-model, so no teacher-only field is in scope here even
// by accident: this component cannot reach the ResultView.
export function ParentReportView({ view }: { view: ParentReportViewModel }) {
  const t = useTranslations('Report');
  const format = useFormatter();
  const absentKey =
    view.headline.state === 'pending' ? 'parentHeadlinePending' : 'parentHeadlineNotApplicable';

  return (
    <div data-slot="report-parent-view" className="flex flex-col gap-6">
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
