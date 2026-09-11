'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { SectionCard } from '@/modules/teacher/components/v2/SectionCard';
import {
  INSIGHTS_ACTIVITY_LIMIT,
  INSIGHTS_ACTIVITY_TIME_FORMAT,
} from '@/modules/teacher/constants/results.constants';
import { useSittingActivityQuery } from '@/modules/test-day';
import type { RecentActivityCardProps } from '@/modules/teacher/types/class-analytics.types';

// Teaching insights · Recent activity (`:821–829`): the activity trail of the class's latest
// reading sitting (GET /api/sittings/:id/activity, newest first). A trail with no entries
// leaves the card out — the design's feed is static.
function RecentActivityCard({ sittingDocumentId }: RecentActivityCardProps) {
  const t = useTranslations('TeacherPortal.insights');
  const format = useFormatter();
  const feed = useSittingActivityQuery(sittingDocumentId);
  const entries = (feed.data?.entries ?? []).slice(0, INSIGHTS_ACTIVITY_LIMIT);

  if (entries.length === 0) return null;

  return (
    <SectionCard data-insights-section="activity" data-sitting-id={sittingDocumentId} title={t('activity.title')}>
      <ul className="-mt-0.5 flex flex-col gap-3">
        {entries.map((entry) => (
          <li key={`${entry.occurred_at}-${entry.action}`} data-slot="insights-activity-row" className="flex items-start gap-3">
            <span aria-hidden="true" className="mt-1.5 size-[7px] flex-none rounded-full bg-[#C6CFDD]" />
            <div className="min-w-0">
              <div className="text-[13.5px] text-navy-900">{entry.action}</div>
              <div className="mt-0.5 text-[12px] text-[#6B7280]">
                {format.dateTime(new Date(entry.occurred_at), INSIGHTS_ACTIVITY_TIME_FORMAT)}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

export { RecentActivityCard };
