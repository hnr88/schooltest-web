'use client';

import { OpsConfirmDialog } from '@/modules/ops';

import type { ConfirmStaffActionDialogProps } from '@/modules/teachers/types/components.types';

// Staff row actions (deactivate/reactivate, revoke invitation, remove).
//
// De-duplicated onto the portal's ONE confirm (U-24 / R-19): this file keeps its
// per-surface copy and action wiring and holds NO dialog implementation. Copy
// still arrives fully translated via props, so one component serves every
// action. `warning` — the conditional consequence the caller passes only when
// the data says it applies — travels through the shared `notice` slot, which
// keeps it OUTSIDE the description's <p>, exactly as before.
export function ConfirmStaffActionDialog({
  open,
  onOpenChange,
  title,
  description,
  warning,
  cancelLabel,
  confirmLabel,
  destructive,
  pending,
  onConfirm,
}: ConfirmStaffActionDialogProps) {
  return (
    <OpsConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      notice={warning ? { title: warning.title, body: warning.body } : null}
      cancelLabel={cancelLabel}
      confirmLabel={confirmLabel}
      tone={destructive ? 'destructive' : 'neutral'}
      className="sm:max-w-[450px]"
      pending={pending}
      onConfirm={onConfirm}
    />
  );
}
