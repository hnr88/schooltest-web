'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { StatusPill } from '@/modules/design-system';
import { getChildResultTitle } from '@/modules/children/lib/child-profile-display';
import { getResultStatusTone } from '@/modules/children/lib/child-results';
import type { ChildProgressResult } from '@/modules/children/types/children.types';

// §B.6 ResultRow — the name/date stack, then the trailing facts. The design's
// trailing cells are `B1 · 74%`, `+6% vs May` and a `Report` link: the percentage
// is B-3, the delta is B-10 (no `previousResultDocumentId` in this payload) and the
// report target is BLOCKED-NO-API (`GET /api/results/:id` is not granted to a
// parent — G2). What is left is what the API really published: the band, the
// readiness and the lifecycle status.
export function ChildResultRow({ result }: { result: ChildProgressResult }) {
  const t = useTranslations('Children');
  const format = useFormatter();
  const readiness =
    result.readiness && result.readiness !== 'not_assessed' ? result.readiness : null;

  return (
    <li className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-divider py-4 last:border-b-0">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-body-md font-semibold text-foreground">
          {getChildResultTitle(result, t('untitledResult'))}
        </span>
        <span className="truncate text-caption text-muted-foreground">
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
    </li>
  );
}
