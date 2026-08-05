'use client';

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconButton,
  RowActionsCluster,
} from '@/modules/design-system';
import { ConfirmStaffActionDialog } from '@/modules/teachers/components/ConfirmStaffActionDialog';
import { EditTeacherDialog } from '@/modules/teachers/components/EditTeacherDialog';
import { useStaffRowActions } from '@/modules/teachers/hooks/use-staff-row-actions';

import type { StaffRowActionsProps } from '@/modules/teachers/types/components.types';

// Row actions for the merged staff table. A live account gets the spec's two
// icon buttons — edit (C-TCH-04) and remove (C-TCH-03) — with the reversible
// access toggle (C-TCH-02) behind the overflow menu. An open invitation has no
// account to edit or remove, so it keeps its own menu: reissue (C-INV-03) and
// revoke (C-INV-04/07). Everything that changes access confirms first.
export function StaffRowActions({ row }: StaffRowActionsProps) {
  const {
    t,
    name,
    confirmAction,
    setConfirmAction,
    confirmPending,
    editOpen,
    setEditOpen,
    handleReissue,
    handleConfirm,
  } = useStaffRowActions(row);

  return (
    <RowActionsCluster className="justify-end">
      {row.kind === 'teacher' ? (
        <>
          <IconButton
            icon={Pencil}
            size="sm"
            label={t('editLabel', { name })}
            onClick={() => setEditOpen(true)}
          />
          <IconButton
            icon={Trash2}
            size="sm"
            tone="danger"
            label={t('removeLabel', { name })}
            onClick={() => setConfirmAction('remove')}
          />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <IconButton icon={MoreHorizontal} size="sm" label={t('menuLabel', { name })} />
              }
            />
            <DropdownMenuContent align="end">
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
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<IconButton icon={MoreHorizontal} size="sm" label={t('menuLabel', { name })} />}
          />
          <DropdownMenuContent align="end">
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
          </DropdownMenuContent>
        </DropdownMenu>
      )}
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
      {editOpen ? <EditTeacherDialog row={row} onClose={() => setEditOpen(false)} /> : null}
    </RowActionsCluster>
  );
}
