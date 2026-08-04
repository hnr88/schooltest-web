'use client';

import { useTranslations } from 'next-intl';

import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/design-system';

import type { OpsFormInspectionResultProps } from '@/modules/ops/types/components.types';

// The inspected form's Q-matrix and key table, plus the C-WIN-02 lock badge.
export function OpsFormInspectionResult({ inspection }: OpsFormInspectionResultProps) {
  const t = useTranslations('Ops.tools.inspection');
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-foreground">{inspection.form_code}</span>
        <Badge
          data-surface="ops-form-inspection-locked"
          variant={inspection.locked ? 'warning' : 'success'}
        >
          {inspection.locked ? t('locked') : t('unlocked')}
        </Badge>
        <span className="text-sm text-body">
          {t('anchors', { count: inspection.anchors.length })}
        </span>
      </div>
      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('columnItem')}</TableHead>
              <TableHead>{t('columnTaskType')}</TableHead>
              <TableHead>{t('columnStage')}</TableHead>
              <TableHead>{t('columnKey')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inspection.items.map((item) => (
              <TableRow key={item.item_code}>
                <TableCell className="font-medium text-foreground">{item.item_code}</TableCell>
                <TableCell>{item.task_type ?? '-'}</TableCell>
                <TableCell>{item.stage ?? '-'}</TableCell>
                <TableCell className="font-mono text-xs">{JSON.stringify(item.key)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
