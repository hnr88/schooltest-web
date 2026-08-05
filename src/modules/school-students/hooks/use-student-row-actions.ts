'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { classifyStudentError } from '@/modules/school-students/lib/classify-student-error';
import { useArchiveStudentMutation } from '@/modules/school-students/queries/use-archive-student.mutation';
import type { SchoolStudent } from '@/modules/school-students/types/school-students.types';

export function studentDisplayName(student: SchoolStudent): string {
  return `${student.given_name ?? ''} ${student.family_name ?? ''}`.trim();
}

// Archive wiring for StudentRowActions (C-CHD-04, keeps the component under the
// line cap): confirm-dialog state, mutation, toasts.
export function useStudentRowActions(student: SchoolStudent) {
  const t = useTranslations('SchoolStudents.archiveDialog');
  const [archiveOpen, setArchiveOpen] = useState(false);
  const archive = useArchiveStudentMutation();

  const handleArchive = async () => {
    try {
      await archive.mutateAsync(student.documentId);
      toast.success(t('successToast', { name: studentDisplayName(student) }));
      setArchiveOpen(false);
    } catch (error) {
      // Archive can only 403 on role/school scope — the seat gate lives on
      // create — so the contract codes collapse to the generic failure here.
      const kind = classifyStudentError(error);
      toast.error(t(kind === 'forbidden' ? 'forbiddenToast' : 'genericToast'));
    }
  };

  return { archiveOpen, setArchiveOpen, archivePending: archive.isPending, handleArchive };
}
