'use client';

import { useTranslations } from 'next-intl';

import { SelectField } from '@/modules/design-system';
import { SCHOOL_PLAN_OPTIONS } from '@/modules/ops/constants/components.constants';
import { useSchoolPlan } from '@/modules/ops/hooks/use-school-plan';

import type { OpsSchoolPlanPanelProps } from '@/modules/ops/types/components.types';

// Spec §Plan System: the full licence is "assigned by Ops (not self-serve)",
// and this panel is that assignment surface — the school's stored tier plus the
// switch between the two, written through C-SCH-03. The value shown is always
// the SAVED one: the pick is applied, then re-read from the C-OPS-01 row, so a
// refused write can never leave the page claiming a plan the school does not
// hold. Switching to the full licence hands the allowance totals back to the
// stored entitlement — which this page does not read, so ops still sets those
// through C-ENT-02.
export function OpsSchoolPlanPanel({ documentId, plan }: OpsSchoolPlanPanelProps) {
  const t = useTranslations('Ops.plan');
  const { assign, pending } = useSchoolPlan(documentId);

  return (
    <section
      data-slot="ops-school-plan"
      data-surface="ops-school-plan"
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
        <p className="text-sm text-body">{t('description')}</p>
      </div>
      <p data-surface="ops-school-plan-current" className="text-sm text-body">
        {plan ? t('current', { plan: t(`options.${plan}`) }) : t('currentNone')}
      </p>
      <SelectField
        id="ops-school-plan"
        label={t('label')}
        placeholder={t('placeholder')}
        helperText={t('helper')}
        options={SCHOOL_PLAN_OPTIONS.map((option) => ({
          value: option,
          label: t(`options.${option}`),
        }))}
        value={plan ?? ''}
        onValueChange={(value) => void assign(value)}
        disabled={pending}
      />
    </section>
  );
}
