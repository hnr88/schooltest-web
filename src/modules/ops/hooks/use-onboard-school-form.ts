'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useOnboardSchoolMutation } from '@/modules/ops/queries/use-onboard-school.mutation';
import {
  createOnboardSchoolSchema,
  type OnboardSchoolValues,
} from '@/modules/ops/schemas/school-invitation.schema';

import type { UseOnboardSchoolFormInput } from '@/modules/ops/types/hooks.types';
import { DEFAULT_VALUES } from '@/modules/ops/constants/hooks.constants';

/**
 * C-SCH-04 (v2) submit handling for the Onboard School modal. Keeps the dialog
 * dumb: the form wiring, the 409 mapping and the toasts live here.
 */
export function useOnboardSchoolForm({ schoolDocumentId, onDone }: UseOnboardSchoolFormInput) {
  const t = useTranslations('Ops.onboard');
  const tv = useTranslations('Ops.onboard.validation');
  const schema = useMemo(() => createOnboardSchoolSchema(tv), [tv]);
  const onboard = useOnboardSchoolMutation();

  const form = useForm<OnboardSchoolValues, unknown, OnboardSchoolValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  const reset = () => form.reset(DEFAULT_VALUES);

  const submit = form.handleSubmit(async (values) => {
    try {
      // Awaited, so a 409 can still land inline on the open form. The panel
      // keeps the dialog mounted across the status flip this triggers, so
      // closing afterwards still runs the primitive's own close cleanup.
      await onboard.mutateAsync({ schoolDocumentId, ...values });
      toast.success(t('successToast', { email: values.contact_email }));
      reset();
      onDone();
    } catch (error) {
      // 409 = the school already holds an active invitation. It belongs on the
      // form, not in a toast, because the ops user has to revoke first.
      if (isAxiosError(error) && error.response?.status === 409) {
        form.setError('contact_email', { message: t('conflict') });
        return;
      }
      toast.error(t('errorToast'));
    }
  });

  return { form, submit, reset, isPending: onboard.isPending };
}
