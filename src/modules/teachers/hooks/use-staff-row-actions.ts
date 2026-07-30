'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { useReissueInvitationMutation } from '@/modules/teachers/mutations/use-reissue-invitation.mutation';
import { useRevokeInvitationMutation } from '@/modules/teachers/mutations/use-revoke-invitation.mutation';
import {
  useDeactivateTeacherMutation,
  useReactivateTeacherMutation,
} from '@/modules/teachers/mutations/use-toggle-teacher.mutation';
import type { StaffRow } from '@/modules/teachers/types/teachers.types';

export type StaffConfirmAction = 'deactivate' | 'reactivate' | 'revoke';

// Mutation + toast wiring for StaffRowActions (keeps the component under the
// line cap): reissue (C-INV-03), revoke (C-INV-04), deactivate/reactivate
// (C-TCH-02). The confirm dialog drives handleConfirm via confirmAction.
export function useStaffRowActions(row: StaffRow) {
  const t = useTranslations('Teachers.actions');
  const [confirmAction, setConfirmAction] = useState<StaffConfirmAction | null>(null);
  const reissue = useReissueInvitationMutation();
  const revoke = useRevokeInvitationMutation();
  const deactivate = useDeactivateTeacherMutation();
  const reactivate = useReactivateTeacherMutation();

  const name = `${row.first_name} ${row.last_name}`.trim() || row.email;
  const confirmPending =
    (confirmAction === 'revoke' && revoke.isPending) ||
    (confirmAction === 'deactivate' && deactivate.isPending) ||
    (confirmAction === 'reactivate' && reactivate.isPending);

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
      }
      setConfirmAction(null);
    } catch {
      toast.error(t('errorToast'));
    }
  };

  return { t, name, confirmAction, setConfirmAction, confirmPending, handleReissue, handleConfirm };
}
