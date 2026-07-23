'use client';

import { ChevronRight } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { StatusPill } from '@/modules/design-system';
import { getDisplayLabelState, splitDisplayLabel } from '@/modules/report/lib/display-label';
import { getResultStatusTone } from '@/modules/report/lib/report-status';
import type { ResultView } from '@/modules/report/types/report.types';

// C-11 rows carry NO student identity by design (PII stays off the ResultView),
// so the row is named by what the API actually published: the display label,
// the skill and the publication date. No name is invented to fill the gap.
export function ReportListRow({ result }: { result: ResultView }) {
  const t = useTranslations('Report');
  const format = useFormatter();
  const state = getDisplayLabelState(result);
  const parts = result.display_label ? splitDisplayLabel(result.display_label) : null;

  return (
    <li>
      <Link
        href={`/dashboard/reports/${result.document_id}`}
        data-slot="report-list-row"
        className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-divider px-1 py-4 transition-colors duration-200 ease-out last:border-b-0 hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none motion-reduce:transition-none"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-body-md font-semibold text-foreground">
            {parts !== null
              ? parts.label
              : t(state === 'pending' ? 'displayLabelPending' : 'displayLabelNotApplicable')}
          </span>
          <span className="truncate text-caption text-muted-foreground">
            {[
              result.skill ? t(`skills.${result.skill}`) : t('skillCombined'),
              result.published_at
                ? format.dateTime(new Date(result.published_at), { dateStyle: 'medium' })
                : t('notPublished'),
            ].join(' · ')}
          </span>
        </div>
        {parts && parts.qualifiers.length > 0 ? (
          <StatusPill tone="warning" className="shrink-0">
            {parts.qualifiers.join(' · ')}
          </StatusPill>
        ) : null}
        <StatusPill tone={getResultStatusTone(result.status)} className="shrink-0">
          {t(`resultStatus.${result.status}`)}
        </StatusPill>
        <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      </Link>
    </li>
  );
}
