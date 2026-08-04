'use client';

import { useTranslations } from 'next-intl';

import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/design-system';
import type { RecoveryMonitorStudent } from '@/modules/ops/types/schemas.types';

import type { OpsSittingRecoveryTableProps } from '@/modules/ops/types/components.types';

// The roster table of the recovery panel (C-OPS-02, task 69): live C-SIT-02
// states with a per-student re-sit through the ops passthrough.
export function OpsSittingRecoveryTable({
  students,
  resitting,
  onResit,
}: OpsSittingRecoveryTableProps) {
  const t = useTranslations('Ops.recovery');

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('columnStudent')}</TableHead>
          <TableHead>{t('columnState')}</TableHead>
          <TableHead>{t('columnActions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => (
          <TableRow key={student.documentId}>
            <TableCell className="font-medium text-foreground">
              {student.given_name} {student.family_name}
            </TableCell>
            <TableCell>{t(`state.${student.state}`)}</TableCell>
            <TableCell>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-11 px-3"
                loading={resitting}
                onClick={() =>
                  onResit(student.documentId, `${student.given_name} ${student.family_name}`)
                }
              >
                {t('resitButton')}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
