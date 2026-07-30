'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useCreateClassMutation } from '@/modules/classes/mutations/use-create-class.mutation';
import { useUpdateClassMutation } from '@/modules/classes/mutations/use-update-class.mutation';
import {
  createClassFormSchema,
  type ClassFormValues,
} from '@/modules/classes/schemas/class.schema';
import type { ClassChildOption, SchoolClass } from '@/modules/classes/types/classes.types';

export type ClassFormTarget = { mode: 'create' } | { mode: 'edit'; schoolClass: SchoolClass };

function initialValues(target: ClassFormTarget, children: ClassChildOption[]): ClassFormValues {
  if (target.mode === 'create') {
    return { name: '', year_band: '7_9', teacher_documentIds: [], student_documentIds: [] };
  }
  const { schoolClass } = target;
  return {
    name: schoolClass.name,
    year_band: schoolClass.year_band === '10_12' ? '10_12' : '7_9',
    teacher_documentIds: schoolClass.teachers.map((teacher) => teacher.documentId),
    // Pre-check the class's current members so the PATCH replace semantics
    // keep them (including archived children hidden from no filter).
    student_documentIds: children
      .filter((child) => child.class?.documentId === schoolClass.documentId)
      .map((child) => child.documentId),
  };
}

// Form wiring for ClassForm (C-CLS-02 create / C-CLS-03 edit): schema,
// defaults, mutation dispatch and toast/error classification. A 403 (wrong
// role) gets its own toast; anything else is the generic failure.
export function useClassForm(
  target: ClassFormTarget,
  children: ClassChildOption[],
  onClose: () => void,
) {
  const t = useTranslations('Classes.form');
  const tv = useTranslations('Classes.validation');
  const schema = useMemo(() => createClassFormSchema(tv), [tv]);
  const create = useCreateClassMutation();
  const update = useUpdateClassMutation();
  const form = useForm<ClassFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues(target, children),
  });

  const pending = create.isPending || update.isPending;

  const submit = form.handleSubmit(async (values) => {
    try {
      if (target.mode === 'create') {
        await create.mutateAsync({
          name: values.name,
          year_band: values.year_band,
          teacher_documentIds: values.teacher_documentIds,
        });
        toast.success(t('createdToast', { name: values.name }));
      } else {
        await update.mutateAsync({ documentId: target.schoolClass.documentId, ...values });
        toast.success(t('updatedToast', { name: values.name }));
      }
      onClose();
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 403) {
        toast.error(t('forbiddenToast'));
        return;
      }
      toast.error(t('errorToast'));
    }
  });

  return { form, submit, pending };
}
