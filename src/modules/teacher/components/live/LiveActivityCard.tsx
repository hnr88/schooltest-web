'use client';

import { useLocale, useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { LIVE_ACTIVITY_POLL_MS } from '@/modules/teacher/constants/live-tab.constants';
import { clockLabel } from '@/modules/teacher/lib/live-tab';
import { useSittingActivityQuery } from '@/modules/test-day';

// Teacher Portal v2.dc.html:1207–1221 — Session activity: the server's trail for
// this sitting (C-SIT-ACTIVITY, last 8 of `total`), re-read while the sitting is live.
function LiveActivityCard({ sittingDocumentId }: { sittingDocumentId: string }) {
  const t = useTranslations('TeacherPortal.live.activity');
  const locale = useLocale();
  const feed = useSittingActivityQuery(sittingDocumentId, { refetchInterval: LIVE_ACTIVITY_POLL_MS });
  const entries = feed.data?.entries ?? [];
  const total = feed.data?.total ?? 0;

  return (
    <section
      data-slot="live-activity"
      data-status={feed.isError ? 'error' : feed.isPending ? 'loading' : 'ready'}
      aria-labelledby="live-activity-title"
      className="rounded-[11px] border border-[#ECEEF2] bg-[#FAFBFC] px-[30px] pt-6 pb-5"
    >
      <h3 id="live-activity-title" className="text-[16px] font-semibold text-navy-900">
        {t('title')}
      </h3>
      <p className="mt-[5px] text-[13px] text-[#6B7280]">{t('subtitle')}</p>
      {feed.isError ? (
        <p role="alert" className="mt-3.5 text-[13px] text-[#B42318]">
          {t('loadError')}
        </p>
      ) : (
        <ol className="mt-3.5 flex flex-col">
          {entries.map((entry, index) => (
            <li
              key={`${entry.occurred_at}-${entry.action}`}
              data-slot="live-activity-row"
              data-kind={entry.kind}
              className={cn(
                'flex items-baseline gap-3.5 py-[11px]',
                index < entries.length - 1 && 'border-b border-[#EEF1F6]',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'size-[7px] flex-none -translate-y-0.5 rounded-full',
                  entry.kind === 'warn' ? 'bg-[#92610B]' : 'bg-[#C4CEDC]',
                )}
              />
              <time dateTime={entry.occurred_at} className="w-11 flex-none text-[12.5px] font-semibold text-[#4B5563]">
                {clockLabel(entry.occurred_at, locale)}
              </time>
              <span className="min-w-0 flex-1 text-[13.5px] leading-normal text-navy-900">{entry.action}</span>
              <span className="flex-none text-[12.5px] text-[#6B7280]">{entry.actor_label}</span>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-3 text-[12.5px] text-[#6B7280]">
        {total > entries.length ? t('noteTruncated', { shown: entries.length, total }) : t('note')}
      </p>
    </section>
  );
}

export { LiveActivityCard };
