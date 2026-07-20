'use client';

import { CalendarDays, CircleGauge, FileText, Languages } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Badge } from '@/modules/design-system';
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
      aria-labelledby="child-results-title"
      className="rounded-2xl border border-border bg-card p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="child-results-title" className="text-lg font-bold text-foreground">
            {t('recentResultsHeading')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('recentResultsDescription')}</p>
        </div>
        <FileText aria-hidden="true" className="size-5 text-blue-600" />
      </div>
      {results.length === 0 ? (
        <p className="mt-5 rounded-xl bg-muted px-4 py-5 text-sm text-foreground">
          {t('emptyResults')}
        </p>
      ) : (
        <ol className="mt-5 grid gap-3">
          {results.map((result) => (
            <li key={result.documentId}>
              <article className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-semibold text-foreground">
                    {getChildResultTitle(result, t('untitledResult'))}
                  </h3>
                  <Badge variant={getResultBadgeVariant(result.status)}>
                    {t(`resultStatus.${result.status}`)}
                  </Badge>
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Languages aria-hidden="true" className="size-4 text-teal-600" />
                    <dt>{t('resultSkill')}</dt>
                    <dd className="text-foreground">
                      {result.skill ? t(`resultSkills.${result.skill}`) : t('notAvailable')}
                    </dd>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CircleGauge aria-hidden="true" className="size-4 text-blue-600" />
                    <dt>{t('resultCefr')}</dt>
                    <dd className="text-foreground">{result.cefrBand ?? t('notAvailable')}</dd>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText aria-hidden="true" className="text-navy-700 size-4" />
                    <dt>{t('resultReadiness')}</dt>
                    <dd className="text-foreground">
                      {result.readiness
                        ? t(`resultReadinessValues.${result.readiness}`)
                        : t('notAvailable')}
                    </dd>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays aria-hidden="true" className="size-4 text-teal-600" />
                    <dt>{t('resultPublished')}</dt>
                    <dd className="text-foreground">
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
