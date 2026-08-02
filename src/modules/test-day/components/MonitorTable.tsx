'use client';

import { useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/modules/design-system';
import { effectiveRevealedIds, studentDisplayName } from '../lib/monitor-row-state';
import { useRevealAuditStore } from '../stores/use-reveal-audit-store';
import type { MonitorStudent, SittingMonitor } from '../types/test-day.types';
import { MonitorRow } from './MonitorRow';
import { StudentRevealDialog } from './StudentRevealDialog';

interface MonitorTableProps {
  sitting: SittingMonitor['sitting'];
  students: MonitorStudent[];
  resitPendingId: string | null;
  absentPendingId: string | null;
  onResit: (studentDocumentId: string) => void;
  onToggleAbsent: (studentDocumentId: string, absent: boolean) => void;
}

// C-SIT-02 live board: one row per roster student (MonitorRow carries the
// state pill, the C-SIT-05 reveal action, the C-SIT-03 re-sit and the C-SIT-06
// absent toggle). The per-row reveal action opens the per-student dialog over
// the already-loaded monitor payload and appends the UI-only audit entry.
// Dumb renderer; polling and mutations live in the query/mutation hooks.
export function MonitorTable({
  sitting,
  students,
  resitPendingId,
  absentPendingId,
  onResit,
  onToggleAbsent,
}: MonitorTableProps) {
  const t = useTranslations('TestDay.monitor');
  const revealEntries = useRevealAuditStore((state) => state.entries[sitting.documentId]);
  const [revealTarget, setRevealTarget] = useState<MonitorStudent | null>(null);
  const revealedIds = useMemo(
    () => effectiveRevealedIds(revealEntries, students, sitting.status),
    [revealEntries, students, sitting.status],
  );

  return (
    <div className="rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('columnName')}</TableHead>
            <TableHead>{t('columnEmail')}</TableHead>
            <TableHead>{t('columnStatus')}</TableHead>
            <TableHead>{t('columnAction')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((row) => (
            <MonitorRow
              key={row.documentId}
              sittingDocumentId={sitting.documentId}
              student={row}
              revealedIds={revealedIds}
              resitPendingId={resitPendingId}
              absentPendingId={absentPendingId}
              onReveal={setRevealTarget}
              onResit={onResit}
              onToggleAbsent={onToggleAbsent}
            />
          ))}
        </TableBody>
      </Table>
      <StudentRevealDialog
        open={revealTarget !== null}
        onClose={() => setRevealTarget(null)}
        code={sitting.code}
        status={sitting.status}
        studentName={revealTarget ? studentDisplayName(revealTarget) : ''}
        studentEmail={revealTarget?.email ?? null}
      />
    </div>
  );
}
