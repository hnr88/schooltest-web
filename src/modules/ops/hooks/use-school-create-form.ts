'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useSchoolCreateMutation } from '@/modules/ops/queries/use-school-create.mutation';
import {
  createSchoolCreateFormSchema,
  type SchoolCreateFormValues,
} from '@/modules/ops/schemas/school-create.schema';
import type { UseSchoolCreateFormInput } from '@/modules/ops/types/school-create.types';

const DEFAULT_CREATE_VALUES: SchoolCreateFormValues = {
  name: '',
  suburb: '',
  state: '',
  sector: '',
  plan: 'pilot',
  status: 'pending_setup',
  contact_name: '',
  contact_email: '',
  phone: '',
};

/**
 * Submit handling for the Create School modal. One Idempotency-Key per dialog
 * session (regenerated on reset): an in-flight retry of the SAME submission
 * replays the original 201 instead of creating a second school, while a fresh
 * dialog always starts a fresh key. The 409 lands on the form root because the
 * operator must change the details, not just dismiss a toast.
 *
 * Task 10 — the onboarding_delivery outcome is RETURNED to the dialog: a
 * failed invitation keeps the dialog open with the school id and offers the
 * resend (which re-runs ONLY the invitation) — never "invitation sent", never
 * a recreate.
 */
export function useSchoolCreateForm({ onDone }: UseSchoolCreateFormInput) {
  const t = useTranslations('Ops.createSchool');
  const tv = useTranslations('Ops.createSchool.validation');
  const schema = useMemo(() => createSchoolCreateFormSchema(tv), [tv]);
  const create = useSchoolCreateMutation();
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [deliveryState, setDeliveryState] = useState<'sent' | 'failed' | 'not_requested' | null>(null);
  const [deliverySchoolDocumentId, setDeliverySchoolDocumentId] = useState<string | null>(null);

  const form = useForm<SchoolCreateFormValues, unknown, SchoolCreateFormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_CREATE_VALUES,
  });

  const reset = () => {
    setIdempotencyKey(crypto.randomUUID());
    form.reset(DEFAULT_CREATE_VALUES);
  };

  const submit = form.handleSubmit(async (values) => {
    try {
      // Awaited, so a 409 can still land inline on the open form.
      const result = await create.mutateAsync({ values, idempotencyKey });
      if (result.onboarding_delivery.state === 'failed') {
        setDeliveryState('failed');
        setDeliverySchoolDocumentId(result.documentId);
        setIdempotencyKey(crypto.randomUUID());
        form.reset(DEFAULT_CREATE_VALUES);
        return;
      }
      if (result.onboarding_delivery.state === 'sent') {
        toast.success(t('successToast', { email: values.contact_email }));
      } else {
        toast.success(t('successNoInviteToast'));
      }
      reset();
      onDone();
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        form.setError('root', { message: t('conflict') });
        return;
      }
      toast.error(t('errorToast'));
    }
  });

  return { form, submit, reset, isPending: create.isPending, deliveryState, deliverySchoolDocumentId, setDeliveryState };
}
