'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
import {
  Alert,
  Badge,
  Button,
  SelectField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/design-system';
import { useFormInspectionQuery } from '@/modules/ops/queries/use-form-inspection.query';
import { useFormsQuery } from '@/modules/ops/queries/use-forms.query';

// Ops form-inspection panel (task 70, C-OPS-04, mvp-updates 4.2): Q-matrix and
// key inspection plus the C-WIN-02 lock badge. Internal ops screen, so the
// contract's technical terms are acceptable here (task assumption).
export function OpsFormInspection() {
  const t = useTranslations('Ops.tools.inspection');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const authed = hydrated && Boolean(token);
  const formsQuery = useFormsQuery(authed);
  const [selected, setSelected] = useState('');
  const inspectionQuery = useFormInspectionQuery(selected, authed);
  const inspection = inspectionQuery.data;

  const options = (formsQuery.data ?? []).map((form) => ({
    value: form.documentId,
    label: form.form_code,
  }));

  return (
    <section
      data-slot="ops-form-inspection"
      data-surface="ops-form-inspection"
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
        <p className="text-sm text-body">{t('description')}</p>
      </div>
      <SelectField
        id="ops-form-inspection-picker"
        label={t('pickerLabel')}
        placeholder={t('pickerPlaceholder')}
        options={options}
        value={selected}
        onValueChange={setSelected}
        disabled={!formsQuery.isSuccess || options.length === 0}
      />
      {inspectionQuery.isError ? (
        <Alert
          variant="error"
          title={t('errorTitle')}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={inspectionQuery.isFetching}
              onClick={() => inspectionQuery.refetch()}
            >
              {t('retry')}
            </Button>
          }
        >
          {t('errorDescription')}
        </Alert>
      ) : null}
      {inspection ? (
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
                    <TableCell className="font-mono text-xs">
                      {JSON.stringify(item.key)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
