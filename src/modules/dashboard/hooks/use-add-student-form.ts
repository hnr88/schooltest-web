'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { classifyAddStudentError } from '@/modules/dashboard/lib/classify-add-student-error';
import { useCreateStudentMutation } from '@/modules/dashboard/queries/use-create-student.mutation';
import {
  addStudentSchema,
  type AddStudentFormValues,
  type AddStudentInput,
} from '@/modules/dashboard/schemas/add-student.schema';
import type { AddStudentErrorState } from '@/modules/dashboard/types/add-student.types';

const DEFAULT_VALUES: AddStudentFormValues = {
  given_name: '',
  family_name: '',
  year_level: null,
  email: '',
};

interface UseAddStudentFormOptions {
  onOpenChange: (open: boolean) => void;
}

// Owns the AddStudentDialog's form state, submit flow, and error
// classification (C-STUDENT-CREATE) so the component stays presentational.
export function useAddStudentForm({ onOpenChange }: UseAddStudentFormOptions) {
  const t = useTranslations('Dashboard');
  const createStudent = useCreateStudentMutation();
  const [formError, setFormError] = useState<AddStudentErrorState | null>(null);
  const form = useForm<AddStudentFormValues, unknown, AddStudentInput>({
    resolver: zodResolver(addStudentSchema),
    defaultValues: DEFAULT_VALUES,
  });

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      form.reset(DEFAULT_VALUES);
      setFormError(null);
    }
  }

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    createStudent.mutate(values, {
      onSuccess: (student) => {
        toast.success(t('addedToast', { name: `${student.given_name} ${student.family_name}` }));
        handleOpenChange(false);
      },
      onError: (error) => setFormError(classifyAddStudentError(error)),
    });
  });

  const errorTitle = !formError
    ? null
    : formError.kind === 'validation'
      ? (formError.message ?? t('addStudentServerError'))
      : t(formError.kind === 'offline' ? 'addStudentOfflineError' : 'addStudentServerError');

  return {
    form,
    onSubmit,
    handleOpenChange,
    errorTitle,
    isPending: createStudent.isPending,
  };
}
