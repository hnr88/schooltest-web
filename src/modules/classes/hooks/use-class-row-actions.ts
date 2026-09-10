'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { showOpsToast } from '@/modules/ops/actions';
import { useDeleteClassMutation } from '@/modules/classes/queries/use-delete-class.mutation';
import type { SchoolClass } from '@/modules/classes/types/classes.types';

// Delete wiring for the classes roster's delete action (C-CLS-04, keeps the
// component under the line cap): confirm-dialog state, mutation, toasts.
// ops/30 — the confirm dialog moved to the classes table (the kit renders the
// row actions now), so the target arrives as `SchoolClass | null` and the
// handler is a no-op while no row asked for it.
export function useClassRowActions(schoolClass: SchoolClass | null) {
  const t = useTranslations('Classes.deleteDialog');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const remove = useDeleteClassMutation();

  const handleDelete = async () => {
    if (schoolClass === null) return;
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
