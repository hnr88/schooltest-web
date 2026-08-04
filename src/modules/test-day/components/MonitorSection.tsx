'use client';

import { useMemo } from 'react';

import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';
import { effectiveRevealedIds, summarizeRowStates } from '@/modules/test-day/lib/monitor-row-state';
import { useCloseReopenMutation } from '@/modules/test-day/queries/use-close-reopen.mutation';
import { useMarkAbsentMutation } from '@/modules/test-day/queries/use-mark-absent.mutation';
import { useResitMutation } from '@/modules/test-day/queries/use-resit.mutation';
import { useSittingMonitorQuery } from '@/modules/test-day/queries/use-sitting-monitor.query';
import { useRevealAuditStore } from '@/modules/test-day/stores/use-reveal-audit-store';
import type { ClassSitting } from '@/modules/test-day/types/test-day.types';
import { MonitorSummary } from './MonitorSummary';
import { MonitorTable } from './MonitorTable';
import { NeedsToSitPanel } from './NeedsToSitPanel';

import type { MonitorSectionProps } from '@/modules/test-day/types/components.types';

// The live monitor section (C-SIT-02 polling + E2-11 close/reopen + C-SIT-03
// re-sit + C-SIT-06 absent wiring). Kept out of TestDayScreen to respect the
// component size limit; the table itself is a dumb renderer. The summary line
// (task 90) counts the derived row states including code_shown so a staggered
// sitting visibly sums to the roster.
export function MonitorSection({ sitting }: MonitorSectionProps) {
  const t = useTranslations('TestDay.monitor');
  const monitor = useSittingMonitorQuery(sitting.documentId);
  const closeReopen = useCloseReopenMutation();
  const resit = useResitMutation();
  const markAbsent = useMarkAbsentMutation();
  const resitPendingId = resit.isPending ? (resit.variables?.studentDocumentId ?? null) : null;
  const absentPendingId = markAbsent.isPending
    ? (markAbsent.variables?.studentDocumentId ?? null)
    : null;
  const revealEntries = useRevealAuditStore((state) => state.entries[sitting.documentId]);
  const summary = useMemo(() => {
    if (!monitor.data) return null;
    const revealedIds = effectiveRevealedIds(
      revealEntries,
      monitor.data.students,
      monitor.data.sitting.status,
    );
    return summarizeRowStates(monitor.data.students, revealedIds);
  }, [monitor.data, revealEntries]);

  return (
    <section className="flex flex-col gap-3" aria-label={t('title')}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 px-4"
          loading={closeReopen.isPending}
          onClick={() =>
            closeReopen.mutate({
              sittingDocumentId: sitting.documentId,
              action: sitting.status === 'open' ? 'close' : 'reopen',
            })
          }
        >
          {sitting.status === 'open' ? t('closeCta') : t('reopenCta')}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{t('liveNote')}</p>
      {monitor.isPending ? (
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      ) : null}
      {monitor.isError ? (
        <p role="alert" className="text-sm text-danger-ink">
          {t('loadError')}
        </p>
      ) : null}
      {summary ? <MonitorSummary counts={summary} /> : null}
      {monitor.isSuccess ? <NeedsToSitPanel students={monitor.data.students} /> : null}
      {monitor.isSuccess ? (
        <MonitorTable
          sitting={monitor.data.sitting}
          students={monitor.data.students}
          resitPendingId={resitPendingId}
          absentPendingId={absentPendingId}
          onResit={(studentDocumentId) =>
            resit.mutate({ sittingDocumentId: sitting.documentId, studentDocumentId })
          }
          onToggleAbsent={(studentDocumentId, absent) =>
            markAbsent.mutate({ sittingDocumentId: sitting.documentId, studentDocumentId, absent })
          }
        />
      ) : null}
    </section>
  );
}
