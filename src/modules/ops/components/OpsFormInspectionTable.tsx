'use client';

import { useTranslations } from 'next-intl';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/modules/design-system';
import { inspectionCell } from '@/modules/ops/lib/inspection.lib';
import type { OpsFormInspectionTableProps } from '@/modules/ops/types/inspection.types';

/**
 * Ledger row 11a / D-007 — the inspection payload as a table.
 *
 * `attribute_vector` and `key` are `unknown` by contract (authored per task
 * type), so they are rendered verbatim as compact JSON: narrowing them here
 * would be inventing a shape the server never promised, and this surface exists
 * precisely to show what is really stored.
 */
export function OpsFormInspectionTable({ inspection }: OpsFormInspectionTableProps) {
  const t = useTranslations('Ops.inspection');

  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex flex-wrap items-center gap-2 text-sm text-body"
        data-slot="ops-form-inspection-summary"
        data-form-code={inspection.form_code}
        data-item-count={inspection.items.length}
        data-locked={inspection.locked}
      >
        <span className="font-medium text-foreground">
          {t('formCode', { formCode: inspection.form_code })}
        </span>
        <span>{t('itemCount', { count: inspection.items.length })}</span>
        <span data-slot="ops-form-inspection-anchors">
          {inspection.anchors.length > 0
            ? t('anchors', { codes: inspection.anchors.join(', ') })
            : t('anchorsNone')}
        </span>
        {inspection.locked ? (
          <Badge variant="error">{t('lockedBadge')}</Badge>
        ) : (
          <Badge variant="default">{t('unlockedBadge')}</Badge>
        )}
      </div>

      <div className="overflow-x-auto">
        <Table data-slot="ops-form-inspection-table">
          <TableHeader>
            <TableRow>
              <TableHead>{t('columnItem')}</TableHead>
              <TableHead>{t('columnTaskType')}</TableHead>
              <TableHead>{t('columnStage')}</TableHead>
              <TableHead>{t('columnVector')}</TableHead>
              <TableHead>{t('columnKey')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inspection.items.map((item) => (
              <TableRow key={item.item_code} data-slot="ops-form-inspection-row">
                <TableCell className="font-medium">{item.item_code}</TableCell>
                <TableCell>{inspectionCell(item.task_type)}</TableCell>
                <TableCell>{inspectionCell(item.stage)}</TableCell>
                <TableCell className="font-mono text-xs">
                  {inspectionCell(item.attribute_vector)}
                </TableCell>
                <TableCell className="font-mono text-xs" data-slot="ops-form-inspection-key">
                  {inspectionCell(item.key)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
