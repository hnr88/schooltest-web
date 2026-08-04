'use client';

import { useFormatter, useTranslations } from 'next-intl';

import type { DiagnosticPrintHeaderProps } from '@/modules/teach/types/components.types';

// Task 140 (mvp-updates §4.9): the printed report's document header - class
// name, form code and the print date, all localised. Screen rendering is
// untouched: `.print-only` is display:none outside print, and the header
// duplicates what the on-screen title row already says so paper reads as a
// self-contained document. No form code on the wire means no form label, the
// same conditional as the screen summary row.
export function DiagnosticPrintHeader({ classLabel, formCode }: DiagnosticPrintHeaderProps) {
  const t = useTranslations('Teach.diagnostic');
  const format = useFormatter();

  return (
    <div data-slot="print-header" className="print-only">
      <p className="text-lg font-semibold text-foreground">{classLabel}</p>
      <p className="text-sm text-body">
        {formCode ? `${t('formLabel', { code: formCode })} · ` : ''}
        {t('printDate', {
          date: format.dateTime(new Date(), {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
        })}
      </p>
    </div>
  );
}
