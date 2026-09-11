'use client';

import { useFormatter, useNow, useTranslations } from 'next-intl';

import { useAuthStore } from '@/modules/auth';
import { Alert, Button, Skeleton } from '@/modules/design-system';
import { useSchoolActivityQuery } from '@/modules/ops/queries/use-school-activity.query';

// ops-tabs-audit — the design's dot colours (`Ops Portal.dc.html:1504-1507`):
// the NEWEST event carries the blue #2563EB, everything younger than a month
// is navy #0E2350, and older entries fade to #9AA6B8. (The seed's ages — 2
// days blue, 5 days and 2 weeks navy, 1 month grey — are the whole spec; the
// former semantic red/amber/green mapping appears nowhere in the design.)
function activityDotTone(index: number, ageDays: number): string {
  if (index === 0) return 'bg-[#2563EB]';
  return ageDays > 30 ? 'bg-[#9AA6B8]' : 'bg-[#0E2350]';
}

// C-OPS-PORTAL-010 (OPS-020) — the school overview's Recent activity card:
// one dot + title + relative time per real audit event. The feed is the
// server's school-scoped projection, never the prototype's hard-coded list;
// relative times come from the stored timestamp via Intl, so a row rendered
// two days after the event reads "2 days ago" in the viewer's locale.
export function OpsSchoolActivity({ documentId }: { documentId: string }) {
  const t = useTranslations('Ops.activity');
  const format = useFormatter();
  // next-intl's relativeTime needs an explicit `now`: without one it falls
  // back to the environment's clock at MODULE scope and logs an
  // IntlError ENVIRONMENT_FALLBACK into the console on every render (x per
  // activity row) — the house pattern is `useNow()` (NotificationFeedList,
  // NotificationPreviewItem).
  const now = useNow();
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const activityQuery = useSchoolActivityQuery({ schoolDocumentId: documentId }, hydrated && Boolean(token));

  if (activityQuery.isPending) {
    return (
      <section
        data-slot="ops-activity-card"
        className="rounded-card bg-card px-[30px] py-[26px] shadow-sm"
      >
        <Skeleton className="h-5 w-40" />
        <div className="mt-3 flex flex-col gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </section>
    );
  }

  if (activityQuery.isError) {
    return (
      <section
        data-slot="ops-activity-card"
        className="rounded-card bg-card px-[30px] py-[26px] shadow-sm"
      >
        <h2 className="text-base font-semibold text-foreground">{t('title')}</h2>
        <div data-slot="ops-activity-error" className="mt-3">
          <Alert
            variant="error"
            title={t('errorTitle')}
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={activityQuery.isFetching}
                onClick={() => activityQuery.refetch()}
              >
                {t('retry')}
              </Button>
            }
          >
            {t('errorDescription')}
          </Alert>
        </div>
      </section>
    );
  }

  const rows = activityQuery.data.data;

  return (
    <section
      data-slot="ops-activity-card"
      className="rounded-card bg-card px-[30px] py-[26px] shadow-sm"
    >
      <h2 className="mb-3.5 text-base font-semibold text-foreground">{t('title')}</h2>
      {rows.length === 0 ? (
        <p data-slot="ops-activity-empty" className="mt-3 text-sm text-body">
          {t('empty')}
        </p>
      ) : (
        <ul className="flex flex-col">
          {rows.map((row, index) => {
            const ageDays = (now.getTime() - new Date(row.timestamp).getTime()) / 86_400_000;
            return (
              <li
                key={row.documentId}
                data-slot="ops-activity-row"
                data-action={row.action}
                data-timestamp={row.timestamp}
                className="flex gap-3.5 border-b border-[#EEF1F6] py-3 last:border-b-0"
              >
                <span
                  aria-hidden="true"
                  className={`mt-1.5 size-2 flex-none rounded-full ${activityDotTone(index, ageDays)}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold text-foreground">{row.summary}</div>
                  <div className="mt-0.5 text-[12.5px] text-[#7C8698]">
                    {format.relativeTime(new Date(row.timestamp), { now })}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
