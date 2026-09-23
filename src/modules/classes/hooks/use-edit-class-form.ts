'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { showOpsToast } from '@/modules/ops/actions';
import { assignmentFromPicks, currentTeacherPick } from '@/modules/classes/lib/class-teacher-picker';
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
      teacher_documentId: currentTeacherPick(schoolClass.teacher?.documentId, schoolClass.pending_teacher),
    },
  });

  const submit = form.handleSubmit(async (values) => {
    // BUG-006: the single pick IS the class's teacher. An invited pick is sent
    // as the pending teacher; any other pick clears a pending teacher the class
    // holds (the reassign path). A class with no known pending teacher never
    // sends the key, so a plain rename/reassign is unchanged on the wire.
    const assignment = assignmentFromPicks([values.teacher_documentId]);
    const touchesPending =
      assignment.pending_teacher_documentId !== null || Boolean(schoolClass.pending_teacher);
    try {
      await update.mutateAsync({
        documentId: schoolClass.documentId,
        name: values.name,
        teacher_documentIds: assignment.teacher_documentIds,
        ...(touchesPending ? { pending_teacher_documentId: assignment.pending_teacher_documentId } : {}),
      });
      showOpsToast({ tone: 'ok', message: t('savedToast', { name: values.name }) });
      onClose();
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 403) {
        // C-CLS-03 tenancy failures carry the server reason (e.g. a teacher
        // outside the school); surface it verbatim when present.
        const envelope = error.response.data as StrapiErrorEnvelope | undefined;
        showOpsToast({ tone: 'error', message: envelope?.error?.message ?? t('forbiddenToast') });
        return;
      }
      showOpsToast({ tone: 'error', message: t('errorToast') });
    }
  });

  return { form, submit, pending: update.isPending };
}
