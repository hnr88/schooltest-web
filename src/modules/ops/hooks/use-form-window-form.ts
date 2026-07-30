'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { format, parseISO } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useFormWindowMutation } from '@/modules/ops/queries/use-form-window.mutation';
import {
  createFormWindowFormSchema,
  type FormWindow,
  type FormWindowFormValues,
} from '@/modules/ops/schemas/form-window.schema';

// ISO on the wire -> datetime-local input value (local wall time).
function toLocalInput(iso: string): string {
  return format(parseISO(iso), "yyyy-MM-dd'T'HH:mm");
}

// The Strapi v5 error envelope's human message, when one came back.
function serverMessage(error: unknown): { status?: number; message?: string } {
  if (isAxiosError<{ error?: { message?: string } }>(error)) {
    return { status: error.response?.status, message: error.response?.data?.error?.message };
  }
  return {};
}

// Form wiring for the OpsFormWindow editor (C-WIN-01, task 68). The component
// remounts (keyed on the window content) whenever the saved window changes, so
// defaultValues are always the current window at mount - no reset effect that
// could clobber a mid-edit form on a background refetch. A 400 is shown in the
// panel - the FORM_LOCKED copy for the lock, the server message verbatim for
// every other validation refusal; a 403 toasts.
export function useFormWindowForm(schoolDocumentId: string, currentWindow: FormWindow | null) {
  const t = useTranslations('Ops.window');
  const tv = useTranslations('Ops.window.validation');
  const mutation = useFormWindowMutation();
  const [serverError, setServerError] = useState<string | null>(null);
  const schema = useMemo(() => createFormWindowFormSchema(tv), [tv]);
  const form = useForm<FormWindowFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      form_documentId: currentWindow?.form?.documentId ?? '',
      opens_at: currentWindow ? toLocalInput(currentWindow.opens_at) : '',
      closes_at: currentWindow ? toLocalInput(currentWindow.closes_at) : '',
    },
  });

  const submit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      const saved = await mutation.mutateAsync({
        schoolDocumentId,
        form_documentId: values.form_documentId,
        opens_at: new Date(values.opens_at).toISOString(),
        closes_at: new Date(values.closes_at).toISOString(),
      });
      toast.success(t('savedToast', { formCode: saved.form?.form_code ?? '' }));
    } catch (error) {
      const { status, message } = serverMessage(error);
      if (status === 400) {
        setServerError(
          message?.startsWith('FORM_LOCKED') ? t('lockedError') : (message ?? t('errorToast')),
        );
        return;
      }
      if (status === 403) {
        toast.error(t('forbiddenToast'));
        return;
      }
      toast.error(t('errorToast'));
    }
  });

  return { form, submit, serverError, pending: mutation.isPending };
}
