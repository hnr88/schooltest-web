'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff } from 'lucide-react';

import {
  Alert,
  Button,
  NativeSelect,
  NativeSelectOption,
  Skeleton,
} from '@/modules/design-system';
import { OpsFormInspectionTable } from '@/modules/ops/components/OpsFormInspectionTable';
import { useFormInspectionQuery } from '@/modules/ops/queries/use-form-inspection.query';
import type { OpsFormInspectionProps } from '@/modules/ops/types/inspection.types';

/**
 * Ledger row 11a / D-007 — form Q-matrix + key inspection, mounted on the
 * window detail surface (`OpsFormWindow`) because that panel is the one place
 * in the portal that already resolves BOTH the live window's form and the
 * picker's form list.
 *
 * CLOSED BY DEFAULT, and that is a product decision rather than a preference:
 * this is the only surface in the product that serves the CORRECT KEYS, so the
 * read happens when an operator asks for it (the query is `enabled` only while
 * this panel is open) instead of on every visit to a school page.
 *
 * WHY THERE IS A FORM PICKER HERE. The obvious build — inspect the form the
 * live window points at — renders NOTHING on every school in the current
 * database, because `form_windows` holds zero rows (checked in postgres before
 * building this, not assumed). A control that is invisible on all real data is
 * not a shipped surface, so the panel defaults to the live window's form when
 * there is one and otherwise lets the operator inspect any form from the list
 * this panel already loaded — no second fetch, no invented endpoint. When the
 * selection is not the window's form, the panel says so.
 */
export function OpsFormInspection({ formDocumentId, formCode, forms }: OpsFormInspectionProps) {
  const t = useTranslations('Ops.inspection');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>(formDocumentId ?? '');
  const target = selected === '' ? (forms[0]?.documentId ?? null) : selected;
  const inspection = useFormInspectionQuery(target, open);

  if (forms.length === 0 && formDocumentId === null) return null;

  return (
    <div
      data-slot="ops-form-inspection"
      data-surface="ops-form-inspection"
      data-open={open}
      data-target={target ?? ''}
      className="flex flex-col gap-3 rounded-lg border border-border bg-background p-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-foreground">{t('title')}</h3>
          <p className="text-sm text-body">{t('description')}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-slot="ops-form-inspection-toggle"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? (
            <EyeOff aria-hidden="true" className="size-4" />
          ) : (
            <Eye aria-hidden="true" className="size-4" />
          )}
          {open ? t('hide') : t('show')}
        </Button>
      </div>

      {open ? (
        <div className="flex flex-col gap-3">
          <NativeSelect
            id="ops-form-inspection-form"
            aria-label={t('formSelectLabel')}
            data-slot="ops-form-inspection-select"
            value={target ?? ''}
            onChange={(event) => setSelected(event.target.value)}
          >
            {forms.map((form) => (
              <NativeSelectOption key={form.documentId} value={form.documentId}>
                {form.form_code}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {formDocumentId === null ? (
            <p className="text-xs text-muted-foreground" data-slot="ops-form-inspection-no-window">
              {t('noLiveWindow')}
            </p>
          ) : target !== formDocumentId ? (
            <p className="text-xs text-muted-foreground" data-slot="ops-form-inspection-not-live">
              {t('notLiveForm', { formCode: formCode ?? '' })}
            </p>
          ) : null}

          {inspection.isPending ? (
            <div className="flex flex-col gap-2" data-slot="ops-form-inspection-loading">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : inspection.isError || inspection.data === undefined ? (
            <Alert variant="error" title={t('errorTitle')}>
              {t('errorDescription')}
            </Alert>
          ) : (
            <OpsFormInspectionTable inspection={inspection.data} />
          )}
        </div>
      ) : null}
    </div>
  );
}
