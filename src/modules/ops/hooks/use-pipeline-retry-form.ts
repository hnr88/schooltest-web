'use client';

import { isAxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { usePipelineRetryMutation } from '@/modules/ops/queries/use-pipeline-retry.mutation';

// Retry-control wiring for the pipeline panel (C-OPS-03, task 69): a manual
// job id per queue (the health payload carries no ids), with the contract's
// 404/400 mapped to their own toasts and 403 to the wrong-role toast.
export function usePipelineRetryForm(queue: string) {
  const t = useTranslations('Ops.pipeline');
  const mutation = usePipelineRetryMutation();
  const [jobId, setJobId] = useState('');

  const submit = async () => {
    const trimmed = jobId.trim();
    if (!trimmed) return;
    try {
      await mutation.mutateAsync({ queue, jobId: trimmed });
      toast.success(t('retriedToast', { jobId: trimmed }));
      setJobId('');
    } catch (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 404) {
          toast.error(t('retryNotFoundToast'));
          return;
        }
        if (status === 403) {
          toast.error(t('forbiddenToast'));
          return;
        }
      }
      toast.error(t('retryErrorToast'));
    }
  };

  return { jobId, setJobId, submit, pending: mutation.isPending };
}
