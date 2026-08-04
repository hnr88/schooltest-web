'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { useReissueInvitationMutation } from '@/modules/teachers/queries/use-reissue-invitation.mutation';
import { useRemoveTeacherMutation } from '@/modules/teachers/queries/use-remove-teacher.mutation';
import { useRevokeInvitationMutation } from '@/modules/teachers/queries/use-revoke-invitation.mutation';
import {
  useDeactivateTeacherMutation,
  useReactivateTeacherMutation,
} from '@/modules/teachers/queries/use-toggle-teacher.mutation';
import type { StaffRow } from '@/modules/teachers/types/teachers.types';

import type { StaffConfirmAction } from '@/modules/teachers/types/hooks.types';

// Mutation + toast wiring for StaffRowActions (keeps the component under the
// line cap): reissue (C-INV-03), revoke (C-INV-04/07), deactivate/reactivate
// (C-TCH-02) and permanent removal (C-TCH-03). The confirm dialog drives
// handleConfirm via confirmAction.
//
// Server refusals are surfaced VERBATIM rather than as a generic failure: the
// 400 guards ("you cannot remove your own account", "…the last active school
// administrator") are the only way the admin learns why nothing happened.
/** The API's own refusal message, when it sent one — never a swallowed error. */
function serverMessage(error: unknown): string | null {
  const message = (error as { response?: { data?: { error?: { message?: unknown } } } })?.response
    ?.data?.error?.message;
  return typeof message === 'string' && message.trim().length > 0 ? message : null;
}

export function useStaffRowActions(row: StaffRow) {
  const t = useTranslations('Teachers.actions');
  const [confirmAction, setConfirmAction] = useState<StaffConfirmAction | null>(null);
  const reissue = useReissueInvitationMutation();
  const revoke = useRevokeInvitationMutation();
  const deactivate = useDeactivateTeacherMutation();
  const reactivate = useReactivateTeacherMutation();
  const remove = useRemoveTeacherMutation();

  const name = `${row.first_name} ${row.last_name}`.trim() || row.email;
  const confirmPending =
    (confirmAction === 'revoke' && revoke.isPending) ||
    (confirmAction === 'deactivate' && deactivate.isPending) ||
    (confirmAction === 'reactivate' && reactivate.isPending) ||
    (confirmAction === 'remove' && remove.isPending);

  const handleReissue = async () => {
    try {
      await reissue.mutateAsync(row.documentId);
      toast.success(t('reissuedToast', { email: row.email }));
    } catch {
      toast.error(t('errorToast'));
    }
  };

  const handleConfirm = async () => {
    try {
      if (confirmAction === 'revoke') {
        await revoke.mutateAsync(row.documentId);
        toast.success(t('revokedToast', { email: row.email }));
      } else if (confirmAction === 'deactivate') {
        await deactivate.mutateAsync(row.documentId);
        toast.success(t('deactivatedToast', { name }));
      } else if (confirmAction === 'reactivate') {
        await reactivate.mutateAsync(row.documentId);
        toast.success(t('reactivatedToast', { name }));
      } else if (confirmAction === 'remove') {
        const result = await remove.mutateAsync(row.documentId);
        toast.success(
          t('removedToast', { name, classes: result.classes_unassigned }),
        );
      }
      setConfirmAction(null);
    } catch (error) {
      toast.error(serverMessage(error) ?? t('errorToast'));
    }
  };

  return { t, name, confirmAction, setConfirmAction, confirmPending, handleReissue, handleConfirm };
}
