'use client';

import { CalendarDays, ChartNoAxesColumnIncreasing, CircleGauge, FileText, Languages } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Badge, EmptyState } from '@/modules/design-system';
import {
  getChildResultTitle,
  getResultBadgeVariant,
} from '@/modules/children/lib/child-profile-display';
import type { ChildProgressResult } from '@/modules/children/types/children.types';

interface ChildResultsProps {
  results: ChildProgressResult[];
}

export function ChildResults({ results }: ChildResultsProps) {
  const format = useFormatter();
  const t = useTranslations('Children');

  return (
    <section
      data-slot="child-results-timeline"
      aria-labelledby="child-results-title"
      className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="child-results-title" className="text-lg font-bold text-foreground">
            {t('recentResultsHeading')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('recentResultsDescription')}</p>
        </div>
        <FileText aria-hidden="true" className="size-5 text-primary" />
      </div>
      {results.length === 0 ? (
        <EmptyState
          icon={ChartNoAxesColumnIncreasing}
          title={t('emptyResults')}
          description={t('recentResultsDescription')}
          className="mt-5 bg-muted/40"
        />
      ) : (
        <ol className="mt-5 grid gap-4 border-l border-border pl-5">
          {results.map((result) => (
            <li key={result.documentId} className="relative">
              <span
                aria-hidden="true"
                className="absolute top-5 -left-7 size-3 rounded-full border-2 border-card bg-primary"
              />
              <article className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-semibold text-foreground">
                    {getChildResultTitle(result, t('untitledResult'))}
                  </h3>
                  <Badge variant={getResultBadgeVariant(result.status)}>
                    {t(`resultStatus.${result.status}`)}
                  </Badge>
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <dt className="flex items-center gap-2 text-muted-foreground">
                      <Languages aria-hidden="true" className="size-4 text-teal-600" />
                      {t('resultSkill')}
                    </dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {result.skill ? t(`resultSkills.${result.skill}`) : t('notAvailable')}
                    </dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-2 text-muted-foreground">
                      <CircleGauge aria-hidden="true" className="size-4 text-blue-600" />
                      {t('resultCefr')}
                    </dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {result.cefrBand ?? t('notAvailable')}
                    </dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-2 text-muted-foreground">
                      <FileText aria-hidden="true" className="size-4 text-navy-700" />
                      {t('resultReadiness')}
                    </dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {result.readiness
                        ? t(`resultReadinessValues.${result.readiness}`)
                        : t('notAvailable')}
                    </dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays aria-hidden="true" className="size-4 text-teal-600" />
                      {t('resultPublished')}
                    </dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {result.publishedAt
                        ? format.dateTime(new Date(result.publishedAt), { dateStyle: 'medium' })
                        : t('notPublished')}
                    </dd>
                  </div>
                </dl>
              </article>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
