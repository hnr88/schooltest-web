'use client';

import { useTranslations } from 'next-intl';

import {
  StatusPill,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/design-system';
import { RESITTABLE_STATES } from '../constants/test-day.constants';
import type { MonitorStudent, SittingStudentState } from '../types/test-day.types';
import { ResitButton } from './ResitButton';

type PillTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const STATE_TONES: Record<SittingStudentState, PillTone> = {
  not_joined: 'neutral',
  joined: 'info',
  in_progress: 'warning',
  submitted: 'success',
  stalled: 'danger',
};

function studentDisplayName(row: MonitorStudent): string {
  return [row.given_name, row.family_name].filter(Boolean).join(' ');
}

interface MonitorTableProps {
  students: MonitorStudent[];
  resitPendingId: string | null;
  onResit: (studentDocumentId: string) => void;
}

// C-SIT-02 live board: one row per roster student with the five-state chip.
// Re-sit (C-SIT-03) is offered only where there is an attempt to terminate
// (joined / in_progress / stalled). Dumb renderer; polling and mutations live
// in the query/mutation hooks.
export function MonitorTable({ students, resitPendingId, onResit }: MonitorTableProps) {
  const t = useTranslations('TestDay.monitor');

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
            <TableRow key={row.documentId} data-student={row.documentId}>
              <TableCell className="font-medium">{studentDisplayName(row)}</TableCell>
              <TableCell>{row.email ?? t('emailMissing')}</TableCell>
              <TableCell data-state={row.state}>
                <StatusPill tone={STATE_TONES[row.state]}>{t(`state.${row.state}`)}</StatusPill>
              </TableCell>
              <TableCell>
                {RESITTABLE_STATES.includes(row.state) ? (
                  <ResitButton
                    studentName={studentDisplayName(row)}
                    pending={resitPendingId === row.documentId}
                    onConfirm={() => onResit(row.documentId)}
                  />
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
