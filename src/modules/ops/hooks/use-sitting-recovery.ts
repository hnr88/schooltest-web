'use client';

import { isAxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { useInvalidateSittingMutation } from '@/modules/ops/queries/use-invalidate-sitting.mutation';
import { useOpsResitMutation } from '@/modules/ops/queries/use-ops-resit.mutation';

// Mutation wiring for the sitting-recovery panel (C-OPS-02, task 69):
// invalidate closes the sitting and stamps its sessions invalidated; resit is
// the ops-side C-SIT-03 passthrough. A 403 (wrong role) gets its own toast;
// anything else is the generic failure.
export function useSittingRecovery(sittingDocumentId: string) {
  const t = useTranslations('Ops.recovery');
  const invalidateMutation = useInvalidateSittingMutation();
  const resitMutation = useOpsResitMutation();

  const invalidate = async () => {
    try {
      await invalidateMutation.mutateAsync(sittingDocumentId);
      toast.success(t('invalidatedToast'));
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 403) {
        toast.error(t('forbiddenToast'));
        return;
      }
      toast.error(t('errorToast'));
    }
  };

  const resit = async (studentDocumentId: string, studentName: string) => {
    try {
      await resitMutation.mutateAsync({ sittingDocumentId, studentDocumentId });
      toast.success(t('resitToast', { name: studentName }));
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 403) {
        toast.error(t('forbiddenToast'));
        return;
      }
      toast.error(t('resitErrorToast'));
    }
  };

  return {
    invalidate,
    resit,
    invalidating: invalidateMutation.isPending,
    invalidated: invalidateMutation.isSuccess,
    resitting: resitMutation.isPending,
  };
}
