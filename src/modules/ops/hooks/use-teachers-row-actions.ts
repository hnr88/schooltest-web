'use client';

import { useState } from 'react';

import {
  useOpsTeacherRemoveMutation,
  useOpsTeacherUpdateMutation,
  type OpsTeacherPatch,
} from '@/modules/ops/queries/use-teachers-list.query';
import { serverMessage } from '@/modules/teachers';

import type { EditState } from '@/modules/ops/types/components.types';

/**
 * The inline edit (C-TCH-04 whitelist) and remove (C-TCH-03 revocation)
 * behaviour of one directory row, kept out of the dialog so the component only
 * renders. Both mutations already invalidate `['ops','schools',id,'teachers']`,
 * which prefixes every cached portal page, so a successful write is re-read
 * from the API rather than patched into the cache by hand.
 */
export function useOpsTeacherRowActions(schoolDocumentId: string) {
  const updateMutation = useOpsTeacherUpdateMutation();
  const removeMutation = useOpsTeacherRemoveMutation();
  const [editing, setEditing] = useState<EditState | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const save = async () => {
    if (!editing) return;
    const patch: OpsTeacherPatch = {
      first_name: editing.values.first_name.trim(),
      last_name: editing.values.last_name.trim(),
      email: editing.values.email.trim().toLowerCase(),
    };
    await updateMutation.mutateAsync({
      schoolDocumentId,
      teacherDocumentId: editing.documentId,
      ...patch,
    });
    setEditing(null);
  };

  const remove = async (teacherDocumentId: string) => {
    await removeMutation.mutateAsync({ schoolDocumentId, teacherDocumentId });
    setRemoving(null);
  };

  return {
    editing,
    setEditing,
    removing,
    setRemoving,
    save,
    remove,
    savePending: updateMutation.isPending,
    removePending: removeMutation.isPending,
    error: editing
      ? updateMutation.isError
        ? serverMessage(updateMutation.error)
        : null
      : removing && removeMutation.isError
        ? serverMessage(removeMutation.error)
        : null,
  };
}
