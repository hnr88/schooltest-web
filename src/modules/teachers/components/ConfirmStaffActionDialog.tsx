'use client';

import {
  Alert,
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from '@/modules/design-system';

import type { ConfirmStaffActionDialogProps } from '@/modules/teachers/types/components.types';

// Shared confirm dialog for the staff row actions (deactivate/reactivate,
// revoke invitation, remove). Copy arrives fully translated via props so the one
// component serves every action. `warning` is the conditional consequence — the
// caller passes it only when the data says it applies — and sits outside the
// description, which renders a <p>.
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {warning ? (
          <Alert variant="warning" title={warning.title}>
            {warning.body}
          </Alert>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11 px-4" disabled={pending}>
            {cancelLabel}
          </AlertDialogCancel>
          <Button
            type="button"
            variant={destructive ? 'destructive' : 'default'}
            className="h-11 px-4"
            loading={pending}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
