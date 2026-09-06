'use client';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Input,
  Label,
} from '@/modules/design-system';

export interface OpsTypedNameConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Names the target AND the effect — never just "Are you sure?". */
  description: string;
  /** The exact name the operator must retype. */
  requiredName: string;
  typedName: string;
  onTypedNameChange: (value: string) => void;
  confirmLabel: string;
  cancelLabel: string;
  pending: boolean;
  canConfirm: boolean;
  errorMessage: string | null;
  onConfirm: () => void;
}

/**
 * The typed-name confirmation: `OpsConfirmDialog` plus the one control it does
 * not have. It composes the same AlertDialog primitives rather than editing the
 * generic dialog, so the plain confirmation keeps exactly the behaviour every
 * existing caller relies on while this variant adds the name gate.
 *
 * Both buttons disable while pending, so the action cannot double-fire, and the
 * alert dialog does not dismiss on a backdrop click — a destructive action is
 * left only through a deliberate choice.
 */
export function OpsTypedNameConfirm({
  open,
  onOpenChange,
  title,
  description,
  requiredName,
  typedName,
  onTypedNameChange,
  confirmLabel,
  cancelLabel,
  pending,
  canConfirm,
  errorMessage,
  onConfirm,
}: OpsTypedNameConfirmProps) {
  const inputId = 'ops-typed-name-confirm';
  const errorId = `${inputId}-error`;
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor={inputId}>
            Type <span className="font-semibold">{requiredName}</span> to confirm
          </Label>
          <Input
            id={inputId}
            value={typedName}
            autoComplete="off"
            disabled={pending}
            aria-invalid={errorMessage !== null}
            aria-describedby={errorMessage === null ? undefined : errorId}
            onChange={(event) => onTypedNameChange(event.target.value)}
          />
          {errorMessage === null ? null : (
            <p id={errorId} role="alert" className="text-sm text-destructive">
              {errorMessage}
            </p>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11 px-4" disabled={pending}>
            {cancelLabel}
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            className="h-11 px-4"
            loading={pending}
            disabled={!canConfirm}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
