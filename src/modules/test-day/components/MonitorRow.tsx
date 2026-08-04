'use client';

import { useTranslations } from 'next-intl';
import { KeyRound } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge, IconButton, TableCell, TableRow } from '@/modules/design-system';
import { RESITTABLE_STATES } from '@/modules/test-day/constants/test-day.constants';
import { deriveRowState, studentDisplayName } from '@/modules/test-day/lib/monitor-row-state';
import { useRevealAuditStore } from '@/modules/test-day/stores/use-reveal-audit-store';
import type { MonitorStudent } from '@/modules/test-day/types/test-day.types';
import { AbsentToggle } from './AbsentToggle';
import { MonitorStatePill } from './MonitorStatePill';
import { ResitButton } from './ResitButton';

import type { MonitorRowProps } from '@/modules/test-day/types/components.types';

// One C-SIT-02 monitor row: state pill, per-student reveal (C-SIT-05), re-sit
// (C-SIT-03) and the absent toggle (C-SIT-06, task 120). An absent row reads
// muted with an "Absent" badge next to the name and is excluded from
// needs_to_sit server-side. Extracted from MonitorTable so both stay inside
// the component line limit; all behaviour is prop-driven.
export function MonitorRow({
  sittingDocumentId,
  student,
  revealedIds,
  resitPendingId,
  absentPendingId,
  onReveal,
  onResit,
  onToggleAbsent,
}: MonitorRowProps) {
  const t = useTranslations('TestDay.monitor');
  const tReveal = useTranslations('TestDay.studentReveal');
  const recordReveal = useRevealAuditStore((state) => state.recordReveal);
  const rowState = deriveRowState(student, revealedIds);
  const name = studentDisplayName(student);

  return (
    <TableRow
      data-student={student.documentId}
      data-slot={rowState === 'code_shown' ? 'monitor-row-code-shown' : undefined}
      data-absent={student.absent ? 'true' : undefined}
      className={cn({ 'bg-muted/50 text-muted-foreground': student.absent })}
    >
      <TableCell className="font-medium">
        <span className="flex items-center gap-2">
          {name}
          {student.absent ? <Badge variant="secondary">{t('absentLabel')}</Badge> : null}
        </span>
      </TableCell>
      <TableCell>{student.email ?? t('emailMissing')}</TableCell>
      <TableCell data-state={rowState}>
        <MonitorStatePill state={rowState} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <IconButton
            icon={KeyRound}
            label={tReveal('actionLabel', { name })}
            onClick={() => {
              recordReveal(sittingDocumentId, student.documentId);
              onReveal(student);
            }}
          />
          {RESITTABLE_STATES.includes(student.state) ? (
            <ResitButton
              studentName={name}
              pending={resitPendingId === student.documentId}
              onConfirm={() => onResit(student.documentId)}
            />
          ) : null}
          <AbsentToggle
            studentName={name}
            absent={student.absent}
            pending={absentPendingId === student.documentId}
            onToggle={(absent) => onToggleAbsent(student.documentId, absent)}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}
