'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { CLASSES_QUERY_KEY } from '@/modules/classes/constants/queries.constants';
import { toStudentCreateBody } from '@/modules/classes/lib/add-class.helpers';
import { useCreateClassMutation } from '@/modules/classes/queries/use-create-class.mutation';
import {
  createAddClassFormSchema,
  type AddClassFormValues,
} from '@/modules/classes/schemas/class.schema';
import { useCreateStudentMutation } from '@/modules/school-students';
import type { ParsedStudentCsv } from '@/modules/student-import';

const EMPTY_CSV: ParsedStudentCsv = { rows: [], errors: [] };

// Spec §2 add-class submit: create the class through C-CLS-02, then create each
// pasted/uploaded student through C-CHD-02 against the NEW class documentId.
// The import is optional, so an empty CSV is a plain class create. Student
// writes are settled rather than raced to a first rejection: the class already
// exists at that point, so a partial import must still close and report.
export function useAddClassForm(onClose: () => void) {
  const t = useTranslations('Classes.addForm');
  const tv = useTranslations('Classes.validation');
  const schema = useMemo(() => createAddClassFormSchema(tv), [tv]);
  const queryClient = useQueryClient();
  const create = useCreateClassMutation();
  const createStudent = useCreateStudentMutation();
  const [parsed, setParsed] = useState<ParsedStudentCsv>(EMPTY_CSV);
  const form = useForm<AddClassFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', teacher_documentId: '' },
  });

  const submit = form.handleSubmit(async (values) => {
    let schoolClass;
    try {
      schoolClass = await create.mutateAsync({
        name: values.name,
        teacher_documentIds:
          values.teacher_documentId === '' ? [] : [values.teacher_documentId],
      });
    } catch (error) {
      const forbidden = isAxiosError(error) && error.response?.status === 403;
      toast.error(forbidden ? t('forbiddenToast') : t('errorToast'));
      return;
    }

    const results = await Promise.allSettled(
      parsed.rows.map((row) =>
        createStudent.mutateAsync(toStudentCreateBody(row, schoolClass.documentId)),
      ),
    );
    const failed = results.filter((result) => result.status === 'rejected').length;
    // The imports changed student_count, which C-CLS-01 computes at read, so
    // the roster needs a second refresh after the class create's own one.
    await queryClient.invalidateQueries({ queryKey: CLASSES_QUERY_KEY });

    if (failed > 0) {
      toast.error(t('importFailedToast', { name: values.name, count: failed }));
    } else if (parsed.rows.length > 0) {
      toast.success(t('createdWithStudentsToast', { name: values.name, count: parsed.rows.length }));
    } else {
      toast.success(t('createdToast', { name: values.name }));
    }
    onClose();
  });

  return { form, submit, parsed, setParsed, pending: form.formState.isSubmitting };
}
