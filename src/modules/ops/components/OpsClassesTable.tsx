'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusPill } from '@/modules/design-system';
import { noValueIfMissing, opsTeacherLabel } from '@/modules/ops/lib/ops-class-detail.helpers';
import { classRowStatus, type ClassListStatus, type ClassRow } from '@/modules/ops/lib/ops-classes-contract';

import type { StatusPillTone } from '@/modules/design-system/types/data-display.types';

// C-OPS-PORTAL-028 rows. Every cell is a value the operation actually serves —
// the count is the live active-student count, the sub-line is the school's real
// test window, and the pill is derived by the SHARED status rule, never by a
// second copy of it living in the UI.
const STATUS_TONE: Record<ClassListStatus, StatusPillTone> = {
  active: 'success',
  pending_setup: 'warning',
  archived: 'neutral',
};

export function OpsClassesTable({
  schoolDocumentId,
  rows,
}: {
  schoolDocumentId: string;
  rows: readonly ClassRow[];
}) {
  const t = useTranslations('Ops.classesTab');

  return (
    <div className="overflow-x-auto rounded-card border border-border bg-card shadow-sm">
      <Table data-testid="ops-classes-table">
        <TableHeader>
          <TableRow>
            <TableHead>{t('columnClass')}</TableHead>
            <TableHead>{t('columnTeacher')}</TableHead>
            <TableHead>{t('columnStudents')}</TableHead>
            <TableHead>{t('columnYear')}</TableHead>
            <TableHead>{t('columnStatus')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const status = classRowStatus(row);
            return (
              <TableRow key={row.documentId} data-testid="ops-classes-row">
                <TableCell className="font-medium text-foreground">
                  <Link
                    href={`/dashboard/ops/schools/${schoolDocumentId}/classes/${row.documentId}`}
                    className="underline-offset-2 hover:underline"
                    data-testid="ops-classes-open"
                  >
                    {noValueIfMissing(row.name)}
                  </Link>
                  <span className="block text-meta text-muted-foreground" data-testid="ops-classes-window">
                    {row.test_window === null ? t('noWindow') : row.test_window.title}
                  </span>
                </TableCell>
                <TableCell data-testid="ops-classes-teacher">
                  {row.primary_teacher === null
                    ? t('noTeacher')
                    : opsTeacherLabel({ ...row.primary_teacher, email: null })}
                </TableCell>
                <TableCell data-testid="ops-classes-students">{String(row.student_count)}</TableCell>
                <TableCell data-testid="ops-classes-year">{noValueIfMissing(row.year_band)}</TableCell>
                <TableCell>
                  <StatusPill tone={STATUS_TONE[status]}>{t(`status.${status}`)}</StatusPill>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
