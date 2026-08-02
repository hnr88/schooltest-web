'use client';

import { useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';
import { KeyRound } from 'lucide-react';

import {
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/design-system';
import { RESITTABLE_STATES } from '../constants/test-day.constants';
import { deriveRowState, effectiveRevealedIds } from '../lib/monitor-row-state';
import { useRevealAuditStore } from '../stores/use-reveal-audit-store';
import type { MonitorStudent, SittingMonitor } from '../types/test-day.types';
import { MonitorStatePill } from './MonitorStatePill';
import { ResitButton } from './ResitButton';
import { StudentRevealDialog } from './StudentRevealDialog';

function studentDisplayName(row: MonitorStudent): string {
  return [row.given_name, row.family_name].filter(Boolean).join(' ');
}

interface MonitorTableProps {
  sitting: SittingMonitor['sitting'];
  students: MonitorStudent[];
  resitPendingId: string | null;
  onResit: (studentDocumentId: string) => void;
}

// C-SIT-02 live board: one row per roster student with the state chip.
// Re-sit (C-SIT-03) is offered only where there is an attempt to terminate
// (joined / in_progress / stalled). The per-row reveal action (C-SIT-05) opens
// the per-student dialog over the already-loaded monitor payload and appends
// the UI-only audit entry; a revealed student still waiting to join reads as
// code_shown, derived client-side from that audit (task 90). Dumb renderer;
// polling and mutations live in the query/mutation hooks.
export function MonitorTable({ sitting, students, resitPendingId, onResit }: MonitorTableProps) {
  const t = useTranslations('TestDay.monitor');
  const tReveal = useTranslations('TestDay.studentReveal');
  const recordReveal = useRevealAuditStore((state) => state.recordReveal);
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
          {students.map((row) => {
            const rowState = deriveRowState(row, revealedIds);
            return (
              <TableRow
                key={row.documentId}
                data-student={row.documentId}
                data-slot={rowState === 'code_shown' ? 'monitor-row-code-shown' : undefined}
              >
                <TableCell className="font-medium">{studentDisplayName(row)}</TableCell>
                <TableCell>{row.email ?? t('emailMissing')}</TableCell>
                <TableCell data-state={rowState}>
                  <MonitorStatePill state={rowState} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <IconButton
                      icon={KeyRound}
                      label={tReveal('actionLabel', { name: studentDisplayName(row) })}
                      onClick={() => {
                        recordReveal(sitting.documentId, row.documentId);
                        setRevealTarget(row);
                      }}
                    />
                    {RESITTABLE_STATES.includes(row.state) ? (
                      <ResitButton
                        studentName={studentDisplayName(row)}
                        pending={resitPendingId === row.documentId}
                        onConfirm={() => onResit(row.documentId)}
                      />
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
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
