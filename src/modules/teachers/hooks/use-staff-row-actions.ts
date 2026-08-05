'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { serverMessage } from '@/modules/teachers/lib/server-message';
import { useReissueInvitationMutation } from '@/modules/teachers/queries/use-reissue-invitation.mutation';
import { useRemoveTeacherMutation } from '@/modules/teachers/queries/use-remove-teacher.mutation';
import { useRevokeInvitationMutation } from '@/modules/teachers/queries/use-revoke-invitation.mutation';
import {
  useDeactivateTeacherMutation,
  useReactivateTeacherMutation,
} from '@/modules/teachers/queries/use-toggle-teacher.mutation';
import type { StaffRow } from '@/modules/teachers/types/teachers.types';

import type { StaffActionWarning } from '@/modules/teachers/types/components.types';
import type { StaffConfirmAction } from '@/modules/teachers/types/hooks.types';

// Mutation + toast wiring for StaffRowActions (keeps the component under the
// line cap): edit (C-TCH-04), reissue (C-INV-03), revoke (C-INV-04/07),
// deactivate/reactivate (C-TCH-02) and permanent removal (C-TCH-03). The
// confirm dialog drives handleConfirm via confirmAction; the edit dialog is
// mounted only while editOpen, so its default values match the row.
export function useStaffRowActions(row: StaffRow) {
  const t = useTranslations('Teachers.actions');
  const [confirmAction, setConfirmAction] = useState<StaffConfirmAction | null>(null);
  const [editOpen, setEditOpen] = useState(false);
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

  // Spec section 3: only a removal that really touches sittings or results is
  // warned about. `reportingClassCount` is null when C-RPT-04 could not be read,
  // and an unknown count is never dressed up as a warning.
  const confirmWarning: StaffActionWarning | undefined =
    confirmAction === 'remove' && row.reportingClassCount !== null && row.reportingClassCount > 0
      ? {
          title: t('removeReportingWarningTitle'),
          body: t('removeReportingWarning', { count: row.reportingClassCount }),
        }
      : undefined;

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

  return {
    t,
    name,
    confirmAction,
    setConfirmAction,
    confirmPending,
    confirmWarning,
    editOpen,
    setEditOpen,
    handleReissue,
    handleConfirm,
  };
}
