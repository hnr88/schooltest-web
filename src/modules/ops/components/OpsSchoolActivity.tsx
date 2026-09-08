'use client';

import { useFormatter, useNow, useTranslations } from 'next-intl';

import { useAuthStore } from '@/modules/auth';
import { Alert, Button, Skeleton } from '@/modules/design-system';
import { useSchoolActivityQuery } from '@/modules/ops/queries/use-school-activity.query';

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
      <section data-slot="ops-activity-card" className="rounded-xl border border-border bg-card p-4">
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
      <section data-slot="ops-activity-card" className="rounded-xl border border-border bg-card p-4">
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
    <section data-slot="ops-activity-card" className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-base font-semibold text-foreground">{t('title')}</h2>
      {rows.length === 0 ? (
        <p data-slot="ops-activity-empty" className="mt-3 text-sm text-body">
          {t('empty')}
        </p>
      ) : (
        <ul className="mt-1 flex flex-col">
          {rows.map((row) => (
            <li
              key={row.documentId}
              data-slot="ops-activity-row"
              data-action={row.action}
              data-timestamp={row.timestamp}
              className="flex gap-3.5 border-b border-border/60 py-3 last:border-b-0"
            >
              <span aria-hidden="true" className="mt-1.5 size-2 flex-none rounded-full bg-foreground/30" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-foreground">{row.summary}</div>
                <div className="mt-0.5 text-xs text-body">
                  {format.relativeTime(new Date(row.timestamp), { now })}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
