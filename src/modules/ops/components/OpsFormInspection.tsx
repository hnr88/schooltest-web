'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useAuthStore } from '@/modules/auth';
import { Alert, Button, SelectField } from '@/modules/design-system';
import { OpsFormInspectionResult } from '@/modules/ops/components/OpsFormInspectionResult';
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
      {inspection ? <OpsFormInspectionResult inspection={inspection} /> : null}
    </section>
  );
}
