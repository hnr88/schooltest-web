'use client';

import { useMemo } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Button, StatusPill } from '@/modules/design-system';
import { useRouter } from '@/i18n/navigation';
import { QueryErrorFallback } from '@/modules/query-errors';
import { useAcaraPhaseText } from '@/modules/report/hooks/useAcaraPhaseText';
import { useRungHeading } from '@/modules/report/hooks/useRungHeading';
import { useFamilyReportListQuery } from '@/modules/report/queries/use-family-report.query';
import type { FamilyReportListRow } from '@/modules/report/schemas/family-report.schema';

/**
 * C-PAR-REPORT (NIGHT-2 W8) — the PARENT reports list (PAR-010): every official
 * result of the caller's own children, one row per report with the release
 * state and the publish date, released rows linking into the family report
 * face. The read is GET /api/my/results — no other family's row can appear
 * (ownership is re-asserted server-side), so no search obfuscation is needed
 * and the rows are grouped newest-first as the API answers them.
 */
export function FamilyReportsListScreen() {
  const t = useTranslations('Report.family');
  const tList = useTranslations('Report');
  const format = useFormatter();
  const phaseText = useAcaraPhaseText();
  const rungHeading = useRungHeading();
  const router = useRouter();
  const { data, error, isError, isFetching, isLoading, refetch } = useFamilyReportListQuery();

  const rows = useMemo(() => {
    const order: Record<FamilyReportListRow['state'], number> = { released: 0, held: 1, recalled: 2 };
    return [...(data ?? [])].sort((a, b) => {
      const byState = order[a.state] - order[b.state];
      if (byState !== 0) return byState;
      return (b.published_at ? Date.parse(b.published_at) : 0) - (a.published_at ? Date.parse(a.published_at) : 0);
    });
  }, [data]);

  if (isLoading) {
    return (
      <main className="flex flex-1 flex-col px-4 py-7 sm:px-6 lg:px-8">
        <p className="text-body-md text-muted-foreground">{tList('listLoading')}</p>
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="flex flex-1 flex-col px-4 py-7 sm:px-6 lg:px-8">
        <div className="w-full max-w-160">
          <QueryErrorFallback
            error={error}
            isRetrying={isFetching}
            onRetry={() => refetch()}
            action={
              <Button href="/dashboard/children" variant="outline" size="sm" className="h-11 rounded-full px-4">
                {t('backToChildren')}
              </Button>
            }
          />
        </div>
      </main>
    );
  }

  return (
    <main
      data-surface="family-reports-list"
      className="flex flex-1 animate-in flex-col gap-6 px-4 py-6 duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none sm:px-6 lg:px-8 lg:py-7"
    >
      <section className="flex max-w-160 flex-col gap-1">
        <h1 className="text-portal-heading font-bold text-foreground">{t('listHeading')}</h1>
        <p className="text-body-md text-muted-foreground">{t('listDescription')}</p>
      </section>

      {rows.length === 0 ? (
        <section className="flex max-w-160 flex-col gap-2 rounded-card bg-card px-6 py-8 shadow-sm sm:px-7.5">
          <h2 className="text-portal-panel font-bold text-foreground">{t('listEmptyTitle')}</h2>
          <p className="text-body-md text-muted-foreground">{t('listEmptyBody')}</p>
        </section>
      ) : (
        <ul className="flex max-w-160 flex-col rounded-card bg-card px-6 py-2 shadow-sm sm:px-7.5">
          {rows.map((row) => {
            const childName = [row.student.given_name, row.student.family_name].filter(Boolean).join(' ');
            const openable = row.state === 'released';
            return (
              <li
                key={row.documentId}
                data-slot="family-report-row"
                data-state={row.state}
                className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-divider py-4 last:border-b-0"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-body-md font-semibold text-foreground">
                    {childName || t('yourChild')}
                  </span>
                  <span className="truncate text-caption text-muted-foreground">
                    {[
                      rungHeading(row.acara_phase) ?? row.display_label ?? phaseText(row.acara_phase),
                      row.published_at
                        ? format.dateTime(new Date(row.published_at), { dateStyle: 'medium' })
                        : t('notPublished'),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </div>
                <StatusPill
                  tone={row.state === 'released' ? 'success' : row.state === 'recalled' ? 'warning' : 'info'}
                  className="shrink-0"
                >
                  {t(`state.${row.state}`)}
                </StatusPill>
                {openable ? (
                  <button
                    type="button"
                    data-slot="family-report-open"
                    onClick={() => router.push(`/dashboard/reports/${row.documentId}`)}
                    className="flex shrink-0 items-center gap-1 rounded-full border border-border px-3 py-1.5 text-caption font-semibold hover:bg-muted"
                  >
                    {t('openReport')}
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
