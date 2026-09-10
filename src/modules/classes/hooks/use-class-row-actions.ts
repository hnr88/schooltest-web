'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { showOpsToast } from '@/modules/ops/actions';
import { useDeleteClassMutation } from '@/modules/classes/queries/use-delete-class.mutation';
import type { SchoolClass } from '@/modules/classes/types/classes.types';

// Delete wiring for ClassRowActions (C-CLS-04, keeps the component under the
// line cap): confirm-dialog state, mutation, toasts.
export function useClassRowActions(schoolClass: SchoolClass) {
  const t = useTranslations('Classes.deleteDialog');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const remove = useDeleteClassMutation();

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(schoolClass.documentId);
      showOpsToast({ tone: 'ok', message: t('successToast', { name: schoolClass.name }) });
      setDeleteOpen(false);
    } catch {
      showOpsToast({ tone: 'error', message: t('errorToast') });
    }
  };

  return { deleteOpen, setDeleteOpen, deletePending: remove.isPending, handleDelete };
}
