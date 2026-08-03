'use client';

import { MoreHorizontal } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconButton,
} from '@/modules/design-system';
import { ConfirmStaffActionDialog } from '@/modules/teachers/components/ConfirmStaffActionDialog';
import { useStaffRowActions } from '@/modules/teachers/hooks/use-staff-row-actions';
import type { StaffRow } from '@/modules/teachers/types/teachers.types';

interface StaffRowActionsProps {
  row: StaffRow;
}

// Row actions for the merged staff table: reissue (C-INV-03) + revoke
// (C-INV-04/07) on open invitations, deactivate/reactivate (C-TCH-02) and
// permanent removal (C-TCH-03) on staff accounts. Access-changing actions
// confirm first; reissue is immediate. Removal is offered for both active and
// deactivated accounts — deactivation is reversible, removal is not.
export function StaffRowActions({ row }: StaffRowActionsProps) {
  const {
    t,
    name,
    confirmAction,
    setConfirmAction,
    confirmPending,
    handleReissue,
    handleConfirm,
  } = useStaffRowActions(row);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<IconButton icon={MoreHorizontal} label={t('menuLabel', { name })} />}
        />
        <DropdownMenuContent align="end">
          {row.kind === 'invitation' ? (
            <>
              <DropdownMenuItem className="min-h-11" onClick={handleReissue}>
                {t('reissue')}
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                className="min-h-11"
                onClick={() => setConfirmAction('revoke')}
              >
                {t('revoke')}
              </DropdownMenuItem>
            </>
          ) : (
            <>
              {row.status === 'deactivated' ? (
                <DropdownMenuItem
                  className="min-h-11"
                  onClick={() => setConfirmAction('reactivate')}
                >
                  {t('reactivate')}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  variant="destructive"
                  className="min-h-11"
                  onClick={() => setConfirmAction('deactivate')}
                >
                  {t('deactivate')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                variant="destructive"
                className="min-h-11"
                onClick={() => setConfirmAction('remove')}
              >
                {t('remove')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmStaffActionDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
        title={confirmAction ? t(`${confirmAction}Title`, { name }) : ''}
        description={confirmAction ? t(`${confirmAction}Description`) : ''}
        cancelLabel={t('cancel')}
        confirmLabel={confirmAction ? t(`${confirmAction}Confirm`) : ''}
        destructive={confirmAction !== 'reactivate'}
        pending={confirmPending}
        onConfirm={handleConfirm}
      />
    </>
  );
}
