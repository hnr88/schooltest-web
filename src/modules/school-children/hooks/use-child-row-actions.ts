'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { classifyChildError } from '@/modules/school-children/lib/classify-child-error';
import { useArchiveChildMutation } from '@/modules/school-children/queries/use-archive-child.mutation';
import type { SchoolChild } from '@/modules/school-children/types/school-children.types';

export function childDisplayName(child: SchoolChild): string {
  return `${child.given_name ?? ''} ${child.family_name ?? ''}`.trim();
}

// Archive wiring for ChildRowActions (C-CHD-04, keeps the component under the
// line cap): confirm-dialog state, mutation, toasts.
export function useChildRowActions(child: SchoolChild) {
  const t = useTranslations('SchoolChildren.archiveDialog');
  const [archiveOpen, setArchiveOpen] = useState(false);
  const archive = useArchiveChildMutation();

  const handleArchive = async () => {
    try {
      await archive.mutateAsync(child.documentId);
      toast.success(t('successToast', { name: childDisplayName(child) }));
      setArchiveOpen(false);
    } catch (error) {
      // Archive can only 403 on role/school scope — the seat gate lives on
      // create — so the contract codes collapse to the generic failure here.
      const kind = classifyChildError(error);
      toast.error(t(kind === 'forbidden' ? 'forbiddenToast' : 'genericToast'));
    }
  };

  return { archiveOpen, setArchiveOpen, archivePending: archive.isPending, handleArchive };
}
