'use client';

import { isAxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { isSchoolPlan } from '@/modules/ops/lib/ops-school-plan.helpers';
import { useSchoolPlanMutation } from '@/modules/ops/queries/use-school-plan.mutation';

// Plan-assignment wiring for the ops school detail (spec §Plan System, written
// through C-SCH-03). The pick is applied straight away and the C-OPS-01 row is
// then re-read, so the panel only ever shows a plan the server accepted. A 403
// (wrong role) gets its own toast; anything else is the generic failure.
export function useSchoolPlan(schoolDocumentId: string) {
  const t = useTranslations('Ops.plan');
  const mutation = useSchoolPlanMutation();

  const assign = async (value: string) => {
    if (!isSchoolPlan(value)) return;
    try {
      await mutation.mutateAsync({ schoolDocumentId, plan: value });
      toast.success(t('savedToast', { plan: t(`options.${value}`) }));
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 403) {
        toast.error(t('forbiddenToast'));
        return;
      }
      toast.error(t('errorToast'));
    }
  };

  return { assign, pending: mutation.isPending };
}
