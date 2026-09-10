'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { showOpsToast } from '@/modules/ops/actions';
import { CLASSES_QUERY_KEY } from '@/modules/classes/constants/queries.constants';
import { useCreateClassMutation } from '@/modules/classes/queries/use-create-class.mutation';
import {
  createAddClassFormSchema,
  type AddClassFormValues,
} from '@/modules/classes/schemas/class.schema';

// Spec §2 add-class submit (P-03): the modal is name + teacher picker + summary
// ONLY — the CSV import block left the add-class modal, so a submit is a plain
// C-CLS-02 class create. Students join a class through the ONE import flow (the
// shared dialog on the preview→commit engine), never as a side effect of
// creating the class.
export function useAddClassForm(onClose: () => void) {
  const t = useTranslations('Classes.addForm');
  const tv = useTranslations('Classes.validation');
  const schema = useMemo(() => createAddClassFormSchema(tv), [tv]);
  const queryClient = useQueryClient();
  const create = useCreateClassMutation();
  const form = useForm<AddClassFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', teacher_documentId: '' },
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      await create.mutateAsync({
        name: values.name,
        teacher_documentIds:
          values.teacher_documentId === '' ? [] : [values.teacher_documentId],
      });
    } catch (error) {
      const forbidden = isAxiosError(error) && error.response?.status === 403;
      showOpsToast({ tone: 'error', message: forbidden ? t('forbiddenToast') : t('errorToast') });
      return;
    }
    // The create changed student_count/roster_count, which C-CLS-01 computes
    // at read, so the classes roster refreshes with the new class.
    await queryClient.invalidateQueries({ queryKey: CLASSES_QUERY_KEY });
    showOpsToast({ tone: 'ok', message: t('createdToast', { name: values.name }) });
    onClose();
  });

  return { form, submit, pending: form.formState.isSubmitting };
}
