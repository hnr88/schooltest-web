'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useUpdateClassMutation } from '@/modules/classes/queries/use-update-class.mutation';
import {
  createEditClassFormSchema,
  type EditClassFormValues,
} from '@/modules/classes/schemas/edit-class.schema';
import type { EditClassTarget } from '@/modules/classes/types/components.types';
import type { StrapiErrorEnvelope } from '@/modules/classes/types/hooks.types';

// Spec §1 Edit Class modal wiring (C-CLS-03). The PATCH carries ONLY name +
// the single teacher: `student_documentIds` is deliberately absent, so the
// server's REPLACE semantics never touch the roster, and `year_band` is absent
// so the class keeps its band.
export function useEditClassForm(schoolClass: EditClassTarget, onClose: () => void) {
  const t = useTranslations('Classes.detail.edit');
  const tv = useTranslations('Classes.validation');
  const schema = useMemo(() => createEditClassFormSchema(tv), [tv]);
  const update = useUpdateClassMutation();
  const form = useForm<EditClassFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: schoolClass.name ?? '',
      teacher_documentId: schoolClass.teacher?.documentId ?? '',
    },
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      await update.mutateAsync({
        documentId: schoolClass.documentId,
        name: values.name,
        teacher_documentIds:
          values.teacher_documentId === '' ? [] : [values.teacher_documentId],
      });
      toast.success(t('savedToast', { name: values.name }));
      onClose();
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 403) {
        // C-CLS-03 tenancy failures carry the server reason (e.g. a teacher
        // outside the school); surface it verbatim when present.
        const envelope = error.response.data as StrapiErrorEnvelope | undefined;
        toast.error(envelope?.error?.message ?? t('forbiddenToast'));
        return;
      }
      toast.error(t('errorToast'));
    }
  });

  return { form, submit, pending: update.isPending };
}
