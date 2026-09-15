'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { StatusPill } from '@/modules/design-system';
import { getChildResultTitle } from '@/modules/children/lib/child-profile-display';
import { getResultStatusTone } from '@/modules/children/lib/child-results';
import type { ChildProgressResult } from '@/modules/children/types/children.types';

// §B.6 ResultRow — the name/date stack, then the trailing facts. NIGHT-2 (W8):
// the trailing cell is the design's `Report` link again. The family-report read
// exists now (C-PAR-REPORT, GET /api/my/results/:id is parent-authorised), so
// the old BLOCKED-NO-API comment no longer holds. The progress feed lists only
// RELEASED rows (the service filters held/recalled out), so every link opens a
// released family report face.
export function ChildResultRow({ result }: { result: ChildProgressResult }) {
  const t = useTranslations('Children');
  const format = useFormatter();
  const readiness =
    result.readiness && result.readiness !== 'not_assessed' ? result.readiness : null;

  return (
    <li className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-divider py-4 last:border-b-0">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className="truncate text-body-md font-semibold text-foreground"
          title={getChildResultTitle(result, t('untitledResult'))}
        >
          {getChildResultTitle(result, t('untitledResult'))}
        </span>
        <span
          className="truncate text-caption text-muted-foreground"
          title={[
            result.skill ? t(`resultSkills.${result.skill}`) : null,
            result.publishedAt
              ? format.dateTime(new Date(result.publishedAt), { dateStyle: 'medium' })
              : t('notPublished'),
          ]
            .filter(Boolean)
            .join(' · ')}
        >
          {[
            result.skill ? t(`resultSkills.${result.skill}`) : null,
            result.publishedAt
              ? format.dateTime(new Date(result.publishedAt), { dateStyle: 'medium' })
              : t('notPublished'),
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </div>
      {result.cefrBand ? (
        <span className="shrink-0 text-body-md font-bold text-foreground">
          {t(`cefrBands.${result.cefrBand}`)}
        </span>
      ) : null}
      {readiness ? (
        <StatusPill tone="info" className="shrink-0">
          {t(`resultReadinessValues.${readiness}`)}
        </StatusPill>
      ) : (
        <StatusPill tone={getResultStatusTone(result.status)} className="shrink-0">
          {t(`resultStatus.${result.status}`)}
        </StatusPill>
      )}
      <Link
        href={`/dashboard/reports/${result.documentId}`}
        data-slot="child-result-report-link"
        className="shrink-0 rounded-full border border-border px-3 py-1.5 text-caption font-semibold text-foreground hover:bg-muted"
      >
        {t('resultReportLink')}
      </Link>
    </li>
  );
}
