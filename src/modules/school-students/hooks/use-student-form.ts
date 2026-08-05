'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { classifyStudentError } from '@/modules/school-students/lib/classify-student-error';
import {
  buildStudentCreateBody,
  buildStudentUpdateBody,
} from '@/modules/school-students/lib/student-request';
import { useCreateStudentMutation } from '@/modules/school-students/queries/use-create-student.mutation';
import { useUpdateStudentMutation } from '@/modules/school-students/queries/use-update-student.mutation';
import {
  createSchoolStudentFormSchema,
  type SchoolStudentFormValues,
} from '@/modules/school-students/schemas/school-student.schema';
import type { SchoolStudent } from '@/modules/school-students/types/school-students.types';

import type { StudentFormTarget } from '@/modules/school-students/types/hooks.types';
import { BLANK_VALUES } from '@/modules/school-students/constants/hooks.constants';

function initialValues(target: StudentFormTarget): SchoolStudentFormValues {
  if (target.mode === 'create') {
    return BLANK_VALUES;
  }
  const { student } = target;
  // The C-CHD-01 row carries name/class/status only; every other field stays
  // blank so an untouched edit sends nothing for it (see lib/student-request).
  return {
    ...BLANK_VALUES,
    given_name: student.given_name ?? '',
    family_name: student.family_name ?? '',
    class_documentId: student.class?.documentId ?? '',
  };
}

function displayName(values: SchoolStudentFormValues): string {
  return `${values.given_name} ${values.family_name}`.trim();
}

// Form wiring for SchoolStudentForm (C-CHD-02 create / C-CHD-03 edit): schema,
// defaults, body building, mutation dispatch and toast/error classification.
// onDone fires after a successful save (page navigates back, dialog closes).
export function useStudentForm(target: StudentFormTarget, onDone: () => void) {
  const t = useTranslations('SchoolStudents.form');
  const tv = useTranslations('SchoolStudents.validation');
  const schema = useMemo(() => createSchoolStudentFormSchema(tv), [tv]);
  const create = useCreateStudentMutation();
  const update = useUpdateStudentMutation();
  const form = useForm<SchoolStudentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues(target),
  });

  const pending = create.isPending || update.isPending;

  const submit = form.handleSubmit(async (values) => {
    try {
      if (target.mode === 'create') {
        await create.mutateAsync(buildStudentCreateBody(values));
        toast.success(t('createdToast', { name: displayName(values) }));
      } else {
        const body = buildStudentUpdateBody(values, initialValues(target));
        if (Object.keys(body).length > 0) {
          await update.mutateAsync({ documentId: target.student.documentId, body });
          toast.success(t('updatedToast', { name: displayName(values) }));
        }
      }
      onDone();
    } catch (error) {
      toast.error(t(`${classifyStudentError(error)}Toast`));
    }
  });

  return { form, submit, pending };
}
